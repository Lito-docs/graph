import { createHash } from "crypto";
import type { DocFile } from "./doc-utils.js";
import type { ParsedDoc } from "./frontmatter.js";
import type {
  GraphNode,
  DocNode,
  ConceptNode,
  ApiNode,
  WorkflowNode,
  StepNode,
} from "../types/nodes.js";
import { parseWorkflowSections } from "./content-parser.js";

/**
 * Generate a deterministic node ID from source_path and type.
 */
function makeId(sourcePath: string, type: string): string {
  return createHash("sha256")
    .update(`${sourcePath}:${type}`)
    .digest("hex")
    .slice(0, 12);
}

/**
 * Extract the first paragraph from body as a summary.
 */
function extractSummary(body: string, description?: string): string {
  if (description) return description;

  // Find first non-empty, non-heading paragraph
  const lines = body.split("\n");
  let paragraph = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (paragraph) break;
      continue;
    }
    if (trimmed.startsWith("#")) {
      if (paragraph) break;
      continue;
    }
    if (trimmed.startsWith("---")) continue;
    paragraph += (paragraph ? " " : "") + trimmed;
  }

  // Truncate to ~200 chars
  if (paragraph.length > 200) {
    return paragraph.slice(0, 197) + "...";
  }
  return paragraph;
}

/**
 * Create typed graph nodes from a parsed document file.
 * Returns an array because WorkflowNodes also produce StepNode children.
 */
export function createNodes(
  file: DocFile,
  parsed: ParsedDoc,
  slug: string,
  anchors: string[]
): GraphNode[] {
  const fm = parsed.frontmatter;
  const base = {
    title: fm.title ?? slug.split("/").pop() ?? "Untitled",
    summary: extractSummary(parsed.body, fm.description),
    source_path: file.relativePath,
    slug,
    anchors,
    version: fm.version,
    locale: fm.locale,
    tags: fm.tags ?? [],
  };

  switch (fm.type) {
    case "concept": {
      const node: ConceptNode = {
        ...base,
        id: makeId(file.relativePath, "concept"),
        type: "concept",
        entity_type: fm.entity_type,
        canonical_name: fm.canonical_name,
        aliases: fm.aliases,
        related_entities: fm.related_entities,
      };
      return [node];
    }

    case "api": {
      const node: ApiNode = {
        ...base,
        id: makeId(file.relativePath, "api"),
        type: "api",
        api_type: fm.api_type,
        operation_id: fm.operation_id,
        method: fm.method,
        path: fm.path,
        resource: fm.resource,
        capabilities: fm.capabilities,
        side_effects: fm.side_effects,
        preconditions: fm.preconditions,
        permissions: fm.permissions,
        rate_limit: fm.rate_limit,
      };
      return [node];
    }

    case "workflow": {
      const sections = parseWorkflowSections(parsed.body);
      const workflowNode: WorkflowNode = {
        ...base,
        id: makeId(file.relativePath, "workflow"),
        type: "workflow",
        workflow_id: fm.workflow_id,
        goal: fm.goal,
        primary_entity: fm.primary_entity,
        risk_level: fm.risk_level,
        requires_human_approval: fm.requires_human_approval,
        steps: sections.steps,
      };

      // Create inline StepNode children
      const stepNodes: StepNode[] = sections.steps.map((step) => ({
        id: makeId(`${file.relativePath}:step:${step.step_number}`, "step"),
        type: "step" as const,
        title: `Step ${step.step_number}: ${step.action}`,
        summary: step.action,
        source_path: file.relativePath,
        slug: `${slug}#step-${step.step_number}`,
        anchors: [],
        version: fm.version,
        locale: fm.locale,
        tags: [],
        step_number: step.step_number,
        action: step.action,
        uses_api: step.uses_api,
        workflow_id: fm.workflow_id,
      }));

      return [workflowNode, ...stepNodes];
    }

    default: {
      const docFm = fm as { type: "doc"; section?: string };
      const node: DocNode = {
        ...base,
        id: makeId(file.relativePath, "doc"),
        type: "doc",
        section: docFm.section,
      };
      return [node];
    }
  }
}
