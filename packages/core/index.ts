import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { z } from 'zod';
import { Store, AppError } from '../shared/store.js';
import { BrandSchema, EditItemSchema, PlatformSchema, VideoSchema, EmailTypeSchema, FormatSchema, validDate, type Brand, type Item, type State, type Platform, type Format } from '../shared/schemas.js';
import { ingest, draft } from '../content/index.js';
import { generateStrategy } from '../strategy/index.js';
import { emailDrafts } from '../campaigns/index.js';
import { checkQuality } from '../quality/index.js';
import { renderExport } from '../exporters/index.js';

const now = () => new Date().toISOString();
function find<T extends { id: string }>(list: T[], id: string): T { const x = list.find(x => x.id === id); if (!x) throw new AppError('NOT_FOUND', 'Requested record does not exist'); return x; }
function snapshot(i: Item) { return { body: i.body, topic: i.topic, cta: i.cta, pillar: i.pillar, requiredAssets: [...i.requiredAssets], ...(i.date ? { date: i.date } : {}), ...(i.subject ? { subject: i.subject } : {}), ...(i.previewText ? { previewText: i.previewText } : {}) }; }
function event(i: Item, action: string, note: string) { i.history.push({ action, note, version: i.version, at: now() }); }
function invalidate(i: Item, reason: string) { i.version++; i.status = 'draft'; delete i.approval; i.revisions.push({ version: i.version, at: now(), change: reason, snapshot: snapshot(i) }); event(i, 'edited', reason); }
function makeItem(b: Brand, sourceId: string, platform: Platform, body: string, cta: string, topic: string, extra: Partial<Item> = {}): Item {
  const i: Item = { id: randomUUID(), brandId: b.id, brandVersion: b.version, sourceIds: [sourceId], platform, kind: 'social', generationMethod: 'template-v1', body, cta, topic, pillar: 'Education', requiredAssets: ['Human-reviewed source material'], version: 1, status: 'draft', revisions: [], history: [], ...extra };
  i.revisions.push({ version: 1, at: now(), change: 'Initial template draft', snapshot: snapshot(i) }); event(i, 'created', 'Offline deterministic template; not AI-generated'); return i;
}
export class Engine {
  readonly store: Store;
  constructor(workspace: string) { this.store = new Store(workspace); }
  state() { return this.store.read(); }
  async createBrand(input: unknown): Promise<Brand> {
    const data = BrandSchema.parse(input);
    return this.store.transaction(state => { const brand = { ...data, id: randomUUID(), version: 1 }; state.brands.push(brand); return brand; });
  }
  importBrand(input: unknown) { return this.createBrand(input); }
  async exportBrand(id: string) { const b = find((await this.state()).brands, id); const { id: _, version: __, ...profile } = b; return profile; }
  async editBrand(id: string, patch: unknown) {
    const parsed = BrandSchema.partial().strict().parse(patch); if (!Object.keys(parsed).length) throw new Error('Empty brand patch');
    return this.store.transaction(state => {
      const b = find(state.brands, id); Object.assign(b, BrandSchema.parse({ ...awaitlessProfile(b), ...parsed })); b.version++;
      for (const item of state.items.filter(i => i.brandId === id)) { item.brandVersion = b.version; invalidate(item, 'Brand profile changed; review against current brand'); }
      return b;
    });
  }
  async ingest(input: unknown) { const source = ingest(input); return this.store.transaction(state => { state.sources.push(source); return source; }); }
  async importVideo(input: unknown) {
    const video = VideoSchema.parse(input); const source = ingest({ kind: video.transcript ? 'transcript' : 'script', title: video.videoTitle, text: video.transcript ?? video.script }); source.video = video;
    return this.store.transaction(state => { state.sources.push(source); return source; });
  }
  async exportVideo(id: string) {
    const source = find((await this.state()).sources, id);
    if (source.video) return source.video;
    return VideoSchema.parse({ schemaVersion: '1.0.0', videoTitle: source.title, transcript: source.text, description: '', chapters: [], keyThemes: [], audience: [], callsToAction: [], sourceReferences: [], approvalMetadata: { status: 'draft' } });
  }
  async repurpose(brandId: string, sourceId: string, choices: string[]) {
    const selected = z.array(PlatformSchema).min(1).max(50).parse(choices);
    return this.store.transaction(state => {
      const b = find(state.brands, brandId); const s = find(state.sources, sourceId);
      const items = selected.map(p => { const result = draft(b, s, p); return makeItem(b, s.id, p, result.body, result.cta, s.title); });
      state.items.push(...items); return items;
    });
  }
  async strategy(brandId: string) { return generateStrategy(find((await this.state()).brands, brandId)); }
  async calendar(brandId: string, sourceId: string, days: number, start: string) {
    if (![7, 30].includes(days)) throw new Error('Calendar length must be 7 or 30 days'); validDate(start);
    return this.store.transaction(state => {
      const b = find(state.brands, brandId); const s = find(state.sources, sourceId);
      const pillars = generateStrategy(b).contentPillars;
      const items = Array.from({ length: days }, (_, n) => {
        const date = new Date(`${start}T12:00:00.000Z`); date.setUTCDate(date.getUTCDate() + n);
        const p = b.preferredPlatforms[n % b.preferredPlatforms.length]!; const result = draft(b, s, p);
        return makeItem(b, s.id, p, result.body, result.cta, `${s.title} — planning slot ${n + 1}`, { kind: 'calendar', date: date.toISOString().slice(0, 10), pillar: pillars[n % pillars.length]!, requiredAssets: [p === 'instagram' || p === 'shorts' ? 'Create visual or video asset' : 'Review draft and source'], });
      }); state.items.push(...items); return items;
    });
  }
  async email(brandId: string, sourceId: string, campaign: string) {
    const type = EmailTypeSchema.parse(campaign);
    return this.store.transaction(state => {
      const b = find(state.brands, brandId); const s = find(state.sources, sourceId);
      const items = emailDrafts(b, s, type).map(d => makeItem(b, s.id, 'email', d.body, b.approvedCallsToAction[0]!, `${type} ${d.step}`, { kind: 'email', subject: d.subject, previewText: d.previewText, requiredAssets: ['Confirm consent, sender identity, unsubscribe link and campaign details'] }));
      state.items.push(...items); return items;
    });
  }
  async editItem(id: string, patch: unknown, reason: string) {
    const parsed = EditItemSchema.parse(patch); const note = z.string().trim().min(1).max(10000).parse(reason); if (parsed.date) validDate(parsed.date);
    return this.store.transaction(state => { const i = find(state.items, id); Object.assign(i, parsed); invalidate(i, note); return i; });
  }
  async quality(id: string) { const state = await this.state(); const item = find(state.items, id); return checkQuality(item, find(state.brands, item.brandId), state.sources, state.items); }
  async requestReview(id: string) {
    return this.store.transaction(state => { const i = find(state.items, id); i.status = 'review-required'; delete i.approval; event(i, 'review-requested', 'Human review requested'); return i; });
  }
  async approve(id: string, version: number, reviewer: string, note: string) {
    const r = z.string().trim().min(1).max(10000).parse(reviewer); const n = z.string().trim().min(1).max(10000).parse(note);
    return this.store.transaction(state => {
      const i = find(state.items, id); if (i.version !== version) throw new AppError('STALE_VERSION', 'Version changed; review the current version');
      if (i.status !== 'review-required') throw new AppError('REVIEW_REQUIRED', 'Request review before approval');
      i.approval = { version, reviewer: r, at: now(), note: n }; i.status = 'approved'; event(i, 'approved', `${r}: ${n}`); return i;
    });
  }
  async exportItems(ids: string[], format: Format, filename: string) {
    FormatSchema.parse(format); z.array(z.uuid()).min(1).max(1000).parse(ids);
    return this.store.transaction(async state => {
      const items = [...new Set(ids)].map(id => find(state.items, id));
      for (const i of items) if (!['approved', 'exported'].includes(i.status) || !i.approval || i.approval.version !== i.version || i.brandVersion !== find(state.brands, i.brandId).version) throw new AppError('APPROVAL_REQUIRED', 'Every exported item requires current explicit approval');
      const exported = items.map(i => ({ ...i, status: 'exported' as const }));
      const path = await new Store(join(this.store.root, 'exports')).atomic(filename, renderExport(exported, format));
      for (const i of items) { i.status = 'exported'; event(i, 'exported', `Local ${format} export: ${filename}; nothing published or sent`); }
      return { path, count: items.length, published: false };
    });
  }
}
function awaitlessProfile(b: Brand) { const { id: _, version: __, ...profile } = b; return profile; }
export * from '../shared/schemas.js';
