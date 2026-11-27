/** Registers every model. Import this once before using `approved(...)`. */
import './city';
import './landmarks';
import './metro';
import './people';
import { registerClay } from './clay';
import { registerClay2 } from './clay2';
import { registerClay3 } from './clay3';
import { register } from './registry';
import { applyApprovals } from './approvals';
registerClay(register);
registerClay2();
registerClay3(register);
applyApprovals();
export * from './registry';
export { buildModel } from './extras';
