import { describe, test, expect } from "bun:test";
import { parseAndClassify } from "../../src/core/frontmatter.js";

describe("parseAndClassify", () => {
  test("parses standard doc frontmatter", () => {
    const content = `---
title: "Hello World"
description: "A test page"
tags:
  - test
  - demo
---

# Hello

Body content here.`;

    const result = parseAndClassify(content);
    expect(result.frontmatter.type).toBe("doc");
    expect(result.frontmatter.title).toBe("Hello World");
    expect(result.frontmatter.tags).toEqual(["test", "demo"]);
    expect(result.body).toContain("# Hello");
  });

  test("parses concept frontmatter", () => {
    const content = `---
type: concept
canonical_name: "Workspace"
entity_type: "resource"
aliases:
  - "Org Workspace"
related_entities:
  - "User"
  - "Project"
---

# Workspace`;

    const result = parseAndClassify(content);
    expect(result.frontmatter.type).toBe("concept");
    if (result.frontmatter.type === "concept") {
      expect(result.frontmatter.canonical_name).toBe("Workspace");
      expect(result.frontmatter.aliases).toEqual(["Org Workspace"]);
      expect(result.frontmatter.related_entities).toEqual(["User", "Project"]);
    }
  });

  test("parses API frontmatter", () => {
    const content = `---
type: api
operation_id: "create_workspace"
method: "POST"
path: "/v1/workspaces"
resource: "Workspace"
capabilities:
  - "create"
preconditions:
  - "user_authenticated"
permissions:
  - "workspace:write"
---

# Create Workspace`;

    const result = parseAndClassify(content);
    expect(result.frontmatter.type).toBe("api");
    if (result.frontmatter.type === "api") {
      expect(result.frontmatter.operation_id).toBe("create_workspace");
      expect(result.frontmatter.method).toBe("POST");
      expect(result.frontmatter.path).toBe("/v1/workspaces");
      expect(result.frontmatter.capabilities).toEqual(["create"]);
    }
  });

  test("parses workflow frontmatter", () => {
    const content = `---
type: workflow
workflow_id: "onboard_new_workspace"
goal: "Onboard a new customer workspace."
primary_entity: "Workspace"
risk_level: "medium"
requires_human_approval: true
---

# Onboard`;

    const result = parseAndClassify(content);
    expect(result.frontmatter.type).toBe("workflow");
    if (result.frontmatter.type === "workflow") {
      expect(result.frontmatter.workflow_id).toBe("onboard_new_workspace");
      expect(result.frontmatter.goal).toBe("Onboard a new customer workspace.");
      expect(result.frontmatter.requires_human_approval).toBe(true);
    }
  });

  test("backward compat: converts api: 'GET /users' to API format", () => {
    const content = `---
title: "List Users"
api: "GET /v1/users"
resource: "User"
---

# List Users`;

    const result = parseAndClassify(content);
    expect(result.frontmatter.type).toBe("api");
    if (result.frontmatter.type === "api") {
      expect(result.frontmatter.method).toBe("GET");
      expect(result.frontmatter.path).toBe("/v1/users");
      expect(result.frontmatter.operation_id).toBe("get_v1_users");
    }
  });

  test("defaults to doc type when no type specified", () => {
    const content = `---
title: "Plain Page"
---

Just a page.`;

    const result = parseAndClassify(content);
    expect(result.frontmatter.type).toBe("doc");
  });

  test("handles files with no frontmatter", () => {
    const content = `# Just a heading

Some content with no frontmatter.`;

    const result = parseAndClassify(content);
    expect(result.frontmatter.type).toBe("doc");
    expect(result.body).toContain("# Just a heading");
  });
});
