import { STRINGS } from './strings';

export type ModuleCode = '101' | '102' | '103' | '104';

export type ModuleProduct = {
  code: ModuleCode;
  title: string;
  productId: string;
};

export const MODULE_PRODUCTS: ModuleProduct[] = [
  { code: '101', title: STRINGS.moduleTitle101, productId: 'purchase_unit_1' },
  { code: '102', title: STRINGS.moduleTitle102, productId: 'purchase_unit_2' },
  { code: '103', title: STRINGS.moduleTitle103, productId: 'purchase_unit_3' },
  { code: '104', title: STRINGS.moduleTitle104, productId: 'purchase_unit_4' },
];
