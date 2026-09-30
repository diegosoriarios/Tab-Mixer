const vm = require("vm");
const assert = require("assert");

class AudioParam {
  constructor() { this.value = 1; }
}
class BaseCtx {}
class AudioContext extends BaseCtx {
  constructor() {
    super();
    this.destination = new AudioDestinationNode(this);
    this._edges = [];
  }
  createGain() { return new GainNode(this); }
}
class OfflineAudioContext extends BaseCtx {
  constructor() {
    super();
    this.destination = new AudioDestinationNode(this);
    this._edges = [];
  }
  createGain() { return new GainNode(this); }
}
class AudioNode {
  constructor(ctx) { this.context = ctx; this._outs = []; }
  connect(dest) {
    if (this._outs.includes(dest)) return dest;
    this._outs.push(dest);
    if (dest && dest.context) dest.context._edges.push([this, dest]);
    return dest;
  }
}
class AudioDestinationNode extends AudioNode {}
class GainNode extends AudioNode {
  constructor(ctx) { super(ctx); this.gain = new AudioParam(); }
}
class SourceNode extends AudioNode {}

globalThis.window = new EventTarget();
globalThis.AudioNode = AudioNode;
globalThis.AudioContext = AudioContext;
globalThis.OfflineAudioContext = OfflineAudioContext;
globalThis.AudioDestinationNode = AudioDestinationNode;

vm.runInThisContext(
  require("fs").readFileSync(require("path").join(__dirname, "..", "audio-hook.js"), "utf8")
);

const ctx = new AudioContext();
const offline = new OfflineAudioContext();
const s1 = new SourceNode(ctx);

const ret = s1.connect(ctx.destination);
assert.strictEqual(ret, ctx.destination, "connect returns destination");
assert.strictEqual(ctx._edges.length, 2, "two edges inserted");
const [e1, e2] = ctx._edges;
assert.strictEqual(e1[1] instanceof GainNode, true, "edge1 source->gain");
assert.strictEqual(e2[0] instanceof GainNode && e2[1] === ctx.destination, true, "edge2 gain->dest");
assert.strictEqual(e1[1].gain.value, 1, "passthrough at 1");
const g1 = e1[1];

const ret2 = s1.connect(ctx.destination);
assert.strictEqual(ctx._edges.length, 2, "repeat connect adds no new edges");
assert.strictEqual(
  ctx._edges.filter((e) => e[1] instanceof GainNode).length,
  1,
  "exactly one inserted gain for s1"
);

window.dispatchEvent(new CustomEvent("tabmixer:setVolume", { detail: 0.4 }));
assert.strictEqual(g1.gain.value, 0.4, "existing gain updated to 0.4");

const s2 = new SourceNode(ctx);
s2.connect(ctx.destination);
const newGain = ctx._edges[ctx._edges.length - 1][0];
assert.strictEqual(newGain.gain.value, 0.4, "new edge starts at 0.4");

const s3 = new SourceNode(offline);
s3.connect(offline.destination);
assert.strictEqual(offline._edges.length, 1, "offline ctx untouched");
assert.strictEqual(offline._edges[0][1], offline.destination, "offline direct edge");

const s4 = new SourceNode(ctx);
const plain = new GainNode(ctx);
const r4 = s4.connect(plain);
const e4 = ctx._edges.find((e) => e[0] === s4);
assert.strictEqual(e4 && e4[1], plain, "non-destination connect untouched (direct edge)");
assert.strictEqual(r4, plain, "plain connect returns dest");

window.dispatchEvent(new CustomEvent("tabmixer:setVolume", { detail: 1 }));
assert.strictEqual(g1.gain.value, 1, "release restores 1");

console.log("all hook assertions passed");
