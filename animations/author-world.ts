// Authors animations/world.json: a seamless 24s loop of a small "world model":
// a hub (the agent) with orbiting memory nodes, live edges, and recall pulses.
// Run: npm run build
import { mkdirSync, writeFileSync } from "node:fs";
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  fill,
  hex,
  keyed,
  marker,
  parallaxLayersMacro,
  type PathData,
  pointerFieldMacro,
  type SceneNode,
  stroke,
  withComputedRevision,
  withInteraction,
} from "@clayzo/animation/authoring";

const W = 840;
const H = 480;
const CX = W / 2;
const CY = H / 2;
const TPS = 240;
const FPS = 30;
const STEP = TPS / FPS; // 8 ticks per frame
const SECONDS = 24; // slow and ambient: this is a background plane
const DURATION = TPS * SECONDS; // 5760
const K = DURATION / 1920; // the beat grid below was laid out for 8s

// Brand tokens from DESIGN.md.
const VOID = hex("#040404");
const ORANGE = hex("#FF8C00");
const AMBER = hex("#FFAA00");
const SOFT = hex("#FFB74D");
const GRAY = hex("#B0B0B1");
const DIM = hex("#7C7C7C");
const VIOLET = hex("#846CE4");

const OUT = { x1: 0.2, y1: 0.45, x2: 0.45, y2: 1 };
const TAU = Math.PI * 2;

type Orbit = {
  id: string;
  rx: number;
  ry: number;
  r: number;
  color: typeof ORANGE;
  phase: number; // radians
  revs: number; // whole revolutions per loop (negative = counter-clockwise)
};

// Whole revolutions per loop keep every orbit seamless.
const orbits: Orbit[] = [
  { id: "n1", rx: 120, ry: 120, r: 9, color: ORANGE, phase: 0.2, revs: 1 },
  { id: "n2", rx: 120, ry: 120, r: 7, color: SOFT, phase: 2.3, revs: 1 },
  { id: "n3", rx: 120, ry: 120, r: 8, color: VIOLET, phase: 4.4, revs: 1 },
  { id: "n4", rx: 205, ry: 205, r: 8, color: AMBER, phase: 1.0, revs: -1 },
  { id: "n5", rx: 205, ry: 205, r: 6, color: ORANGE, phase: 2.6, revs: -1 },
  { id: "n6", rx: 205, ry: 205, r: 9, color: SOFT, phase: 4.1, revs: -1 },
  { id: "n7", rx: 205, ry: 205, r: 6, color: VIOLET, phase: 5.5, revs: -1 },
];

const posAt = (o: Orbit, tick: number) => {
  const a = o.phase + (o.revs * TAU * tick) / DURATION;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return { x: r1(CX + o.rx * Math.cos(a)), y: r1(CY + o.ry * Math.sin(a)) };
};

// One sample per frame so linear interpolation tracks the ellipse closely.
const sampleTicks: number[] = [];
for (let t = 0; t <= DURATION; t += STEP) sampleTicks.push(t);
// Edges are sampled every 6 frames (a 12 degree step on a 24s orbit, ~1px chord error).
const edgeTicks: number[] = [];
for (let t = 0; t <= DURATION; t += STEP * 2 * K) edgeTicks.push(t);

const nodes: Record<string, SceneNode> = {};
const roots: string[] = [];
const add = (id: string, node: SceneNode) => {
  nodes[id] = node;
  roots.push(id);
};

add("field", {
  ...base("field", { outTick: DURATION, x: CX, y: CY }),
  type: "rect",
  size: constant({ width: W, height: H }),
  cornerRadius: constant(0),
  style: { fill: fill(VOID) },
});

// Orbit guides.
for (
  const [id, rx, ry] of [["guide-inner", 120, 120], [
    "guide-outer",
    205,
    205,
  ]] as const
) {
  add(id, {
    ...base(id, { outTick: DURATION, x: CX, y: CY }),
    type: "ellipse",
    size: constant({ width: rx * 2, height: ry * 2 }),
    style: { stroke: stroke(DIM, 1, { opacity: 0.22 }) },
  });
}

// Edges: hub to every node, plus a few node-to-node links. Sampled per frame.
const edgePath = (
  a: (t: number) => { x: number; y: number },
  b: (t: number) => { x: number; y: number },
) =>
(t: number): PathData => {
  const p = a(t);
  const q = b(t);
  const z = { x: 0, y: 0 };
  return {
    contours: [{
      closed: false,
      vertices: [
        { point: p, inTangent: z, outTangent: z },
        { point: q, inTangent: z, outTangent: z },
      ],
    }],
  };
};

