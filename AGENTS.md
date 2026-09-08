# Coding Guidelines

These guidelines apply to all work in this repository. They intentionally
favor caution and clarity over speed. Use judgment for truly trivial tasks.

## 1. Think Before Coding

- State material assumptions explicitly before implementing.
- Surface multiple reasonable interpretations instead of choosing silently.
- Call out simpler approaches and meaningful tradeoffs.
- Stop and ask when ambiguity would materially change the implementation.

## 2. Simplicity First

- Write the minimum code needed for the requested behavior.
- Do not add speculative features, abstractions, configurability, or defensive
  handling for impossible scenarios.
- Prefer a direct implementation over a reusable abstraction for one-time use.
- If the solution is substantially larger than necessary, simplify it.

## 3. Surgical Changes

- Change only what is required by the request.
- Do not refactor, reformat, or rewrite adjacent code unless required.
- Match the repository's existing style and patterns.
- Mention unrelated issues instead of fixing them without approval.
- Remove only imports, variables, functions, or files made obsolete by the
  current change.
- Every changed line should trace directly to the requested outcome.

## 4. Goal-Driven Execution

- Translate the request into concrete, verifiable success criteria.
- For multi-step work, state a brief plan with a verification step for each
  item.
- For bug fixes, reproduce the failure first, then implement the smallest fix.
- For behavior changes, add or update focused tests before implementation when
  practical.
- Run relevant focused checks, then broader regression checks in proportion to
  the change's risk.
- Do not claim completion without fresh verification evidence.

## UI/UX Constraint

- Preserve the existing UI, UX, content, styling, layout, and interactions
  unless the user explicitly requests a visible change.
