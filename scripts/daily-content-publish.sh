#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NODE_BIN="${NODE_BIN:-}"
if [[ -z "$NODE_BIN" ]]; then
  for candidate in \
    "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" \
    "$(command -v node || true)"; do
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      NODE_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  echo "Node.js executable not found." >&2
  exit 1
fi

DATE="${DAILY_ARTICLE_DATE:-$(TZ=Asia/Shanghai date +%F)}"
COUNT="${DAILY_ARTICLE_COUNT:-10}"

"$NODE_BIN" --import tsx scripts/generate-daily-problem-posts.ts --date="$DATE" --count="$COUNT"
"$NODE_BIN" node_modules/eslint/bin/eslint.js .
"$NODE_BIN" node_modules/typescript/bin/tsc --noEmit
"$NODE_BIN" node_modules/next/dist/bin/next build --webpack

daily_files=()
while IFS= read -r file; do
  daily_files+=("$file")
done < <(find content/posts -maxdepth 1 -type f -name "daily-${DATE}-*.md" | sort)

if [[ "${#daily_files[@]}" -eq 0 ]]; then
  echo "No daily article files found for ${DATE}."
  exit 0
fi

git add "${daily_files[@]}"

if git diff --cached --quiet; then
  echo "No new daily article changes to commit for ${DATE}."
  exit 0
fi

git commit -m "Add daily problem-solving articles ${DATE}"
git push origin main
