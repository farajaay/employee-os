/**
 * Application types.
 *
 * M-07 replaces the `Database` placeholder below with the output of
 * `supabase gen types typescript`, covering all eleven relations in use:
 * tasks, achievements, design_concepts, events, task_evidence, workflow_runs,
 * workflow_run_steps, workflow_steps, workspace_members, v_control_exceptions,
 * v_project_progress.
 */

/** The five product views, named as they are in the current `index.html`. */
export type ViewId = 'home' | 'projects' | 'workflow' | 'events' | 'career';

export const VIEW_IDS: readonly ViewId[] = [
  'home',
  'projects',
  'workflow',
  'events',
  'career'
];

/**
 * A view module. Feature modules under `src/features/` export one of these.
 * Views never call Supabase directly — they go through `src/data/repositories/`
 * (enforced from M-08: no `supabase.from(` may appear under `src/features/`).
 */
export interface View {
  readonly id: ViewId;
  /** Arabic label, as shown in the sidebar today and the bottom tabs from M-13. */
  readonly label: string;
  render(host: HTMLElement): void;
}

/** The eleven relations the product reads or writes. */
export const RELATIONS = [
  'tasks',
  'achievements',
  'design_concepts',
  'events',
  'task_evidence',
  'workflow_runs',
  'workflow_run_steps',
  'workflow_steps',
  'workspace_members',
  'v_control_exceptions',
  'v_project_progress'
] as const;

export type RelationName = (typeof RELATIONS)[number];
