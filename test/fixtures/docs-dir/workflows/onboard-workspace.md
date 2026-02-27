---
type: workflow
workflow_id: "onboard_new_workspace"
goal: "Onboard a new customer workspace with default settings."
primary_entity: "Workspace"
tags: ["onboarding", "provisioning"]
risk_level: "medium"
requires_human_approval: true
version: "v1"
title: "Onboard New Workspace"
description: "Complete workflow for onboarding a new customer workspace."
---

# Onboard New Workspace

This workflow provisions a new workspace with all required default settings.

## Preconditions

- User has valid billing plan.
- Customer account exists.
- Domain is verified.

## Steps

1. Create workspace via `create_workspace` API.
2. Assign default roles to initial users.
3. Provision default projects.
4. Send onboarding email sequence.

## Failure Modes

- Workspace creation fails due to invalid billing status.
- Role assignment fails due to permission issues.

## Recovery

- If billing invalid: trigger `notify_billing_issue` workflow.
- If permission error: escalate to human operator.

## Guardrails

- Never delete existing workspaces during onboarding.
- Escalate to human if workspace creation fails twice.