const hubPos = () => ({ x: CX, y: CY });
const byId = Object.fromEntries(orbits.map((o) => [o.id, o]));
const links: [string, string][] = [
  ["hub", "n1"],
  ["hub", "n2"],
  ["hub", "n3"],
  ["n1", "n4"],
  ["n2", "n5"],
  ["n3", "n6"],
  ["n3", "n7"],
  ["n4", "n5"],
  ["n6", "n7"],
];
const posOf = (id: string) =>
  id === "hub" ? hubPos : (t: number) => posAt(byId[id], t);

for (const [a, b] of links) {
  const id = `edge-${a}-${b}`;
  const f = edgePath(posOf(a), posOf(b));
  const hubEdge = a === "hub";
  add(id, {
    ...base(id, { outTick: DURATION }),
    type: "path",
    path: {
      kind: "keyframed",
      keyframes: edgeTicks.map((t, i) => ({
        id: `${id}.${i}`,
        tick: t,
        value: f(t),
        interpolation: i === edgeTicks.length - 1 ? "hold" : "linear",
      })),
    },
    style: {
      stroke: stroke(hubEdge ? ORANGE : DIM, hubEdge ? 1.5 : 1, {
        opacity: hubEdge ? 0.55 : 0.3,
      }),
    },
  } as SceneNode);
}

// Recall pulses: a bright dot travels hub -> node, staggered around the loop.
const pulses: { node: string; start: number }[] = [
  { node: "n1", start: 0 },
  { node: "n3", start: 480 * K },
  { node: "n2", start: 960 * K },
  { node: "n1", start: 1440 * K },
];
pulses.forEach(({ node, start }, i) => {
  const id = `pulse-${i}`;
  const len = 360 * K;
  const track = (axis: "x" | "y") =>
    sampleTicks
      .filter((t) => t >= start && t <= start + len)
      .map((t) => {
        const k = (t - start) / len;
        const target = posAt(byId[node], t);
        const e = k * k * (3 - 2 * k);
        return [
          t,
          axis === "x" ? CX + (target.x - CX) * e : CY + (target.y - CY) * e,
        ] as const;
      });
  const xs = track("x");
  const ys = track("y");
  add(id, {
    ...base(id, {
      inTick: start,
      outTick: start + len + STEP,
      position: {
        kind: "keyframed",
        keyframes: xs.map(([t, x], j) => ({
          id: `${id}.p${j}`,
          tick: t,
          value: { x, y: ys[j][1], z: 0 },
          interpolation: j === xs.length - 1 ? "hold" : "linear",
        })),
      },
    }),
    type: "ellipse",
    size: constant({ width: 8, height: 8 }),
    style: {
      fill: fill(
        hex("#FFFFFF"),
        keyed(`${id}.fade`, [[start, 0, OUT], [start + 40 * K, 1, "linear"], [
          start + len - 60 * K,
          1,
          OUT,
        ], [start + len, 0]]),
      ),
    },
  } as SceneNode);
});

// Hub: breathing core, plus 4 expanding "ping" rings per loop (every 2s).
for (let i = 0; i < 4; i++) {
  const s = i * 480 * K;
  const id = `ping-${i}`;
  add(id, {
    ...base(id, {
      inTick: s,
      outTick: s + 480 * K,
      x: CX,
      y: CY,
      scale: keyed(`${id}.scale`, [[s, { x: 0.3, y: 0.3, z: 1 }, OUT], [
        s + 480 * K,
        { x: 1, y: 1, z: 1 },
      ]]),
    }),
    type: "ellipse",
    size: constant({ width: 420, height: 420 }),
    style: {
      stroke: stroke(ORANGE, 1.5, {
        opacity: keyed(`${id}.alpha`, [[s, 0.55, "linear"], [
          s + 480 * K - STEP,
          0,
        ]]),
      }),
    },
  } as SceneNode);
}

add("hub-glow", {
  ...base("hub-glow", {
    outTick: DURATION,
    x: CX,
    y: CY,
    // Four slow breaths per loop.
    scale: keyed("hub-glow.scale", [
      ...Array.from({ length: 8 }, (_, i) =>
        [
          i * 240 * K,
          { x: i % 2 ? 1.18 : 1, y: i % 2 ? 1.18 : 1, z: 1 },
          OUT,
        ] as const),
      [DURATION, { x: 1, y: 1, z: 1 }] as const,
    ]),
  }),
  type: "ellipse",
  size: constant({ width: 76, height: 76 }),
  style: { fill: fill(ORANGE, 0.16) },
} as SceneNode);
add("hub", {
  ...base("hub", { outTick: DURATION, x: CX, y: CY }),
  type: "ellipse",
  size: constant({ width: 34, height: 34 }),
  style: { fill: fill(ORANGE) },
} as SceneNode);
add("hub-core", {
  ...base("hub-core", { outTick: DURATION, x: CX, y: CY }),
  type: "ellipse",
  size: constant({ width: 12, height: 12 }),
  style: { fill: fill(VOID) },
} as SceneNode);

