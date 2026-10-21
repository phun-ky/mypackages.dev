// Pieces shared by the help hub, About and the FAQ (#63), without the FAQ's
// content, so About doesn't load it. Plain template strings, so Prettier
// never splits an end tag over two lines (#64). All of the text comes from
// this code base.

/** A question as markup: `code` in backticks is the only formatting */
export const questionHtml = (question: string) =>
  question
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

const WEIGHTS: [string, number][] = [
  ['Security', 30],
  ['Maintenance', 25],
  ['Quality', 25],
  ['Provenance', 10],
  ['Popularity', 10]
];

/** The weights of the health score, as one bar */
export const weightsBar = () =>
  `<div class="help-weights" role="img" aria-label="Weights: ${WEIGHTS.map(([name, weight]) => `${name} ${weight}%`).join(', ')}">${WEIGHTS.map(([name, weight], i) => `<span class="help-weight is-${i}" style="flex:${weight}" aria-hidden="true"><b>${name}</b>${weight}%</span>`).join('')}</div>`;

/** The weights, labels and caps of the health score, drawn */
export const scoreFigure = () =>
  `<figure class="help-figure"><figcaption class="visually-hidden">How the health score is worked out</figcaption>
  <span class="help-label">Weights</span>${weightsBar()}
  <span class="help-label">Labels</span><ul class="help-bands"><li><b>85 to 100</b>Excellent</li><li><b>70 to 84</b>Good</li><li><b>50 to 69</b>OK</li><li><b>0 to 49</b>Poor</li></ul>
  <span class="help-label">Caps, so a risky package can't look fine</span><ul class="help-caps"><li><b>Deprecated</b>Capped at 15</li><li><b>Security under 40</b>Capped at 55</li><li><b>Security under 60</b>Capped at 75</li></ul>
</figure>`;

const SOURCES: [string, string, string][] = [
  [
    'npm',
    'Package metadata and download history, from the registry and the downloads API.',
    '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 15v-6h3v6M13 9v6M13 9h4v6"/>'
  ],
  [
    'OSV',
    'Known vulnerabilities for the exact version, from the open source vulnerability database.',
    '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'
  ],
  [
    'GitHub',
    'Stars and open issues, when the package links to a GitHub repository.',
    '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M18 11.5c0 3-4 3-9.5 5"/>'
  ]
];

export const sourceCards = () =>
  `<ul class="help-sources">${SOURCES.map(([name, text, icon]) => `<li class="help-card"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><h3>${name}</h3><p>${text}</p></li>`).join('')}</ul>`;

export const faqLink = (topicOrQuestionId: string) =>
  `/help/faq#${topicOrQuestionId}`;
