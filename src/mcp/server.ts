import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { LitoGraph } from "../types/graph.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

/**
 * Start the MCP server on stdio transport.
 * All logging goes to stderr so stdout is reserved for JSON-RPC.
 */
export async function startMcpServer(graph: LitoGraph) {
  const server = new McpServer({
    name: "lito-graph",
    version: "0.1.0",
  });

  registerTools(server, graph);
  registerResources(server, graph);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("MCP server running on stdio");
}
