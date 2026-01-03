Step 1: Merge Dependencies
Merge `src/ui/package.json` dependencies into root `package.json`.
- Add `vue`, `vue-router`, `vuetify`, `roboto-fontface`, `@mdi/font` to dependencies.
- Add `@vitejs/plugin-vue`, `vite-plugin-vuetify`, `vite`, `sass` to devDependencies.
- Ensure version conflicts are resolved (likely favoring root or newer).

Step 2: Update Root Scripts
- Update `dev:ui` to `vite src/ui`.
- Update `build:ui` to `vite build src/ui`.
- Ensure `dev:server` and `build:server` remain functional.

Step 3: Refactor Vite Config
- Move `src/ui/vite.config.ts` to `vite.config.ts` (Root).
- Update `root` property in vite config to `src/ui`.
- Update `outDir` to `../../dist` (relative to new root) or absolute path `dist` relative to project root.
- Update `env` and `define` paths if necessary.

Step 4: Clean Up
- Delete `src/ui/package.json`.
- Delete `src/ui/node_modules` (if exists).
- Delete `src/ui/vite.config.ts`.
- Remove `scripts/embed-assets.ts` check for `src/ui/dist` if path changes (it shouldn't if we set outDir correctly).

Step 5: Verification
- Run `bun install` at root.
- Run `bun run dev` to test both server and UI.
- Run `bun run build` to verify full build pipeline.
