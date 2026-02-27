import { startMcpServer } from "./mcp/server.js";
import type { LitoGraph } from "./types/graph.js";

/**
 * Slim entry point for `npx @litodocs/graph <url>`.
 * Fetches a remote graph.json and starts the MCP server on stdio.
 * No Commander.js, no @clack/prompts — keeps npx fast and light.
 */
async function main() {
  // Parse URL from argv: positional or --url flag
  const args = process.argv.slice(2);
  let url: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url" && args[i + 1]) {
      url = args[i + 1];
      break;
    }
    // First positional arg that looks like a URL
    if (!args[i].startsWith("-") && !url) {
      url = args[i];
    }
  }

  if (!url) {
    console.error(
      "Usage: npx @litodocs/graph <url>\n" +
        "       npx @litodocs/graph --url https://example.com/graph.json\n\n" +
        "Fetches a remote graph.json and starts an MCP server on stdio."
    );
    process.exit(1);
  }

  try {
    console.error(`Fetching graph from ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `Failed to fetch graph: ${response.status} ${response.statusText}`
      );
      process.exit(1);
    }

    const graph = (await response.json()) as LitoGraph;
    console.error(
      `Loaded graph: ${graph.stats.total_nodes} nodes, ${graph.stats.total_edges} edges`
    );

    await startMcpServer(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
