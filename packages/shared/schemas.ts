import { z } from 'zod';

export const platforms = ['linkedin', 'facebook', 'instagram', 'x', 'youtube', 'shorts', 'newsletter', 'blog', 'email'] as const;
export const PlatformSchema = z.enum(platforms);
export type Platform = z.infer<typeof PlatformSchema>;
const text = z.string().trim().min(1).max(10000);
const list = z.array(text).min(1).max(100);
export const BrandSchema = z.object({
  businessName: text, businessDescription: text, industry: text, targetAudience: list,
  brandVoice: list, productsAndServices: list, marketingObjectives: list,
  approvedCallsToAction: list, restrictedClaims: z.array(text).max(100),
  preferredPlatforms: z.array(PlatformSchema).min(1).max(9), publishingFrequency: z.number().int().min(1).max(70),
}).strict();
export type BrandProfile = z.infer<typeof BrandSchema>;
export const BrandRecordSchema = BrandSchema.extend({ id: z.uuid(), version: z.number().int().positive() });
export type Brand = z.infer<typeof BrandRecordSchema>;
export const ApprovalMetadataSchema = z.object({ status: z.enum(['draft', 'review-required', 'approved', 'exported']), reviewer: text.optional(), approvedAt: z.iso.datetime().optional() }).strict();
export const VideoSchema = z.object({
  schemaVersion: z.literal('1.0.0'), videoTitle: text,
  transcript: z.string().trim().min(1).max(1_048_576).optional(), script: z.string().trim().min(1).max(1_048_576).optional(),
  description: z.string().max(10000), chapters: z.array(z.object({ startSeconds: z.number().nonnegative(), title: text }).strict()).max(1000),
  keyThemes: z.array(text).max(100), audience: z.array(text).max(100), callsToAction: z.array(text).max(100),
  sourceReferences: z.array(z.object({ label: text, uri: z.url().refine(v => /^https?:\/\//i.test(v), 'Only HTTP(S) reference URIs are allowed') }).strict()).max(100),
  approvalMetadata: ApprovalMetadataSchema,
}).strict().refine(x => Boolean(x.transcript || x.script), 'A transcript or script is required');
export type Video = z.infer<typeof VideoSchema>;
export const IngestSchema = z.object({ kind: z.enum(['transcript', 'markdown', 'text', 'script', 'product', 'brief']), title: text, text: z.string().trim().min(1).max(1_048_576) }).strict();
export const SourceSchema = z.object({ id: z.uuid(), kind: IngestSchema.shape.kind, title: text, original: z.string().max(1_048_576), text: z.string().trim().min(1).max(1_048_576), digest: z.string().regex(/^[a-f0-9]{64}$/), importedAt: z.iso.datetime(), video: VideoSchema.optional() }).strict();
export type Source = z.infer<typeof SourceSchema>;
const editableFields = {
  body: z.string().trim().min(1).max(20000), topic: text, cta: text,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), pillar: text,
  requiredAssets: z.array(text).max(20), subject: text.optional(), previewText: text.optional(),
};
export const EditItemSchema = z.object(editableFields).partial().strict().refine(x => Object.keys(x).length > 0, 'At least one field must change');
const RevisionSchema = z.object({ version: z.number().int().positive(), at: z.iso.datetime(), change: text, snapshot: z.object(editableFields).strict() }).strict();
export const ItemSchema = z.object({
  ...editableFields, id: z.uuid(), brandId: z.uuid(), brandVersion: z.number().int().positive(), sourceIds: z.array(z.uuid()).min(1),
  platform: PlatformSchema, kind: z.enum(['social', 'calendar', 'email']), generationMethod: z.literal('template-v1'),
  version: z.number().int().positive(), status: z.enum(['draft', 'review-required', 'approved', 'exported']),
  approval: z.object({ version: z.number().int().positive(), reviewer: text, at: z.iso.datetime(), note: text }).strict().optional(),
  revisions: z.array(RevisionSchema).min(1),
  history: z.array(z.object({ action: text, at: z.iso.datetime(), version: z.number().int().positive(), note: text }).strict()).min(1),
}).strict();
export type Item = z.infer<typeof ItemSchema>;
export const StateSchema = z.object({ schemaVersion: z.literal('1.0.0'), brands: z.array(BrandRecordSchema), sources: z.array(SourceSchema), items: z.array(ItemSchema) }).strict();
export type State = z.infer<typeof StateSchema>;
export const FormatSchema = z.enum(['json', 'csv', 'markdown']);
export type Format = z.infer<typeof FormatSchema>;
export const EmailTypeSchema = z.enum(['welcome', 'newsletter', 'launch', 'webinar', 'follow-up']);
export type EmailType = z.infer<typeof EmailTypeSchema>;
export function validDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Invalid date; use a real YYYY-MM-DD date');
  return value;
}
