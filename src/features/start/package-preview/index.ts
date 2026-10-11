import './styles/packagePreview.css';

const html = String.raw;

export const PackagePreview = () => {
  return html`<div class="package-preview">
    <div class="feature-preview">
      <div class="feature-preview-inner">
        <img
          src="/package-preview.png"
          alt="Package health score of 96 out of 100, with scores for security, quality, provenance, popularity and maintenance"
        />
      </div>
    </div>
  </div>`;
};
