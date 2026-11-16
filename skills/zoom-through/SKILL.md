---
name: zoom-through
description: Add the zoom-through video effect to a talking-head clip (A Claude chat flies into your clip). Use when the user types /zoom-through or asks for this effect by name or description.
---

# /zoom-through: A Claude chat flies into your clip

Effect 19 of the 20 techwith.ram video effects (Screen).

This skill is a shortcut. The engine lives in the sibling `video-effects` skill, in the same skills folder as this one (`../video-effects/` next to this file). Read `../video-effects/SKILL.md` and follow it with the effect set to `zoom-through`. Use absolute paths in commands.

Quick path:
1. Set up once: `bash ../video-effects/scripts/setup.sh` (prints `READY`).
2. Check a still from the middle of the window:
   `../video-effects/.venv/bin/python ../video-effects/scripts/fx.py zoom-through <video> <folder>/check.png --start 0 --end 3 --still 1.5 --text "/zoom-through"`
3. Render:
   `../video-effects/.venv/bin/python ../video-effects/scripts/fx.py zoom-through <video> <video-name>_zoom-through.mp4 --start 0 --end 3 --text "/zoom-through"`

Options:
- `--start` / `--end` set the window in seconds (default: 3 seconds from `--start`).
- `--text "/zoom-through"` sets the prompt shown in the chat card.
- `--color "#FF8A1F"` changes the accent colour; `--opt ramp=0.5` changes the ease in and out.

If `../video-effects` is missing, the pack is not fully installed: run
`curl -fsSL https://raw.githubusercontent.com/Ramakm/claude-video-effects/main/install.sh | bash`
