import { describe, test, expect } from "bun:test";
import { parseWorkflowSections } from "../../src/core/content-parser.js";

describe("parseWorkflowSections", () => {
  test("parses all workflow sections", () => {
    const body = `# Onboard New Workspace

This workflow provisions a new workspace.

## Preconditions

- User has valid billing plan.
- Customer account exists.

## Steps

1. Create workspace via \`create_workspace\` API.
2. Assign default roles to initial users.
3. Provision default projects.
4. Send onboarding email sequence.

## Failure Modes

- Workspace creation fails due to invalid billing.
- Role assignment fails due to permission issues.

## Recovery

- If billing invalid: trigger notify_billing_issue workflow.
- If permission error: escalate to human operator.

## Guardrails

- Never delete existing workspaces during onboarding.
- Escalate to human if workspace creation fails twice.`;

    const sections = parseWorkflowSections(body);

    expect(sections.preconditions).toHaveLength(2);
    expect(sections.preconditions[0]).toBe("User has valid billing plan.");

    expect(sections.steps).toHaveLength(4);
    expect(sections.steps[0].step_number).toBe(1);
    expect(sections.steps[0].action).toContain("Create workspace");
    expect(sections.steps[0].uses_api).toBe("create_workspace");
    expect(sections.steps[1].uses_api).toBeUndefined();

    expect(sections.failure_modes).toHaveLength(2);
    expect(sections.recovery).toHaveLength(2);
    expect(sections.guardrails).toHaveLength(2);
  });

  test("handles missing sections gracefully", () => {
    const body = `# Simple Workflow

## Steps

1. Do the thing.
2. Done.`;

    const sections = parseWorkflowSections(body);
    expect(sections.steps).toHaveLength(2);
    expect(sections.preconditions).toEqual([]);
    expect(sections.guardrails).toEqual([]);
  });

  test("detects API references in backticks", () => {
    const body = `## Steps

1. Call \`list_workspaces\` to get all workspaces.
2. For each workspace, call \`delete_workspace\`.
3. Log the results.`;

    const sections = parseWorkflowSections(body);
    expect(sections.steps[0].uses_api).toBe("list_workspaces");
    expect(sections.steps[1].uses_api).toBe("delete_workspace");
    expect(sections.steps[2].uses_api).toBeUndefined();
  });
});
