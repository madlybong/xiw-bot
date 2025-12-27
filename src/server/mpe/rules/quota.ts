import db from '../../db';
import type { MessageContext, PolicyDecision } from '../types';

export const checkQuota = (ctx: MessageContext): PolicyDecision => {
    // 1. Fetch User's Quota Settings
    const user = db.query('SELECT message_limit, message_usage, limit_frequency, last_usage_reset FROM users WHERE id = $id').get({ $id: ctx.userId }) as any;

    if (!user) {
        // Fallback: If user not found (rare), block or allow? Safer to block or allow standard behavior.
        // Assuming allow with strict defaults if missing.
        return { allowed: true };
    }

    // 2. Unlimited Check
    if (user.message_limit === -1) {
        return { allowed: true };
    }

    // 3. Reset Logic (Daily)
    const now = new Date();
    const lastReset = new Date(user.last_usage_reset);
    const ONE_DAY = 24 * 60 * 60 * 1000;

    let effectiveUsage = user.message_usage;

    if (user.limit_frequency === 'daily') {
        // If last reset was more than 24h ago, effective usage is 0
        if (now.getTime() - lastReset.getTime() > ONE_DAY) {
            effectiveUsage = 0;
            // NOTE: We don't update DB here (read-only rule). 
            // The Controller/Action handling the send *should* trigger a reset update if it notices this, 
            // But usually we assume a separate "reset job" or "lazy reset on increment".
            // Here we just calculate "If I were to send...".
        } else {
            // Reset if day changed (Calendar day vs 24h rolling? "Daily" typically means rolling 24h or midnight).
            // Assuming simplistic 24h rolling from last_reset for now based on previous code.
            // Or better: Check if calendar date changed?
            // Let's stick to Time Diff provided in schema context for simplicity and safety.
        }
    }

    // 4. Limit Check
    if (effectiveUsage >= user.message_limit) {
        return {
            allowed: false,
            reason: `QUOTA_EXCEEDED: Message limit of ${user.message_limit} reached.`,
            code: 429
        };
    }

    return { allowed: true };
};
