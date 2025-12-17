import { spawn, execSync } from "bun";
import { join } from "path";

// Configuration
const REPO_ROOT = join(import.meta.dir, "../.."); // Assuming src/scripts/auto_sync.ts
const CONTEXT_DIR = join(REPO_ROOT, "antigravity_context");

async function run(cmd: string, args: string[]) {
    const proc = Bun.spawn(cmd.split(" ").concat(args), {
        cwd: REPO_ROOT,
        stdout: "inherit",
        stderr: "inherit",
    });
    await proc.exited;
    if (proc.exitCode !== 0) {
        throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
    }
}

async function main() {
    console.log("🔄 Starting Antigravity Sync...");

    try {
        // 1. Check if git is initialized
        try {
            execSync("git rev-parse --is-inside-work-tree", { cwd: REPO_ROOT, stdio: 'ignore' });
        } catch {
            console.log("📦 Initializing Git repository...");
            await run("git", ["init"]);
            await run("git", ["branch", "-M", "main"]);
        }

        // 2. Add all changes
        console.log("➕ Adding changes...");
        await run("git", ["add", "."]);

        // 3. Commit
        const timestamp = new Date().toISOString();
        console.log("💾 Committing...");
        try {
            // Only commit if there are changes
            await run("git", ["commit", "-m", `Antigravity Sync: ${timestamp}`]);
        } catch (e) {
            console.log("  - No changes to commit.");
        }

        // 4. Push (Try to push, might fail if no remote, which is expected for local-only start)
        console.log("⬆️ Pushing to remote (if configured)...");
        try {
            await run("git", ["push", "-u", "origin", "main"]);
        } catch (e) {
            console.log("  ⚠️  Push failed (No remote configured?). Skipping push.");
            console.log("  ℹ️  To configure remote: git remote add origin <url>");
        }

        console.log("✅ Antigravity Sync Complete!");

    } catch (error) {
        console.error("❌ Sync failed:", error);
        process.exit(1);
    }
}

main();
