# ADR-0001: Use Next.js (frontend) and NestJS on Node.js (backend)

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Engineering leads

## Context
Frame Africa is a news platform that must be fast, SEO-friendly, mobile-first, and
maintainable by a small team. We need strong server rendering for SEO and speed,
a typed and modular backend, and one language across the stack to reduce context switching.

## Decision
- **Frontend:** Next.js (React) with TypeScript, using SSG/ISR for content pages and
  SSR for personalized/authenticated views, plus the BFF pattern for sensitive calls.
- **Backend:** NestJS on Node.js with TypeScript, structured as a modular monolith that
  can peel off services (search, media, notifications, AI) as load demands.

## Consequences
- **Positive:** Excellent SEO and performance via ISR; shared TypeScript types across
  the stack; testable, modular backend; large ecosystem and hiring pool.
- **Negative:** Node's single-threaded model needs care for CPU-heavy work (offload to
  queues/services); Next.js rendering strategy must be chosen deliberately per page.
- **Neutral:** Commits us to a JavaScript/TypeScript toolchain end to end.

## Alternatives Considered
- **Laravel (PHP) backend:** capable and batteries-included, but splits the language stack.
- **Plain React SPA:** weaker SEO and slower first paint for a content site.
- **Full microservices from day one:** unnecessary complexity for the team size at launch.
