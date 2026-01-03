import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Helper to run commands
const run = (cmd: string, args: string[], cwd = process.cwd()) => {
    console.log(`> ${cmd} ${args.join(' ')}`);
    const res = spawnSync(cmd, args, { stdio: 'inherit', cwd, shell: true });
    if (res.status !== 0) {
        console.error(`Command failed with code ${res.status}`);
        process.exit(1);
    }
};

// 1. Check Git Status
console.log('--- Checking Git Status ---');
const status = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf-8' });
if (status.stdout.trim().length > 0) {
    console.error('Error: Working tree is not clean. Commit or stash changes first.');
    process.exit(1);
}

// 2. Prompt for Version
const currentPkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const currentVer = currentPkg.version;
const newVer = prompt(`Current version: ${currentVer}\nEnter new version (e.g. 1.3.4):`);

if (!newVer || !newVer.match(/^\d+\.\d+\.\d+$/)) {
    console.error('Invalid version format.');
    process.exit(1);
}

// 3. Update package.json
console.log(`--- Bumping Version to ${newVer} ---`);
currentPkg.version = newVer;
writeFileSync('package.json', JSON.stringify(currentPkg, null, 2) + '\n');

// 4. Run Build (Verify it works)
console.log('--- Running Full Build ---');
run('bun', ['run', 'build']);

// 5. Commit & Tag
console.log('--- Committing & Tagging ---');
run('git', ['add', 'package.json']);
run('git', ['commit', '-m', `chore(release): v${newVer}`]);
run('git', ['tag', '-a', `v${newVer}`, '-m', `v${newVer}`]);

// 6. Push
const confirm = prompt('Push commit and tag to origin? (y/N)');
if (confirm?.toLowerCase() === 'y') {
    run('git', ['push']);
    run('git', ['push', '--tags']);
    console.log('--- Release Pushed! CI should trigger now. ---');
} else {
    console.log('--- Push aborted. Manual push required. ---');
}
