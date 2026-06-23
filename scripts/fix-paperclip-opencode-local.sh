#!/usr/bin/env bash
set -euo pipefail

OPENCODE_BIN="${OPENCODE_BIN:-/Users/bradshaw/.opencode/bin/opencode}"
PAPERCLIP_ROOT="${PAPERCLIP_ROOT:-/Users/bradshaw/Repos/Paperclip}"
MODELS_TS="$PAPERCLIP_ROOT/packages/adapters/opencode-local/src/server/models.ts"
PAPERCLIP_PATH="/Users/bradshaw/.opencode/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

if [[ ! -x "$OPENCODE_BIN" ]]; then
  echo "ERROR: OpenCode CLI not executable at $OPENCODE_BIN" >&2
  echo "Set OPENCODE_BIN=/absolute/path/to/opencode if it is installed elsewhere." >&2
  exit 1
fi

if [[ ! -f "$MODELS_TS" ]]; then
  echo "ERROR: Paperclip OpenCode models file not found at $MODELS_TS" >&2
  echo "Set PAPERCLIP_ROOT=/absolute/path/to/Paperclip if the checkout is elsewhere." >&2
  exit 1
fi

python3 - "$MODELS_TS" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
if "20000" not in text and "60000" in text:
    print(f"Model discovery timeout already appears to be 60000ms in {path}")
    raise SystemExit(0)
if "20000" not in text:
    raise SystemExit(f"ERROR: Could not find 20000 timeout in {path}; inspect the file manually before patching.")
path.write_text(text.replace("20000", "60000", 1))
print(f"Updated OpenCode model discovery timeout to 60000ms in {path}")
PY

cat <<EOF2

Use this Paperclip subprocess environment for OpenCode adapters:
PATH=$PAPERCLIP_PATH

Use this absolute OpenCode command in each OpenCode agent config:
$OPENCODE_BIN

After applying the config values above:
1. Fully quit and restart Paperclip.
2. Do not retry stale failed runs.
3. Create a fresh task that returns exactly: OpenCode DeepSeek operational.
4. Use deepseek/deepseek-v4-flash for CMO and HR.
5. Use deepseek/deepseek-v4-pro for COS and CTO.
EOF2
