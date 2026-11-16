# 20 video effects for Claude

Record one take of you talking to camera. Claude adds the effects on top.

20 effects as Claude Code skills (they work in Codex too). Each one tracks your face, can put things behind your head, and keeps your original audio. Everything runs on your computer.

| | | | |
|:-:|:-:|:-:|:-:|
| <img src="assets/previews/grid-dive.gif" width="180" alt="grid-dive"><br>**01 `/grid-dive`**<br>You're one tile in a wall of video | <img src="assets/previews/title-orbit.gif" width="180" alt="title-orbit"><br>**02 `/title-orbit`**<br>Your title circles your head | <img src="assets/previews/magnifying-lens.gif" width="180" alt="magnifying-lens"><br>**03 `/magnifying-lens`**<br>A glass disc slides over your shot | <img src="assets/previews/portal.gif" width="180" alt="portal"><br>**04 `/portal`**<br>A ring of light you fly through |
| <img src="assets/previews/clone-room.gif" width="180" alt="clone-room"><br>**05 `/clone-room`**<br>Copies of you step out behind you | <img src="assets/previews/infinite-zoom.gif" width="180" alt="infinite-zoom"><br>**06 `/infinite-zoom`**<br>Frames inside frames, then through | <img src="assets/previews/cube-spin.gif" width="180" alt="cube-spin"><br>**07 `/cube-spin`**<br>Your shot turns like a cube | <img src="assets/previews/liquid-glass.gif" width="180" alt="liquid-glass"><br>**08 `/liquid-glass`**<br>A drop of glass becomes a pane |
| <img src="assets/previews/screen-in-screen.gif" width="180" alt="screen-in-screen"><br>**09 `/screen-in-screen`**<br>You, playing on a laptop | <img src="assets/previews/frame-break.gif" width="180" alt="frame-break"><br>**10 `/frame-break`**<br>Your head breaks out of a photo | <img src="assets/previews/tile-tunnel.gif" width="180" alt="tile-tunnel"><br>**11 `/tile-tunnel`**<br>A tunnel of tiles opens behind you | <img src="assets/previews/depth-ui.gif" width="180" alt="depth-ui"><br>**12 `/depth-ui`**<br>App windows float around you |
| <img src="assets/previews/vertigo.gif" width="180" alt="vertigo"><br>**13 `/vertigo`**<br>The room stretches, you don't | <img src="assets/previews/phone-fan.gif" width="180" alt="phone-fan"><br>**14 `/phone-fan`**<br>Phones fan out like a hand of cards | <img src="assets/previews/shatter.gif" width="180" alt="shatter"><br>**15 `/shatter`**<br>Your shot cracks like glass | <img src="assets/previews/spotlight.gif" width="180" alt="spotlight"><br>**16 `/spotlight`**<br>One theatre light finds your face |
| <img src="assets/previews/pull-back-reveal.gif" width="180" alt="pull-back-reveal"><br>**17 `/pull-back-reveal`**<br>You're inside a video editor | <img src="assets/previews/ribbon-wrap.gif" width="180" alt="ribbon-wrap"><br>**18 `/ribbon-wrap`**<br>A ribbon carries your words | <img src="assets/previews/zoom-through.gif" width="180" alt="zoom-through"><br>**19 `/zoom-through`**<br>A Claude chat flies into your clip | <img src="assets/previews/head-pop-out.gif" width="180" alt="head-pop-out"><br>**20 `/head-pop-out`**<br>Your head springs out of a panel |

## Install (one line)

```bash
curl -fsSL https://raw.githubusercontent.com/Ramakm/claude-video-effects/main/install.sh | bash
```

That downloads the pack to `~/.claude/claude-video-effects`, links the skills into `~/.claude/skills` (and `~/.codex/skills` if you use Codex), and sets up Python, the face tracker and a headless Chromium. You need **git**, **ffmpeg** and **Python 3.10 to 3.13**. If ffmpeg or Python is missing, the installer tells you how to get it.

Prefer the skills CLI? `npx skills add Ramakm/claude-video-effects`, then ask Claude to "set up video-effects".

## Use

Open Claude Code in the folder with your video and type:

```
/title-orbit  my-video.mp4, first 3 seconds, text "CLAUDE SKILLS"
/cube-spin    my-video.mp4 at 7.5s
/head-pop-out my-video.mp4 when I say "start here"
```

