import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LitoGraph } from "../types/graph.js";

export function registerResources(server: McpServer, graph: LitoGraph) {
  // Full graph resource
  server.registerResource(
    "graph",
    "lito-graph://graph.json",
    { mimeType: "application/json", description: "The complete Lito documentation graph" },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify(graph, null, 2),
        },
      ],
    })
  );

  // Individual node resources via URI template
  const nodeTemplate = new ResourceTemplate("lito-graph://nodes/{id}", {
    list: async () => ({
      resources: graph.nodes.map((n) => ({
        uri: `lito-graph://nodes/${n.id}`,
        name: n.title,
        description: n.summary,
        mimeType: "application/json",
      })),
    }),
  });

  server.registerResource(
    "node",
    nodeTemplate,
    { mimeType: "application/json", description: "A single node from the graph" },
    async (uri, variables) => {
      const node = graph.nodes.find((n) => n.id === variables.id);
      if (!node) {
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "text/plain",
              text: `Node not found: ${variables.id}`,
            },
          ],
        };
      }
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "application/json",
            text: JSON.stringify(node, null, 2),
          },
        ],
      };
    }
  );
}
