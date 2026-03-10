import './styles/packagePreview.css';

const html = String.raw;

export const PackagePreview = () => {
  return html`<div class="package-preview">
    <div class="feature-preview">
      <div class="feature-preview-inner">
        <img src="/package-preview.png" />
      </div>
    </div>
  </div>`;
};
