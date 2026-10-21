import { SiteHeader } from '../../../../components/page-section/SiteHeader';
import {
  FAQ_TOPICS,
  SCORE_QUESTION,
  questionId
} from '../../../../features/help/faq';
import { attachFaqEvents } from '../../../../features/help/interactions';
import { questionHtml, scoreFigure } from '../../../../features/help/sections';
import {
  contents,
  helpSidebar,
  onThisPage
} from '../../../../features/help/topics';
import type { PagePropsType } from '../../../../lib/spa/types';

import '../../styles/helpPage.css';

const html = String.raw;
const topics = () =>
  FAQ_TOPICS.map(
    (topic) =>
      `<section class="help-topic" id="${topic.id}" aria-labelledby="${topic.id}-title"><h2 id="${topic.id}-title">${topic.title}</h2>${topic.items
        .map((item) => {
          const id = questionId(item.question);

          return `<h3 id="${id}">${questionHtml(item.question)} <a class="help-anchor" href="#${id}" aria-label="Link to this answer">#</a></h3>${item.question === SCORE_QUESTION ? scoreFigure() : ''}<div class="help-prose">${item.answer}</div>`;
        })
        .join('')}</section>`
  ).join('');

/**
 * Questions and answers (#63), as docs: every answer is open, so the
 * browser's find works, and each question has its own link.
 */
export const FAQPage = async ({ session = null }: PagePropsType) => {
  attachFaqEvents();

  return html`<div class="help-page nebula-page">
    ${SiteHeader({ session })}
    <div class="help-docs">
      ${helpSidebar()}
      <div class="help-doc">
        <span class="help-eyebrow">FAQ</span>
        <h1>Questions and answers</h1>
        <p class="help-lede">
          Every answer is on this page, so the browser's find works, and each
          question has its own link.
        </p>
        ${contents()} ${topics()}
      </div>
      ${onThisPage()}
    </div>
  </div>`;
};
