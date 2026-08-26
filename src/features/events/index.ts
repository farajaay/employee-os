import type { View } from '../../app/types';

/**
 * Event Radar
 *
 * Placeholder until M-05 moves the corresponding markup and behaviour out of
 * the single-file `index.html`. Behaviour must be preserved exactly — only the
 * module boundary changes. Queries belong in `src/data/repositories/` (M-08).
 */
export const eventsView: View = {
  id: 'events',
  label: 'Event Radar',
  render(host: HTMLElement): void {
    host.replaceChildren();
    const heading = document.createElement('h1');
    heading.textContent = 'Event Radar';
    host.append(heading);
  }
};
