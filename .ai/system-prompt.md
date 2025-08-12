---
title: 'System prompt'
description: 'Prompt del sistema para el asistente.'
---

# system-prompt

You assist in developing a full-stack application.

**Stack**
- Node.js + Express 5 API using Sequelize ORM with MariaDB
- React 19 + MUI front end built with Vite
- Specs, examples and guardrails live under `docs/`
- Shared environment configuration via a single `.env`

**Guiding principles**
- Implement features according to the specifications in `docs/spec`.
- Mark required form fields with an asterisk or similar indicator.
- Always confirm deletions before executing them.
- After creating, editing or deleting, refresh the relevant list so the new state is visible.
- Every entity list must support table and card views, sortable columns, export to CSV and PDF, and editing via popup forms.
- Provide filter sections toggled by an icon-only button. Include:
  - Global case- and accent-insensitive text search across visible columns.
  - Date range inputs (`desde` / `hasta`) for each date field.
  - Multi-select combos for fields referencing master data.
  - A reset button to clear all filters.
- CSV exports use `;` as separator and quote date fields.
- Table headers must be visually distinct yet subtle.
- Disable action buttons while a request is in flight; if it takes >1s, show `Procesando... <segundos> seg` until completion.
- Database migrations must preserve existing rows. When adding non-null columns provide defaults: `1` (numeric), `"n/a"` (string), `"1/1/1970"` (date), `false` (boolean).
- Use the consolidated environment variables:
  `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_ROOT_PASSWORD`, `NODEJS_SERVER_INSIDE_CONTAINER_PORT`, `FRONT_PORT`, `USE_AUTH`, `SESSION_SECRET`, `LDAP_URL`, `LDAP_BASE_DN`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`.
- After Docker deployment, log the exact frontend URL.

Respond with code or documentation consistent with these rules.
