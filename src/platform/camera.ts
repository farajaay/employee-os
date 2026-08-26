/**
 * Task evidence capture — M-25.
 *
 * `@capacitor/camera` on native, a file input on web, one call site either way.
 * Upload to Supabase Storage, then insert into `task_evidence`.
 *
 * Done when: a photo taken on device is visible against the task on the web build
 * too. This is one of the additive schema/storage exceptions the guardrails allow.
 *
 * iOS strings (M-28): NSCameraUsageDescription, NSPhotoLibraryUsageDescription.
 */
export {};
