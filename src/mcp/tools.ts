import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LitoGraph } from "../types/graph.js";
import type { GraphNode } from "../types/nodes.js";

export function registerTools(server: McpServer, graph: LitoGraph) {
  // 1. list_nodes — filter by type/tag
  server.registerTool(
    "list_nodes",
    {
      description:
        "List nodes in the documentation graph. Filter by type (doc, concept, api, workflow, step) or tag.",
      inputSchema: {
        type: z.enum(["doc", "concept", "api", "workflow", "step"]).optional().describe("Filter by node type"),
        tag: z.string().optional().describe("Filter by tag"),
        limit: z.number().optional().default(50).describe("Max results to return"),
      },
    },
    async ({ type, tag, limit }) => {
      let nodes = graph.nodes;
      if (type) nodes = nodes.filter((n) => n.type === type);
      if (tag) nodes = nodes.filter((n) => n.tags.includes(tag));
      const results = nodes.slice(0, limit ?? 50).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        summary: n.summary,
        slug: n.slug,
      }));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // 2. get_node — by ID or slug
  server.registerTool(
    "get_node",
    {
      description: "Get full details of a specific node by ID or slug.",
      inputSchema: {
        identifier: z.string().describe("Node ID or slug"),
      },
    },
    async ({ identifier }) => {
      const node = graph.nodes.find(
        (n) => n.id === identifier || n.slug === identifier || n.id.startsWith(identifier)
      );
      if (!node) {
        return {
          content: [{ type: "text" as const, text: `Node not found: ${identifier}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(node, null, 2) }],
      };
    }
  );

  // 3. traverse — connected nodes via edges
  server.registerTool(
    "traverse",
    {
      description:
        "Find nodes connected to a given node. Filter by edge type and direction.",
      inputSchema: {
        node_id: z.string().describe("Starting node ID"),
        edge_type: z.string().optional().describe("Filter by edge type (e.g., RELATED_TO, ACTS_ON, USES_API)"),
        direction: z.enum(["outgoing", "incoming", "both"]).optional().default("both").describe("Edge direction"),
      },
    },
    async ({ node_id, edge_type, direction }) => {
      const dir = direction ?? "both";
      let edges = graph.edges;

      if (dir === "outgoing") {
        edges = edges.filter((e) => e.source === node_id);
      } else if (dir === "incoming") {
        edges = edges.filter((e) => e.target === node_id);
      } else {
        edges = edges.filter((e) => e.source === node_id || e.target === node_id);
      }

      if (edge_type) {
        edges = edges.filter((e) => e.type === edge_type);
      }

      const connectedIds = new Set<string>();
      for (const e of edges) {
        if (e.source !== node_id) connectedIds.add(e.source);
        if (e.target !== node_id) connectedIds.add(e.target);
      }

      const connected = graph.nodes
        .filter((n) => connectedIds.has(n.id))
        .map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          summary: n.summary,
          edge_types: edges
            .filter((e) => e.source === n.id || e.target === n.id)
            .map((e) => e.type),
        }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(connected, null, 2) }],
      };
    }
  );

  // 4. search — keyword search
  server.registerTool(
    "search",
    {
      description:
        "Search the graph by keyword across titles, summaries, tags, and canonical names.",
      inputSchema: {
        query: z.string().describe("Search query"),
        limit: z.number().optional().default(20).describe("Max results"),
      },
    },
    async ({ query, limit }) => {
      const q = query.toLowerCase();
      const scored: { node: GraphNode; score: number }[] = [];

      for (const node of graph.nodes) {
        let score = 0;
        if (node.title.toLowerCase().includes(q)) score += 10;
        if (node.summary.toLowerCase().includes(q)) score += 5;
        if (node.tags.some((t) => t.toLowerCase().includes(q))) score += 3;
        if (node.type === "concept") {
          const cn = node as GraphNode & { canonical_name?: string; aliases?: string[] };
          if (cn.canonical_name?.toLowerCase().includes(q)) score += 10;
          if (cn.aliases?.some((a: string) => a.toLowerCase().includes(q))) score += 7;
        }
        if (score > 0) scored.push({ node, score });
      }

      scored.sort((a, b) => b.score - a.score);
      const results = scored.slice(0, limit ?? 20).map((s) => ({
        id: s.node.id,
        type: s.node.type,
        title: s.node.title,
        summary: s.node.summary,
        score: s.score,
      }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // 5. get_workflow — complete workflow with steps + API details + guardrails
  server.registerTool(
    "get_workflow",
    {
      description:
        "Get a complete workflow with its steps, linked API details, and guardrails.",
      inputSchema: {
        workflow_id: z.string().describe("Workflow ID or node ID"),
      },
    },
    async ({ workflow_id }) => {
      const wfNode = graph.nodes.find(
        (n) =>
          n.type === "workflow" &&
          (n.id === workflow_id ||
            (n as any).workflow_id === workflow_id)
      );
      if (!wfNode || wfNode.type !== "workflow") {
        return {
          content: [{ type: "text" as const, text: `Workflow not found: ${workflow_id}` }],
          isError: true,
        };
      }

      // Find step nodes
      const steps = graph.nodes
        .filter((n) => n.type === "step" && (n as any).workflow_id === (wfNode as any).workflow_id)
        .sort((a, b) => (a as any).step_number - (b as any).step_number);

      // Find linked APIs for each step
      const stepsWithApis = steps.map((step) => {
        const apiEdges = graph.edges.filter(
          (e) => e.source === step.id && e.type === "USES_API"
        );
        const apis = apiEdges
          .map((e) => graph.nodes.find((n) => n.id === e.target))
          .filter(Boolean);
        return { ...step, linked_apis: apis };
      });

      const result = {
        workflow: wfNode,
        steps: stepsWithApis,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // 6. find_apis_for_entity — all APIs acting on a given entity
  server.registerTool(
    "find_apis_for_entity",
    {
      description: "Find all API nodes that act on a given entity/concept.",
      inputSchema: {
        entity: z.string().describe("Entity canonical name or node ID"),
      },
    },
    async ({ entity }) => {
      // Find the concept node
      const conceptNode = graph.nodes.find(
        (n) =>
          n.type === "concept" &&
          (n.id === entity ||
            (n as any).canonical_name?.toLowerCase() === entity.toLowerCase())
      );

      if (!conceptNode) {
        return {
          content: [{ type: "text" as const, text: `Entity not found: ${entity}` }],
          isError: true,
        };
      }

      // Find all ACTS_ON edges targeting this concept
      const actsOnEdges = graph.edges.filter(
        (e) => e.target === conceptNode.id && e.type === "ACTS_ON"
      );

      const apis = actsOnEdges
        .map((e) => graph.nodes.find((n) => n.id === e.source))
        .filter((n): n is GraphNode => n !== undefined && n.type === "api");

      return {
        content: [{ type: "text" as const, text: JSON.stringify(apis, null, 2) }],
      };
    }
  );

  // 7. get_graph_stats — overview statistics
  server.registerTool(
    "get_graph_stats",
    {
      description: "Get overview statistics about the documentation graph.",
      inputSchema: {},
    },
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                version: graph.version,
                generated_at: graph.generated_at,
                source_dir: graph.source_dir,
                ...graph.stats,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
