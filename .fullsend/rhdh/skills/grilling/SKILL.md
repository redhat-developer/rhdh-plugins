---
name: grilling
description: >
  Grill an engineer relentlessly about a plan, design, or PR change via
  inline PR review comments. Use when /fs-grillme is invoked or when
  stress-testing decisions for shared understanding.
---

# Grilling (Fullsend)

Interview the engineer about every material _decision_ behind this change
until you reach a shared understanding. Walk down each branch of the decision
tree. For each question, pin it to the relevant diff line when one exists.

## Scope: decisions, not correctness

You pursue **architectural alignment and explicit decisions** — not code
review. Do not raise correctness, style, security, or lint findings.
Those belong to `/fs-review`. If a correctness concern reveals a missing
_decision_ (e.g. "you haven't decided how to handle the error case"), frame
it as a decision question, not a bug report.

## Turn model (Fullsend)

Each agent run is **one turn** that may ask **several questions in parallel**:

1. Read the PR (diff, description, relevant files) and existing grillme
   review threads (`<!-- grillme -->` / bot-authored inline comments).
2. Resolve threads whose answers are satisfactory. Reply in-thread when an
   answer needs a follow-up. Leave unanswered threads alone.
3. Pin **2–5 new questions** as inline comments on distinct decision points
   in the diff. If a question has no diff anchor, put it in the review body.
4. Stop. Do not continue until the next `/fs-grillme` turn.

A session is complete when every grillme thread is resolved and no new
questions remain.

## Facts vs decisions

If a _fact_ can be found by exploring the environment (filesystem, `gh`, PR
diff, docs, OpenSpec artifacts when present), look it up rather than asking.
The _decisions_ are the engineer's — put each one to them on a specific
line and wait for their reply on the next turn.

## How to probe

### Domain precision

When the engineer uses vague or overloaded terms, propose a precise canonical
term. ("You say 'account' — do you mean the Customer or the User? Those are
different things.") When domain relationships are discussed, invent concrete
edge-case scenarios that force precision about boundaries. When claims are made
about how something works, cross-reference against the actual code or artifacts
and surface contradictions.

If the repo has a `CONTEXT.md` (glossary / ubiquitous language), challenge new
terms against it. If a decision should be captured somewhere (an ADR, a design
doc, an OpenSpec artifact), say _where_ it belongs in the closing summary —
but do not write the file yourself.

### What to probe

Adapt to whatever the PR actually changes. Prefer high-leverage decision
branches over trivia. Typical dimensions (skip what does not apply):

1. **Problem & scope** — what problem, non-goals, success criteria, who cares
2. **Design choices** — architecture, API surface, alternatives rejected, coupling
3. **Trade-offs & edges** — failure modes, compatibility, migration, what breaks
4. **Operability** — rollout/rollback, observability, testing strategy
5. **Follow-through** — missing work, sequencing, docs, ownership

### When OpenSpec artifacts are present

If the PR includes `openspec/` (proposal, specs, design, tasks), also walk that
artifact sequence in dependency order — those docs are primary decision
surfaces. Do not invent OpenSpec content that is not on the PR. OpenSpec is one
useful lens, not a requirement to run.

## Closing

When prior answers resolve the open decision branches (or the engineer
explicitly confirms shared understanding), post a short closing summary:

- Decisions reached
- Remaining gaps (if any)
- Where to capture each decision (e.g. "record in `design.md`", "warrants an
  ADR in `openspec/changes/foo/adr/`", "update `CONTEXT.md` with the canonical
  term for X") — only when the decision is durable enough to merit it
- Suggested next step (human edit, `/fs-fix`, or ready for review)

Do not write files yourself. The engineer or `/fs-fix` applies captured
decisions to the appropriate artifacts.
