import { verifyLicense, type LicensePayload } from "./verifyLicense";
import { getMachineFingerprint } from "./fingerprint";
import db from "../server/db";

let activeLicense: LicensePayload | null = null;
let bindingMismatch = false;

// Initialize critical tables
const initDb = () => {
    db.query(`CREATE TABLE IF NOT EXISTS system_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
    )`).run();
};

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// ... (existing imports)

export const initializeLicense = () => {
    console.log("[Licensing] Initializing...");
    let key = process.env.XIWBOT_LICENSE;

    // Try loading from file if env var is missing
    if (!key) {
        const potentialFiles = [
            resolve("license.txt"),
            resolve("xiwbot.license"),
            resolve(process.execPath, "../license.txt"),
            resolve(process.execPath, "../xiwbot.license")
        ];

        for (const file of potentialFiles) {
            if (existsSync(file)) {
                try {
                    // Read file and strip potential "Key: " prefixes or whitespace
                    const content = readFileSync(file, "utf-8");
                    // Simple heuristic: if it looks like a key (starts with XIWBOT.)
                    const lines = content.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith("XIWBOT.")) {
                            key = trimmed;
                            console.log(`[Licensing] Loaded license from file: ${file}`);
                            break;
                        }
                    }
                } catch (e) {
                    console.warn(`[Licensing] Failed to read license file ${file}:`, e);
                }
                if (key) break;
            }
        }
    }

    if (!key) {
        console.error("FATAL: XIWBOT_LICENSE environment variable is missing AND no valid license file detected.");
        console.error("Please set XIWBOT_LICENSE=<your_license_key> or place a 'license.txt' file next to the executable.");
        process.exit(1);
    }

    const result = verifyLicense(key);

    // Hard fail on invalid or expired
    if (!result.valid) {
        console.error("FATAL: License verification failed.");
        console.error(`Reason: ${result.error}`);
        if (result.license) {
            console.error("License Details:", JSON.stringify(result.license, null, 2));
        }
        process.exit(1);
    }

    // Warn if valid but technically expired (cleaner handling if verifyLicense didn't hard fail, but it does return valid=false)
    // verifyLicense returns valid=false if expired. So we are good.

    activeLicense = result.license!;
    console.log(`[Licensing] License loaded for client: ${activeLicense.client}`);
    console.log(`[Licensing] Expires: ${activeLicense.expires_at}`);

    // Machine Binding
    try {
        initDb();
        const currentFingerprint = getMachineFingerprint();
        const stored = db.query("SELECT value FROM system_metadata WHERE key = 'machine_fingerprint'").get() as { value: string };

        if (!stored) {
            console.log(`[Licensing] First run detected. Binding to machine fingerprint: ${currentFingerprint}`);
            db.query("INSERT INTO system_metadata (key, value) VALUES ('machine_fingerprint', $val)").run({ $val: currentFingerprint });
        } else {
            if (stored.value !== currentFingerprint) {
                console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.warn("WARNING: MACHINE FINGERPRINT MISMATCH DETECTED");
                console.warn(`Stored: ${stored.value}`);
                console.warn(`Current: ${currentFingerprint}`);
                console.warn("This license is bound to a different machine/configuration.");
                console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                bindingMismatch = true;
            } else {
                console.log("[Licensing] Machine binding verified.");
            }
        }
    } catch (e) {
        console.error("[Licensing] Failed to enforce machine binding:", e);
        // Fallback: don't crash, but maybe set mismatch?
        // "Never throw fatal errors (fallback gracefully)" - requirement for fingerprint module
    }
};

export const getLicense = () => activeLicense;

export const getLicenseLimits = () => activeLicense?.limits || { max_whatsapp_accounts: 0, max_agents: 0 };

export const isMachineMismatch = () => bindingMismatch;

export const getLicenseStatus = () => {
    if (!activeLicense) return null;

    const now = new Date();
    const expires = new Date(activeLicense.expires_at);
    const diffTime = expires.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        ...activeLicense,
        days_remaining: daysRemaining,
        machine_mismatch: bindingMismatch,
        status: daysRemaining < 0 ? 'expired' : (daysRemaining < 7 ? 'warning' : 'active')
    };
};
