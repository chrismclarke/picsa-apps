import { IRegionSettings, IAppVariants } from '@picsa/models';

const REGIONS: { [variant in IAppVariants]: IRegionSettings } = {
  MALAWI: {
    countryCode: 'MW',
    languages: [
      { label: 'English', code: 'en' },
      { label: 'Chichewa', code: 'ny' }
    ],
    currency: 'MK',
    currencyCounters: {
      large: 50000,
      medium: 10000,
      small: 1000,
      half: 500
    },
    subtitle: 'Extension Toolkit'
  },
  KENYA: {
    countryCode: 'KE',
    languages: [
      { label: 'English', code: 'en' },
      { label: 'Swahili', code: 'sw' }
    ],
    currency: 'KSH',
    currencyCounters: {
      large: 5000,
      medium: 1000,
      small: 100,
      half: 50
    },
    subtitle: 'for Financial Service Providers'
  },
  // add support for self-referencing default and dev
  get DEFAULT() {
    return this.MALAWI;
  },
  get DEV() {
    return this.MALAWI;
  }
};

export default REGIONS;
