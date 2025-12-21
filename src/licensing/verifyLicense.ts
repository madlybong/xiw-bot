import { verify } from "crypto";
import { PUBLIC_KEY } from "./publicKey";

export interface LicensePayload {
    product: string;
    client: string;
    license_id: string;
    issued_at: string;
    expires_at: string;
    billing_cycle: string;
    machine: {
        fingerprint: string | null;
        bound: boolean;
    };
    limits: {
        max_whatsapp_accounts: number;
        max_agents: number;
    };
    version: number;
}

export interface LicenseVerificationResult {
    valid: boolean;
    error?: string;
    license?: LicensePayload;
    expired?: boolean;
}

export const verifyLicense = (licenseKey: string): LicenseVerificationResult => {
    if (!PUBLIC_KEY) {
        return { valid: false, error: "Public key missing. Cannot verify license." };
    }

    try {
        const parts = licenseKey.split('.');
        if (parts.length !== 3) {
            return { valid: false, error: "Invalid license format (parts)." };
        }

        const [header, b64Payload, b64Signature] = parts;

        if (header !== 'XIWBOT') {
            return { valid: false, error: "Invalid license product header." };
        }

        const payloadStr = Buffer.from(b64Payload, 'base64').toString('utf-8');
        const signature = Buffer.from(b64Signature, 'base64');

        // 1. Verify Signature
        const isVerified = verify(
            null,
            Buffer.from(payloadStr),
            PUBLIC_KEY,
            signature
        );

        if (!isVerified) {
            return { valid: false, error: "Invalid license signature." };
        }

        // 2. Parse & Validate Content
        let payload: LicensePayload;
        try {
            payload = JSON.parse(payloadStr);
        } catch (e) {
            return { valid: false, error: "Invalid license payload JSON." };
        }

        if (payload.product !== 'xiw-bot') {
            return { valid: false, error: "License is not for xiw-bot." };
        }

        // 3. Expiry Check
        const expiresAt = new Date(payload.expires_at);
        const now = new Date();

        // Check for "Refuse to start if expired"
        // We return valid=false if expired, but distinguish it
        if (now > expiresAt) {
            return { valid: false, error: "License expired.", expired: true, license: payload };
        }

        return { valid: true, license: payload };

    } catch (e: any) {
        return { valid: false, error: `License verification failed: ${e.message}` };
    }
};
