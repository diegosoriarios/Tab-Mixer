const listEl = document.getElementById("tabs");
const emptyEl = document.getElementById("empty");
const FALLBACK_ICON = chrome.runtime.getURL("icons/icon48.png");

function faviconUrl(tab) {
  if (!/^https?:/.test(tab.url)) return FALLBACK_ICON;
  return (
    chrome.runtime.getURL("/_favicon/") +
    "?pageUrl=" +
    encodeURIComponent(tab.url) +
    "&size=32"
  );
}

function row(tab) {
  const li = document.createElement("li");

  const img = document.createElement("img");
  img.className = "fav";
  img.alt = "";
  img.src = faviconUrl(tab);
  img.onerror = () => {
    img.src = FALLBACK_ICON;
  };

  const title = document.createElement("span");
  title.className = "title";
  title.textContent = tab.title;
  title.title = tab.title;

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.step = "1";
  slider.value = String(tab.volume);

  const pct = document.createElement("span");
  pct.className = "pct" + (tab.volume < 100 ? " custom" : "");
  pct.textContent = tab.volume + "%";

  slider.addEventListener("input", () => {
    const v = Number(slider.value);
    pct.textContent = v + "%";
    pct.classList.toggle("custom", v < 100);
    chrome.runtime.sendMessage({
      type: "mc:setVolume",
      tabId: tab.id,
      volume: v,
    });
  });

  li.append(img, title, slider, pct);
  return li;
}

async function render() {
  let tabs = [];
  try {
    const res = await chrome.runtime.sendMessage({ type: "mc:getTabs" });
    tabs = (res && res.tabs) || [];
  } catch (e) {
    tabs = [];
  }
  emptyEl.hidden = tabs.length > 0;
  listEl.textContent = "";
  for (const tab of tabs) listEl.appendChild(row(tab));
}

render();
