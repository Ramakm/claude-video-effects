#!/usr/bin/env python3
"""techwith.ram video effects: render any of 20 effects onto a talking-head clip.

  fx.py list
  fx.py <effect> <input> <output.mp4> [--start S] [--end E] [--text T] [--color #HEX] [--opt key=value]
  fx.py --plan plan.json <input> <output.mp4>
  add --still 1.2,2.0 to write check PNGs instead of a video (output becomes the PNG name pattern)

The output keeps the original audio. Frames outside the effect windows are untouched.
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile, asyncio

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.join(ROOT, 'engine')
MODELS = os.path.join(ROOT, 'models')
DEFAULT_LEN = 3.0      # seconds, when no --end is given
PREROLL = 1.5          # seconds of history loaded before each window (clones, grids)


def die(msg):
    print('ERROR: ' + msg, file=sys.stderr)
    sys.exit(1)


def effect_meta():
    src = open(os.path.join(ENGINE, 'effects.js'), encoding='utf-8').read()
    return [(m[0], m[1], m[2]) for m in re.findall(r"^fx\('([a-z\-]+)', '([A-Z ]+)', [\"'](.+?)[\"'],", src, re.M)]


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode:
        die('command failed: ' + ' '.join(cmd[:6]) + ' ...\n' + r.stderr[-1500:])
    return r.stdout


def probe(path):
    if not os.path.exists(path):
        die(f'video not found: {path}')
    info = json.loads(run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', path]))
    v = next((s for s in info['streams'] if s['codec_type'] == 'video'), None)
    if not v:
        die('no video stream in ' + path)
    w, h = int(v['width']), int(v['height'])
    rot = 0
    for sd in v.get('side_data_list', []) or []:
        if 'rotation' in sd:
            rot = int(float(sd['rotation']))
    rot = rot or int(v.get('tags', {}).get('rotate', 0) or 0)
    if abs(rot) % 180 == 90:
        w, h = h, w
    num, den = (v.get('avg_frame_rate') or v.get('r_frame_rate') or '30/1').split('/')
    fps = float(num) / float(den or 1) if float(num) else 30.0
    dur = float(info['format'].get('duration') or v.get('duration') or 0)
    has_audio = any(s['codec_type'] == 'audio' for s in info['streams'])
    return dict(w=w, h=h, fps=fps, dur=dur, audio=has_audio)


# ---------------------------------------------------------------- analysis
class Analyzer:
    """Face centre (YuNet) and person matte (MediaPipe selfie segmenter), both bundled in models/."""

    def __init__(self):
        import cv2, numpy as np
        self.cv2, self.np = cv2, np
        self.det = None
        try:
            self.det = cv2.FaceDetectorYN.create(os.path.join(MODELS, 'yunet.onnx'), '', (320, 320), 0.6, 0.3, 5000)
        except Exception as e:
            print('note: face detector unavailable (' + str(e) + '), using the person outline instead')
        import mediapipe as mp
        from mediapipe.tasks import python as mpt
        from mediapipe.tasks.python import vision
        self.mp = mp
        self.seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
            base_options=mpt.BaseOptions(model_asset_path=os.path.join(MODELS, 'selfie_segmenter.tflite')),
            output_confidence_masks=True))

    def close(self):
        try:
            self.seg.close()
        except Exception:
            pass

    def folder(self, d, n):
        cv2, np = self.cv2, self.np
        faces, prev_mask, last = [], None, None
        for i in range(n):
            img = cv2.imread(os.path.join(d, f'f{i + 1:05d}.jpg'))
            H, W = img.shape[:2]
            # matte at <=512 px, smoothed over time
            s = 512 / max(W, H)
            small = cv2.resize(img, (max(1, int(W * s)), max(1, int(H * s))), interpolation=cv2.INTER_AREA) if s < 1 else img
            rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
            m = self.seg.segment(self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))).confidence_masks[0].numpy_view()
            m = np.squeeze(m).astype(np.float32)
            m = cv2.GaussianBlur(m, (0, 0), 1.2)
            m = np.clip((m - .3) / .4, 0, 1)
            if prev_mask is not None and prev_mask.shape == m.shape:
                m = .6 * m + .4 * prev_mask
            prev_mask = m
            a = (m * 255).astype(np.uint8)
            rgba = np.dstack([np.full_like(a, 255)] * 3 + [a])
            cv2.imwrite(os.path.join(d, f'm{i + 1:05d}.png'), rgba)
            # face
            f = None
            if self.det is not None:
                self.det.setInputSize((small.shape[1], small.shape[0]))
                _, res = self.det.detect(small)
                if res is not None and len(res):
                    x, y, w, h = max(res, key=lambda r: r[2] * r[3])[:4]
                    f = [(x + w / 2) / small.shape[1], (y + h * .48) / small.shape[0], h / 2 / small.shape[0]]
            if f is None:
                ys, xs = np.nonzero(m > .5)
                if len(ys) > 50:
                    top = ys.min() / m.shape[0]
                    band = ys < ys.min() + m.shape[0] * .15
                    f = [xs[band].mean() / m.shape[1], top + .1, .09]
            if f is None:
                f = last or [.5, .36, .1]
            if last:
                f = [last[j] * .55 + f[j] * .45 for j in range(3)]
            last = f
            faces.append([round(float(v), 5) for v in f])
        return faces


# ---------------------------------------------------------------- rendering
async def render_window(item, src, info, W, H, fps, tmp, stills=None, still_out=None):
    from playwright.async_api import async_playwright
    start, end = item['start'], item['end']
    pre = min(start, PREROLL)
    d = os.path.join(tmp, f"w{item['idx']}")
    os.makedirs(d, exist_ok=True)
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{start - pre:.3f}', '-t', f'{end - start + pre:.3f}', '-i', src,
         '-vf', f'fps={fps},scale={W}:{H}:flags=lanczos', '-q:v', '2', os.path.join(d, 'f%05d.jpg')])
    n = len([f for f in os.listdir(d) if f.startswith('f')])
    pre_n = min(n - 1, int(round(pre * fps)))
    print(f"  {item['fx']}: {start:.2f}s to {end:.2f}s, {n - pre_n} frames, analysing...", flush=True)
    an = Analyzer()
    try:
        faces = an.folder(d, n)
    finally:
        an.close()
    job = dict(W=W, H=H, fps=fps, dur=end - start, pre=pre_n, fx=item['fx'], faces=faces,
               opts=item.get('opts', {}), ramp=float(item.get('opts', {}).get('ramp', .35)),
               dir='file://' + os.path.abspath(d))
    targets = None
    if stills:
        targets = {pre_n + max(0, min(n - pre_n - 1, int(round((s - start) * fps)))): s for s in stills if start <= s <= end}
        if not targets:
            return None
    seg = os.path.join(tmp, f"seg{item['idx']}.mp4")
    enc = None
    if not stills:
        enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(fps), '-c:v', 'mjpeg', '-i', '-',
                                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', seg], stdin=subprocess.PIPE)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--allow-file-access-from-files', '--disable-web-security'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + os.path.join(ENGINE, 'page.html'))
        await pg.evaluate('job => setup(job)', job)
        last = max(targets) if targets else n - 1
        for i in range(last + 1):
            draw = i >= pre_n and (targets is None or i in targets)
            await pg.evaluate('([i, d]) => renderFrame(i, d)', [i, draw])
            if errs:
                die('effect error: ' + errs[0])
            if not draw:
                continue
            if targets:
                out = still_out.replace('.png', f"_{item['fx']}_{targets[i]:.2f}s.png")
                await pg.screenshot(path=out)
                print('  wrote ' + out)
            else:
                enc.stdin.write(await pg.screenshot(type='jpeg', quality=93))
            if not targets and (i - pre_n) % 30 == 0:
                print(f'    frame {i - pre_n + 1}/{n - pre_n}', flush=True)
        await b.close()
    if enc:
        enc.stdin.close()
        enc.wait()
        if enc.returncode:
            die('encoding failed')
    return seg


def compose(src, info, W, H, segs, out):
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src]
    for _, s in segs:
        cmd += ['-i', s]
    parts, last = [f'[0:v]scale={W}:{H}:flags=lanczos,setsar=1[b0]'], 'b0'
    for j, (item, _) in enumerate(segs, 1):
        st, en = item['start'], item['end']
        parts.append(f'[{j}:v]setpts=PTS-STARTPTS+{st:.4f}/TB[s{j}]')
        parts.append(f"[{last}][s{j}]overlay=enable='between(t,{st:.4f},{en - .0005:.4f})':eof_action=pass[b{j}]")
        last = f'b{j}'
    cmd += ['-filter_complex', ';'.join(parts), '-map', f'[{last}]']
    if info['audio']:
        cmd += ['-map', '0:a:0', '-c:a', 'aac', '-b:a', '192k']
    cmd += ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]
    run(cmd)


def main():
    names = [m[0] for m in effect_meta()]
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('args', nargs='*', help='list | <effect> <input> <output> | (with --plan) <input> <output>')
    ap.add_argument('--plan', help='JSON plan with several effects')
    ap.add_argument('--start', type=float, default=0.0)
    ap.add_argument('--end', type=float)
    ap.add_argument('--text', help='words for title-orbit, ribbon-wrap, zoom-through, depth-ui, head-pop-out')
    ap.add_argument('--color', help='accent colour, e.g. #FF8A1F')
    ap.add_argument('--opt', action='append', default=[], help='key=value (e.g. ramp=0.5)')
    ap.add_argument('--width', type=int, default=1080, help='output width (default 1080)')
    ap.add_argument('--fps', type=float, help='render fps (default: source, max 30)')
    ap.add_argument('--still', help='comma-separated seconds: write check PNGs instead of a video')
    a = ap.parse_args()

    if a.args[:1] == ['list'] or not a.args and not a.plan:
        for i, (n, c, dsc) in enumerate(effect_meta(), 1):
            print(f'{i:02d}  /{n:<18} {c:<12} {dsc}')
        return
    if a.plan:
        if len(a.args) != 2:
            die('usage: fx.py --plan plan.json <input> <output>')
        src, out = a.args
        items = json.load(open(a.plan))['effects']
    else:
        if len(a.args) != 3:
            die('usage: fx.py <effect> <input> <output>')
        name, src, out = a.args
        items = [dict(fx=name, start=a.start, end=a.end, text=a.text, color=a.color)]
    for o in a.opt:
        if '=' not in o:
            die('--opt needs key=value')
    extra = dict(o.split('=', 1) for o in a.opt)

    for tool in ('ffmpeg', 'ffprobe'):
        if not shutil.which(tool):
            die('ffmpeg is not installed (Mac: brew install ffmpeg, Windows: winget install ffmpeg)')
    info = probe(src)
    W = min(a.width, info['w']) // 2 * 2
    H = int(round(W * info['h'] / info['w'] / 2)) * 2
    fps = a.fps or min(30.0, round(info['fps'], 3))

    clean = []
    for idx, it in enumerate(items):
        n = it['fx'].lstrip('/')
        if n not in names:
            die(f"unknown effect '{n}'. Run: fx.py list")
        st = max(0.0, float(it.get('start') or 0))
        en = it.get('end')
        en = min(info['dur'], float(en) if en is not None else st + DEFAULT_LEN)
        if en - st < .3:
            die(f'{n}: window too short ({st:.2f}s to {en:.2f}s); clip is {info["dur"]:.2f}s')
        opts = dict(it.get('opts') or {}, **extra)
        if it.get('text'):
            opts['text'] = it['text']
        if it.get('color'):
            opts['color'] = it['color']
        clean.append(dict(idx=idx, fx=n, start=st, end=en, opts=opts))
    clean.sort(key=lambda x: x['start'])
    for x, y in zip(clean, clean[1:]):
        if y['start'] < x['end']:
            die(f"effects overlap: {x['fx']} ends at {x['end']}, {y['fx']} starts at {y['start']}")

    stills = [float(s) for s in a.still.split(',')] if a.still else None
    tmp = tempfile.mkdtemp(prefix='twr_fx_')
    try:
        print(f"Rendering {len(clean)} effect(s) on {os.path.basename(src)} at {W}x{H}, {fps:g} fps")
        segs = []
        for it in clean:
            s = asyncio.run(render_window(it, src, info, W, H, fps, tmp, stills, out if out.endswith('.png') else out.rsplit('.', 1)[0] + '.png'))
            if s:
                segs.append((it, s))
        if stills:
            return
        compose(src, info, W, H, segs, out)
        print('DONE ' + os.path.abspath(out))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
