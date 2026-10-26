# Reproducible Audio Fixtures

The two WAV files in this directory are original synthetic sine tones generated
specifically for this repository by \`scripts/generate-audio-fixtures.js\`. They do
not contain recordings, samples, or other material from an external source.
License for the generated WAV fixtures: CC0-1.0
(https://creativecommons.org/publicdomain/zero/1.0/). They may be copied and
redistributed with this coursework for testing. No third-party audio license
or remote audio host is required. This license statement applies to the two
WAV fixtures only.

| File | Signal | Format | Duration |
|---|---|---|---|
| \`tone-a.wav\` | 440 Hz with short fades | 16 kHz, mono, 16-bit PCM | 0.75 s |
| \`tone-b.wav\` | 660 Hz with short fades | 16 kHz, mono, 16-bit PCM | 0.75 s |

Run \`node scripts/generate-audio-fixtures.js\` from the repository root to
regenerate them deterministically. Serve the repository with a local HTTP
server and open \`index.html\`. Enter \`./audio/fixtures/tone-a.wav\` or
\`./audio/fixtures/tone-b.wav\`, add a task, then choose Play when it becomes
Ready. AudioContext starts inside this user action.

For a repeatable failure, enter \`./audio/fixtures/missing.wav\`. The local
server returns HTTP 404, the task becomes Failed, and the error is shown in
the live status and task row. Remove the failed task before retrying.
