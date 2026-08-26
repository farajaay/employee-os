/**
 * Push notifications — M-24.
 *
 * APNs + FCM registration, one token row per device, dispatched from a Supabase
 * Edge Function on task due dates and Event Radar changes.
 *
 * Apple forbids requiring push for core functionality: every feature must still
 * work with the permission denied. That is half of M-24's Done when.
 *
 * M-28 supplies the rationale strings. No permission prompt at cold start.
 */
export {};
