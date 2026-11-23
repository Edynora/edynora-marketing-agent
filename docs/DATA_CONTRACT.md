# Proposed Edynora Video Workflow contract

Schema version `1.0.0`, JSON Schema in `schemas/edynora-video-v1.schema.json`. No official existing Edynora Video Workflow contract was provided. This is a proposed shared contract, tested for import/export within this package; compatibility with a separate Video Workflow product remains unverified.

Fields: `videoTitle`; at least one of `transcript` or `script`; `description`; `chapters` containing nonnegative `startSeconds` and `title`; `keyThemes`; `audience`; `callsToAction`; `sourceReferences` with `label` and HTTP(S) `uri`; `approvalMetadata` with status and optional reviewer/approvedAt. Unknown properties and schema versions are rejected.

```json
{
  "schemaVersion": "1.0.0",
  "videoTitle": "Review a workflow",
  "transcript": "Document your current workflow. Review outputs.",
  "description": "A workflow education source",
  "chapters": [{"startSeconds": 0, "title": "Introduction"}],
  "keyThemes": ["Workflow review"],
  "audience": ["Educators"],
  "callsToAction": ["Explore our workflows"],
  "sourceReferences": [{"label": "Source notes", "uri": "https://example.org/notes"}],
  "approvalMetadata": {"status": "draft"}
}
```

Imported contract metadata round-trips but cannot approve new local drafts. References are never fetched. Exporting a source that was not imported as a video constructs a v1 contract with draft approval and empty optional planning lists.

Migration policy: unknown major/minor versions fail; no implicit migration exists. A future schema change must ship an explicit converter with fixtures and documented field mapping. Keep an original backup; migration must preserve source references and must not transfer approval to changed content. JSON Schema's `anyOf` mirrors runtime's script-or-transcript refinement. Valid calendar dates additionally undergo runtime checks.
