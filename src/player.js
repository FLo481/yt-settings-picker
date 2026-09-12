// Runs in YouTube's own page context ("MAIN" world) so it can call the
// player's JavaScript API. Settings arrive from bridge.js via DOM events.
(() => {
  "use strict";

  const SETTINGS_EVENT = "yt-settings-picker:settings";
  const REQUEST_EVENT = "yt-settings-picker:request";

  // YouTube's internal quality names, best first.
  const QUALITY_ORDER = [
    "highres", // 4320p
    "hd2880",
    "hd2160",
    "hd1440",
    "hd1080",
    "hd720",
    "large", // 480p
    "medium", // 360p
    "small", // 240p
    "tiny", // 144p
  ];

  const STATE_PLAYING = 1;

  // YouTube sometimes switches captions on a moment after playback starts,
  // so keep turning them off for a little while.
  const CAPTIONS_GUARD_MS = 5000;

  let settings = null;
  let settingsJson = "";
  let configuredVideoId = null;
  let captionsGuardUntil = 0;

  const getPlayer = () => document.getElementById("movie_player");

  const isWatchPage = () =>
    location.pathname === "/watch" || location.pathname.startsWith("/live/");

  // The wanted quality if available, else the next lower one, else the lowest.
  function pickQuality(available, wanted) {
    const levels = QUALITY_ORDER.filter((q) => available.includes(q));
    if (levels.length === 0) return null;
    if (wanted === "highest") return levels[0];
    const wantedRank = QUALITY_ORDER.indexOf(wanted);
    return (
      levels.find((q) => QUALITY_ORDER.indexOf(q) >= wantedRank) ?? levels.at(-1)
    );
  }

  function applyQuality(player, available) {
    const quality = pickQuality(available, settings.quality);
    if (!quality) return;
    if (player.setPlaybackQualityRange) {
      player.setPlaybackQualityRange(quality, quality);
    } else {
      player.setPlaybackQuality?.(quality);
    }
  }

  function applySpeed(player) {
    // Live streams can't be sped up.
    if (player.getVideoData().isLive) return;
    player.setPlaybackRate?.(Number(settings.speed));
  }

  function turnOffCaptions(player) {
    if (player.isSubtitlesOn && player.toggleSubtitles) {
      if (player.isSubtitlesOn()) player.toggleSubtitles();
      return;
    }
    const button = player.querySelector(".ytp-subtitles-button");
    if (button?.getAttribute("aria-pressed") === "true") button.click();
  }

  function onMediaEvent(event) {
    if (!settings || !isWatchPage()) return;
    const player = getPlayer();
    if (!player?.getVideoData || !player.contains(event.target)) return;
    // Ads play in the same player; wait for the actual video.
    if (player.classList.contains("ad-showing")) return;

    const videoId = player.getVideoData().video_id;
    if (
      videoId &&
      videoId !== configuredVideoId &&
      player.getPlayerState() === STATE_PLAYING
    ) {
      const available = player.getAvailableQualityLevels?.() ?? [];
      // Quality levels show up once the video has loaded; try again later.
      if (available.length === 0) return;

      configuredVideoId = videoId;
      applySpeed(player);
      applyQuality(player, available);
      captionsGuardUntil = settings.subtitlesOff ? Date.now() + CAPTIONS_GUARD_MS : 0;
    }
    if (Date.now() < captionsGuardUntil) turnOffCaptions(player);
  }

  // Don't fight the user: touching the player or pressing "c" ends the guard.
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (getPlayer()?.contains(event.target)) captionsGuardUntil = 0;
    },
    true,
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "c" || event.key === "C") captionsGuardUntil = 0;
    },
    true,
  );

  document.addEventListener(SETTINGS_EVENT, (event) => {
    if (typeof event.detail !== "string" || event.detail === settingsJson) return;
    settingsJson = event.detail;
    settings = JSON.parse(event.detail);
    // Apply changed settings to the video that's already playing, too.
    configuredVideoId = null;
  });

  // Media events don't bubble, but capturing listeners on document see them.
  // timeupdate fires several times a second and covers SPA navigation and
  // videos that start after an ad.
  for (const type of ["loadeddata", "playing", "timeupdate"]) {
    document.addEventListener(type, onMediaEvent, true);
  }

  document.dispatchEvent(new CustomEvent(REQUEST_EVENT));
})();
