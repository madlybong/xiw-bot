import { waManager } from '../../wa';
import type { MessageContext, PolicyDecision } from '../types';

export const checkInstanceStatus = (ctx: MessageContext): PolicyDecision => {
    const session = waManager.getSession(ctx.instanceId);

    if (!session) {
        return {
            allowed: false,
            reason: 'Instance not found or not running.',
            code: 404
        };
    }

    if (session.status !== 'connected') {
        return {
            allowed: false,
            reason: `Instance is ${session.status}. Please wait for connection.`,
            code: 503 // Service Unavailable
        };
    }

    return { allowed: true };
};
