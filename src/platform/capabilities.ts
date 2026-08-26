/**
 * Platform capability detection.
 *
 * One code path, two runtimes. Feature modules ask for a capability; they never
 * branch on platform. See MOBILE_BUILD_PLAN.md §5.
 *
 *   correct   export const captureEvidence = () => isNative() ? nativeCamera() : fileInputFallback();
 *   wrong     if (Capacitor.getPlatform() === 'ios') { ... }
 *
 * M-20 replaces the body of `isNative()` with `Capacitor.isNativePlatform()` once
 * `@capacitor/core` is a dependency. The signature does not change.
 */

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
}

export function isNative(): boolean {
  const cap = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap?.isNativePlatform?.() ?? false;
}

export function isWeb(): boolean {
  return !isNative();
}
