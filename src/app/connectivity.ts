/**
 * M-11 offline state and M-12 service-worker update prompt.
 *
 * A separate entry point, loaded from index.html alongside the app module. It
 * touches nothing in `src/main.js`, which still holds the product's original
 * script and must not be edited before M-05 stage 2.
 *
 * Both surfaces share one bar at the bottom of the screen, built from existing
 * tokens. Neither ever blocks the interface: the app stays usable offline
 * (M-17's read cache is what makes it useful offline), and an available update
 * is an offer, never an interruption.
 */

type BarKind = 'offline' | 'update';

const TEXT = {
  offline: 'أنت غير متصل بالإنترنت. التغييرات ستُحفظ عند عودة الاتصال.',
  update: 'تحديث متاح',
  reload: 'تحديث الآن',
  dismiss: 'لاحقًا'
} as const;

let bar: HTMLDivElement | null = null;
let label: HTMLSpanElement | null = null;
let action: HTMLButtonElement | null = null;

function ensureBar(): { bar: HTMLDivElement; label: HTMLSpanElement; action: HTMLButtonElement } {
  if (bar && label && action) return { bar, label, action };

  bar = document.createElement('div');
  bar.className = 'netbar';
  bar.id = 'netbar';
  // Announced politely: an offline notice must not interrupt what the user is
  // typing, and VoiceOver/TalkBack navigate this interface in Arabic (M-35).
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');

  label = document.createElement('span');
  action = document.createElement('button');
  action.type = 'button';
  action.hidden = true;

  bar.append(label, action);
  document.body.append(bar);
  return { bar, label, action };
}

function show(kind: BarKind, text: string, actionText?: string, onAction?: () => void): void {
  const el = ensureBar();
  el.label.textContent = text;
  el.bar.classList.toggle('update', kind === 'update');
  el.bar.classList.add('show');

  if (actionText && onAction) {
    el.action.textContent = actionText;
    el.action.hidden = false;
    el.action.onclick = onAction;
  } else {
    el.action.hidden = true;
    el.action.onclick = null;
  }
}

function hide(): void {
  bar?.classList.remove('show');
}

/** M-11 — reflect connectivity. `online`/`offline` fire in the browser; M-18 adds the native listener. */
function watchConnectivity(): void {
  const render = (): void => {
    // Never clobber an update offer with a connectivity change.
    if (bar?.classList.contains('update') && bar.classList.contains('show')) return;
    if (navigator.onLine) hide();
    else show('offline', TEXT.offline);
  };
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  render();
}

/**
 * M-12 — offer the waiting worker instead of reloading under the user.
 *
 * `registerType: 'prompt'` means a new service worker installs and then waits.
 * Reloading automatically would discard whatever the user is part-way through
 * typing into a task or an achievement, so the update is always an offer.
 */
async function watchForUpdates(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        show('update', TEXT.update, TEXT.reload, () => {
          void updateSW(true);
        });
      }
    });
  } catch {
    // No service worker in this build (dev, or an unsupported browser). The
    // offline bar still works from navigator.onLine.
  }
}

export function initConnectivity(): void {
  watchConnectivity();
  void watchForUpdates();
}

initConnectivity();
