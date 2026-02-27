import { describe, test, expect } from "bun:test";
import { resolveEdges } from "../../src/core/edge-resolver.js";
import type { ConceptNode, ApiNode, WorkflowNode, StepNode } from "../../src/types/nodes.js";

describe("resolveEdges", () => {
  const workspaceNode: ConceptNode = {
    id: "concept-ws",
    type: "concept",
    title: "Workspace",
    summary: "A workspace",
    source_path: "concepts/workspace.md",
    slug: "/concepts/workspace",
    anchors: [],
    tags: [],
    entity_type: "resource",
    canonical_name: "Workspace",
    aliases: ["Org Workspace"],
    related_entities: ["User"],
  };

  const userNode: ConceptNode = {
    id: "concept-user",
    type: "concept",
    title: "User",
    summary: "A user",
    source_path: "concepts/user.md",
    slug: "/concepts/user",
    anchors: [],
    tags: [],
    entity_type: "resource",
    canonical_name: "User",
    aliases: [],
    related_entities: ["Workspace"],
  };

  const apiNode: ApiNode = {
    id: "api-create",
    type: "api",
    title: "Create Workspace",
    summary: "Creates a workspace",
    source_path: "api/create.md",
    slug: "/api/create",
    anchors: [],
    tags: [],
    api_type: "http",
    operation_id: "create_workspace",
    method: "POST",
    path: "/v1/workspaces",
    resource: "Workspace",
    capabilities: ["create"],
    side_effects: [],
    preconditions: [],
    permissions: [],
  };

  test("resolves RELATED_TO edges between concepts", () => {
    const { edges } = resolveEdges([workspaceNode, userNode]);
    const relatedEdges = edges.filter((e) => e.type === "RELATED_TO");
    expect(relatedEdges.length).toBeGreaterThanOrEqual(2);

    // Workspace → User
    const wsToUser = relatedEdges.find(
      (e) => e.source === "concept-ws" && e.target === "concept-user"
    );
    expect(wsToUser).toBeDefined();

    // User → Workspace
    const userToWs = relatedEdges.find(
      (e) => e.source === "concept-user" && e.target === "concept-ws"
    );
    expect(userToWs).toBeDefined();
  });

  test("resolves ACTS_ON edge from API to concept", () => {
    const { edges } = resolveEdges([workspaceNode, apiNode]);
    const actsOn = edges.find(
      (e) => e.source === "api-create" && e.type === "ACTS_ON"
    );
    expect(actsOn).toBeDefined();
    expect(actsOn?.target).toBe("concept-ws");
  });

  test("creates unresolved edges with warnings for missing targets", () => {
    const lonelyApi: ApiNode = {
      ...apiNode,
      id: "api-lonely",
      resource: "NonExistent",
    };
    const { edges, warnings } = resolveEdges([lonelyApi]);
    const unresolved = edges.find((e) => e.target.startsWith("unresolved:"));
    expect(unresolved).toBeDefined();
    expect(unresolved?.target).toBe("unresolved:NonExistent");
    expect(warnings.length).toBeGreaterThan(0);
  });

  test("resolves NEXT_STEP_OF chain for workflow steps", () => {
    const step1: StepNode = {
      id: "step-1",
      type: "step",
      title: "Step 1",
      summary: "Do first thing",
      source_path: "workflows/test.md",
      slug: "/workflows/test#step-1",
      anchors: [],
      tags: [],
      step_number: 1,
      action: "Do first thing",
      workflow_id: "test_wf",
    };
    const step2: StepNode = {
      id: "step-2",
      type: "step",
      title: "Step 2",
      summary: "Do second thing",
      source_path: "workflows/test.md",
      slug: "/workflows/test#step-2",
      anchors: [],
      tags: [],
      step_number: 2,
      action: "Do second thing",
      workflow_id: "test_wf",
    };

    const { edges } = resolveEdges([step1, step2]);
    const nextStep = edges.find((e) => e.type === "NEXT_STEP_OF");
    expect(nextStep).toBeDefined();
    expect(nextStep?.source).toBe("step-1");
    expect(nextStep?.target).toBe("step-2");
  });

  test("resolves USES_API edge from step to API node", () => {
    const step: StepNode = {
      id: "step-api",
      type: "step",
      title: "Step 1",
      summary: "Create workspace",
      source_path: "workflows/test.md",
      slug: "/workflows/test#step-1",
      anchors: [],
      tags: [],
      step_number: 1,
      action: "Create workspace via create_workspace API",
      uses_api: "create_workspace",
      workflow_id: "test_wf",
    };

    const { edges } = resolveEdges([apiNode, step]);
    const usesApi = edges.find(
      (e) => e.source === "step-api" && e.type === "USES_API"
    );
    expect(usesApi).toBeDefined();
    expect(usesApi?.target).toBe("api-create");
  });
});
