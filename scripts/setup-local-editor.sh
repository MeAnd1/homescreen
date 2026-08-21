#!/usr/bin/env bash
# Recreate the throwaway repo the local editor backend pushes to.
# Safe to re-run: it wipes and rebuilds $S from the current working copy's content.
# See docs/EDITOR-BACKEND.md — never point the server at this working copy.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
S="${1:-/tmp/editor-test}"

rm -rf "$S"
git init --bare -q "$S/origin.git"
mkdir -p "$S/repo"
cd "$S/repo"
git init -q -b main
mkdir -p src public
cp -R "$HERE/src/content" src/content
# backstory/ and infection/ were folded into text/ on 2026-08-20 (scripts/migrate-prose-ids.mjs);
# copy whichever still exist so this keeps working as the legacy dirs disappear.
for d in backstory infection text; do
  [ -d "$HERE/public/$d" ] && cp -R "$HERE/public/$d" public/ || true
done
git add -A
git -c user.name=local -c user.email=local@local commit -qm "scratch content"
git branch content
git remote add origin "$S/origin.git"
git push -q origin main content
git checkout -q content

echo "scratch repo ready: $S/repo (branch: content, origin: $S/origin.git)"
echo "projects.json  kataa-local.repoPath  must be: $S/repo"
