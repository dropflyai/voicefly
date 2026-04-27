# Scope Documents

Build specs for features that are designed but not yet shipped. Each scope
contains: problem statement, architecture, schema, implementation order,
risks, and open questions.

When picking up one of these to build:
1. Re-read the open questions and confirm they're still valid
2. Check if any other code has shifted since the scope was written
3. Update the scope doc as you build (don't let it drift from reality)

## Active scopes

| Scope | Status | Trigger to build |
|---|---|---|
| [insurance-verification.md](./insurance-verification.md) | Ready to ship | Decision needed — would unlock dental beta credibility |
| [multi-location.md](./multi-location.md) | Deferred | First chain prospect signs |
| [pos-square-menu-sync.md](./pos-square-menu-sync.md) | Deferred | Restaurant vertical added to beta target list |

## Format conventions

- **Status**: `Ready to ship` / `Scoped, awaiting decision` / `Deferred until trigger`
- **Effort**: estimated focused-work time (excludes review, deploys, beta feedback iterations)
- **Trigger to build**: explicit signal that should kick off the work
- **Open questions**: must be resolved before writing code
