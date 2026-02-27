---
type: api
api_type: "http"
operation_id: "list_workspaces"
method: "GET"
path: "/v1/workspaces"
resource: "Workspace"
capabilities:
  - "list"
  - "read"
preconditions:
  - "user_authenticated"
permissions:
  - "workspace:read"
tags: ["workspace", "list"]
version: "v1"
title: "List Workspaces"
description: "List all workspaces the current user has access to."
---

# List Workspaces

Returns a paginated list of workspaces accessible to the authenticated user.

## Response

```json
{
  "data": [
    { "id": "ws_123", "name": "My Workspace" }
  ],
  "total": 1
}
```
