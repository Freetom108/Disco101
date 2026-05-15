export type ModuleCode = '101' | '102' | '103' | '104';

export type ModuleProduct = {
  code: ModuleCode;
  /** Zeile 1, z. B. "Unit 1 Basics" */
  title: string;
  priceLabel: string;
};

export const MODULE_PRODUCTS: ModuleProduct[] = [
  {
    code: '101',
    title: 'Unit 1 Basics',
    priceLabel: '5,99 €',
  },
  {
    code: '102',
    title: 'Unit 2 Urlaub',
    priceLabel: '5,99 €',
  },
  {
    code: '103',
    title: 'Unit 3 Job',
    priceLabel: '5,99 €',
  },
  {
    code: '104',
    title: 'Unit 4 Expat',
    priceLabel: '5,99 €',
  },
];
