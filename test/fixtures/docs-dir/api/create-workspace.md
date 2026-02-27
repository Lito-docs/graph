---
type: api
api_type: "http"
operation_id: "create_workspace"
method: "POST"
path: "/v1/workspaces"
resource: "Workspace"
capabilities:
  - "create"
  - "provision"
side_effects:
  - "creates_workspace_record"
  - "sends_welcome_email"
preconditions:
  - "user_authenticated"
  - "billing_plan_active"
permissions:
  - "workspace:write"
tags: ["workspace", "create"]
version: "v1"
title: "Create Workspace"
description: "Create a new workspace for an organization."
---

# Create Workspace

Creates a new workspace with default settings.

## Request

```json
{
  "name": "My Workspace",
  "plan": "pro"
}
```

## Response

```json
{
  "id": "ws_123",
  "name": "My Workspace",
  "plan": "pro",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Error Codes

- `400` — Invalid request body
- `401` — Not authenticated
- `403` — Insufficient permissions
- `409` — Workspace name already exists
