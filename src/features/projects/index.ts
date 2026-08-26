import type { View } from '../../app/types';

/**
 * المشاريع
 *
 * Placeholder until M-05 moves the corresponding markup and behaviour out of
 * the single-file `index.html`. Behaviour must be preserved exactly — only the
 * module boundary changes. Queries belong in `src/data/repositories/` (M-08).
 */
export const projectsView: View = {
  id: 'projects',
  label: 'المشاريع',
  render(host: HTMLElement): void {
    host.replaceChildren();
    const heading = document.createElement('h1');
    heading.textContent = 'المشاريع';
    host.append(heading);
  }
};
