import { PROJECT_OWNER, PROJECT_REPO_SITE_URL } from '../../constants';

export type BuildBugReportUrlParamsType = {
  title: string;
  body: string;
};

export const buildBugReportUrl = (params: BuildBugReportUrlParamsType) => {
  const { title, body } = params;
  const base = `${PROJECT_REPO_SITE_URL}/issues/new`;
  const template = 'bug_report.md';
  const assignees = [PROJECT_OWNER];
  const labels = ['problems: 🐛 bug'];
  const urlParams = new URLSearchParams();

  urlParams.set('template', template);
  urlParams.set('title', title);
  urlParams.set('body', body);

  if (labels?.length) urlParams.set('labels', labels.join(','));

  if (assignees?.length) urlParams.set('assignees', assignees.join(','));

  return `${base}?${urlParams.toString()}`;
};

export const buildFeedbackReportUrl = (params: BuildBugReportUrlParamsType) => {
  const { title, body } = params;
  const base = `${PROJECT_REPO_SITE_URL}/issues/new`;
  const template = 'feedback.md';
  const assignees = [PROJECT_OWNER];
  const labels = ['feedback: 💬 general'];
  const urlParams = new URLSearchParams();

  urlParams.set('template', template);
  urlParams.set('title', title);
  urlParams.set('body', body);

  if (labels?.length) urlParams.set('labels', labels.join(','));

  if (assignees?.length) urlParams.set('assignees', assignees.join(','));

  return `${base}?${urlParams.toString()}`;
};
