import { careerView } from './career';
import { eventsView } from './events';
import { projectsView } from './projects';
import { todayView } from './today';
import { workflowView } from './workflow';
import type { View, ViewId } from '../app/types';

/** Tab order, right-to-left. Matches the sidebar order in the current `index.html`. */
export const views: readonly View[] = [
  todayView,
  projectsView,
  workflowView,
  eventsView,
  careerView
];

export const viewsById: Record<ViewId, View> = {
  home: todayView,
  projects: projectsView,
  workflow: workflowView,
  events: eventsView,
  career: careerView
};
