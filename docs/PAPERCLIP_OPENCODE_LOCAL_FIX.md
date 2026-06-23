# Paperclip OpenCode Local Adapter Fix

This repo cannot directly edit Bradshaw's macOS Paperclip checkout from the Linux agent container, but the operational fix is captured in `scripts/fix-paperclip-opencode-local.sh`.

Run it on the Mac where Paperclip and OpenCode are installed:

```bash
./scripts/fix-paperclip-opencode-local.sh
```

If the paths differ, override them:

```bash
OPENCODE_BIN=/Users/bradshaw/.opencode/bin/opencode \
PAPERCLIP_ROOT=/Users/bradshaw/Repos/Paperclip \
./scripts/fix-paperclip-opencode-local.sh
```

## Required Paperclip adapter settings

Use the absolute OpenCode command in each OpenCode agent config:

```text
/Users/bradshaw/.opencode/bin/opencode
```

Set the subprocess PATH for the Paperclip adapter/runtime:

```text
PATH=/Users/bradshaw/.opencode/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

## Timeout patch

Patch this file in the Paperclip checkout:

```text
/Users/bradshaw/Repos/Paperclip/packages/adapters/opencode-local/src/server/models.ts
```

Change the OpenCode model discovery timeout from `20000` to `60000` milliseconds.

## Restart and validation

1. Fully quit and restart Paperclip.
2. Do not retry stale failed runs.
3. Create a fresh test task that returns exactly:

```text
OpenCode DeepSeek operational.
```

## Model routing

- Use `deepseek/deepseek-v4-flash` for CMO and HR.
- Use `deepseek/deepseek-v4-pro` for COS and CTO.
