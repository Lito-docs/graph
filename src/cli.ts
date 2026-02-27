import { Command } from "commander";
import pc from "picocolors";
import { buildCommand } from "./commands/build.js";
import { serveCommand } from "./commands/serve.js";
import { inspectCommand } from "./commands/inspect.js";

export async function cli() {
  const program = new Command();

  program
    .name("lito-graph")
    .description(
      "Compile Markdown docs into a knowledge & workflow graph for AI agents."
    )
    .version("0.1.0");

  program
    .command("build")
    .description("Compile docs into graph.json")
    .requiredOption("-i, --input <path>", "Path to the docs folder")
    .option("-o, --output <path>", "Output file path", "./graph.json")
    .action(buildCommand);

  program
    .command("serve")
    .description("Start MCP server exposing the graph")
    .option("-i, --input <path>", "Path to the docs folder (builds graph on startup)")
    .option("-g, --graph <path>", "Path to pre-built graph.json")
    .action(serveCommand);

  program
    .command("inspect")
    .description("Query and inspect a built graph")
    .requiredOption("-g, --graph <path>", "Path to graph.json")
    .option("--stats", "Show graph statistics (default)")
    .option("--nodes", "List all nodes")
    .option("--type <type>", "Filter nodes by type")
    .option("--node <id>", "Show a specific node by ID")
    .option("--edges", "List all edges")
    .option("--orphans", "Show nodes with no edges")
    .option("--unresolved", "Show unresolved references")
    .action(inspectCommand);

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(pc.red("Error:"), message);
    process.exit(1);
  }
}
