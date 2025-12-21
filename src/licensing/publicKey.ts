import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Attempt to load from current working directory
// In a compiled Bun app, this might need adjustment if assets aren't adjacent, 
// but "App ships with public.key" implies it's a file.
// Attempt to load from multiple potential locations
const possiblePaths = [
    resolve("public.key"), // CWD
    resolve(process.execPath, "../public.key"), // Executable dir (for compiled binaries)
    resolve(process.execPath, "public.key"), // Executable dir (alternative)
];

let keyContent: string | null = null;
let foundPath: string | null = null;

try {
    for (const p of possiblePaths) {
        if (existsSync(p)) {
            keyContent = readFileSync(p, "utf-8");
            foundPath = p;
            break;
        }
    }

    if (!keyContent) {
        console.warn(`[Licensing] Public key not found. Searched: ${possiblePaths.join(', ')}`);
    } else {
        console.log(`[Licensing] Public key loaded from ${foundPath}`);
    }
} catch (e) {
    console.error(`[Licensing] Failed to load public key:`, e);
}

export const PUBLIC_KEY = keyContent;
