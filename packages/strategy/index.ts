import type { Brand } from '../shared/schemas.js';
export function generateStrategy(b: Brand) {
  return {
    generationMethod: 'template-v1', verifiedBusinessInformation: { businessName: b.businessName, businessDescription: b.businessDescription, audience: b.targetAudience, offerings: b.productsAndServices, objectives: b.marketingObjectives },
    verificationScope: 'User-supplied business profile; not independently verified.',
    audiencePositioning: `${b.businessName}: ${b.productsAndServices.join(', ')} for ${b.targetAudience.join(', ')}.`,
    contentPillars: ['Education', 'Workflow walkthroughs', 'Product and service explanations'],
    campaignThemes: b.marketingObjectives.map(x => `Explore: ${x}`),
    messagingRecommendations: b.brandVoice.map(x => `Use a ${x.toLowerCase()} tone; check examples against approved brand material.`),
    channelStrategies: b.preferredPlatforms.map(platform => ({ platform, recommendation: `Test source-backed educational drafts on ${platform}; compare audience response before increasing frequency.` })),
    suggestedIndicators: ['Qualified inquiries', 'Engagement rate', 'Link click-through rate', 'Email unsubscribe rate'],
    callsToAction: b.approvedCallsToAction,
    assumptions: ['Pillars and channel tactics are planning hypotheses, not researched market facts.', `Brand requests ${b.publishingFrequency} posts per week. Calendars provide daily draft slots; choose publishing cadence manually.`, 'No competitor research or market statistics were performed.'],
  };
}
