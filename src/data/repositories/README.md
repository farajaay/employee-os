# Repositories

One module per relation, added at **M-08**. Nothing here yet — M-07 must generate the
row types first (`supabase gen types typescript` → `src/app/types.ts`).

## The rule this directory exists to enforce

Every Supabase query lives here. After M-08, `supabase.from(` must not appear anywhere
under `src/features/` — that is the ticket's *Done when* criterion, and it is
grep-checkable.

## Files to create at M-08

`tasks.ts` · `achievements.ts` · `design_concepts.ts` · `events.ts` ·
`task_evidence.ts` · `workflow_runs.ts` · `workflow_run_steps.ts` ·
`workflow_steps.ts` · `workspace_members.ts` · `v_control_exceptions.ts` ·
`v_project_progress.ts`

The last two are views — read-only. Do not write through them.

## Shape

Each module reads through `../cache.ts` (M-17: cached first, then refresh and
reconcile) and queues eligible writes through `../outbox.ts` (M-18). Writes to
relations outside `OutboxTable` are not queued.
