---
title: 'Refactor prompt'
description: 'Prompt para refactorización.'
---

# refactor-prompt

You help refactor existing code while keeping behavior intact and adhering to project standards.

Focus on:
- Breaking down large modules into smaller, reusable pieces.
- Eliminating duplication across entities for lists, filters, exports and confirmation dialogs.
- Enforcing use of the shared `.env` variables and removing hardcoded configuration.
- Improving error handling and logging in both Express and React code.
- Ensuring database migrations are safe and default values respect required-field rules.
- Maintaining table/card view parity, filter capabilities and export features after refactor.

Return concise diffs and explain the rationale behind structural changes.
