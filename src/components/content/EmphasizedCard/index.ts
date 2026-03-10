import './styles/emphasizedCard.css';

export type EmphasizedCardPropsType = {
  children: string;
  title?: string;
  icon?: string;
  subTitle?: string;
  type?: 'subtle' | 'default' | 'box';
  className?: string;
  size?: 'full' | 'default';
};

const html = String.raw;

export const EmphasizedCard = (props: EmphasizedCardPropsType) => {
  const {
    children,
    title,
    icon = '',
    type = 'default',
    subTitle = '',
    className = '',
    size = 'default'
  } = props;

  return html`<div class="emphasized-card ${className} ${type} ${size}">
    <span class="title-container">
      <span class="subTitle">${subTitle}</span>
      <span class="title h4">${icon}${title}</span>
    </span>
    ${children}
  </div>`;
};
