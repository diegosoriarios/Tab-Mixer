const STATE_KEY = "tabVolumes";
const RELEASED = 100;

async function getMap() {
  const stored = await chrome.storage.session.get(STATE_KEY);
  return stored[STATE_KEY] || {};
}

async function setMap(map) {
  await chrome.storage.session.set({ [STATE_KEY]: map });
}

async function ensureInjected(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["content.js"],
    });
    return Array.isArray(results) && results.length > 0;
  } catch (e) {
    return false;
  }
}

function deliver(tabId, volume) {
  const fraction = volume / RELEASED;
  chrome.tabs.sendMessage(tabId, { type: "mc:setVolume", volume: fraction }).catch(() => {});
}

async function setVolume(tabId, volume) {
  const map = await getMap();
  if (volume >= RELEASED) {
    delete map[tabId];
  } else {
    map[tabId] = volume;
  }
  await setMap(map);
  await ensureInjected(tabId);
  deliver(tabId, volume);
}

async function getTabs() {
  const [audible, map] = await Promise.all([
    chrome.tabs.query({ audible: true }),
    getMap(),
  ]);
  const ids = new Set(audible.map((t) => t.id));
  for (const key of Object.keys(map)) ids.add(Number(key));
  const tabs = [];
  for (const id of ids) {
    try {
      const tab = await chrome.tabs.get(id);
      tabs.push({
        id: tab.id,
        title: tab.title || tab.url || "Tab",
        url: tab.url || "",
        audible: !!tab.audible,
        volume: map[id] ?? RELEASED,
      });
    } catch (e) {
      delete map[id];
    }
  }
  await setMap(map);
  tabs.sort((a, b) => Number(b.audible) - Number(a.audible) || a.id - b.id);
  return tabs;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg && msg.type === "mc:getTabs") {
        sendResponse({ tabs: await getTabs() });
      } else if (msg && msg.type === "mc:setVolume" && msg.tabId != null) {
        await setVolume(msg.tabId, msg.volume);
        sendResponse({ ok: true });
      }
    } catch (e) {
      sendResponse({ error: String(e) });
    }
  })();
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status !== "complete") return;
  (async () => {
    const map = await getMap();
    if (tabId in map) {
      delete map[tabId];
      await setMap(map);
    }
  })();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  (async () => {
    const map = await getMap();
    if (tabId in map) {
      delete map[tabId];
      await setMap(map);
    }
  })();
});
