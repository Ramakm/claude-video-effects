---
name: spotlight
description: Add the spotlight video effect to a talking-head clip (One theatre light finds your face). Use when the user types /spotlight or asks for this effect by name or description.
---

# /spotlight: One theatre light finds your face

Effect 16 of the 20 techwith.ram video effects (Hook).

This skill is a shortcut. The engine lives in the sibling `video-effects` skill, in the same skills folder as this one (`../video-effects/` next to this file). Read `../video-effects/SKILL.md` and follow it with the effect set to `spotlight`. Use absolute paths in commands.

Quick path:
1. Set up once: `bash ../video-effects/scripts/setup.sh` (prints `READY`).
2. Check a still from the middle of the window:
   `../video-effects/.venv/bin/python ../video-effects/scripts/fx.py spotlight <video> <folder>/check.png --start 0 --end 3 --still 1.5`
3. Render:
   `../video-effects/.venv/bin/python ../video-effects/scripts/fx.py spotlight <video> <video-name>_spotlight.mp4 --start 0 --end 3`

Options:
- `--start` / `--end` set the window in seconds (default: 3 seconds from `--start`).
- `--color "#FF8A1F"` changes the accent colour; `--opt ramp=0.5` changes the ease in and out.

If `../video-effects` is missing, the pack is not fully installed: run
`curl -fsSL https://raw.githubusercontent.com/Ramakm/claude-video-effects/main/install.sh | bash`
