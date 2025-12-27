import { getLicenseStatus } from '../../../licensing/runtime';
import type { MessageContext, PolicyDecision } from '../types';

export const checkLicense = (ctx: MessageContext): PolicyDecision => {
    const status = getLicenseStatus();

    if (status?.enforced_restrictions.block_sends) {
        return {
            allowed: false,
            reason: 'License expired or locked. Sending is disabled.',
            code: 403
        };
    }

    return { allowed: true };
};
