export type FAQItemType = {
  question: string;
  answer: string;
};

export type FAQCategory = 'Site' | 'Npm' | 'Github' | 'Account' | 'Privacy';
export type FAQSubCategory =
  | 'Search'
  | 'Package'
  | 'Health'
  | 'General'
  | 'Legal'
  | 'Repo'
  | 'Login';

export type FAQItemsType = FAQItemType[];

export type FAQSubCategoryMapType = Partial<
  Record<FAQSubCategory, FAQItemsType>
>;

export type FAQCategoryMapType = Partial<
  Record<FAQCategory, FAQSubCategoryMapType>
>;

export type FAQCategoryEntries = FAQCategoryMapType[];
