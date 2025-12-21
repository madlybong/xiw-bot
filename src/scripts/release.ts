import { spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const run = (cmd: string, args: string[]) => {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
        proc.on('close', (code) => {
            if (code === 0) resolve(true);
            else reject(new Error(`Command failed: ${cmd} ${args.join(' ')}`));
        });
    });
};

const main = async () => {
    const versionArg = process.argv[2];
    if (!versionArg) {
        console.error("Usage: bun run release <version>");
        process.exit(1);
    }

    const pkgPath = path.resolve(__dirname, "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

    // Simple validation
    if (!/^\d+\.\d+\.\d+$/.test(versionArg)) {
        console.error("Invalid version format. Use x.y.z");
        process.exit(1);
    }

    console.log(`Bumping version from ${pkg.version} to ${versionArg}...`);
    pkg.version = versionArg;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    try {
        await run("git", ["add", "package.json"]);
        await run("git", ["commit", "-m", `chore(release): v${versionArg}`]);
        await run("git", ["tag", `v${versionArg}`]);
        console.log(`\nSuccess! Version bumped to ${versionArg}.`);
        console.log(`Run 'git push && git push --tags' to trigger the release workflow.`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

main();