Or ask for several at once: *"Add title-orbit at the start, cube-spin at 8s and head-pop-out at 14s."* Claude checks still frames first, then renders `my-video_effects.mp4`.

Run it yourself:

```bash
cd ~/.claude/claude-video-effects/skills/video-effects
.venv/bin/python scripts/fx.py list
.venv/bin/python scripts/fx.py title-orbit in.mp4 out.mp4 --start 0 --end 3 --text "CLAUDE SKILLS"
.venv/bin/python scripts/fx.py --plan plan.json in.mp4 out.mp4
.venv/bin/python scripts/fx.py ribbon-wrap in.mp4 check.png --start 2 --end 5 --still 3.5   # preview a frame
```

`plan.json`:

```json
{"effects": [
  {"fx": "title-orbit", "start": 0.0, "end": 3.0, "text": "CLAUDE SKILLS"},
  {"fx": "cube-spin", "start": 7.5, "end": 9.0},
  {"fx": "head-pop-out", "start": 14.0, "end": 17.0, "text": "START HERE"}
]}
```

Options: `--text` (title-orbit, ribbon-wrap, zoom-through, depth-ui, head-pop-out), `--color "#FF8A1F"` (accent), `--opt ramp=0.5` (ease in/out seconds), `--width 1080`, `--fps 30`.

## The effects

| # | Command | Type | What it does |
|---|---|---|---|
| 01 | `/grid-dive` | Transition | You're one tile in a wall of video |
| 02 | `/title-orbit` | Hook | Your title circles your head |
| 03 | `/magnifying-lens` | Transition | A glass disc slides over your shot |
| 04 | `/portal` | Hook | A ring of light you fly through |
| 05 | `/clone-room` | Hook | Copies of you step out behind you |
| 06 | `/infinite-zoom` | Transition | Frames inside frames, then through |
| 07 | `/cube-spin` | Transition | Your shot turns like a cube |
| 08 | `/liquid-glass` | Transition | A drop of glass becomes a pane |
| 09 | `/screen-in-screen` | Screen | You, playing on a laptop |
| 10 | `/frame-break` | Frame Break | Your head breaks out of a photo |
| 11 | `/tile-tunnel` | Transition | A tunnel of tiles opens behind you |
| 12 | `/depth-ui` | Screen | App windows float around you |
| 13 | `/vertigo` | Hook | The room stretches, you don't |
| 14 | `/phone-fan` | Screen | Phones fan out like a hand of cards |
| 15 | `/shatter` | Transition | Your shot cracks like glass |
| 16 | `/spotlight` | Hook | One theatre light finds your face |
| 17 | `/pull-back-reveal` | Screen | You're inside a video editor |
| 18 | `/ribbon-wrap` | Frame Break | A ribbon carries your words |
| 19 | `/zoom-through` | Screen | A Claude chat flies into your clip |
| 20 | `/head-pop-out` | Frame Break | Your head springs out of a panel |

## How it works

1. ffmpeg pulls the frames for each effect window (plus 1.5 s before it, so clones and grids have history).
2. YuNet finds your face and MediaPipe cuts you out of the background, frame by frame, on your machine.
3. Each effect is drawn on a canvas in headless Chromium (`skills/video-effects/engine/effects.js`), frame by frame.
4. ffmpeg lays the rendered windows back over your clip and keeps the original audio.

Add your own effect: write a function in `engine/effects.js` with `fx('my-effect', 'HOOK', 'What it does', (c, S) => { ... })`. It appears in `fx.py list` straight away.

## Credits

- Built by Ramakrushna Mohapatra ([@techwith.ram](https://instagram.com/techwith.ram), [techwithram.com](https://techwithram.com)).
- Pack layout (one engine skill, bundled models, setup that prints READY, check-a-still-first) inspired by [Vibha Ramprakash's claude-video-effects](https://github.com/Vibha-Ramprakash/claude-video-effects) (MIT).
- Models: YuNet face detector from [opencv_zoo](https://github.com/opencv/opencv_zoo) (MIT) and MediaPipe Selfie Segmenter (Apache 2.0). See `skills/video-effects/models/NOTICE.md`.
- Fonts: Space Grotesk and Space Mono (SIL Open Font License), in `skills/video-effects/fonts/`.

MIT licence.
