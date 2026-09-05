/**
 * Fixture workspace — realistic Arabic content for every relation the app reads.
 *
 * This exists so the five product views can be rendered, screenshotted and
 * regression-tested WITHOUT a login and WITHOUT touching the production
 * Supabase project. Field names and shapes are taken from what the renderers
 * actually access, not guessed.
 *
 * The content is deliberately realistic rather than "test test test": Arabic
 * titles of believable length are the whole point, because that is what
 * exercises RTL wrapping, truncation and the 390pt layout. Latin strings appear
 * only where the real interface uses them (status values, workflow names).
 *
 * Nothing here is real. No client, employer or person named in this file
 * exists, and none of it is ever written anywhere.
 */

/*
 * Value domains below are read FROM THE CODE, not invented:
 *   events.start_date       DATE ('YYYY-MM-DD'), concatenated with 'T00:00:00'
 *   events.relevance_score  rendered as "SCORE n/5"
 *   events.relevance_status must_act | consider  (.tag.must_act exists in CSS)
 *   workflow_runs.status    active | planned | waiting  (counted as ACTIVE)
 *   workflow_steps.name     the step label — NOT .title
 *   tasks.status            todo | in_progress | waiting | blocked | done
 *   tasks.priority          high | medium | low
 */

export const WORKSPACE_ID = '00000000-0000-4000-8000-000000000001';
export const USER_ID = '00000000-0000-4000-8000-0000000000u1'.replace('u1', '00a1');

const dayTs = (offset) => {
  const d = new Date('2026-09-05T09:00:00Z');
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};

/**
 * `events.start_date` is a DATE column, not a timestamp: renderEvents does
 * `new Date(e.start_date + 'T00:00:00')`, so a full ISO string yields
 * Invalid Date. Date-only is what the real column returns.
 */
const day = (offset) => dayTs(offset).slice(0, 10);

export const workspace_members = [
  { user_id: USER_ID, workspace_id: WORKSPACE_ID, role: 'member' }
];

export const v_project_progress = [
  {
    workspace_id: WORKSPACE_ID,
    project_id: 'p-1',
    name: 'هوية المعرض السنوي',
    total_tasks: 12,
    done_tasks: 9,
    computed_progress: 75,
    next_milestone: 'تسليم الملفات للطباعة'
  },
  {
    workspace_id: WORKSPACE_ID,
    project_id: 'p-2',
    name: 'حملة الشركة الرقمية',
    total_tasks: 8,
    done_tasks: 2,
    computed_progress: 25,
    next_milestone: 'اعتماد النص التسويقي'
  },
  {
    workspace_id: WORKSPACE_ID,
    project_id: 'p-3',
    name: 'جلسة تصوير المنتجات',
    total_tasks: 6,
    done_tasks: 6,
    computed_progress: 100,
    next_milestone: 'أُنجز'
  }
];

export const tasks = [
  {
    id: 't-1', workspace_id: WORKSPACE_ID, project_id: 'p-1',
    title: 'مراجعة ألوان الغلاف قبل إرسالها للمطبعة',
    status: 'blocked', priority: 'high', owner_label: 'Fatimah',
    waiting_on: 'اعتماد مدير التسويق', due_at: dayTs(1), follow_up_at: dayTs(3),
    archived_at: null, created_at: dayTs(-6), updated_at: dayTs(-1)
  },
  {
    id: 't-2', workspace_id: WORKSPACE_ID, project_id: 'p-2',
    title: 'كتابة النص التسويقي للحملة الرقمية',
    status: 'in_progress', priority: 'high', owner_label: 'Fatimah',
    waiting_on: null, due_at: dayTs(2), follow_up_at: null,
    archived_at: null, created_at: dayTs(-5), updated_at: dayTs(-1)
  },
  {
    id: 't-3', workspace_id: WORKSPACE_ID, project_id: 'p-1',
    title: 'تجهيز ملفات التصدير بدقة عالية',
    status: 'waiting', priority: 'medium', owner_label: 'Fatimah',
    waiting_on: 'ردّ المطبعة على المقاسات', due_at: dayTs(4), follow_up_at: dayTs(2),
    archived_at: null, created_at: dayTs(-4), updated_at: dayTs(-2)
  },
  {
    id: 't-4', workspace_id: WORKSPACE_ID, project_id: null,
    title: 'تحديث ملف الأعمال الشخصي',
    status: 'todo', priority: 'low', owner_label: 'Fatimah',
    waiting_on: null, due_at: dayTs(9), follow_up_at: null,
    archived_at: null, created_at: dayTs(-3), updated_at: dayTs(-3)
  },
  {
    id: 't-5', workspace_id: WORKSPACE_ID, project_id: 'p-3',
    title: 'أرشفة صور الجلسة وتسليم النسخ النهائية',
    status: 'done', priority: 'medium', owner_label: 'Fatimah',
    waiting_on: null, due_at: dayTs(-2), follow_up_at: null,
    archived_at: null, created_at: dayTs(-10), updated_at: dayTs(-2)
  }
];

