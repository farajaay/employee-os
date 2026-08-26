import { describe, expect, it } from 'vitest';
import { parseHash } from '../../src/app/router';

describe('parseHash', () => {
  it('resolves each of the five views', () => {
    expect(parseHash('#/home')).toBe('home');
    expect(parseHash('#/projects')).toBe('projects');
    expect(parseHash('#/workflow')).toBe('workflow');
    expect(parseHash('#/events')).toBe('events');
    expect(parseHash('#/career')).toBe('career');
  });

  it('falls back to home for an empty or unknown hash', () => {
    expect(parseHash('')).toBe('home');
    expect(parseHash('#')).toBe('home');
    expect(parseHash('#/nope')).toBe('home');
  });

  it('ignores a query string', () => {
    expect(parseHash('#/events?id=42')).toBe('events');
  });
});
