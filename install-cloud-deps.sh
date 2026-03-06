#!/bin/bash

# 批量安装所有云函数的依赖
cd "$(dirname "$0")/cloudfunctions" || exit 1

for dir in */; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing dependencies for: $dir"
    cd "$dir"
    npm install
    cd ..
  fi
done

echo "All cloud functions dependencies installed!"
