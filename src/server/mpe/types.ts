import type { ActorType, AuthType } from '../audit';

export interface MessageContext {
    userId: number;
    instanceId: string;
    to: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'template';
    content: any;
    timestamp: Date;
    authType?: AuthType;
    actorType?: ActorType;
    allowedInstances?: number[]; // For assignment rule
    userRole?: string;
}

export interface PolicyDecision {
    allowed: boolean;
    reason?: string;
    code?: number; // HTTP Status code suggestion
    meta?: any;
}
