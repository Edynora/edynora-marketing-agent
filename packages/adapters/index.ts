import type { BrandProfile, Source, Platform } from '../shared/schemas.js';
/** Extension seam only. No network model provider ships in v0.1. */
export interface ModelProvider {
  readonly name: string;
  generate(request: { brand: BrandProfile; untrustedSource: Source; platform: Platform; signal?: AbortSignal }): Promise<unknown>;
}
/** Proposed integration boundary. No publishing implementation is provided. */
export interface PublishingAdapter {
  readonly platform: 'n8n' | 'make' | 'zapier' | 'youtube' | 'linkedin' | 'facebook' | 'instagram' | 'email';
  capabilities(): { publishing: boolean; scheduling: boolean };
}
