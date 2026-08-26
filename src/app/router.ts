import { viewsById } from '../features';
import { markActiveTab } from './shell';
import { VIEW_IDS, type ViewId } from './types';

const DEFAULT_VIEW: ViewId = 'home';

function isViewId(value: string): value is ViewId {
  return (VIEW_IDS as readonly string[]).includes(value);
}

/** `#/projects` -> `projects`; anything unrecognised -> `home`. */
export function parseHash(hash: string): ViewId {
  const id = hash.replace(/^#\/?/, '').split('?')[0] ?? '';
  return isViewId(id) ? id : DEFAULT_VIEW;
}

/**
 * One router for both runtimes. M-22 hooks the Android hardware back button and
 * deep links into `navigate()` — it does not add a second routing path.
 */
export function startRouter(root: HTMLElement, host: HTMLElement): void {
  const render = (): void => {
    const id = parseHash(window.location.hash);
    viewsById[id].render(host);
    markActiveTab(root, id);
  };

  window.addEventListener('hashchange', render);
  render();
}

export function navigate(id: ViewId): void {
  window.location.hash = `#/${id}`;
}