// Moons: small satellites on a faster orbit around some nodes. Whole
// revolutions per loop keep them seamless; the ring is a faint guide.
type Moon = { d: number; r: number; revs: number; phase: number };
const moons: Record<string, Moon[]> = {
  n1: [{ d: 24, r: 2.5, revs: 4, phase: 0.5 }],
  n3: [{ d: 22, r: 2.5, revs: -5, phase: 1.2 }, {
    d: 32,
    r: 2,
    revs: 3,
    phase: 3.9,
  }],
  n4: [{ d: 23, r: 2.5, revs: 4, phase: 2.8 }],
  n6: [{ d: 26, r: 3, revs: -3, phase: 4.6 }],
};

// Memory nodes: halo + body, both riding the sampled orbit.
for (const o of orbits) {
  // A group at the hub rotates; the node sits at its radius. Two keys per orbit.
  const startDeg = (o.phase * 180) / Math.PI;
  const endDeg = startDeg + o.revs * 360;
  nodes[`${o.id}-halo`] = {
    ...base(`${o.id}-halo`, { outTick: DURATION, x: o.rx, y: 0 }),
    type: "ellipse",
    size: constant({ width: o.r * 3.2, height: o.r * 3.2 }),
    style: { fill: fill(o.color, 0.14) },
  } as SceneNode;
  nodes[o.id] = {
    ...base(o.id, { outTick: DURATION, x: o.rx, y: 0 }),
    type: "ellipse",
    size: constant({ width: o.r * 2, height: o.r * 2 }),
    style: { fill: fill(o.color) },
  } as SceneNode;
  const kids = [`${o.id}-halo`, o.id];
  (moons[o.id] ?? []).forEach((m, i) => {
    const mid = `${o.id}-moon${i}`;
    nodes[`${mid}-ring`] = {
      ...base(`${mid}-ring`, { outTick: DURATION, x: o.rx, y: 0 }),
      type: "ellipse",
      size: constant({ width: m.d * 2, height: m.d * 2 }),
      style: { stroke: stroke(o.color, 0.75, { opacity: 0.18 }) },
    } as SceneNode;
    nodes[mid] = {
      ...base(mid, { outTick: DURATION, x: m.d, y: 0 }),
      type: "ellipse",
      size: constant({ width: m.r * 2, height: m.r * 2 }),
      style: { fill: fill(GRAY) },
    } as SceneNode;
    const deg = (m.phase * 180) / Math.PI;
    nodes[`${mid}-orbit`] = {
      ...base(`${mid}-orbit`, {
        outTick: DURATION,
        x: o.rx,
        y: 0,
        rotation: keyed(`${mid}.rot`, [
          [0, { x: 0, y: 0, z: deg }, "linear"],
          [DURATION, { x: 0, y: 0, z: deg + m.revs * 360 }],
        ]),
      }),
      type: "group",
      children: [mid],
    } as SceneNode;
    kids.push(`${mid}-ring`, `${mid}-orbit`);
  });
  add(`${o.id}-orbit`, {
    ...base(`${o.id}-orbit`, {
      outTick: DURATION,
      x: CX,
      y: CY,
      rotation: keyed(`${o.id}.rot`, [[
        0,
        { x: 0, y: 0, z: startDeg },
        "linear",
      ], [DURATION, { x: 0, y: 0, z: endDeg }]]),
    }),
    type: "group",
    children: kids,
  } as SceneNode);
}

// Two parallax layers. The orbit guides are a backdrop; everything else moves
// as one so edges never detach from the hub.
const guideIds = roots.filter((id) => id.startsWith("guide-"));
const frontIds = roots.filter((id) => id !== "field" && !guideIds.includes(id));
const layer = (id: string, children: string[]): SceneNode =>
  ({
    ...base(id, { outTick: DURATION, x: 0, y: 0 }),
    type: "group",
    children,
  }) as SceneNode;
nodes["layer-back"] = layer("layer-back", guideIds);
nodes["layer-front"] = layer("layer-front", frontIds);

