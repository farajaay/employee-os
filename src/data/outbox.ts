/**
 * Write outbox — M-18.
 *
 * The type is fixed here at scaffold time because the rest of the data layer is
 * written against it. M-18 supplies the IndexedDB store and the replay loop.
 *
 * Replay contract (M-18):
 *   - FIFO by `createdAt`, exponential backoff.
 *   - `id` doubles as the idempotency key so a retried write lands exactly once.
 *   - Triggered by `Network.addListener('networkStatusChange')` on native and the
 *     `online` event on web.
 *   - Surface `attempts` to the user after 5.
 *   - Auth operations and evidence deletions are NEVER queued — they fail loudly.
 *
 * Conflict policy (M-19): last-write-wins on `updated_at`, except task completion,
 * which is monotonic and never reverts.
 */

/** Only these relations accept queued writes. */
export type OutboxTable = 'tasks' | 'achievements' | 'events' | 'workflow_runs';

export type OutboxOp = 'insert' | 'update' | 'delete';

export interface OutboxEntry {
  /** uuid v4, also the idempotency key */
  id: string;
  table: OutboxTable;
  op: OutboxOp;
  payload: Record<string, unknown>;
  createdAt: number;
  /** surface to the user after 5 */
  attempts: number;
}

/** Attempts after which the pending write is shown to the user as stuck. */
export const ATTEMPT_WARNING_THRESHOLD = 5;

/** FIFO by `createdAt`, as the replay loop requires. Does not mutate the input. */
export function replayOrder(entries: readonly OutboxEntry[]): OutboxEntry[] {
  return [...entries].sort((a, b) => a.createdAt - b.createdAt);
}

/** Exponential backoff in milliseconds for a given attempt count. */
export function backoffMs(attempts: number, baseMs = 1_000, capMs = 5 * 60_000): number {
  return Math.min(capMs, baseMs * 2 ** Math.max(0, attempts));
}
