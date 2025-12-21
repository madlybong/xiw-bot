import { platform, arch, hostname, cpus, networkInterfaces } from "os";
import { createHash } from "crypto";

export const getMachineFingerprint = (): string => {
    try {
        // 1. OS Info
        const osInfo = `${platform()}-${arch()}`;

        // 2. CPU Model (best effort)
        const cpuInfo = cpus()[0]?.model || "unknown-cpu";

        // 3. Hostname
        const host = hostname();

        // 4. Primary MAC Address
        // Collect all MACs to be robust against interface order changes
        const macs: string[] = [];
        const nets = networkInterfaces();

        for (const name of Object.keys(nets)) {
            const ifaces = nets[name];
            if (ifaces) {
                for (const net of ifaces) {
                    // Skip internal (localhost) and invalid MACs
                    if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
                        macs.push(net.mac);
                    }
                }
            }
        }

        // Sort and join to create a stable string
        macs.sort();
        const macString = macs.join('|');

        // Combine all identifiers
        const raw = `${osInfo}:${cpuInfo}:${host}:${macString}`;

        // Normalize and Hash
        const normalized = raw.toLowerCase().trim();
        return createHash("sha256").update(normalized).digest("hex");

    } catch (e) {
        console.error("Error generating fingerprint, using fallback:", e);
        return "00000000-fallback-fingerprint-00000000";
    }
};
