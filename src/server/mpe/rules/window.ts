import db from '../../db';
import type { MessageContext, PolicyDecision } from '../types';

export const checkWindow = (ctx: MessageContext): PolicyDecision => {
    // 1. Templates always allowed (Business Initiated)
    if (ctx.type === 'template') {
        return { allowed: true };
    }

    // 2. For standard messages, check 24h window
    // Normalize phone
    const phone = ctx.to.replace('@s.whatsapp.net', '').replace(/\D/g, '');

    const contact = db.query('SELECT last_inbound_at FROM contacts WHERE phone = $p').get({ $p: phone }) as any;

    if (!contact || !contact.last_inbound_at) {
        return {
            allowed: false,
            reason: 'REPLY_WINDOW_EXPIRED: User must initiate conversation first (First-inbound unlock).',
            code: 403
        };
    }

    // SQLite stores UTC strings "YYYY-MM-DD HH:MM:SS"
    // To ensure UTC parsing, append 'Z' if missing, or trust Date.parse behavior
    const lastInbound = new Date(contact.last_inbound_at + (contact.last_inbound_at.endsWith('Z') ? '' : 'Z')).getTime();
    const now = Date.now();
    const diff = now - lastInbound;
    const isWithin24 = diff < 24 * 60 * 60 * 1000;

    if (!isWithin24) {
        return {
            allowed: false,
            reason: 'REPLY_WINDOW_EXPIRED: 24h session ended. Message rejected.',
            code: 403
        };
    }

    return { allowed: true };
};
