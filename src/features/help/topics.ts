import { FAQ_TOPICS, questionId } from './faq';

// The FAQ's topics as navigation and search (#63), for the FAQ and the help
// hub. Plain template strings, so Prettier never splits an end tag (#64).

/** The FAQ's sidebar: About and Feedback, then every topic */
export const helpSidebar = () =>
  `<nav class="help-side" aria-label="Help">
  <h2>About</h2><ul><li><a href="/help/about" data-link>About My packages</a></li><li><a href="/help/feedback" data-link>Send feedback</a></li></ul>
  <h2>Questions and answers</h2><ul>${FAQ_TOPICS.map((t) => `<li><a href="#${t.id}" data-topic="${t.id}">${t.title}</a></li>`).join('')}</ul>
</nav>`;

/** Every topic on the FAQ, for wide screens. The current one is marked as you scroll. */
export const onThisPage = () =>
  `<aside class="help-onpage" aria-label="On this page"><h2>On this page</h2><ul>${FAQ_TOPICS.map((t) => `<li><a href="#${t.id}" data-topic="${t.id}">${t.title}</a></li>`).join('')}</ul></aside>`;

/** The topics for phones, where there's no sidebar */
export const contents = () =>
  `<details class="help-contents help-card"><summary>Contents</summary><ul>${FAQ_TOPICS.map((t) => `<li><a href="#${t.id}">${t.title}</a></li>`).join('')}</ul></details>`;

export const answerCount = () =>
  FAQ_TOPICS.reduce((count, topic) => count + topic.items.length, 0);

/** Every question with its id, for the search on the help hub */
export const searchableQuestions = () =>
  FAQ_TOPICS.flatMap((topic) =>
    topic.items.map((item) => ({
      id: questionId(item.question),
      topic: topic.title,
      question: item.question,
      text: `${item.question} ${item.answer.replace(/<[^>]+>/g, ' ')}`.toLowerCase()
    }))
  );
