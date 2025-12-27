import type { MessageContext, PolicyDecision } from '../types';

export const checkAssignment = (ctx: MessageContext): PolicyDecision => {
    // If no specific restrictions are set, assume allowed (e.g. Admin)
    if (ctx.userRole === 'admin') return { allowed: true };
    if (!ctx.allowedInstances) return { allowed: true };

    const targetId = parseInt(ctx.instanceId, 10);

    if (!ctx.allowedInstances.includes(targetId)) {
        return {
            allowed: false,
            reason: `Access denied. You are not assigned to Instance ID ${targetId}.`,
            code: 403
        };
    }

    return { allowed: true };
};
