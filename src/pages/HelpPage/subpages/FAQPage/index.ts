/* eslint-disable @typescript-eslint/no-unused-vars */
import DOMPurify from 'dompurify';
import { marked } from 'marked';

import { Link } from '../../../../components/actions/Link';
import { Container } from '../../../../components/layout/Container';
import type { PagePropsType } from '../../../../lib/spa/types';

import { getQuestionsAndAnswers } from './services/get-questions-and-answers';
import type {
  FAQCategoryEntries,
  FAQCategoryMapType,
  FAQSubCategoryMapType
} from './types';

import './styles/faqPage.css';

const html = String.raw;

export const FAQPage = async (props: PagePropsType, signal: AbortSignal) => {
  console.log(props, signal);

  const faqItems: FAQCategoryEntries = getQuestionsAndAnswers();
  const items: string[] = [];

  Object.entries(faqItems as FAQCategoryMapType).forEach(
    ([_, topCategories]) => {
      if (!topCategories) return;

      Object.entries(topCategories as FAQCategoryMapType).forEach(
        ([categoryKey, categories]) => {
          items.push(html`<h2>${categoryKey}</h2>`);

          if (!categories) return;

          Object.entries(categories as FAQSubCategoryMapType).forEach(
            ([subCategoryKey, faqItems]) => {
              items.push(html`<h3>${subCategoryKey}</h3>`);

              if (!faqItems) return;

              items.push('<div class="flex column gap-2">');

              faqItems.forEach((item) => {
                const { question, answer } = item;

                items.push(html`
                  <details class="well">
                    <summary>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="currentColor"
                      >
                        <path
                          d="M508.5-267.21q11.81-11.83 11.81-28.97 0-17.13-11.83-28.94-11.83-11.8-28.96-11.8-17.13 0-28.94 11.83-11.81 11.83-11.81 28.96 0 17.13 11.83 28.94 11.83 11.8 28.96 11.8 17.13 0 28.94-11.82Zm-57.27-131.41h56.31q.77-29.53 8.65-47.19 7.89-17.65 38.27-46.8 26.39-26.39 40.42-48.74 14.04-22.34 14.04-52.77 0-51.65-37.11-80.69-37.12-29.03-87.81-29.03-50.08 0-82.88 26.73-32.81 26.73-46.81 62.96l51.38 20.61q7.31-19.92 25-38.81 17.69-18.88 52.54-18.88 35.46 0 52.42 19.42 16.97 19.43 16.97 42.73 0 20.39-11.62 37.31-11.61 16.92-29.61 32.69-39.39 35.54-49.77 56.7-10.39 21.15-10.39 63.76ZM480.07-100q-78.84 0-148.21-29.92t-120.68-81.21q-51.31-51.29-81.25-120.63Q100-401.1 100-479.93q0-78.84 29.92-148.21t81.21-120.68q51.29-51.31 120.63-81.25Q401.1-860 479.93-860q78.84 0 148.21 29.92t120.68 81.21q51.31 51.29 81.25 120.63Q860-558.9 860-480.07q0 78.84-29.92 148.21t-81.21 120.68q-51.29 51.31-120.63 81.25Q558.9-100 480.07-100Zm-.07-60q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
                        />
                      </svg>
                      <h4>
                        ${DOMPurify.sanitize(marked.parse(question) as string)}
                      </h4>

                      <svg
                        class="arrow"
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="currentColor"
                      >
                        <path
                          d="m480-541.85-184 184L253.85-400 480-626.15 706.15-400 664-357.85l-184-184Z"
                        />
                      </svg>
                    </summary>
                    ${DOMPurify.sanitize(answer)}
                  </details>
                `);
              });

              items.push(html`</div>`);
            }
          );
        }
      );
    }
  );

  return html`<section class="faq-page">
    <header class="about-hero">
      ${Container({
        size: 'small',
        children: html`
          <div class="inner">
            ${Link({
              to: '/help',
              className: 'button back-to ghost',
              children: html`<svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 -960 960 960"
                  fill="currentColor"
                >
                  <path
                    d="m294.92-450 227.85 227.85L480-180 180-480l300-300 42.77 42.15L294.92-510H780v60H294.92Z"
                  />
                </svg>
                Back to Help`
            })}
            <div class="title-container">
              <span class="eyebrow">FAQ</span>
              <h1>Need answers? You might find them here!</h1>
            </div>
            <p class="lead">asd</p>
          </div>
        `
      })}
    </header>
    ${Container({
      size: 'small',
      children: html` ${items.join('\n')}`
    })}
  </section>`;
};
