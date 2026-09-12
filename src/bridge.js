// Runs in the extension's isolated content-script world and hands the stored
// settings to player.js, which runs in the page's world and has no access to
// extension APIs. Event names must match player.js.
const SETTINGS_EVENT = "yt-settings-picker:settings";
const REQUEST_EVENT = "yt-settings-picker:request";

async function sendSettings() {
  const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
  // Only strings cross from the content script into the page intact.
  document.dispatchEvent(
    new CustomEvent(SETTINGS_EVENT, { detail: JSON.stringify(settings) }),
  );
}

// Whichever script loads second triggers the first delivery.
document.addEventListener(REQUEST_EVENT, sendSettings);
browser.storage.onChanged.addListener(sendSettings);
sendSettings();
