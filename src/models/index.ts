/** Registers every model. Import this once before using `approved(...)`. */
import './city';
import './landmarks';
import './metro';
import './people';
import { registerClay } from './clay';
import { registerClay2 } from './clay2';
import { register } from './registry';
import { applyApprovals } from './approvals';
registerClay(register);
registerClay2();
applyApprovals();
export * from './registry';
export { buildModel } from './extras';
