import type { Brand, Source, EmailType } from '../shared/schemas.js';
import { draft, clip } from '../content/index.js';
export const emailSteps: Record<EmailType, string[]> = {
  welcome: ['Welcome', 'Start with a workflow', 'Your next step'], newsletter: ['Workflow newsletter'],
  launch: ['Introducing our offering', 'Explore the offering', 'Questions and next steps'],
  webinar: ['Webinar invitation', 'Prepare your questions', 'Webinar follow-up'], 'follow-up': ['Following up', 'A useful source note'],
};
export function emailDrafts(b: Brand, s: Source, type: EmailType) {
  return emailSteps[type].map((step, index) => ({
    subject: clip(`${step}: ${s.title}`, 120), previewText: clip(`A source-backed note from ${b.businessName}: ${s.title}`, 180),
    body: `${step}\n\n${draft(b, s, 'email').body}\n\n${type === 'webinar' ? '[Confirm webinar date, registration link and details before use.]\n' : ''}${type === 'launch' ? '[Confirm offering details and availability before use.]\n' : ''}Sender: [legal sender identity and postal address]\nManage preferences: [unsubscribe link]\nAudience: consented recipients only.`,
    step: index + 1,
  }));
}
