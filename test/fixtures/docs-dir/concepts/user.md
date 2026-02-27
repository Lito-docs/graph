---
type: concept
entity_type: "resource"
canonical_name: "User"
aliases: ["Account", "Member"]
related_entities:
  - "Workspace"
tags: ["core", "resource"]
version: "v1"
title: "User"
description: "A user account in the platform."
---

# User

A user represents an authenticated account in the platform.

## Overview

Users can belong to multiple workspaces and have different roles in each.

## Fields

- `id` — Unique identifier
- `email` — Email address
- `name` — Display name
- `role` — Global role (admin, member)
