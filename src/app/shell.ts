import { views } from '../features';
import { setState } from './state';
import type { ViewId } from './types';

/**
 * The application shell: one persistent chrome, one swappable view host.
 *
 * M-13 turns the navigation below into a sidebar at >= 900 px and bottom tabs
 * under it. M-14 applies the safe-area insets. The chrome is deliberately bare
 * here — the product's markup and styling arrive with M-00/M-04/M-05, and this
 * scaffold must not invent a visual language of its own.
 */
export function mountShell(root: HTMLElement): { host: HTMLElement } {
  root.replaceChildren();

  const nav = document.createElement('nav');
  nav.className = 'app-nav';
  nav.setAttribute('aria-label', 'التنقل الرئيسي');

  for (const view of views) {
    const link = document.createElement('a');
    link.href = `#/${view.id}`;
    link.dataset['viewId'] = view.id;
    link.textContent = view.label;
    nav.append(link);
  }

  const host = document.createElement('main');
  host.className = 'app-view';
  host.id = 'view';

  root.append(nav, host);
  return { host };
}

export function markActiveTab(root: HTMLElement, view: ViewId): void {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('.app-nav a')) {
    const isActive = link.dataset['viewId'] === view;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  setState({ view });
}
