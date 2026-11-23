import { createHash, randomUUID } from 'node:crypto';
import { remark } from 'remark';
import { IngestSchema, type Source, type Brand, type Platform } from '../shared/schemas.js';

type AstNode = { type: string; value?: string; children?: AstNode[] };
function extract(node: AstNode): string {
  if (['html', 'code', 'image', 'definition'].includes(node.type)) return '';
  if (node.value) return node.value;
  const value = node.children?.map(extract).filter(Boolean).join(['root', 'list', 'listItem', 'blockquote'].includes(node.type) ? '\n' : '') ?? '';
  return value;
}
export function ingest(input: unknown): Source {
  const data = IngestSchema.parse(input);
  if (Buffer.byteLength(data.text, 'utf8') > 1_048_576) throw new Error('Source size exceeds the 1 MiB limit');
  const extracted = data.kind === 'markdown' ? extract(remark().parse(data.text) as AstNode) : data.text;
  const text = extracted.trim(); if (!text) throw new Error('Source contains no usable text');
  return { id: randomUUID(), kind: data.kind, title: data.title, original: data.text, text, digest: createHash('sha256').update(data.text).digest('hex'), importedAt: new Date().toISOString() };
}
export const platformLimits: Record<Platform, number> = { linkedin: 3000, facebook: 5000, instagram: 2200, x: 280, youtube: 5000, shorts: 1200, newsletter: 20000, blog: 20000, email: 20000 };
export const clip = (text: string, max: number): string => Array.from(text).slice(0, Math.max(0, max)).join('');
export function draft(brand: Brand, source: Source, platform: Platform): { body: string; cta: string } {
  const cta = brand.approvedCallsToAction[0]!;
  const attribution = `Source: ${source.id}`;
  const openings: Record<Platform, string> = {
    linkedin: `${source.title}\n\nA workflow note for ${brand.targetAudience[0]}:`,
    facebook: `${source.title}\nA practical idea to discuss:`, instagram: `${source.title}\nSave this workflow note:`, x: '',
    youtube: `${source.title}\n\nIn this video:`, shorts: `Shorts script — ${source.title}\n[Opening] Workflow note\n[Main point]`,
    newsletter: `Newsletter — ${source.title}\n\nThis edition's source note:`, blog: `Blog outline — ${source.title}\n1. Context and audience\n2. Source-backed points`, email: `${source.title}\n\nA workflow idea for you:`,
  };
  const prefix = openings[platform]; const suffix = `\n\n${cta}\n${attribution}`;
  const limit = platformLimits[platform]; const space = limit - Array.from(prefix + (prefix ? '\n' : '') + suffix).length;
  if (space < 30) throw new Error(`Title or CTA too long for ${platform}; shorten the brand CTA or source title`);
  const excerpt = clip(source.text, Math.min(space, platform === 'x' ? space : 900));
  return { body: `${prefix}${prefix ? '\n' : ''}${excerpt}${suffix}`, cta };
}
