import db from '../../db';
import type { MessageContext, PolicyDecision } from '../types';

export const checkSuppression = (ctx: MessageContext): PolicyDecision => {
    // Normalize phone (strip @s.whatsapp.net and non-digits)
    const phone = ctx.to.replace('@s.whatsapp.net', '').replace(/\D/g, '');

    const contact = db.query('SELECT suppressed FROM contacts WHERE phone = $p').get({ $p: phone }) as any;

    if (contact && contact.suppressed) {
        return {
            allowed: false,
            reason: 'Contact is suppressed (Do Not Contact).',
            code: 403
        };
    }

    return { allowed: true };
};
