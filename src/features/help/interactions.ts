import { addOnAfterAppRender, addOnInput } from '../../lib/spa';

import { faqLink, questionHtml } from './sections';
import { searchableQuestions } from './topics';

const MAX_RESULTS = 8;

let topicObserver: IntersectionObserver | null = null;

/**
 * Scrolls to the answer in the URL's hash. The router scrolls to the top on
 * every new page, so a link like /help/faq#confidence would otherwise land
 * at the top.
 */
const scrollToHash = () => {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;

  target?.scrollIntoView();
};
/** Marks the topic being read, in the sidebar and "On this page" */
const watchTopics = () => {
  topicObserver?.disconnect();

  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[data-topic]')
  );

  if (!links.length || !('IntersectionObserver' in window)) return;

  topicObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);

      if (!visible) return;

      for (const link of links) {
        link.classList.toggle(
          'is-here',
          link.dataset.topic === visible.target.id
        );
      }
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  for (const section of document.querySelectorAll('.help-topic')) {
    topicObserver.observe(section);
  }
};

/** Wires the FAQ, for one render. */
export const attachFaqEvents = () => {
  addOnAfterAppRender(() => {
    scrollToHash();
    watchTopics();
  });
};

const renderResults = () => {
  const input = document.getElementById('help-search');
  const results = document.getElementById('help-results');

  if (!(input instanceof HTMLInputElement) || !results) return;

  const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);

  if (!words.length) {
    results.innerHTML = '';
    results.hidden = true;

    return;
  }

  const matches = searchableQuestions().filter((q) =>
    words.every((word) => q.text.includes(word))
  );
  const shown = matches.slice(0, MAX_RESULTS);
  const items = shown
    .map(
      (q) =>
        `<li><a href="${faqLink(q.id)}" data-link>${questionHtml(q.question)}</a><span>${q.topic}</span></li>`
    )
    .join('');
  const total = `${matches.length} ${matches.length === 1 ? 'answer' : 'answers'}`;
  const count =
    shown.length < matches.length ? `${shown.length} of ${total}` : total;

  results.hidden = false;
  results.innerHTML = matches.length
    ? `<p class="help-count">${count}</p><ul>${items}</ul>`
    : '<p class="help-count">No answers match. <a href="/help/feedback" data-link>Ask in feedback</a></p>';
};

/** Wires the search on the help hub, for one render. */
export const attachHelpSearchEvents = () => {
  addOnInput('help-search', renderResults);
};
