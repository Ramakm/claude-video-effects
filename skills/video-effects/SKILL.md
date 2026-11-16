---
name: video-effects
description: Add any of 20 video effects to a talking-head clip (grid-dive, title-orbit, magnifying-lens, portal, clone-room, infinite-zoom, cube-spin, liquid-glass, screen-in-screen, frame-break, tile-tunnel, depth-ui, vertigo, phone-fan, shatter, spotlight, pull-back-reveal, ribbon-wrap, zoom-through, head-pop-out). Effects track the speaker's face and can sit behind their head. Use when the user types /video-effects or one of the effect names, or asks to add an effect, hook or transition to their video.
---

# 20 video effects for Claude (by @techwith.ram)

The user is usually a creator, not a developer. Keep replies short, do the work for them, and never ask them to run commands themselves.

All paths below are relative to this skill's folder (the folder this SKILL.md is in). Use the absolute path in commands. On Windows the Python is `.venv\Scripts\python.exe` instead of `.venv/bin/python`.

## 1. First run: set up (once)
Run `bash scripts/setup.sh`. It prints `READY` when done (the first run takes 2 to 4 minutes: Python packages plus a headless Chromium).
- `NEED_FFMPEG`: install it for them. Mac: `brew install ffmpeg` (no `brew`? tell them to install Homebrew from brew.sh). Windows: `winget install ffmpeg`. Linux: `sudo apt install ffmpeg`.
- `NEED_PYTHON`: install Python 3.12 (Mac: `brew install python@3.12`, Windows: `winget install Python.Python.3.12`), then run setup again.

## 2. Get the video and the effect
- Video: the user drags the file into the chat or gives a path. One take of them talking to camera works best; vertical 9:16 or horizontal both work.
- Effect: from the command they typed (`/grid-dive`, `/title-orbit`...) or from what they describe. Match their words to the table below. Unsure? Run `.venv/bin/python scripts/fx.py list` and show them the list.

## 3. Pick the timing
- Each effect plays in a window, then the clip returns to normal. Short windows look best: 2 to 4 seconds.
- No timing given: start at 0 and run 3 seconds (the default). Hooks belong at the start; transitions go between two thoughts.
- "On the word X" or "when I say ...": run `.venv/bin/python scripts/words.py <video>` and use those times.

## 4. Check, then render
1. Several effects? Write a plan next to their video as `<video-name>_effects.json`:
   ```json
   {"effects": [
     {"fx": "title-orbit", "start": 0.0, "end": 3.0, "text": "CLAUDE SKILLS"},
     {"fx": "cube-spin", "start": 7.5, "end": 9.0},
     {"fx": "head-pop-out", "start": 14.0, "end": 17.0, "text": "START HERE"}
   ]}
   ```
   Windows must not overlap.
2. Check stills first (fast): add `--still` with the middle of each window, e.g.
   `.venv/bin/python scripts/fx.py --plan <plan.json> <video> <folder>/check.png --still 1.5,8.2,15.5`
   Open the PNGs yourself. Fix the text, timing or options if something looks off (text cut off, covers the face, unreadable).
3. Render:
   `.venv/bin/python scripts/fx.py --plan <plan.json> <video> <video-name>_effects.mp4`
   A single effect needs no plan:
   `.venv/bin/python scripts/fx.py title-orbit <video> <out.mp4> --start 0 --end 3 --text "CLAUDE SKILLS"`
4. The output keeps their original audio and is 1080 px wide by default (`--width 720` renders faster). Tell them where the file is, and remind them in one line to watch it before posting.

## The 20 effects
| # | `fx` | Type | What it does | Options |
|---|---|---|---|---|
| 01 | `grid-dive` | Transition | You're one tile in a wall of video | |
| 02 | `title-orbit` | Hook | Your title circles your head, passing behind it | `text` |
| 03 | `magnifying-lens` | Transition | A glass disc slides over your shot | |
| 04 | `portal` | Hook | A ring of light you fly through | |
| 05 | `clone-room` | Hook | Copies of you step out behind you | |
| 06 | `infinite-zoom` | Transition | Frames inside frames, then through | |
| 07 | `cube-spin` | Transition | Your shot turns like a cube | |
| 08 | `liquid-glass` | Transition | A drop of glass becomes a pane | |
| 09 | `screen-in-screen` | Screen | You, playing on a laptop | |
| 10 | `frame-break` | Frame break | Your head breaks out of a photo | |
| 11 | `tile-tunnel` | Transition | A tunnel of tiles opens behind you | |
| 12 | `depth-ui` | Screen | App windows float around you | `text` (chip label) |
| 13 | `vertigo` | Hook | The room stretches, you don't | |
| 14 | `phone-fan` | Screen | Phones fan out like a hand of cards | |
| 15 | `shatter` | Transition | Your shot cracks like glass | |
| 16 | `spotlight` | Hook | One theatre light finds your face | |
| 17 | `pull-back-reveal` | Screen | You're inside a video editor | |
| 18 | `ribbon-wrap` | Frame break | A ribbon carries your words around you | `text` |
| 19 | `zoom-through` | Screen | A Claude chat flies into your clip | `text` (prompt) |
| 20 | `head-pop-out` | Frame break | Your head springs out of a panel | `text` (tag) |

Options for every effect: `--color "#FF8A1F"` (accent colour), `--opt ramp=0.5` (seconds to ease in and out, default 0.35), `--width 1080`, `--fps 30`.

## Notes
- The face tracker and person cutout run locally (models in `models/`). Nothing is uploaded.
- Best results: face clearly visible, one person, steady camera.
- If an effect errors, read the message, fix the cause (wrong path, window outside the clip) and run again. Do not hand commands to the user.
