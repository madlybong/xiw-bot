import db from '../../db';
import type { MessageContext, PolicyDecision } from '../types';

export const checkTemplate = (ctx: MessageContext): PolicyDecision => {
    if (ctx.type !== 'template') return { allowed: true };

    const { templateName, variables } = ctx.content;

    if (!templateName) {
        return {
            allowed: false,
            reason: 'Template Name is required.',
            code: 400
        };
    }

    const template = db.query('SELECT * FROM templates WHERE name = $name').get({ $name: templateName }) as any;

    if (!template) {
        return {
            allowed: false,
            reason: `Template '${templateName}' does not exist.`,
            code: 404
        };
    }

    // Variable Validation
    const providedCount = Array.isArray(variables) ? variables.length : 0;
    const requiredCount = template.variable_count || 0;

    if (providedCount !== requiredCount) {
        return {
            allowed: false,
            reason: `Template validation failed. Expected ${requiredCount} variables, got ${providedCount}.`,
            code: 400
        };
    }

    return { allowed: true };
};
