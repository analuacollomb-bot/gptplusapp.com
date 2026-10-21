#!/bin/bash
cd "$(dirname "$0")" || exit 1
bash scripts/local-admin.sh
result=$?
echo
if [[ "$result" -ne 0 ]]; then
  echo "文章后台未能正常运行，请查看上方提示。"
else
  echo "此启动窗口已结束。"
fi
if [[ -t 0 ]]; then
  read -r -p "按回车键关闭此窗口……"
fi
exit "$result"
