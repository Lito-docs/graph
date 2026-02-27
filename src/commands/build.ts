import { existsSync } from "fs";
import { resolve } from "path";
import { intro, outro, spinner, log } from "@clack/prompts";
import pc from "picocolors";
import { buildGraph } from "../core/graph-builder.js";

interface BuildOptions {
  input: string;
  output: string;
}

export async function buildCommand(options: BuildOptions) {
  try {
    const inputPath = resolve(options.input);
    if (!existsSync(inputPath)) {
      log.error(`Input path does not exist: ${pc.cyan(inputPath)}`);
      process.exit(1);
    }

    intro(pc.inverse(pc.cyan(" Lito Graph — Build ")));

    const s = spinner();

    // Step 1: Build graph
    s.start("Scanning docs...");
    const { graph, warnings } = await buildGraph(inputPath);
    s.stop(
      `Found ${pc.bold(String(graph.stats.total_nodes))} nodes, ${pc.bold(String(graph.stats.total_edges))} edges`
    );

    // Step 2: Show warnings
    if (warnings.length > 0) {
      s.start("Resolving cross-references...");
      s.stop(
        `${pc.yellow(String(warnings.length))} unresolved reference(s)`
      );
      for (const w of warnings) {
        log.warn(pc.yellow(w));
      }
    }

    // Step 3: Write output
    const outputPath = resolve(options.output);
    s.start(`Writing ${pc.cyan(outputPath)}...`);
    await Bun.write(outputPath, JSON.stringify(graph, null, 2));
    s.stop(`Graph written to ${pc.cyan(outputPath)}`);

    // Summary
    log.info(pc.dim("Node breakdown:"));
    for (const [type, count] of Object.entries(graph.stats.nodes_by_type)) {
      log.info(`  ${pc.bold(type)}: ${count}`);
    }
    if (Object.keys(graph.stats.edges_by_type).length > 0) {
      log.info(pc.dim("Edge breakdown:"));
      for (const [type, count] of Object.entries(graph.stats.edges_by_type)) {
        log.info(`  ${pc.bold(type)}: ${count}`);
      }
    }

    outro(pc.green("Build completed successfully!"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(pc.red(message));
    if (error instanceof Error && error.stack) {
      log.error(pc.gray(error.stack));
    }
    process.exit(1);
  }
}
