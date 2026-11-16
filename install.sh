#!/usr/bin/env bash
# One-line install for techwith.ram video effects:
#   curl -fsSL https://raw.githubusercontent.com/Ramakm/claude-video-effects/main/install.sh | bash
# Clones (or updates) the pack, links its 21 skills into Claude Code (and Codex, if present), then runs setup.
set -e
REPO="https://github.com/Ramakm/claude-video-effects"
DEST="${VIDEO_EFFECTS_HOME:-$HOME/.claude/claude-video-effects}"

command -v git >/dev/null 2>&1 || { echo "Please install git first."; exit 1; }

if [ -d "$DEST/.git" ]; then
  echo "Updating $DEST"; git -C "$DEST" pull -q --ff-only
else
  echo "Downloading to $DEST"; mkdir -p "$(dirname "$DEST")"; git clone -q --depth 1 "$REPO" "$DEST"
fi

link_into() {
  local target="$1"; mkdir -p "$target"; local n=0
  for d in "$DEST"/skills/*/; do
    d="${d%/}"; name="$(basename "$d")"
    if [ -e "$target/$name" ] && [ ! -L "$target/$name" ]; then
      echo "  skipped $name: $target/$name already exists (not ours)"; continue
    fi
    ln -sfn "$d" "$target/$name"; n=$((n + 1))
  done
  echo "Linked $n skills into $target"
}

link_into "$HOME/.claude/skills"
[ -d "$HOME/.codex" ] && link_into "$HOME/.codex/skills"

echo "Setting up (first time takes a few minutes)..."
bash "$DEST/skills/video-effects/scripts/setup.sh"
echo
echo "Done. Open Claude Code, drop in a talking-head clip and type /title-orbit (or any of the 20 effects)."