export const events = [
  {
    id: 'e-1', workspace_id: WORKSPACE_ID,
    name: 'أسبوع التصميم — معرض الرياض',
    start_date: day(21), relevance_status: 'must_act', relevance_score: 5,
    rationale: 'فرصة مباشرة لعرض أعمال الهوية البصرية أمام عملاء محتملين.'
  },
  {
    id: 'e-2', workspace_id: WORKSPACE_ID,
    name: 'ورشة التصوير التجاري',
    start_date: day(34), relevance_status: 'consider', relevance_score: 3,
    rationale: 'تطوير مهارات الإضاءة، لكن التاريخ يتعارض مع تسليم المعرض.'
  }
];

export const achievements = [
  {
    id: 'a-1', workspace_id: WORKSPACE_ID,
    title: 'إطلاق الهوية البصرية لثلاث علامات في ربع واحد',
    status: 'cv_ready', evidence_summary: 'ثلاث ملفات هوية معتمدة ومنشورة',
    impact: 'رفع اتساق العلامة عبر القنوات وقلّل زمن إنتاج المواد التسويقية.',
    created_at: dayTs(-30)
  },
  {
    id: 'a-2', workspace_id: WORKSPACE_ID,
    title: 'بناء نظام أرشفة للصور',
    status: 'published', evidence_summary: 'دليل الأرشفة الداخلي',
    impact: 'اختصر البحث عن الأصول من ساعات إلى دقائق.',
    created_at: dayTs(-60)
  }
];

export const task_evidence = [
  { id: 'ev-1', workspace_id: WORKSPACE_ID, task_id: 't-1', url: 'https://example.invalid/proof-1' }
];

export const v_control_exceptions = [
  { workspace_id: WORKSPACE_ID, task_id: 't-1', exception_type: 'blocked_over_3_days' },
  { workspace_id: WORKSPACE_ID, task_id: 't-3', exception_type: 'waiting_no_follow_up' }
];

export const design_concepts = [
  { id: 'c-1', workspace_id: WORKSPACE_ID, event_id: 'e-1', title: 'مفهوم: الخط الكوفي المعاصر', created_at: dayTs(-2) }
];

export const workflow_runs = [
  {
    id: 'r-1', workspace_id: WORKSPACE_ID, title: 'تسليم مشروع المعرض',
    status: 'active', target_date: dayTs(7)
  }
];

export const workflow_run_steps = [
  { id: 's-1', run_id: 'r-1', workflow_step_id: 'w-1', step_no: 1, status: 'done', due_at: dayTs(-1) },
  { id: 's-2', run_id: 'r-1', workflow_step_id: 'w-2', step_no: 2, status: 'in_progress', due_at: dayTs(2) },
  { id: 's-3', run_id: 'r-1', workflow_step_id: 'w-3', step_no: 3, status: 'todo', due_at: dayTs(6) }
];

export const workflow_steps = [
  { id: 'w-1', step_no: 1, name: 'جمع المتطلبات' },
  { id: 'w-2', step_no: 2, name: 'إنتاج المواد' },
  { id: 'w-3', step_no: 3, name: 'التسليم والاعتماد' }
];

/** Table name -> rows, as the PostgREST paths refer to them. */
export const TABLES = {
  workspace_members,
  v_project_progress,
  tasks,
  events,
  achievements,
  task_evidence,
  v_control_exceptions,
  design_concepts,
  workflow_runs,
  workflow_run_steps,
  workflow_steps
};

/** A session shaped like the one Supabase returns from signInWithPassword. */
export const SESSION = {
  access_token: 'fixture-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fixture-refresh-token',
  user: {
    id: USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'demo@employee-os.invalid',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: dayTs(-90)
  }
};
