import { z } from 'zod';
import { writeFile, mkdir } from 'node:fs/promises';
import { BrandSchema, VideoSchema, StateSchema } from '../dist/packages/shared/schemas.js';
await mkdir('schemas', { recursive: true });
for (const [name, schema] of Object.entries({ brand: BrandSchema, 'edynora-video-v1': VideoSchema, 'workspace-v1': StateSchema })) {
  const json = z.toJSONSchema(schema, { target: 'draft-2020-12', unrepresentable: 'throw' });
  if (name === 'edynora-video-v1') json.anyOf = [{ required: ['transcript'] }, { required: ['script'] }];
  await writeFile(`schemas/${name}.schema.json`, JSON.stringify(json, null, 2) + '\n');
}
console.log('Generated three JSON schemas; runtime validation additionally enforces refinements.');
