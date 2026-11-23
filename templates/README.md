# Template implementation

The shipped deterministic template implementations live in packages/content/index.ts and packages/campaigns/index.ts, with strategy in packages/strategy/index.ts. They are original Edynora code under Apache-2.0. They extract source text and add channel framing, approved CTAs and source IDs; they do not invoke a model.

To change template behavior, modify those typed functions and run the platform/campaign tests. No runtime template execution, dynamic JavaScript evaluation or untrusted prompt instructions are supported. Example brand data and a sample campaign are in examples/. Human review and editing are expected.
