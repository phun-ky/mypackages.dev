import { Link } from '../../components/actions/Link';
import { Container } from '../../components/layout/Container';
import type { PagePropsType } from '../../lib/spa/types';
import './styles/helpPage.css';

const html = String.raw;

export const HelpPage = async (props: PagePropsType, signal: AbortSignal) => {
  console.log(props, signal);

  return html`<section class="help-page">
    <header class="about-hero">
      ${Container({
        size: 'small',
        children: html`
          <div class="inner">
            <div class="title-container">
              <span class="eyebrow">Help</span>
              <h1>Need help?</h1>
            </div>
            <p class="lead"></p>

            <div class="flex gap-1">
              ${Link({
                to: '/help/faq',
                className: 'button primary',
                children: 'Frequently Answered Questions'
              })}
              ${Link({
                to: '/help/about',
                className: 'button',
                children: 'About'
              })}
            </div>
          </div>
        `
      })}
    </header>

    ${Container({
      size: 'small',
      children: html`asd`
    })}
  </section>`;
};
