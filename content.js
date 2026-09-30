(() => {
  if (globalThis.__mediaControllerLoaded) return;
  globalThis.__mediaControllerLoaded = true;

  const SELECTOR = "audio, video";
  let current = 1;

  function applyTo(el) {
    if (current >= 1) return;
    try {
      el.volume = current;
    } catch (e) {}
  }

  function applyAll(root = document) {
    if (current >= 1) return;
    root.querySelectorAll(SELECTOR).forEach(applyTo);
  }

  document.addEventListener(
    "volumechange",
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLMediaElement)) return;
      if (current >= 1) return;
      if (el.volume !== current) applyTo(el);
    },
    true
  );

  const observer = new MutationObserver((mutations) => {
    if (current >= 1) return;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches && node.matches(SELECTOR)) applyTo(node);
        if (node.querySelectorAll) applyAll(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "mc:setVolume" && typeof msg.volume === "number") {
      current = Math.min(1, Math.max(0, msg.volume));
      applyAll();
      try {
        window.dispatchEvent(
          new CustomEvent("tabmixer:setVolume", { detail: current })
        );
      } catch (e) {}
      sendResponse({ ok: true, volume: current });
    }
    return false;
  });
})();
