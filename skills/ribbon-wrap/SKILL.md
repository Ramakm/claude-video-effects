---
name: ribbon-wrap
description: Add the ribbon-wrap video effect to a talking-head clip (A ribbon carries your words). Use when the user types /ribbon-wrap or asks for this effect by name or description.
---

# /ribbon-wrap: A ribbon carries your words

Effect 18 of the 20 techwith.ram video effects (Frame Break).

This skill is a shortcut. The engine lives in the sibling `video-effects` skill, in the same skills folder as this one (`../video-effects/` next to this file). Read `../video-effects/SKILL.md` and follow it with the effect set to `ribbon-wrap`. Use absolute paths in commands.

Quick path:
1. Set up once: `bash ../video-effects/scripts/setup.sh` (prints `READY`).
2. Check a still from the middle of the window:
   `../video-effects/.venv/bin/python ../video-effects/scripts/fx.py ribbon-wrap <video> <folder>/check.png --start 0 --end 3 --still 1.5 --text "NEW VIDEO"`
3. Render:
   `../video-effects/.venv/bin/python ../video-effects/scripts/fx.py ribbon-wrap <video> <video-name>_ribbon-wrap.mp4 --start 0 --end 3 --text "NEW VIDEO"`

Options:
- `--start` / `--end` set the window in seconds (default: 3 seconds from `--start`).
- `--text "NEW VIDEO"` sets the words on the ribbon.
- `--color "#FF8A1F"` changes the accent colour; `--opt ramp=0.5` changes the ease in and out.

If `../video-effects` is missing, the pack is not fully installed: run
`curl -fsSL https://raw.githubusercontent.com/Ramakm/claude-video-effects/main/install.sh | bash`
