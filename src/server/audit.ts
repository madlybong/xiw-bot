import db from './db';

export type Severity = 'INFO' | 'WARN' | 'ERROR';
export type ActorType = 'system' | 'user' | 'api';
export type AuthType = 'system' | 'jwt' | 'static_token';

interface AuditOptions {
    userId: number;
    instanceId?: number;
    action: string;
    details?: any;
    severity?: Severity;
    actorType?: ActorType;
    authType?: AuthType;
}

export const auditLogger = {
    log: (opts: AuditOptions) => {
        try {
            db.run(`
            INSERT INTO audit_logs (user_id, instance_id, action, details, severity, actor_type, auth_type)
            VALUES ($uid, $iid, $act, $det, $sev, $actor, $auth)
        `, {
                $uid: opts.userId,
                $iid: opts.instanceId || null,
                $act: opts.action,
                $det: JSON.stringify(opts.details || {}),
                $sev: opts.severity || 'INFO',
                $actor: opts.actorType || 'system',
                $auth: opts.authType || 'system'
            });
        } catch (e) {
            console.error('[Audit] Failed to write log:', e);
        }
    }
};
