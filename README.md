# YT Settings Picker

Firefox extension that applies your preferred YouTube settings every time a
video starts:

- turn subtitles/CC off
- playback speed: 1×, 1.5×, 1.75× or 2×
- quality: highest available, or a fixed resolution (falls back to the next
  lower one if a video doesn't have it)

Click the toolbar icon to pick your defaults. Changes also apply to the video
that's already playing.

## Try it

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…** → select `manifest.json`

Temporary add-ons are removed when Firefox restarts.

## Install permanently

Release Firefox only installs signed extensions. Signing for personal use is
free and doesn't publish anything:

1. `python3 -m zipfile -c yt-settings-picker.zip manifest.json icons popup src`
2. On <https://addons.mozilla.org/developers/>, submit a new add-on and choose
   **On your own** (unlisted)
3. Download the signed `.xpi` and open it in Firefox

Bump `version` in `manifest.json` before submitting an update.

## How it works

- `src/player.js` runs in YouTube's page context and uses the player API
  (`#movie_player`) once per video, after any ads
- `src/bridge.js` reads the settings from extension storage and passes them to
  `player.js`
- `popup/` is the settings UI
