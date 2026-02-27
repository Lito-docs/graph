---
type: concept
entity_type: "resource"
canonical_name: "Workspace"
aliases: ["Org Workspace", "Team Workspace"]
related_entities:
  - "User"
  - "Project"
tags: ["core", "resource"]
version: "v1"
title: "Workspace"
description: "A workspace is the top-level organizational unit."
---

# Workspace

A workspace is the top-level organizational unit in the platform.

## Overview

Workspaces contain projects, users, and settings. Each organization has one or more workspaces.

## Fields

- `id` — Unique identifier
- `name` — Display name
- `owner_id` — The user who created the workspace
- `plan` — Billing plan (free, pro, enterprise)

## Relationships

- Contains multiple **Projects**
- Owned by a **User**
- Has billing and settings
