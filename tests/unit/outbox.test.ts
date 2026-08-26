import { describe, expect, it } from 'vitest';
import { backoffMs, replayOrder, type OutboxEntry } from '../../src/data/outbox';

function entry(id: string, createdAt: number): OutboxEntry {
  return { id, table: 'tasks', op: 'insert', payload: {}, createdAt, attempts: 0 };
}

describe('replayOrder', () => {
  it('replays FIFO by createdAt', () => {
    const out = replayOrder([entry('c', 30), entry('a', 10), entry('b', 20)]);
    expect(out.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input', () => {
    const input = [entry('b', 20), entry('a', 10)];
    replayOrder(input);
    expect(input.map((e) => e.id)).toEqual(['b', 'a']);
  });
});

describe('backoffMs', () => {
  it('grows exponentially from the base delay', () => {
    expect(backoffMs(0)).toBe(1_000);
    expect(backoffMs(1)).toBe(2_000);
    expect(backoffMs(3)).toBe(8_000);
  });

  it('is capped', () => {
    expect(backoffMs(99)).toBe(5 * 60_000);
  });
});
