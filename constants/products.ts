import { STRINGS } from './strings';

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
    title: STRINGS.moduleTitle101,
    priceLabel: STRINGS.price599,
  },
  {
    code: '102',
    title: STRINGS.moduleTitle102,
    priceLabel: STRINGS.price599,
  },
  {
    code: '103',
    title: STRINGS.moduleTitle103,
    priceLabel: STRINGS.price599,
  },
  {
    code: '104',
    title: STRINGS.moduleTitle104,
    priceLabel: STRINGS.price599,
  },
];
