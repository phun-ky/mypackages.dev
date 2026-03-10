import { EmphasizedCard } from '../../../../../../../components/content/EmphasizedCard';
import type { FetchUserPackagesUnionItem } from '../../../../../../../types';
import './styles/numberOfPackages.css';

const html = String.raw;

export type NumberOfPackagesPropsType = {
  packages: FetchUserPackagesUnionItem[];
};

export const NumberOfPackages = (props: NumberOfPackagesPropsType) => {
  const { packages } = props;
  const numberFormat = new Intl.NumberFormat(navigator.language, {
    notation: 'compact',
    compactDisplay: 'short'
  });
  const formattedPackagesTotal = numberFormat.format(packages.length);

  return html`${EmphasizedCard({
    title: 'Packages',
    className: 'number-of-packages',
    children: html`<span class="big-number" id="number_of_packages">
      ${formattedPackagesTotal}
    </span>`
  })}`;
};
