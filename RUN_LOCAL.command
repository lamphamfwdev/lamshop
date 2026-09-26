#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Chưa có Node.js. Hãy cài Node.js 20 trở lên tại https://nodejs.org"
  read -r -p "Nhấn Enter để đóng..."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Cài thư viện lần đầu..."
  npm install
fi
npm run preview
