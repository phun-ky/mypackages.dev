import { slugify } from '../../../utils/slugify';
import { Container } from '../../layout/Container';
import './styles/footer.css';

const html = String.raw;

export type FooterPropsType = {
  page: string;
};

export const Footer = ({ page }: FooterPropsType) => {
  if (
    page !== 'StartPage' &&
    page !== 'FAQPage' &&
    page !== 'HelpPage' &&
    page !== 'FeedbackPage' &&
    page !== 'AboutPage'
  )
    return '';

  return html`<footer class="footer ${slugify(page)}">
    ${Container({
      size: 'small',
      children: html` <span class="hr full" role="presentation"></span>
        <div class="inner">
          <div>
            <p>
              Made with <strong>WD-40</strong> by
              <a target="_blank" href="https://phun-ky.net">
                Alexander Vassbotn Røyne-Helgesen
              </a>
              . <br />
              Buy <strong>me</strong> some
              <a href="https://www.paypal.me/phunky/20">monkey grease?</a>
            </p>
            <p>
              npm is a registered trademark of npm, Inc. This site is not
              affiliated with npm, Inc.
            </p>
          </div>
          <p class="cc-license">
            <span>
              <a
                rel="noopener noreferrer"
                target="_blank"
                rel="license"
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              >
                <img
                  alt="Creative Commons Licence"
                  style="border-width: 0"
                  width="88"
                  height="31"
                  src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png"
                />
              </a>
            </span>
            <span>
              This work, and all assets created by
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://phun-ky.net"
                property="cc:attributionName"
                rel="cc:attributionURL"
              >
                Alexander Vassbotn Røyne-Helgesen
              </a>
              is licensed under a
              <a
                rel="noopener noreferrer"
                target="_blank"
                rel="license"
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              >
                Creative Commons Attribution-NonCommercial-ShareAlike 4.0
                International License
              </a>
              .
            </span>
          </p>
        </div>`
    })}
  </footer>`;
};