// Dithering: the web is quantized to a coarse ordered-dither screen, so it
// reads as a printed, low-bit plate rather than smooth vector. The void field
// renders under the web inside the effect. Amount 1 makes dot density track
// brightness, so faint guides and halos survive as sparse dots. The
// cursor carries a lens (focusAmount -1) that resolves the web back to clean
// vector where you look; pointerFieldMacro moves it and opens/closes it.
// The void field sits under the web inside the scene, so the scene is opaque
// and faint strokes keep their real (premultiplied) brightness going into
// the dither.
nodes["scene"] = layer("scene", ["field", "layer-back", "layer-front"]);
const num = (
  name: string,
  value: number,
  minimum: number,
  maximum: number,
) => ({
  id: `dither.${name}`,
  name,
  valueType: "number" as const,
  value: constant(value),
  minimum,
  maximum,
});
// Color matrix as a node: m0-m19 are a row-major 4x5 matrix over
// (r, g, b, a, 1); the player clamps the result to 0-1.
const matrix = (id: string, inputId: string, m: number[]): SceneNode =>
  ({
    ...base(id, { outTick: DURATION, x: 0, y: 0 }),
    type: "effect",
    inputId,
    effect: "color-matrix",
    parameters: m.map((value, i) => ({
      id: `${id}.m${i}`,
      name: `m${i}`,
      valueType: "number" as const,
      value: constant(value),
      minimum: -10,
      maximum: 10,
    })),
    capability: {
      requires: ["image-filter"],
      fallback: "passthrough",
      maxTemporarySurfaces: 1,
    },
  }) as SceneNode;
// Dithering quantizes each channel on its own, so colored input lands on
// off-brand hues (dim orange on maroon, violet on blue). Graying first
// makes every channel equal; two levels then give pure black or white,
// and "brand" maps those to Void and Sunset Orange. Two colors, total.
// Weights of 0.65 put orange at 1.0 (solid nodes) and void at 0.03, which
// the 4x4 Bayer screen (max +0.44) never lights.
// Alpha is forced to 1 so antialiased edges snap instead of blending into
// in-between colors further down the chain.
// deno-fmt-ignore
nodes["gray"] = matrix("gray", "scene", [
  0.65, 0.65, 0.65, 0, 0,
  0.65, 0.65, 0.65, 0, 0,
  0.65, 0.65, 0.65, 0, 0,
  0, 0, 0, 0, 1,
]);
nodes["dither"] = {
  ...base("dither", { outTick: DURATION, x: 0, y: 0 }),
  type: "effect",
  inputId: "gray",
  effect: "dithering",
  parameters: [
    num("amount", 1, 0, 1),
    // Two levels: on or off per pixel ("gray" made channels equal).
    num("levels", 2, 2, 256),
    num("scale", 3, 1, 64),
    {
      id: "dither.focus",
      name: "focus",
      valueType: "point",
      value: constant({ x: CX, y: CY }),
      minimum: { x: 0, y: 0 },
      maximum: { x: W, y: H },
    },
    num("focusRadius", 0, 0, 4096),
    num("focusScale", 0.5, 0.05, 32),
    num("focusAmount", -1, -1, 1),
  ],
  // Players without runtime effects draw the plain vector loop.
  capability: {
    requires: ["runtime-effect"],
    fallback: "passthrough",
    maxTemporarySurfaces: 1,
  },
} as SceneNode;
// Black -> Void (#040404), white -> Sunset Orange (#FF8C00).
// deno-fmt-ignore
nodes["brand"] = matrix("brand", "dither", [
  0.9843, 0, 0, 0, 0.0157,
  0.5333, 0, 0, 0, 0.0157,
  -0.0157, 0, 0, 0, 0.0157,
  0, 0, 0, 1, 0,
]);
const rootIds = ["brand"];

const timeline = withComputedRevision({
  version: ANIMATION_DOCUMENT_VERSION,
  id: "wazoo-world",
  name: "Wazoo world model",
  canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: VOID },
  timing: {
    ticksPerSecond: TPS,
    frameRate: { numerator: FPS, denominator: 1 },
    durationTicks: DURATION,
    displayStartTick: 0,
  },
  assets: {},
  rootCompositionId: "main",
  components: {},
  compositions: {
    main: {
      id: "main",
      name: "Main",
      width: W,
      height: H,
      durationTicks: DURATION,
      nodes,
      rootNodeIds: rootIds,
    },
  },
  markers: [marker("loop-start", 0)],
  design: { tokens: { looping: true } },
  capabilities: { required: [], optional: [], unsupportedPolicy: "warn" },
});

// Cursor parallax: the web drifts up to 18 units, the backdrop rings about half
// of that. The idle loop keeps playing underneath.
const document = withComputedRevision(
  withInteraction(timeline, [
    parallaxLayersMacro({
      nodeIds: ["layer-back", "layer-front"],
      span: 420,
      reach: 18,
    }),
    pointerFieldMacro({
      effectNodeId: "dither",
      focusParameterId: "dither.focus",
      radiusParameterId: "dither.focusRadius",
      radius: 110,
      halfLife: 0.06, // Clayzo: 0.04-0.08s for focus tracking
    }),
  ]),
);

assertValidAnimationDocument(document);
mkdirSync("out", { recursive: true });
writeFileSync("out/world.json", JSON.stringify(document));
console.log(`wrote out/world.json (${Object.keys(nodes).length} nodes)`);
