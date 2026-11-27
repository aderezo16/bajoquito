/** Registers every model. Import this once before using `approved(...)`. */
import './city';
import './landmarks';
import './metro';
import './people';
import { registerClay } from './clay';
import { register } from './registry';
registerClay(register);
export * from './registry';
