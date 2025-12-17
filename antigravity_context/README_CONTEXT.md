# Antigravity Context

This directory (`antigravity_context`) contains the "brain" of the project's development history. It allows you to pause work on one machine and resume strictly on another by carrying the context with the code.

## How to Resume
1.  **Clone/Pull** this repository.
2.  **Install Dependencies**:
    ```bash
    bun install
    ```
3.  **Resume Work**:
    - The state of the project is documented in `task.md`.
    - The architectural plan is in `implementation_plan.md`.
    - Recent changes are in `walkthrough.md`.

## Automation
Use the sync script to auto-commit and attempt to push your changes, ensuring the context travels with the code.

```bash
bun run sync
```

## Rules
- **Bun Only**: Use `bun` for all package management and script execution.
- **Single Source**: Maintain state in `antigravity_context` files.
