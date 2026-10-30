import { FAQ_TOPICS } from '../../features/help/faq';
import { attachHelpSearchEvents } from '../../features/help/interactions';
import { faqLink } from '../../features/help/sections';
import { answerCount } from '../../features/help/topics';

import './styles/helpPage.css';

const html = String.raw;
const card = (to: string, title: string, text: string) =>
  `<li><a class="help-card help-link-card" href="${to}" data-link><h2>${title}</h2><p>${text}</p></a></li>`;

/** The help hub (#63): search the FAQ, or go to About, the FAQ or Feedback. */
export const HelpPage = async () => {
  attachHelpSearchEvents();

  return html`<div class="help-page nebula-page">
    <div class="help-wrap">
      <div class="help-hero">
        <span class="help-eyebrow">Help</span>
        <h1>How can we help?</h1>
        <p class="help-lede">
          Answers about the numbers, the health score, and your account.
        </p>
        <div class="help-search" role="search">
          <label for="help-search" class="visually-hidden">
            Search the answers
          </label>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.2-4.2" />
          </svg>
          <input
            type="search"
            id="help-search"
            placeholder="Search the answers"
            autocomplete="off"
          />
        </div>
        <div
          id="help-results"
          class="help-results"
          aria-live="polite"
          hidden
        ></div>
      </div>

      <ul class="help-cards">
        ${card(
          '/help/faq',
          'Questions and answers',
          `${answerCount()} answers in ${FAQ_TOPICS.length} topics`
        )}
        ${card('/help/about', 'About', 'Where the data comes from, and who makes it')}
        ${card('/help/feedback', 'Feedback', 'Something off or missing? Say so')}
      </ul>

      <section class="help-block" aria-labelledby="topics-title">
        <h2 id="topics-title">Topics</h2>
        <ul class="help-chips">
          ${FAQ_TOPICS.map(
            (t) =>
              `<li><a href="${faqLink(t.id)}" data-link>${t.title} <span>${t.items.length}</span></a></li>`
          ).join('')}
        </ul>
      </section>
    </div>
  </div>`;
};
