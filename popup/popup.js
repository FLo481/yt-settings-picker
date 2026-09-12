const form = document.getElementById("settings");
const status = document.getElementById("status");
let statusTimer;

async function load() {
  const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
  form.subtitlesOff.checked = settings.subtitlesOff;
  form.speed.value = settings.speed;
  form.quality.value = settings.quality;
}

form.addEventListener("change", async () => {
  await browser.storage.sync.set({
    subtitlesOff: form.subtitlesOff.checked,
    speed: form.speed.value,
    quality: form.quality.value,
  });
  status.textContent = "Saved ✓";
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    status.textContent = "Changes apply right away.";
  }, 1500);
});

load();
