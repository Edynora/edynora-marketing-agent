import type { Brand, Item, Source } from '../shared/schemas.js';
import { platformLimits } from '../content/index.js';
export type Finding = { code: string; severity: 'warning' | 'error'; message: string };
export function checkQuality(item: Item, brand: Brand, sources: Source[], siblings: Item[]) {
  const findings: Finding[] = [];
  const add = (code: string, message: string, severity: Finding['severity'] = 'warning') => findings.push({ code, message, severity });
  if (Array.from(item.body).length > platformLimits[item.platform]) add('PLATFORM_LENGTH', `Shorten to ${platformLimits[item.platform]} characters.`, 'error');
  if (!brand.approvedCallsToAction.some(cta => item.body.includes(cta))) add('MISSING_CTA', 'Include a currently approved brand call to action.');
  if (item.sourceIds.some(id => !sources.some(s => s.id === id) || !item.body.includes(`Source: ${id}`))) add('MISSING_ATTRIBUTION', 'Restore source references and inspect the original.');
  const sourceText = sources.filter(s => item.sourceIds.includes(s.id)).map(s => s.text.toLowerCase()).join('\n');
  const newAssertions = item.body.split(/[.!?\n]+/).map(s => s.trim()).filter(s => /\b(?:integrates?|supports?|achieve[sd]?|increases?|reduces?|saves?|delivers?|certified|customers? report)\b/i.test(s));
  if (newAssertions.some(s => !sourceText.includes(s.toLowerCase()))) add('UNSUPPORTED_CONTENT', 'A capability or outcome assertion was not found verbatim in the source. Provide evidence, qualify or remove it.', 'error');
  if (/(\d+(?:[.,]\d+)?\s*%|guarantee|proven|best|testimonial|customers? achieved|"[^"\n]{5,}")/i.test(item.body)) add('VERIFY_CLAIM', 'Check statistics, promises and quotations against evidence; source presence does not verify truth.');
  for (const claim of brand.restrictedClaims) if (item.body.toLowerCase().includes(claim.toLowerCase())) add('RESTRICTED_CLAIM', `Remove or review restricted claim: ${claim}`, 'error');
  if (/guarantee|risk.free|overnight success|100% effective/i.test(item.body)) add('MISLEADING_PROMISE', 'Remove or substantiate promises before approval.', 'error');
  if (sources.filter(s => item.sourceIds.includes(s.id)).some(s => /ignore (?:all |previous )?instructions|system prompt|reveal.*secret|execute.*command/i.test(s.original))) add('UNTRUSTED_INSTRUCTIONS', 'Source contains instruction-like text. Treat it as data, remove it from marketing copy, and inspect manually.');
  if (siblings.some(s => s.id !== item.id && s.body === item.body)) add('REPETITIVE', 'Differentiate this draft from identical content in the workspace.');
  if (/!!!|\b[A-Z]{5,}\b/.test(item.body.replace(/Source: .*/g, ''))) add('VOICE_REVIEW', `Compare emphasis and tone to brand voice: ${brand.brandVoice.join(', ')}.`);
  else add('VOICE_MANUAL', `Human review required for voice: ${brand.brandVoice.join(', ')}.`);
  if (!item.approval || item.approval.version !== item.version || item.brandVersion !== brand.version || !['approved', 'exported'].includes(item.status)) add('MISSING_APPROVAL', 'Request review and approve the current version before export.', 'error');
  return { itemId: item.id, version: item.version, findings, disclaimer: 'Heuristic checks cannot guarantee factual accuracy, brand consistency or legal compliance. Approval is a human decision.' };
}
