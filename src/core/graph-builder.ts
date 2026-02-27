import { readFile } from "node:fs/promises";
import { resolve } from "path";
import { collectMarkdownFiles, deriveSlug } from "./doc-utils.js";
import { parseAndClassify } from "./frontmatter.js";
import { extractHeadings } from "./heading-extractor.js";
import { createNodes } from "./node-factory.js";
import { resolveEdges } from "./edge-resolver.js";
import type { LitoGraph, GraphStats } from "../types/graph.js";
import type { GraphNode } from "../types/nodes.js";
import type { Edge } from "../types/edges.js";

export interface BuildOptions {
  baseUrl?: string;
}

export interface BuildResult {
  graph: LitoGraph;
  warnings: string[];
}

/**
 * Main orchestrator: Discovery → Parse → Classify → Build Nodes → Resolve Edges → Compute Stats → Return LitoGraph
 */
export async function buildGraph(
  docsPath: string,
  options: BuildOptions = {}
): Promise<BuildResult> {
  const resolvedPath = resolve(docsPath);
  const baseUrl = options.baseUrl?.replace(/\/+$/, "");

  // 1. Discovery
  const files = await collectMarkdownFiles(resolvedPath);

  // 2. Parse + Classify + Build Nodes
  const allNodes: GraphNode[] = [];
  const parseWarnings: string[] = [];

  for (const file of files) {
    try {
      const content = await readFile(file.absolutePath, "utf-8");
      const parsed = parseAndClassify(content);
      const slug = deriveSlug(file.relativePath);
      const { anchors } = extractHeadings(parsed.body);
      const nodes = createNodes(file, parsed, slug, anchors);

      // Apply base URL to generate full public URLs
      if (baseUrl) {
        for (const node of nodes) {
          node.url = baseUrl + node.slug;
        }
      }

      allNodes.push(...nodes);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      parseWarnings.push(`Failed to parse ${file.relativePath}: ${message}`);
    }
  }

  // 3. Resolve Edges
  const { edges, warnings: edgeWarnings } = resolveEdges(allNodes);
  const allWarnings = [...parseWarnings, ...edgeWarnings];

  // 4. Compute Stats
  const stats = computeStats(allNodes, edges, edgeWarnings);

  // 5. Build graph
  const graph: LitoGraph = {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    source_dir: resolvedPath,
    ...(baseUrl && { base_url: baseUrl }),
    stats,
    nodes: allNodes,
    edges,
  };

  return { graph, warnings: allWarnings };
}

function computeStats(
  nodes: GraphNode[],
  edges: Edge[],
  warnings: string[]
): GraphStats {
  const nodes_by_type: Record<string, number> = {};
  for (const node of nodes) {
    nodes_by_type[node.type] = (nodes_by_type[node.type] ?? 0) + 1;
  }

  const edges_by_type: Record<string, number> = {};
  for (const edge of edges) {
    edges_by_type[edge.type] = (edges_by_type[edge.type] ?? 0) + 1;
  }

  const unresolved_refs = edges.filter((e) =>
    e.target.startsWith("unresolved:")
  ).length;

  return {
    total_nodes: nodes.length,
    total_edges: edges.length,
    nodes_by_type,
    edges_by_type,
    unresolved_refs,
  };
}
