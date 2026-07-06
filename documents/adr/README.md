# Architecture Decision Records (ADRs)

This folder records significant architectural decisions for Frame Africa.
Each ADR is a short, immutable document describing one decision, its context, and its consequences.

## How to add an ADR
1. Copy `0000-adr-template.md` to `NNNN-short-title.md` (next number).
2. Fill in Context, Decision, Consequences, Alternatives.
3. Open a PR into `dev` like any other change.
4. Once merged, an ADR is not edited — to change a decision, add a new ADR that
   supersedes the old one (update the old one's status to "Superseded by ADR-XXXX").

## Index
| ADR | Title | Status |
|---|---|---|
| [0001](0001-use-nextjs-and-nestjs.md) | Use Next.js + NestJS/Node | Accepted |
