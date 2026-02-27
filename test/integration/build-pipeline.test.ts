import { describe, test, expect } from "bun:test";
import { resolve } from "path";
import { buildGraph } from "../../src/core/graph-builder.js";

const FIXTURES_DIR = resolve(import.meta.dir, "../fixtures/docs-dir");

describe("buildGraph — full pipeline", () => {
  test("builds graph from fixture docs", async () => {
    const { graph, warnings } = await buildGraph(FIXTURES_DIR);

    // Basic structure
    expect(graph.version).toBe("1.0.0");
    expect(graph.generated_at).toBeTruthy();
    expect(graph.nodes.length).toBeGreaterThan(0);

    // Should have all expected node types
    const types = new Set(graph.nodes.map((n) => n.type));
    expect(types.has("doc")).toBe(true);
    expect(types.has("concept")).toBe(true);
    expect(types.has("api")).toBe(true);
    expect(types.has("workflow")).toBe(true);
    expect(types.has("step")).toBe(true);
  });

  test("finds concept nodes", async () => {
    const { graph } = await buildGraph(FIXTURES_DIR);

    const concepts = graph.nodes.filter((n) => n.type === "concept");
    expect(concepts.length).toBe(2); // Workspace + User

    const workspace = concepts.find(
      (n) => n.type === "concept" && n.title === "Workspace"
    );
    expect(workspace).toBeDefined();
  });

  test("finds API nodes including backward-compat format", async () => {
    const { graph } = await buildGraph(FIXTURES_DIR);

    const apis = graph.nodes.filter((n) => n.type === "api");
    // create-workspace, list-workspaces, delete-workspace (backward compat)
    expect(apis.length).toBe(3);

    // Check backward compat conversion
    const deleteApi = apis.find(
      (n) => n.type === "api" && (n as any).method === "DELETE"
    );
    expect(deleteApi).toBeDefined();
  });

  test("finds workflow with steps", async () => {
    const { graph } = await buildGraph(FIXTURES_DIR);

    const workflows = graph.nodes.filter((n) => n.type === "workflow");
    expect(workflows.length).toBe(1);

    const wf = workflows[0];
    expect(wf.type).toBe("workflow");
    if (wf.type === "workflow") {
      expect(wf.workflow_id).toBe("onboard_new_workspace");
      expect(wf.steps.length).toBe(4);
    }

    const steps = graph.nodes.filter((n) => n.type === "step");
    expect(steps.length).toBe(4);
  });

  test("resolves cross-reference edges", async () => {
    const { graph } = await buildGraph(FIXTURES_DIR);

    // Should have RELATED_TO edges between concepts
    const relatedEdges = graph.edges.filter((e) => e.type === "RELATED_TO");
    expect(relatedEdges.length).toBeGreaterThan(0);

    // Should have ACTS_ON edges from APIs to concepts
    const actsOnEdges = graph.edges.filter((e) => e.type === "ACTS_ON");
    expect(actsOnEdges.length).toBeGreaterThan(0);

    // Should have NEXT_STEP_OF edges for workflow steps
    const nextStepEdges = graph.edges.filter((e) => e.type === "NEXT_STEP_OF");
    expect(nextStepEdges.length).toBe(3); // 4 steps = 3 chain links

    // Should have USES_API edge from step 1 to create_workspace
    const usesApiEdges = graph.edges.filter((e) => e.type === "USES_API");
    expect(usesApiEdges.length).toBeGreaterThanOrEqual(1);
  });

  test("stats are computed correctly", async () => {
    const { graph } = await buildGraph(FIXTURES_DIR);

    expect(graph.stats.total_nodes).toBe(graph.nodes.length);
    expect(graph.stats.total_edges).toBe(graph.edges.length);
    expect(graph.stats.nodes_by_type.concept).toBe(2);
    expect(graph.stats.nodes_by_type.api).toBe(3);
    expect(graph.stats.nodes_by_type.workflow).toBe(1);
    expect(graph.stats.nodes_by_type.step).toBe(4);
  });
});
