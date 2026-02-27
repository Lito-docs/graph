import { existsSync } from "fs";
import { resolve } from "path";
import pc from "picocolors";
import { buildGraph } from "../core/graph-builder.js";
import { startMcpServer } from "../mcp/server.js";
import type { LitoGraph } from "../types/graph.js";

interface ServeOptions {
  input?: string;
  graph?: string;
  url?: string;
  baseUrl?: string;
}

export async function serveCommand(options: ServeOptions) {
  try {
    let graph: LitoGraph;

    if (options.url) {
      // Fetch graph from remote URL
      console.error(pc.dim(`Fetching graph from ${options.url}...`));
      const response = await fetch(options.url);
      if (!response.ok) {
        console.error(
          pc.red(`Failed to fetch graph: ${response.status} ${response.statusText}`)
        );
        process.exit(1);
      }
      graph = (await response.json()) as LitoGraph;
      console.error(
        pc.dim(
          `Loaded remote graph: ${graph.stats.total_nodes} nodes, ${graph.stats.total_edges} edges`
        )
      );
    } else if (options.graph) {
      // Load pre-built graph from local file
      const graphPath = resolve(options.graph);
      if (!existsSync(graphPath)) {
        console.error(pc.red(`Graph file not found: ${graphPath}`));
        process.exit(1);
      }
      const content = await Bun.file(graphPath).text();
      graph = JSON.parse(content) as LitoGraph;
      console.error(
        pc.dim(
          `Loaded graph: ${graph.stats.total_nodes} nodes, ${graph.stats.total_edges} edges`
        )
      );
    } else if (options.input) {
      // Build graph from docs
      const inputPath = resolve(options.input);
      if (!existsSync(inputPath)) {
        console.error(pc.red(`Input path does not exist: ${inputPath}`));
        process.exit(1);
      }
      console.error(pc.dim("Building graph from docs..."));
      const result = await buildGraph(inputPath, {
        baseUrl: options.baseUrl,
      });
      graph = result.graph;
      if (result.warnings.length > 0) {
        console.error(
          pc.yellow(`${result.warnings.length} warning(s) during build`)
        );
      }
      console.error(
        pc.dim(
          `Built graph: ${graph.stats.total_nodes} nodes, ${graph.stats.total_edges} edges`
        )
      );
    } else {
      console.error(
        pc.red(
          "Provide --input (docs folder), --graph (local file), or --url (remote graph.json)"
        )
      );
      process.exit(1);
    }

    // Start MCP server on stdio (all logging to stderr)
    console.error(pc.dim("Starting MCP server on stdio..."));
    await startMcpServer(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(pc.red("Error:"), message);
    process.exit(1);
  }
}
