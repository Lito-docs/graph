import type { WorkflowStep } from "../types/nodes.js";

export interface WorkflowSections {
  preconditions: string[];
  steps: WorkflowStep[];
  failure_modes: string[];
  recovery: string[];
  guardrails: string[];
}

/**
 * Split markdown body into sections by ## headings.
 */
function splitBySections(body: string): Map<string, string> {
  const sections = new Map<string, string>();
  const sectionRegex = /^##\s+(.+)$/gm;
  let lastHeading: string | null = null;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const matches: { heading: string; index: number }[] = [];
  while ((match = sectionRegex.exec(body)) !== null) {
    matches.push({ heading: match[1].trim().toLowerCase(), index: match.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + body.slice(matches[i].index).indexOf("\n") + 1;
    const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
    sections.set(matches[i].heading, body.slice(start, end).trim());
  }

  return sections;
}

/**
 * Extract bullet/numbered list items from a section body.
 */
function extractListItems(text: string): string[] {
  const items: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    // Match bullet (- or *) or numbered (1. 2. etc.) list items
    const match = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
    if (match) {
      items.push(match[1].trim());
    }
  }
  return items;
}

/**
 * Detect backtick-wrapped API references in step text.
 * "Create workspace via `create_workspace` API." → "create_workspace"
 */
function detectApiReference(text: string): string | undefined {
  const match = text.match(/`([a-z_][a-z0-9_]*)`/i);
  return match ? match[1] : undefined;
}

/**
 * Parse workflow-specific sections from the markdown body.
 */
export function parseWorkflowSections(body: string): WorkflowSections {
  const sections = splitBySections(body);

  const preconditions = extractListItems(sections.get("preconditions") ?? "");
  const failure_modes = extractListItems(sections.get("failure modes") ?? "");
  const recovery = extractListItems(sections.get("recovery") ?? "");
  const guardrails = extractListItems(sections.get("guardrails") ?? "");

  // Parse steps with API detection
  const stepsText = sections.get("steps") ?? "";
  const stepItems = extractListItems(stepsText);
  const steps: WorkflowStep[] = stepItems.map((action, i) => ({
    step_number: i + 1,
    action,
    uses_api: detectApiReference(action),
  }));

  return { preconditions, steps, failure_modes, recovery, guardrails };
}
