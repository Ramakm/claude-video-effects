---
name: title-orbit
description: Add the title-orbit video effect to a talking-head clip (Your title circles your head). Use when the user types /title-orbit or asks for this effect by name or description.
---

# /title-orbit: Your title circles your head

Effect 02 of the 20 techwith.ram video effects (Hook).

This skill is a shortcut. The engine lives in the sibling `video-effects` skill, in the same skills folder as this one (`../video-effects/` next to this file). Read `../video-effects/SKILL.md` and follow it with the effect set to `title-orbit`. Use absolute paths in commands.

Quick path:
1. Set up once: `bash ../video-effects/scripts/setup.sh` (prints `READY`).
2. Check a still from the middle of the window:
   `../video-effects/.venv/bin/python ../video-effects/scripts/fx.py title-orbit <video> <folder>/check.png --start 0 --end 3 --still 1.5 --text "CLAUDE SKILLS"`
3. Render:
   `../video-effects/.venv/bin/python ../video-effects/scripts/fx.py title-orbit <video> <video-name>_title-orbit.mp4 --start 0 --end 3 --text "CLAUDE SKILLS"`

Options:
- `--start` / `--end` set the window in seconds (default: 3 seconds from `--start`).
- `--text "CLAUDE SKILLS"` sets the title that circles your head.
- `--color "#FF8A1F"` changes the accent colour; `--opt ramp=0.5` changes the ease in and out.

If `../video-effects` is missing, the pack is not fully installed: run
`curl -fsSL https://raw.githubusercontent.com/Ramakm/claude-video-effects/main/install.sh | bash`
