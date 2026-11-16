#!/usr/bin/env python3
"""Print when each word is spoken, so an effect can start on a word.

usage: words.py <video>     -> prints "12.34  word" lines and saves <video>.words.json
Installs faster-whisper into the current environment on first use (about 150 MB with the small model).
"""
import json, os, subprocess, sys

if len(sys.argv) != 2:
    sys.exit(__doc__)
src = sys.argv[1]
try:
    from faster_whisper import WhisperModel
except ImportError:
    print('Installing faster-whisper (first run only)...', flush=True)
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'faster-whisper'])
    from faster_whisper import WhisperModel

model = WhisperModel('small', device='cpu', compute_type='int8')
segments, _ = model.transcribe(src, word_timestamps=True, vad_filter=True)
words = []
for seg in segments:
    for w in seg.words or []:
        words.append({'t': round(w.start, 2), 'end': round(w.end, 2), 'word': w.word.strip()})
        print(f"{w.start:6.2f}  {w.word.strip()}")
out = os.path.splitext(src)[0] + '.words.json'
json.dump(words, open(out, 'w'), indent=1)
print('saved ' + out)
