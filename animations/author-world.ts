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
    children: [`${o.id}-halo`, o.id],
  } as SceneNode);
}

// Edge shimmer is deliberately absent: GRAY is reserved for future labels.
void GRAY;

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
const rootIds = ["field", "layer-back", "layer-front"];

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
  ]),
);

assertValidAnimationDocument(document);
mkdirSync("out", { recursive: true });
writeFileSync("out/world.json", JSON.stringify(document));
console.log(`wrote out/world.json (${Object.keys(nodes).length} nodes)`);
