import type { View } from '../../app/types';

/**
 * Career
 *
 * Placeholder until M-05 moves the corresponding markup and behaviour out of
 * the single-file `index.html`. Behaviour must be preserved exactly — only the
 * module boundary changes. Queries belong in `src/data/repositories/` (M-08).
 */
export const careerView: View = {
  id: 'career',
  label: 'Career',
  render(host: HTMLElement): void {
    host.replaceChildren();
    const heading = document.createElement('h1');
    heading.textContent = 'Career';
    host.append(heading);
  }
};
