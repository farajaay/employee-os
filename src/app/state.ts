import type { ViewId } from './types';

export interface AppState {
  /** The view currently on screen. */
  view: ViewId;
  /** Set by M-11 from the browser/native online signal. */
  online: boolean;
  /** Number of unsent outbox entries. Surfaced in the header from M-19. */
  pendingWrites: number;
}

type Listener = (state: Readonly<AppState>) => void;

const state: AppState = {
  view: 'home',
  online: true,
  pendingWrites: 0
};

const listeners = new Set<Listener>();

export function getState(): Readonly<AppState> {
  return state;
}

export function setState(patch: Partial<AppState>): void {
  Object.assign(state, patch);
  for (const listener of listeners) listener(state);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
