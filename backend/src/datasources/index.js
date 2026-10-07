// datasources/index.js
// Factory that returns the configured provider. The rest of the app imports
// `getDataSource()` and never names a concrete class — so adding a provider is
// a two-line change here, nothing else.

import { config } from '../config.js';
import { UkPoliceDataSource } from './UkPoliceDataSource.js';
import { IndiaNcrbDataSource } from './IndiaNcrbDataSource.js';

let instance = null;

export function getDataSource() {
  if (instance) return instance;
  switch (config.dataSource) {
    case 'india':
      instance = new IndiaNcrbDataSource();
      break;
    case 'uk':
    default:
      instance = new UkPoliceDataSource();
      break;
  }
  return instance;
}
