export type ModuleCode = '101' | '102' | '103' | '104';

export type ModuleProduct = {
  code: ModuleCode;
  /** Zeile 1, z. B. "Disco 101" */
  title: string;
  /** Zeile 2 vor Preis, z. B. "Basis" → angezeigt als `{subtitle} · {priceLabel}` */
  subtitle: string;
  priceLabel: string;
};

export const MODULE_PRODUCTS: ModuleProduct[] = [
  {
    code: '101',
    title: 'Disco 101',
    subtitle: 'Basis',
    priceLabel: '9,99 €',
  },
  {
    code: '102',
    title: 'Disco 102',
    subtitle: 'Urlaub',
    priceLabel: '9,99 €',
  },
  {
    code: '103',
    title: 'Disco 103',
    subtitle: 'Job',
    priceLabel: '9,99 €',
  },
  {
    code: '104',
    title: 'Disco 104',
    subtitle: 'Expats',
    priceLabel: '9,99 €',
  },
];
