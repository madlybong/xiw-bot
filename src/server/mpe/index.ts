import { auditLogger } from '../audit';
import type { MessageContext, PolicyDecision } from './types';

// Rules
import { checkAssignment } from './rules/assignment';
import { checkInstanceStatus } from './rules/instance-status';
import { checkSuppression } from './rules/suppression';
import { checkWindow } from './rules/window';
import { checkContent } from './rules/content';
import { checkTemplate } from './rules/template';
import { checkQuota } from './rules/quota';

export const evaluateMessagePolicy = (ctx: MessageContext): PolicyDecision => {
    // Pipeline of rules
    // ORDER MATTERS: Fail-Fast approach.
    // 1. Critical System Checks (Assignments, Status) - Cheap & Mandatory
    // 2. Resource/Security Checks (Quota, Suppression) - Database hits
    // 3. Compliance & Content Checks (Window, Content, Template) - Logic heavy
    const pipeline = [
        checkAssignment,    // Security: Ensure user owns this instance
        checkInstanceStatus,// Operational: Don't try if dead
        checkQuota,         // Resource: Stop early if out of credits
        checkSuppression,   // Compliance: Respect Opt-outs immediately
        checkWindow,        // Compliance: 24h Marketing Window (Anti-Spam)
        checkContent,       // Compliance: Forbidden words filter
        checkTemplate       // Content: Variable structure validation
    ];

    for (const rule of pipeline) {
        const decision = rule(ctx);
        if (!decision.allowed) {
            // [Audit] Block Event
            auditLogger.log({
                userId: ctx.userId,
                action: 'send_blocked',
                details: {
                    to: ctx.to,
                    reason: decision.reason,
                    instanceId: ctx.instanceId
                },
                severity: 'WARN',
                actorType: ctx.actorType || 'system',
                authType: ctx.authType || 'system',
                instanceId: parseInt(ctx.instanceId, 10) || undefined
            });

            return decision;
        }
    }

    return { allowed: true };
};
