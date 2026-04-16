#!/bin/bash
set -euo pipefail

WATCH_DIR="plugins/theme/src/assets/bui"
BACKSTAGE_DIR="$HOME/git/backstage/backstage"
TARGET_FILE="$BACKSTAGE_DIR/.storybook/themes/redhat.css"

sync_theme() {
  echo "[$(date '+%H:%M:%S')] Change detected — sync theme..."
  cat "$WATCH_DIR/tokens.css" "$WATCH_DIR/component-overrides.css" \
    | sed -z "s/body\[data-theme-name='light'\]\[data-theme-mode='light'\],\nbody\[data-theme-name='dark'\]\[data-theme-mode='dark'\]/[data-theme-name='redhat']/g" \
    | sed -z "s/body\[data-theme-name='light'\]/[data-theme-name='redhat']/g" \
    | sed -z "s/body\[data-theme-name='dark'\]/[data-theme-name='redhat']/g" \
    | sed -zE "s/var\(\s*--pf[^,)]+,\s*([^()]+?)\s*\)/\1/g" \
    > "$TARGET_FILE"
  cd $BACKSTAGE_DIR && yarn prettier --write .storybook/themes/redhat.css && cd - >/dev/null
}

echo "Watching $WATCH_DIR"
echo "Target:  $TARGET_FILE"
echo ""

if command -v inotifywait &>/dev/null; then
  echo "Using inotifywait"
  echo ""
  # Run once on startup
  sync_theme
  inotifywait -m -r -e modify,create,delete,move "$WATCH_DIR" \
    --format '%w%f' \
    --quiet \
    | while read -r _changed_file; do
        sync_theme
      done
else
  echo "inotifywait not found — using polling (install inotify-tools for better performance)"
  echo ""
  # Run once on startup
  sync_theme

  declare -A mtimes

  # Seed initial mtimes so the first poll doesn't trigger a spurious build.
  while IFS= read -r -d '' f; do
    mtimes["$f"]="$(stat -c %Y "$f" 2>/dev/null || echo 0)"
  done < <(find "$WATCH_DIR" -type f -print0)

  while true; do
    changed=false
    while IFS= read -r -d '' f; do
      mtime="$(stat -c %Y "$f" 2>/dev/null || echo 0)"
      if [[ "${mtimes[$f]:-}" != "$mtime" ]]; then
        mtimes["$f"]="$mtime"
        changed=true
      fi
    done < <(find "$WATCH_DIR" -type f -print0)

    if $changed; then
      sync_theme
    fi

    sleep 1
  done
fi
