import { slugify } from '../../../utils/slugify';
import { Link } from '../../actions/Link';
import './styles/footer.css';

const html = String.raw;

export type FooterPropsType = {
  page: string;
};

const LICENSE = 'https://creativecommons.org/licenses/by-nc-sa/4.0/';
// A plain string, so Prettier doesn't split the end tag over two lines,
// which diff-dom can't read (#64)
const external = (href: string, text: string, rel = 'noopener noreferrer') =>
  `<a href="${href}" target="_blank" rel="${rel}">${text}</a>`;

export const Footer = ({ page }: FooterPropsType) => {
  if (
    page !== 'StartPage' &&
    page !== 'FAQPage' &&
    page !== 'HelpPage' &&
    page !== 'FeedbackPage' &&
    page !== 'AboutPage'
  )
    return '';

  // The header hides its links on small screens, so they're here too
  return html`<footer class="footer ${slugify(page)}">
    <div class="footer-inner">
      <nav class="footer-nav" aria-label="Footer">
        ${Link({ to: '/packages', children: 'Packages' })}
        ${Link({ to: '/users', children: 'Users' })}
        ${Link({ to: '/help/about', children: 'About' })}
        ${Link({ to: '/help/faq', children: 'FAQ' })}
        ${Link({ to: '/help/feedback', children: 'Feedback' })}
        ${Link({
          to: 'https://github.com/phun-ky/mypackages.dev',
          children: 'GitHub'
        })}
      </nav>
      <div class="footer-credits">
        <p>
          Made with <strong>WD-40</strong> by
          ${external('https://phun-ky.net', 'Alexander Vassbotn Røyne-Helgesen')}.
          Buy <strong>me</strong> some
          ${external('https://www.paypal.me/phunky/20', 'monkey grease?')}
        </p>
        <p>
          npm is a registered trademark of npm, Inc. This site is not affiliated
          with npm, Inc.
        </p>
      </div>
      <p class="cc-license">
        ${external(
          LICENSE,
          '<img alt="Creative Commons Licence" width="88" height="31" src="/meta/cc-by-nc-sa-4.0-88x31.png">',
          'license noopener noreferrer'
        )}
        <span>
          The code is
          ${external(
            'https://github.com/phun-ky/mypackages.dev/blob/main/LICENSE',
            'MIT licensed',
            'license noopener noreferrer'
          )}.
          The logo, icons and images, by Alexander Vassbotn Røyne-Helgesen, are
          licensed under a
          ${external(
            LICENSE,
            'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License',
            'license noopener noreferrer'
          )}.
        </span>
      </p>
    </div>
  </footer>`;
};
