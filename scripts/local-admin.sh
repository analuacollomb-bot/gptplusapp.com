#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

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
  echo "没有找到可用的 Node.js，请设置 NODE_BIN 为 Node.js 可执行文件的完整路径。" >&2
  exit 1
fi

if [[ ! -f node_modules/next/dist/bin/next || ! -d node_modules/tsx ]]; then
  echo "缺少本地运行依赖。请先在此项目目录安装依赖，再启动文章后台。" >&2
  exit 1
fi

exec "$NODE_BIN" scripts/local-admin-launcher.mjs
