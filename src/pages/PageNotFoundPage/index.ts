import { Link } from '../../components/actions/Link';
import { Container } from '../../components/layout/Container';

import '../ErrorPage/styles/errorPage.css';

const html = String.raw;

export const PageNotFoundPage = async () => {
  return html`<section class="error-page">
    <header class="error-hero">
      ${Container({
        size: 'small',
        children: html`<div class="inner">
          <h1>Page not found</h1>
        </div> `
      })}
    </header>
    ${Container({
      size: 'small',
      children: html`<div class="inner">
        <p>The page you are looking for does not exist, or it has moved.</p>
        ${Link({
          className: 'button primary',
          to: '/',
          children: 'Go to the start page'
        })}
      </div> `
    })}
  </section>`;
};
