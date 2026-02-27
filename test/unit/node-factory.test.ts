import { describe, test, expect } from "bun:test";
import { createNodes } from "../../src/core/node-factory.js";
import { parseAndClassify } from "../../src/core/frontmatter.js";
import type { DocFile } from "../../src/core/doc-utils.js";

describe("createNodes", () => {
  test("creates DocNode for standard docs", () => {
    const file: DocFile = { absolutePath: "/docs/guide.md", relativePath: "guide.md" };
    const parsed = parseAndClassify(`---
title: "Guide"
description: "A guide page."
tags:
  - guide
---

# Guide

This is a guide.`);

    const nodes = createNodes(file, parsed, "/guide", ["guide"]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("doc");
    expect(nodes[0].title).toBe("Guide");
    expect(nodes[0].tags).toEqual(["guide"]);
  });

  test("creates ConceptNode", () => {
    const file: DocFile = { absolutePath: "/docs/workspace.md", relativePath: "concepts/workspace.md" };
    const parsed = parseAndClassify(`---
type: concept
canonical_name: "Workspace"
entity_type: "resource"
aliases:
  - "Org Workspace"
related_entities:
  - "User"
---

# Workspace`);

    const nodes = createNodes(file, parsed, "/concepts/workspace", []);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("concept");
    if (nodes[0].type === "concept") {
      expect(nodes[0].canonical_name).toBe("Workspace");
      expect(nodes[0].related_entities).toEqual(["User"]);
    }
  });

  test("creates ApiNode", () => {
    const file: DocFile = { absolutePath: "/docs/api.md", relativePath: "api/create.md" };
    const parsed = parseAndClassify(`---
type: api
operation_id: "create_workspace"
method: "POST"
path: "/v1/workspaces"
resource: "Workspace"
capabilities:
  - "create"
---

# Create Workspace`);

    const nodes = createNodes(file, parsed, "/api/create", []);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("api");
    if (nodes[0].type === "api") {
      expect(nodes[0].operation_id).toBe("create_workspace");
      expect(nodes[0].method).toBe("POST");
    }
  });

  test("creates WorkflowNode with StepNode children", () => {
    const file: DocFile = { absolutePath: "/docs/wf.md", relativePath: "workflows/onboard.md" };
    const parsed = parseAndClassify(`---
type: workflow
workflow_id: "onboard"
goal: "Onboard a workspace."
primary_entity: "Workspace"
requires_human_approval: true
---

# Onboard

## Steps

1. Create workspace via \`create_workspace\` API.
2. Assign roles.
3. Send email.`);

    const nodes = createNodes(file, parsed, "/workflows/onboard", []);
    // 1 workflow + 3 steps
    expect(nodes).toHaveLength(4);
    expect(nodes[0].type).toBe("workflow");
    expect(nodes[1].type).toBe("step");
    expect(nodes[2].type).toBe("step");
    expect(nodes[3].type).toBe("step");

    if (nodes[0].type === "workflow") {
      expect(nodes[0].steps).toHaveLength(3);
      expect(nodes[0].steps[0].uses_api).toBe("create_workspace");
    }
    if (nodes[1].type === "step") {
      expect(nodes[1].step_number).toBe(1);
      expect(nodes[1].uses_api).toBe("create_workspace");
      expect(nodes[1].workflow_id).toBe("onboard");
    }
  });

  test("generates deterministic IDs", () => {
    const file: DocFile = { absolutePath: "/docs/test.md", relativePath: "test.md" };
    const parsed = parseAndClassify(`---
title: "Test"
---
# Test`);

    const nodes1 = createNodes(file, parsed, "/test", []);
    const nodes2 = createNodes(file, parsed, "/test", []);
    expect(nodes1[0].id).toBe(nodes2[0].id);
  });
});
