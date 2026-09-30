(() => {
  if (window.__tabMixerHook) return;
  const state = { mult: 1, gains: new Set() };
  window.__tabMixerHook = state;

  const nativeConnect = AudioNode.prototype.connect;

  function isSpeakerDestination(dest) {
    try {
      return (
        dest instanceof AudioDestinationNode &&
        dest.context instanceof AudioContext
      );
    } catch (e) {
      return false;
    }
  }

  AudioNode.prototype.connect = function (destination) {
    let inserted = null;
    try {
      if (
        destination instanceof AudioNode &&
        isSpeakerDestination(destination) &&
        !this.__tabMixerGain
      ) {
        const gain = this.context.createGain();
        gain.__tabMixerOwned = true;
        nativeConnect.call(this, gain);
        nativeConnect.call(gain, destination);
        gain.gain.value = state.mult;
        state.gains.add(gain);
        this.__tabMixerGain = gain;
        inserted = gain;
      } else if (
        destination instanceof AudioNode &&
        isSpeakerDestination(destination) &&
        this.__tabMixerGain
      ) {
        nativeConnect.call(this.__tabMixerGain, destination);
        return destination;
      }
    } catch (e) {}
    if (inserted) return destination;
    return nativeConnect.apply(this, arguments);
  };

  window.addEventListener("tabmixer:setVolume", (e) => {
    const v = e.detail;
    if (typeof v !== "number" || v < 0 || v > 1) return;
    state.mult = v;
    state.gains.forEach((g) => {
      try {
        g.gain.value = v;
      } catch (err) {}
    });
  });
})();
