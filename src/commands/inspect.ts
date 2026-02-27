import { existsSync } from "fs";
import { readFile } from "node:fs/promises";
import { resolve } from "path";
import pc from "picocolors";
import type { LitoGraph } from "../types/graph.js";

interface InspectOptions {
  graph: string;
  stats?: boolean;
  nodes?: boolean;
  type?: string;
  node?: string;
  edges?: boolean;
  orphans?: boolean;
  unresolved?: boolean;
}

export async function inspectCommand(options: InspectOptions) {
  try {
    const graphPath = resolve(options.graph);
    if (!existsSync(graphPath)) {
      console.error(pc.red(`Graph file not found: ${graphPath}`));
      process.exit(1);
    }

    const content = await readFile(graphPath, "utf-8");
    const graph: LitoGraph = JSON.parse(content);

    // Determine what to show — default to stats
    const showStats =
      options.stats ||
      (!options.nodes &&
        !options.type &&
        !options.node &&
        !options.edges &&
        !options.orphans &&
        !options.unresolved);

    if (showStats) {
      printStats(graph);
    }

    if (options.nodes || options.type) {
      printNodes(graph, options.type);
    }

    if (options.node) {
      printNode(graph, options.node);
    }

    if (options.edges) {
      printEdges(graph);
    }

    if (options.orphans) {
      printOrphans(graph);
    }

    if (options.unresolved) {
      printUnresolved(graph);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(pc.red("Error:"), message);
    process.exit(1);
  }
}

function printStats(graph: LitoGraph) {
  console.log(pc.bold("\nGraph Statistics"));
  console.log(pc.dim("─".repeat(40)));
  console.log(`  Version:     ${graph.version}`);
  console.log(`  Generated:   ${graph.generated_at}`);
  console.log(`  Source:      ${graph.source_dir}`);
  console.log(`  Nodes:       ${pc.bold(String(graph.stats.total_nodes))}`);
  console.log(`  Edges:       ${pc.bold(String(graph.stats.total_edges))}`);
  console.log(
    `  Unresolved:  ${graph.stats.unresolved_refs > 0 ? pc.yellow(String(graph.stats.unresolved_refs)) : pc.green("0")}`
  );

  console.log(pc.dim("\nNodes by type:"));
  for (const [type, count] of Object.entries(graph.stats.nodes_by_type)) {
    console.log(`  ${type.padEnd(12)} ${count}`);
  }

  if (Object.keys(graph.stats.edges_by_type).length > 0) {
    console.log(pc.dim("\nEdges by type:"));
    for (const [type, count] of Object.entries(graph.stats.edges_by_type)) {
      console.log(`  ${type.padEnd(20)} ${count}`);
    }
  }
  console.log();
}

function printNodes(graph: LitoGraph, typeFilter?: string) {
  let nodes = graph.nodes;
  if (typeFilter) {
    nodes = nodes.filter((n) => n.type === typeFilter);
  }

  console.log(
    pc.bold(
      `\n${typeFilter ? `${typeFilter} nodes` : "All nodes"} (${nodes.length})`
    )
  );
  console.log(pc.dim("─".repeat(60)));
  for (const node of nodes) {
    console.log(
      `  ${pc.dim(node.id.slice(0, 8))}  ${pc.cyan(node.type.padEnd(10))}  ${node.title}`
    );
  }
  console.log();
}

function printNode(graph: LitoGraph, id: string) {
  const node = graph.nodes.find(
    (n) => n.id === id || n.id.startsWith(id) || n.slug === id
  );
  if (!node) {
    console.error(pc.red(`Node not found: ${id}`));
    return;
  }
  console.log(pc.bold(`\nNode: ${node.title}`));
  console.log(pc.dim("─".repeat(40)));
  console.log(JSON.stringify(node, null, 2));

  // Show connected edges
  const connected = graph.edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );
  if (connected.length > 0) {
    console.log(pc.dim(`\nEdges (${connected.length}):`));
    for (const edge of connected) {
      const direction = edge.source === node.id ? "→" : "←";
      const other = edge.source === node.id ? edge.target : edge.source;
      const otherNode = graph.nodes.find((n) => n.id === other);
      console.log(
        `  ${direction} ${pc.cyan(edge.type.padEnd(18))} ${otherNode?.title ?? other}`
      );
    }
  }
  console.log();
}

function printEdges(graph: LitoGraph) {
  console.log(pc.bold(`\nAll edges (${graph.edges.length})`));
  console.log(pc.dim("─".repeat(70)));
  for (const edge of graph.edges) {
    const sourceNode = graph.nodes.find((n) => n.id === edge.source);
    const targetNode = graph.nodes.find((n) => n.id === edge.target);
    const sourceName = sourceNode?.title ?? edge.source;
    const targetName = targetNode?.title ?? edge.target;
    console.log(
      `  ${sourceName} ${pc.cyan(`—[${edge.type}]→`)} ${targetName}`
    );
  }
  console.log();
}

function printOrphans(graph: LitoGraph) {
  const connectedIds = new Set<string>();
  for (const edge of graph.edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }
  const orphans = graph.nodes.filter((n) => !connectedIds.has(n.id));

  console.log(pc.bold(`\nOrphan nodes (${orphans.length})`));
  console.log(pc.dim("─".repeat(40)));
  if (orphans.length === 0) {
    console.log(pc.green("  No orphan nodes!"));
  } else {
    for (const node of orphans) {
      console.log(
        `  ${pc.dim(node.id.slice(0, 8))}  ${pc.cyan(node.type.padEnd(10))}  ${node.title}`
      );
    }
  }
  console.log();
}

function printUnresolved(graph: LitoGraph) {
  const unresolved = graph.edges.filter((e) =>
    e.target.startsWith("unresolved:")
  );

  console.log(pc.bold(`\nUnresolved references (${unresolved.length})`));
  console.log(pc.dim("─".repeat(50)));
  if (unresolved.length === 0) {
    console.log(pc.green("  All references resolved!"));
  } else {
    for (const edge of unresolved) {
      const sourceNode = graph.nodes.find((n) => n.id === edge.source);
      const ref = edge.target.replace("unresolved:", "");
      console.log(
        `  ${pc.yellow(ref)} ${pc.dim(`(${edge.type} from ${sourceNode?.title ?? edge.source})`)}`
      );
    }
  }
  console.log();
}
