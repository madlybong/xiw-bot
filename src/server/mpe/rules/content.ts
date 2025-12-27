import type { MessageContext, PolicyDecision } from '../types';

// TODO: load from DB or Config
const FORBIDDEN_REGEX = [
    /free\s*money/i,
    /winner/i,
    /lottery/i
];

export const checkContent = (ctx: MessageContext): PolicyDecision => {
    // Only check text content
    if (ctx.type !== 'text') return { allowed: true };

    const text = typeof ctx.content === 'string' ? ctx.content : JSON.stringify(ctx.content);

    for (const regex of FORBIDDEN_REGEX) {
        if (regex.test(text)) {
            return {
                allowed: false,
                reason: 'Content Policy Violation: Forbidden pattern detected.',
                code: 400
            };
        }
    }

    return { allowed: true };
};
