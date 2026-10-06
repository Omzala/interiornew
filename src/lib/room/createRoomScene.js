/*
 * The live 3D living room in the hero: a hand-built three.js scene that
 * "assembles itself", lit by four moods (dawn / noon / dusk / night) and
 * upholstered in four palettes.
 *
 *   const room = createRoomScene(canvas, { mood, palette, view, shift, zoom });
 *   await room.ready;   // first frame drawn (still empty: the room is waiting for play)
 *   room.play();        // run the intro; idempotent
 *   room.update({ mood: 'night' });   // ease to new options at any time
 *   room.dispose();     // stop, free every GPU resource and release the context
 *
 * Options
 *   mood     'dawn' | 'noon' | 'dusk' | 'night'           (ids from src/data/room.js)
 *   palette  'ivory' | 'sage' | 'clay' | 'ink'
 *   view     'overview' | 'inside'                         ("Step inside" camera)
 *   shift    -0.45..0.45  slides the room sideways in the frame (fraction of width)
 *   zoom     >0           1 = the room just fits the frame
 *
 * Throws (err.code === 'NO_WEBGL') if WebGL 2 is unavailable. The canvas is owned by the scene until dispose();
 * after dispose() its context is lost on purpose, so use a fresh canvas next time.
 * Rendering pauses while the canvas is off-screen or the tab is hidden, and with
 * prefers-reduced-motion the intro, sway and drifting dust are skipped and frames
 * are only drawn when something changes.
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  ClampToEdgeWrapping,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  InstancedMesh,
  LatheGeometry,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  Path,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

/* Lighting presets. Sky colours are raw display values (the sky shader writes them as-is). */
const MOODS = {
  dawn: { el: 21, az: -30, sun: 0xffc6a2, sunI: 3.4, hemiS: 0xf3d9cc, hemiG: 0x5e4a3e, hemiI: 0.75, lamp: 0.0, cove: 0.0, art: 0.0, env: 0.55, dust: 0.9, shaft: 1.0, exp: 1.0, skyT: 0xe7b3a2, skyB: 0xffe3c6, hill: 0x9a7a74, glow: 0xfff0d8, sx: 0.24, sy: 0.33 },
  noon: { el: 55, az: 10, sun: 0xfff5e6, sunI: 4.2, hemiS: 0xe9eef3, hemiG: 0x8a7663, hemiI: 1.35, lamp: 0.0, cove: 0.0, art: 0.0, env: 0.85, dust: 0.45, shaft: 0.45, exp: 1.0, skyT: 0x86b3dd, skyB: 0xe2eef5, hill: 0x7d9670, glow: 0xffffff, sx: 0.62, sy: 0.9 },
  dusk: { el: 16, az: 32, sun: 0xff9d5c, sunI: 5.1, hemiS: 0xd39a7a, hemiG: 0x3b2a22, hemiI: 0.6, lamp: 9.0, cove: 3.0, art: 4.0, env: 0.45, dust: 1.0, shaft: 1.2, exp: 1.06, skyT: 0x5d4c7c, skyB: 0xffa25e, hill: 0x3f2c3a, glow: 0xffd2a0, sx: 0.74, sy: 0.3 },
  night: { el: 34, az: -12, sun: 0x9db4ff, sunI: 0.8, hemiS: 0x2f3a58, hemiG: 0x15100d, hemiI: 0.3, lamp: 16.0, cove: 6.0, art: 7.0, env: 0.18, dust: 0.18, shaft: 0.3, exp: 1.12, skyT: 0x070b1a, skyB: 0x1c2747, hill: 0x080a12, glow: 0xdfe7ff, sx: 0.3, sy: 0.76 },
};

/* Upholstery presets. */
const PALETTES = {
  ivory: { sofa: 0xe8e0d1, pillow: 0xa58c6c, chair: 0xa8673f, rug: 0xd9ccb7 },
  sage: { sofa: 0xa7b098, pillow: 0x5f6f57, chair: 0xe7dfd0, rug: 0xd8cfbd },
  clay: { sofa: 0xc58a6b, pillow: 0x7e3f2a, chair: 0xe6ddcc, rug: 0xdccab0 },
  ink: { sofa: 0x2d333d, pillow: 0xc29a62, chair: 0x9e7a4a, rug: 0xb8ab97 },
};

const DEFAULTS = { mood: 'dusk', palette: 'ivory', view: 'overview', shift: 0, zoom: 1 };
const D2R = Math.PI / 180;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeBack = (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* Seeded random, so the room is identical on every load. */
const seeded = (start) => {
  let seed = start;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* ------------------------------------------------------------------ textures */

function buildTextures(maxAniso) {
  const rand = seeded(7310);
  const list = [];
  const mkCanvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };
  const tex = (c, rx = 1, ry = 1, clampEdge = false) => {
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = clampEdge ? ClampToEdgeWrapping : RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = maxAniso;
    list.push(t);
    return t;
  };
  const grain = (g, w, h, amt) => {
    const id = g.getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rand() - 0.5) * amt;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    g.putImageData(id, 0, 0);
  };

  const wood = (() => {
    const c = mkCanvas(1024, 1024);
    const g = c.getContext('2d');
    const n = 8;
    const pw = 1024 / n;
    for (let i = 0; i < n; i++) {
      let y = -rand() * 500;
      while (y < 1024) {
        const len = 280 + rand() * 460;
        const l = 0.84 + rand() * 0.22;
        const r = 196 * l;
        const gg = 154 * l;
        const b = 110 * l;
        g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
        g.fillRect(i * pw, y, pw, len);
        for (let k = 0; k < 22; k++) {
          const x0 = i * pw + 3 + rand() * (pw - 6);
          g.strokeStyle = `rgba(${(r * 0.62) | 0},${(gg * 0.58) | 0},${(b * 0.52) | 0},${(0.06 + rand() * 0.16).toFixed(3)})`;
          g.lineWidth = 0.5 + rand() * 1.6;
          g.beginPath();
          g.moveTo(x0, y);
          g.bezierCurveTo(x0 + (rand() - 0.5) * 10, y + len * 0.33, x0 + (rand() - 0.5) * 10, y + len * 0.66, x0 + (rand() - 0.5) * 6, y + len);
          g.stroke();
        }
        g.fillStyle = 'rgba(52,32,18,0.55)';
        g.fillRect(i * pw, y, pw, 2);
        y += len;
      }
      g.fillStyle = 'rgba(52,32,18,0.45)';
      g.fillRect(i * pw, 0, 2, 1024);
    }
    return tex(c, 3.5, 2.9);
  })();

  const plaster = (() => {
    const c = mkCanvas(512, 512);
    const g = c.getContext('2d');
    g.fillStyle = '#ece4d8';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 120; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const r = 30 + rand() * 120;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, rand() < 0.5 ? 'rgba(120,100,80,0.05)' : 'rgba(255,255,255,0.07)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    grain(g, 512, 512, 8);
    return tex(c, 0.5, 0.5);
  })();

  const travertine = (() => {
    const c = mkCanvas(512, 512);
    const g = c.getContext('2d');
    g.fillStyle = '#dccab0';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 70; i++) {
      const y = rand() * 512;
      const hh = 2 + rand() * 16;
      g.fillStyle =
        rand() < 0.5
          ? `rgba(170,140,105,${(0.05 + rand() * 0.12).toFixed(3)})`
          : `rgba(250,240,225,${(0.08 + rand() * 0.15).toFixed(3)})`;
      g.fillRect(0, y, 512, hh);
    }
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(120,95,70,${(0.15 + rand() * 0.3).toFixed(3)})`;
      g.beginPath();
      g.ellipse(rand() * 512, rand() * 512, 1 + rand() * 5, 0.5 + rand() * 1.2, 0, 0, Math.PI * 2);
      g.fill();
    }
    return tex(c);
  })();

  const boucle = (() => {
    const c = mkCanvas(256, 256);
    const g = c.getContext('2d');
    g.fillStyle = '#f2f2f2';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) {
      const v = (200 + rand() * 55) | 0;
      g.strokeStyle = `rgba(${v},${v},${v},0.9)`;
      g.lineWidth = 1 + rand();
      g.beginPath();
      g.arc(rand() * 256, rand() * 256, 1.5 + rand() * 2.5, 0, Math.PI * 2);
      g.stroke();
    }
    return tex(c, 5, 5);
  })();

  const rug = (() => {
    const c = mkCanvas(1024, 1024);
    const g = c.getContext('2d');
    g.fillStyle = '#f1ece4';
    g.fillRect(0, 0, 1024, 1024);
    for (let r = 500; r > 10; r -= 6 + rand() * 10) {
      g.strokeStyle = `rgba(150,130,105,${(0.04 + rand() * 0.08).toFixed(3)})`;
      g.lineWidth = 1 + rand() * 3;
      g.beginPath();
      g.arc(512, 512, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.strokeStyle = 'rgba(120,100,78,0.35)';
    g.lineWidth = 10;
    g.beginPath();
    g.arc(512, 512, 455, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 3;
    g.beginPath();
    g.arc(512, 512, 430, 0, Math.PI * 2);
    g.stroke();
    grain(g, 1024, 1024, 18);
    return tex(c, 1, 1, true);
  })();

  const art = (() => {
    const c = mkCanvas(600, 780);
    const g = c.getContext('2d');
    g.fillStyle = '#ebe2d3';
    g.fillRect(0, 0, 600, 780);
    g.fillStyle = '#b5623d';
    g.beginPath();
    g.moveTo(110, 700);
    g.lineTo(110, 380);
    g.arc(300, 380, 190, Math.PI, 0);
    g.lineTo(490, 700);
    g.closePath();
    g.fill();
    g.fillStyle = '#8c9a7c';
    g.beginPath();
    g.arc(395, 250, 120, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1d1915';
    g.fillRect(70, 560, 460, 8);
    g.fillStyle = '#c8a678';
    g.beginPath();
    g.arc(190, 470, 34, 0, Math.PI * 2);
    g.fill();
    grain(g, 600, 780, 14);
    return tex(c, 1, 1, true);
  })();

  const radial = (stops) => {
    const c = mkCanvas(128, 128);
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach((s) => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const t = new CanvasTexture(c);
    list.push(t);
    return t;
  };
  /* soft-edged arch (1 px = 1 cm) for the light-shaft slices, so the stacked
     slices read as one hazy beam instead of hard outlines */
  const shaftMask = (() => {
    const w = 140;
    const h = 252;
    const c = mkCanvas(w, h);
    const g = c.getContext('2d');
    g.fillStyle = '#000'; // alphaMap reads the green channel, so build the ramp in rgb
    g.fillRect(0, 0, w, h);
    const steps = 9;
    for (let i = 0; i < steps; i++) {
      const inset = i * 1.6;
      const r = w / 2 - inset;
      g.fillStyle = `rgba(255,255,255,${(1 / steps).toFixed(3)})`;
      g.beginPath();
      g.moveTo(inset, h);
      g.lineTo(inset, w / 2);
      g.arc(w / 2, w / 2, r, Math.PI, 0);
      g.lineTo(w - inset, h);
      g.closePath();
      g.fill();
    }
    const t = new CanvasTexture(c);
    t.wrapS = t.wrapT = ClampToEdgeWrapping;
    list.push(t);
    return t;
  })();

  const dot = radial([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
  const ground = radial([[0, 'rgba(0,0,0,0.7)'], [0.55, 'rgba(0,0,0,0.28)'], [1, 'rgba(0,0,0,0)']]);

  return { list, wood, plaster, travertine, boucle, rug, art, dot, ground, shaftMask };
}

/* ------------------------------------------------------------------ geometry helpers */

const sector = (r1, r2, a0, a1, h, bev) => {
  const s = new Shape();
  s.absarc(0, 0, r2 - bev, a0, a1, false);
  s.absarc(0, 0, r1 + bev, a1, a0, true);
  s.closePath();
  const g = new ExtrudeGeometry(s, {
    depth: Math.max(0.002, h - 2 * bev),
    bevelEnabled: bev > 0,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 5,
    curveSegments: 72,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bev, 0);
  return g;
};

const roundedRect = (w, d, rc) => {
  const s = new Shape();
  const x0 = -w / 2;
  const y0 = -d / 2;
  s.moveTo(x0 + rc, y0);
  s.lineTo(x0 + w - rc, y0);
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + rc);
  s.lineTo(x0 + w, y0 + d - rc);
  s.quadraticCurveTo(x0 + w, y0 + d, x0 + w - rc, y0 + d);
  s.lineTo(x0 + rc, y0 + d);
  s.quadraticCurveTo(x0, y0 + d, x0, y0 + d - rc);
  s.lineTo(x0, y0 + rc);
  s.quadraticCurveTo(x0, y0, x0 + rc, y0);
  return s;
};

const roundedBox = (w, h, d, rc, bev) => {
  const g = new ExtrudeGeometry(roundedRect(w - 2 * bev, d - 2 * bev, Math.max(0.002, rc - bev)), {
    depth: Math.max(0.002, h - 2 * bev),
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 4,
    curveSegments: 10,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bev, 0);
  return g;
};

const disc = (r, h, bev, seg = 64) => {
  const s = new Shape();
  s.absarc(0, 0, r - bev, 0, Math.PI * 2, false);
  const g = new ExtrudeGeometry(s, {
    depth: Math.max(0.002, h - 2 * bev),
    bevelEnabled: bev > 0,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 4,
    curveSegments: seg,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bev, 0);
  return g;
};

const archPath = (Kind, cx, y0, w, h) => {
  const p = new Kind();
  const r = w / 2;
  p.moveTo(cx - r, y0);
  p.lineTo(cx + r, y0);
  p.lineTo(cx + r, y0 + h - r);
  p.absarc(cx, y0 + h - r, r, 0, Math.PI, false);
  p.lineTo(cx - r, y0);
  return p;
};

const lathe = (pts, seg = 48) => new LatheGeometry(pts.map((p) => new Vector2(p[0], p[1])), seg);
const tube = (pts, r, seg = 24) =>
  new TubeGeometry(new CatmullRomCurve3(pts.map((p) => new Vector3(p[0], p[1], p[2]))), seg, r, 8, false);

/* ------------------------------------------------------------------ scene */

export function createRoomScene(canvas, options = {}) {
  const mq = (q) => typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
  const coarse = mq('(pointer: coarse)');
  const small = (canvas.clientWidth || 800) < 720 || coarse;
  const reduce = mq('(prefers-reduced-motion: reduce)');

  /* acquire the context ourselves so a device without WebGL 2 fails quietly
     (three would log an error) and the caller can show its photo fallback */
  const powerPreference = coarse ? 'default' : 'high-performance';
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference,
  });
  if (!gl) {
    const err = new Error('WebGL 2 is not available');
    err.code = 'NO_WEBGL';
    throw err;
  }
  const renderer = new WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true, powerPreference });
  try {
    return buildRoom(canvas, renderer, { ...DEFAULTS, ...options }, { coarse, small, reduce });
  } catch (err) {
    renderer.dispose();
    renderer.forceContextLoss();
    throw err;
  }
}

function buildRoom(canvas, renderer, opts, { coarse, small, reduce }) {
  const S = {
    opts,
    dead: false,
    raf: 0,
    compiled: false,
    firstFrame: false,
    onScreen: true,
    pageVisible: document.visibilityState !== 'hidden',
    time: 0,
    lastStamp: 0,
    frame: 0,
    playing: false,
    introStart: 0,
    introDone: false,
    awakeUntil: 0,
    W: 0,
    H: 0,
    aspect: 1,
    view: 0,
    drag: { yaw: 0, pitch: 0, active: false, x: 0, y: 0, id: -1 },
    pointer: { x: 0, y: 0, inside: false },
    hover: { x: 0, y: 0 },
    hv: { x: 0, y: 0 },
    lastInteract: -1e9,
    cur: null,
    tgt: null,
    curC: null,
    tgtC: null,
    intro: [],
  };

  const cleanups = [];
  let resolveReady;
  const ready = new Promise((res) => {
    resolveReady = res;
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap; // PCFSoftShadowMap is gone in r186; radius softens PCF

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 80);
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const rnd = seeded(20261005);

  /* soft studio environment for reflections */
  const pmrem = new PMREMGenerator(renderer);
  const envScene = new Scene();
  const envBox = new BoxGeometry(12, 12, 12);
  const envMats = [new MeshBasicMaterial({ color: 0x4a3c31, side: BackSide })];
  const envGeos = [envBox];
  envScene.add(new Mesh(envBox, envMats[0]));
  const envPanel = (r, g, b, x, y, z, w, h) => {
    const pg = new PlaneGeometry(w, h);
    const pm = new MeshBasicMaterial({ color: new Color(r, g, b), side: DoubleSide });
    envGeos.push(pg);
    envMats.push(pm);
    const m = new Mesh(pg, pm);
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  envPanel(5, 4.4, 3.6, 0, 5.5, 2, 6, 3);
  envPanel(2.2, 2.6, 3.2, -5.5, 2, -1, 3, 4);
  envPanel(3.4, 2.6, 1.8, 5, 1.5, 3, 2.5, 3);
  /* assigned per material (not scene.environment): since r163 three ignores
     material.envMapIntensity for scene.environment, and the moods rely on it */
  const envRT = pmrem.fromScene(envScene, 0.035);
  envGeos.forEach((g) => g.dispose());
  envMats.forEach((m) => m.dispose());
  pmrem.dispose();

  const T = buildTextures(maxAniso);

  /* materials; userData.env scales the mood's reflection strength */
  const mats = [];
  const std = (o, env = 1) => {
    const m = new MeshStandardMaterial({ envMap: envRT.texture, ...o });
    m.userData.env = env;
    mats.push(m);
    return m;
  };
  const M = {
    plaster: std({ map: T.plaster, roughness: 0.95 }, 0.6),
    floor: std({ map: T.wood, roughness: 0.5 }, 0.8),
    cut: std({ color: 0x2a221c, roughness: 0.85 }, 0.4),
    walnut: std({ color: 0x5e3d28, roughness: 0.55 }, 0.8),
    trav: std({ map: T.travertine, roughness: 0.65 }, 0.8),
    sofa: std({ map: T.boucle, color: 0xe8e0d1, roughness: 1 }, 0.6),
    pillow: std({ map: T.boucle, color: 0xa58c6c, roughness: 1 }, 0.6),
    chair: std({ map: T.boucle, color: 0xa8673f, roughness: 0.95 }, 0.6),
    rug: std({ map: T.rug, color: 0xd9ccb7, roughness: 1 }, 0.5),
    rugSide: std({ color: 0xb9ab95, roughness: 1 }, 0.5),
    brass: std({ color: 0xc9a062, metalness: 1, roughness: 0.28 }, 1.4),
    marble: std({ color: 0x2b2522, roughness: 0.22 }, 1),
    ceramic: std({ color: 0x35302b, roughness: 0.45, side: DoubleSide }, 1),
    ceramicW: std({ color: 0xeee7dc, roughness: 0.35 }, 1),
    pot: std({ color: 0xcfc2b0, roughness: 0.92 }, 0.6),
    soil: std({ color: 0x2e241d, roughness: 1 }, 0.3),
    bark: std({ color: 0x5f4a38, roughness: 0.9 }, 0.5),
    leaf: std({ color: 0xffffff, roughness: 0.7, side: DoubleSide }, 0.6),
    stem: std({ color: 0x7b8a63, roughness: 0.8 }, 0.5),
    art: std({ map: T.art, roughness: 0.9 }, 0.5),
    curtain: std({ color: 0xf3eee6, roughness: 1, transparent: true, opacity: 0.86, side: DoubleSide }, 0.6),
    glass: std({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false }, 2),
    frame: std({ color: 0x1b1916, roughness: 0.5, metalness: 0.4 }, 1),
    book1: std({ color: 0xcbbca4, roughness: 0.9 }, 0.5),
    book2: std({ color: 0x5f6a5c, roughness: 0.9 }, 0.5),
    book3: std({ color: 0x9a6b4c, roughness: 0.9 }, 0.5),
    twig: std({ color: 0x7d6650, roughness: 0.9 }, 0.5),
    bulb: new MeshStandardMaterial({ envMap: envRT.texture, color: 0x000000, emissive: 0xffd9a8, emissiveIntensity: 0 }),
    shadeIn: new MeshStandardMaterial({ envMap: envRT.texture, color: 0x241a12, emissive: 0xffc98a, emissiveIntensity: 0, side: BackSide }),
    cove: new MeshStandardMaterial({ envMap: envRT.texture, color: 0x000000, emissive: 0xffc58a, emissiveIntensity: 0 }),
  };

  const room = new Group();
  scene.add(room);
  const dm = new Object3D();
  const mk = (geo, mat, x = 0, y = 0, z = 0, parent = room, cast = true, recv = true) => {
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = recv;
    parent.add(m);
    return m;
  };
  const intro = (obj, delay, kind, dur = 0.9) => {
    S.intro.push({ obj, delay, kind, dur, y: obj.position.y });
  };

  /* soft contact shadow under the floating model */
  const groundMat = new MeshBasicMaterial({ map: T.ground, transparent: true, depthWrite: false, opacity: 0 });
  const ground = new Mesh(new PlaneGeometry(13, 11), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(-0.1, -0.55, -0.1);
  scene.add(ground);

  /* floor slab */
  const floor = mk(new BoxGeometry(6.2, 0.25, 5.2), [M.cut, M.cut, M.floor, M.cut, M.cut, M.cut], -0.1, -0.125, -0.1, room, false, true);
  intro(floor, 0, 'grow', 0.9);

  /* walls, arched window, fluted walnut panel */
  const shell = new Group();
  room.add(shell);
  intro(shell, 0.35, 'rise', 1.1);
  const WIN = { cx: 0.9, y0: 0.12, w: 1.5, h: 2.62 };
  const backWall = new Shape();
  backWall.moveTo(-3.2, 0);
  backWall.lineTo(3.0, 0);
  backWall.lineTo(3.0, 3.2);
  backWall.lineTo(-3.2, 3.2);
  backWall.lineTo(-3.2, 0);
  backWall.holes.push(archPath(Path, WIN.cx, WIN.y0, WIN.w, WIN.h));
  mk(new ExtrudeGeometry(backWall, { depth: 0.2, bevelEnabled: false, curveSegments: 48 }), M.plaster, 0, 0, -2.7, shell);
  mk(new BoxGeometry(0.2, 3.2, 5.0), M.plaster, -3.1, 1.6, 0, shell);
  mk(new BoxGeometry(6.2, 0.012, 0.2), M.cut, -0.1, 3.206, -2.6, shell, false);
  mk(new BoxGeometry(0.2, 0.012, 5.2), M.cut, -3.1, 3.206, -0.1, shell, false);
  mk(new BoxGeometry(0.2, 3.2, 0.012), M.cut, -3.1, 1.6, 2.506, shell, false);
  mk(new BoxGeometry(0.012, 3.2, 0.2), M.cut, 3.006, 1.6, -2.6, shell, false);
  mk(new BoxGeometry(3.15, 0.05, 0.016), M.cut, -1.425, 0.025, -2.492, shell, false);
  mk(new BoxGeometry(1.35, 0.05, 0.016), M.cut, 2.325, 0.025, -2.492, shell, false);
  mk(new BoxGeometry(0.016, 0.05, 5.0), M.cut, -2.992, 0.025, 0, shell, false);

  /* ceiling for the "Step inside" view; faces down and is only shown while the camera
     is below it, so the overview stays an open dollhouse */
  const ceiling = mk(new PlaneGeometry(6.0, 5.0), M.plaster, 0, 3.2, 0, shell, false, false);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.visible = false;

  const frameShape = archPath(Shape, WIN.cx, WIN.y0, WIN.w - 0.01, WIN.h - 0.005);
  frameShape.holes.push(archPath(Path, WIN.cx, WIN.y0 + 0.05, WIN.w - 0.1, WIN.h - 0.1));
  mk(new ExtrudeGeometry(frameShape, { depth: 0.06, bevelEnabled: false, curveSegments: 48 }), M.frame, 0, 0, -2.66, shell);
  const spring = WIN.y0 + WIN.h - WIN.w / 2;
  mk(new BoxGeometry(0.03, WIN.h - 0.08, 0.05), M.frame, WIN.cx, WIN.y0 + 0.03 + (WIN.h - 0.08) / 2, -2.63, shell);
  mk(new BoxGeometry(WIN.w - 0.06, 0.03, 0.05), M.frame, WIN.cx, spring, -2.63, shell);
  mk(new BoxGeometry(WIN.w - 0.06, 0.03, 0.05), M.frame, WIN.cx, 1.02, -2.63, shell);
  [-1, 1].forEach((sg) => {
    const bar = mk(new BoxGeometry(0.03, 0.68, 0.05), M.frame, WIN.cx + sg * 0.34 * 0.7071, spring + 0.34 * 0.7071, -2.63, shell);
    bar.rotation.z = -sg * Math.PI / 4;
  });
  mk(new ShapeGeometry(archPath(Shape, WIN.cx, WIN.y0, WIN.w, WIN.h), 48), M.glass, 0, 0, -2.6, shell, false, false);

  /* painted sky + hills behind the window */
  const skyU = {
    top: { value: new Color() },
    bot: { value: new Color() },
    hill: { value: new Color() },
    glow: { value: new Color() },
    sunPos: { value: new Vector2(0.5, 0.5) },
  };
  const skyMat = new ShaderMaterial({
    uniforms: skyU,
    vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform vec3 top; uniform vec3 bot; uniform vec3 hill; uniform vec3 glow; uniform vec2 sunPos;',
      'varying vec2 vUv;',
      'void main(){',
      '  vec3 c = mix(bot, top, smoothstep(0.15, 1.0, vUv.y));',
      '  float d = length(vUv - sunPos);',
      '  c += glow * (0.45 * exp(-d * 6.0) + smoothstep(0.06, 0.05, d));',
      '  float h1 = 0.30 + 0.035 * sin(vUv.x * 9.0 + 1.2) + 0.02 * sin(vUv.x * 23.0);',
      '  float h2 = 0.22 + 0.025 * sin(vUv.x * 13.0 + 4.0) + 0.012 * sin(vUv.x * 41.0);',
      '  c = mix(c, mix(hill, top, 0.25), step(vUv.y, h1));',
      '  c = mix(c, hill, step(vUv.y, h2));',
      '  gl_FragColor = vec4(c, 1.0);',
      '}',
    ].join('\n'),
  });
  skyMat.toneMapped = false;
  /* just wider than the opening and tucked close behind the wall, so it can only ever be
     seen through the window; uvs keep the painted layout of a 2.8 m wide backdrop */
  const skyGeo = new PlaneGeometry(1.9, 2.78);
  const skyUv = skyGeo.attributes.uv;
  for (let i = 0; i < skyUv.count; i++) skyUv.setX(i, (skyUv.getX(i) * 1.9 + 0.45) / 2.8);
  const sky = new Mesh(skyGeo, skyMat);
  sky.position.set(0.9, 1.39, -2.78);
  shell.add(sky);

  /* fluted walnut wall with a warm cove light above */
  const FZ0 = -1.8;
  const FLEN = 2.8;
  const FH = 2.75;
  mk(new BoxGeometry(0.03, FH, FLEN), M.walnut, -2.985, FH / 2, FZ0 + FLEN / 2, shell);
  const nF = 46;
  const sp = FLEN / nF;
  const flutes = new InstancedMesh(new CylinderGeometry(0.029, 0.029, FH, 12), M.walnut, nF);
  for (let i = 0; i < nF; i++) {
    dm.position.set(-2.968, FH / 2, FZ0 + sp * (i + 0.5));
    dm.updateMatrix();
    flutes.setMatrixAt(i, dm.matrix);
  }
  flutes.instanceMatrix.needsUpdate = true;
  flutes.castShadow = true;
  flutes.receiveShadow = true;
  shell.add(flutes);
  mk(new BoxGeometry(0.03, 0.02, FLEN), M.cove, -2.95, FH + 0.02, FZ0 + FLEN / 2, shell, false, false);

  /* sheer curtain on a brass rod */
  const cw = 0.86;
  const ch = 2.86;
  const curtainGeo = new PlaneGeometry(cw, ch, 56, 12);
  const curtainBase = Float32Array.from(curtainGeo.attributes.position.array);
  {
    const arr = curtainGeo.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) arr[i + 2] = 0.05 * Math.sin(curtainBase[i] * 40 + 0.3);
    curtainGeo.computeVertexNormals();
  }
  mk(curtainGeo, M.curtain, 2.13, 0.03 + ch / 2, -2.4, shell, false, true);
  const rod = mk(new CylinderGeometry(0.012, 0.012, 2.75, 12), M.brass, 1.27, 2.94, -2.4, shell, false);
  rod.rotation.z = Math.PI / 2;
  mk(new SphereGeometry(0.03, 16, 12), M.brass, -0.11, 2.94, -2.4, shell, false);
  mk(new SphereGeometry(0.03, 16, 12), M.brass, 2.65, 2.94, -2.4, shell, false);

  /* floating travertine console + decor */
  const con = new Group();
  room.add(con);
  intro(con, 1.9, 'drop');
  mk(roundedBox(0.44, 0.16, 2.0, 0.03, 0.015), M.trav, -2.75, 0.44, -0.45, con);
  mk(lathe([[0, 0], [0.07, 0], [0.1, 0.05], [0.115, 0.16], [0.09, 0.27], [0.04, 0.35], [0.032, 0.42], [0.042, 0.45], [0, 0.45]]), M.ceramic, -2.78, 0.6, -1.1, con);
  [[0.12, 0.62, -0.18], [-0.05, 0.75, 0.1], [0.08, 0.55, 0.22]].forEach((e) => {
    const b = [-2.78, 1.0, -1.1];
    mk(tube([b, [b[0] + e[0] * 0.4, b[1] + e[1] * 0.5, b[2] + e[2] * 0.4], [b[0] + e[0], b[1] + e[1], b[2] + e[2]]], 0.006, 16), M.twig, 0, 0, 0, con);
  });
  mk(new BoxGeometry(0.3, 0.04, 0.22), M.book1, -2.76, 0.62, 0.15, con);
  mk(new BoxGeometry(0.27, 0.035, 0.2), M.book2, -2.76, 0.6575, 0.15, con).rotation.y = 0.12;
  mk(new BoxGeometry(0.28, 0.03, 0.21), M.book3, -2.76, 0.69, 0.15, con).rotation.y = -0.08;
  mk(new SphereGeometry(0.065, 32, 20), M.brass, -2.76, 0.77, 0.15, con);
  mk(new BoxGeometry(0.1, 0.02, 0.1), M.cut, -2.78, 0.61, 0.62, con);
  mk(new TorusGeometry(0.11, 0.022, 16, 48), M.brass, -2.78, 0.75, 0.62, con).rotation.y = Math.PI / 2;

  /* framed art + brass picture light */
  const art = new Group();
  art.position.set(-1.25, 1.62, -2.48);
  room.add(art);
  intro(art, 2.05, 'pop', 0.7);
  mk(new BoxGeometry(1.02, 1.32, 0.04), M.walnut, 0, 0, 0, art);
  mk(new PlaneGeometry(0.92, 1.2), M.art, 0, 0, 0.0205, art, false);
  mk(new BoxGeometry(0.46, 0.03, 0.06), M.brass, 0, 0.76, 0.04, art, false);

  /* round rug */
  const C = new Vector3(-0.35, 0, 0.7);
  const rug = mk(new CylinderGeometry(1.6, 1.6, 0.018, 96), [M.rugSide, M.rug, M.rug], C.x, 0.009, C.z, room, false, true);
  intro(rug, 0.9, 'grow', 0.8);

  /* curved bouclé sofa */
  const sofa = new Group();
  sofa.position.copy(C);
  room.add(sofa);
  intro(sofa, 1.1, 'drop');
  const a0 = 25 * D2R;
  const a1 = 155 * D2R;
  mk(sector(1.14, 1.8, a0 + 0.02, a1 - 0.02, 0.08, 0), M.cut, 0, 0, 0, sofa);
  mk(sector(1.05, 1.88, a0, a1, 0.3, 0.05), M.sofa, 0, 0.06, 0, sofa);
  mk(sector(1.58, 1.9, a0, a1, 0.8, 0.07), M.sofa, 0, 0.06, 0, sofa);
  [[25, 67], [68, 112], [113, 155]].forEach((r) => mk(sector(1.06, 1.6, r[0] * D2R, r[1] * D2R, 0.15, 0.06), M.sofa, 0, 0.33, 0, sofa));
  const pillowGeo = roundedBox(0.48, 0.42, 0.15, 0.08, 0.06);
  [48, 88, 126].forEach((deg, i) => {
    const a = deg * D2R;
    const r = 1.42;
    const m = mk(pillowGeo, M.pillow, Math.cos(a) * r, 0.44, -Math.sin(a) * r, sofa);
    m.rotation.order = 'YXZ';
    m.rotation.y = Math.atan2(-Math.cos(a), Math.sin(a));
    m.rotation.x = -0.3;
    m.rotation.z = (i - 1) * 0.06;
  });

  /* travertine + marble coffee tables with decor */
  const tables = new Group();
  tables.position.copy(C);
  room.add(tables);
  intro(tables, 1.3, 'drop');
  mk(new CylinderGeometry(0.2, 0.27, 0.31, 48), M.trav, 0, 0.155, 0, tables);
  mk(disc(0.54, 0.07, 0.025, 72), M.trav, 0, 0.3, 0, tables);
  mk(new CylinderGeometry(0.11, 0.14, 0.22, 32), M.marble, 0.62, 0.11, 0.42, tables);
  mk(disc(0.3, 0.05, 0.018, 64), M.marble, 0.62, 0.22, 0.42, tables);
  mk(lathe([[0, 0], [0.06, 0], [0.13, 0.04], [0.16, 0.09], [0.155, 0.095], [0.12, 0.055], [0, 0.045]]), M.ceramic, -0.2, 0.37, 0.08, tables);
  mk(new BoxGeometry(0.28, 0.035, 0.2), M.book1, 0.2, 0.3875, -0.15, tables).rotation.y = 0.3;
  mk(new BoxGeometry(0.24, 0.03, 0.18), M.book2, 0.2, 0.42, -0.15, tables).rotation.y = 0.2;
  mk(lathe([[0, 0], [0.04, 0], [0.05, 0.05], [0.035, 0.12], [0.015, 0.16], [0.02, 0.18], [0, 0.18]], 32), M.ceramicW, 0.2, 0.435, -0.15, tables);
  mk(tube([[0.2, 0.6, -0.15], [0.21, 0.78, -0.14], [0.24, 0.95, -0.12]], 0.004, 12), M.stem, 0, 0, 0, tables);
  [[0.215, 0.74, -0.14, 0.6], [0.23, 0.86, -0.13, -0.7], [0.24, 0.95, -0.12, 0.2]].forEach((l) => {
    const lg = new SphereGeometry(1, 8, 6);
    lg.scale(0.018, 0.004, 0.05);
    mk(lg, M.stem, l[0], l[1], l[2], tables).rotation.set(0.6, l[3], 0.4);
  });

  /* tub chair turned toward the sofa */
  const Q = new Vector3(-2.05, 0, 1.78);
  const chair = new Group();
  chair.position.copy(Q);
  room.add(chair);
  intro(chair, 1.45, 'drop');
  const am = Math.atan2(-(Q.z - C.z), Q.x - C.x);
  const span = 250 * D2R;
  mk(new CylinderGeometry(0.3, 0.32, 0.06, 40), M.cut, 0, 0.03, 0, chair);
  mk(disc(0.4, 0.36, 0.07, 64), M.chair, 0, 0.05, 0, chair);
  mk(sector(0.36, 0.5, am - span / 2, am + span / 2, 0.72, 0.075), M.chair, 0, 0.05, 0, chair);

  /* brass arc floor lamp */
  const lamp = new Group();
  room.add(lamp);
  intro(lamp, 1.6, 'drop');
  mk(disc(0.21, 0.05, 0.015, 48), M.marble, 2.3, 0, 0.25, lamp);
  mk(tube([[2.3, 0.04, 0.25], [2.31, 1.2, 0.27], [2.18, 2.0, 0.33], [1.65, 2.42, 0.44], [0.85, 2.36, 0.56], [0.12, 2.06, 0.64]], 0.017, 140), M.brass, 0, 0, 0, lamp);
  const SH = new Vector3(0.1, 1.83, 0.64);
  mk(new SphereGeometry(0.25, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.brass, SH.x, SH.y, SH.z, lamp);
  mk(new SphereGeometry(0.245, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.shadeIn, SH.x, SH.y, SH.z, lamp, false, false);
  mk(new SphereGeometry(0.075, 24, 16), M.bulb, SH.x, SH.y - 0.02, SH.z, lamp, false, false);

  /* potted olive tree */
  const plant = new Group();
  plant.position.set(-2.42, 0, -1.98);
  room.add(plant);
  intro(plant, 1.75, 'drop');
  mk(lathe([[0, 0], [0.22, 0], [0.29, 0.05], [0.33, 0.18], [0.335, 0.38], [0.315, 0.45], [0.29, 0.46], [0.285, 0.43], [0, 0.43]], 64), M.pot, 0, 0, 0, plant);
  mk(new CylinderGeometry(0.285, 0.285, 0.01, 40), M.soil, 0, 0.42, 0, plant, false);
  const crown = new Group();
  crown.position.set(0, 0.42, 0);
  plant.add(crown);
  const cp = (pts) => pts.map((p) => [p[0], p[1] - 0.42, p[2]]);
  mk(tube(cp([[0, 0.4, 0], [0.03, 0.8, 0.02], [-0.02, 1.2, 0], [0.02, 1.55, -0.02], [0, 1.85, 0]]), 0.032, 40), M.bark, 0, 0, 0, crown);
  mk(tube(cp([[0, 1.15, 0], [0.15, 1.4, 0.05], [0.32, 1.7, 0.1]]), 0.016, 20), M.bark, 0, 0, 0, crown);
  mk(tube(cp([[0, 1.3, 0], [-0.1, 1.55, 0.08], [-0.22, 1.88, 0.14]]), 0.015, 20), M.bark, 0, 0, 0, crown);
  mk(tube(cp([[0.02, 1.55, -0.02], [0.12, 1.85, -0.1], [0.16, 2.15, -0.16]]), 0.014, 20), M.bark, 0, 0, 0, crown);
  mk(tube(cp([[0, 1.7, 0], [-0.06, 1.95, -0.05], [-0.06, 2.25, -0.02]]), 0.012, 20), M.bark, 0, 0, 0, crown);
  const clusters = [[0.32, 1.75, 0.1], [-0.2, 1.93, 0.14], [0.16, 2.2, -0.16], [-0.04, 2.3, -0.02], [0.05, 2.0, 0.05]];
  const leafGeo = new SphereGeometry(1, 7, 5);
  leafGeo.scale(0.032, 0.006, 0.095);
  const NL = small ? 260 : 380;
  const leaves = new InstancedMesh(leafGeo, M.leaf, NL);
  const leafCols = [0x6f7c58, 0x86926a, 0x5b6849, 0x9aa47d];
  const tmpColor = new Color();
  for (let i = 0; i < NL; i++) {
    const c = clusters[i % clusters.length];
    const u = rnd() * Math.PI * 2;
    const v = Math.acos(2 * rnd() - 1);
    const rr = Math.cbrt(rnd()) * 0.3;
    dm.position.set(c[0] + Math.sin(v) * Math.cos(u) * rr, c[1] - 0.42 + Math.cos(v) * rr * 0.75, c[2] + Math.sin(v) * Math.sin(u) * rr);
    dm.rotation.set(rnd() * Math.PI, rnd() * Math.PI * 2, rnd() * Math.PI);
    dm.scale.setScalar(0.75 + rnd() * 0.5);
    dm.updateMatrix();
    leaves.setMatrixAt(i, dm.matrix);
    leaves.setColorAt(i, tmpColor.setHex(leafCols[(rnd() * leafCols.length) | 0]));
  }
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  crown.add(leaves);

  /* invisible shadow casters (ceiling + open right wall) keep the sun to the window */
  const occMat = new MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const occ = (geo, x, y, z) => {
    const m = new Mesh(geo, occMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = false;
    room.add(m);
  };
  occ(new BoxGeometry(6.4, 0.1, 5.4), -0.1, 3.3, -0.1);
  occ(new BoxGeometry(0.1, 3.4, 5.4), 3.1, 1.7, -0.1);

  /* lights */
  const hemi = new HemisphereLight(0xffffff, 0x444444, 0.6);
  scene.add(hemi);
  const sun = new DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  const sc = sun.shadow.camera;
  /* frustum hugs the room's bounding sphere (r ≈ 4.6 around the target) */
  sc.left = -4.7;
  sc.right = 4.7;
  sc.top = 4.7;
  sc.bottom = -4.7;
  sc.near = 11;
  sc.far = 21;
  sc.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = small ? 1.25 : 1.5;
  sun.shadow.autoUpdate = false;
  sun.shadow.needsUpdate = true;
  sun.target.position.set(-0.1, 1.4, -0.1);
  scene.add(sun, sun.target);

  const lampLight = new PointLight(0xffb46b, 0, 9, 2);
  lampLight.position.set(SH.x, SH.y - 0.09, SH.z);
  scene.add(lampLight);
  if (!small) {
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(512, 512);
    lampLight.shadow.bias = -0.003;
    lampLight.shadow.camera.near = 0.05;
    lampLight.shadow.autoUpdate = false;
    lampLight.shadow.needsUpdate = true;
  }
  const coveLight = new PointLight(0xffbf80, 0, 4.5, 2);
  coveLight.position.set(-2.72, 2.55, -0.4);
  scene.add(coveLight);
  const artLight = new SpotLight(0xffd2a0, 0, 3.2, 0.75, 0.9, 2);
  artLight.position.set(-1.25, 2.33, -2.3);
  artLight.target.position.set(-1.25, 1.45, -2.48);
  scene.add(artLight, artLight.target);
  const sunDir = new Vector3(0, -0.5, 1);

  /* dust motes drifting in the sunbeam */
  const ND = small ? 160 : 260;
  const dustGeo = new BufferGeometry();
  const dustPos = new Float32Array(ND * 3);
  dustGeo.setAttribute('position', new BufferAttribute(dustPos, 3));
  const dustSeed = [];
  for (let i = 0; i < ND; i++) dustSeed.push([rnd(), rnd(), rnd(), rnd() * 6.283]);
  const dustMat = new PointsMaterial({
    size: 0.028,
    map: T.dot,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    color: 0xffe2b8,
    opacity: 0,
    sizeAttenuation: true,
  });
  const dust = new Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  room.add(dust);

  /* volumetric light shaft: stacked additive arch slices with feathered edges */
  const SW = WIN.w - 0.1;
  const SHH = WIN.h - 0.1;
  const shaftGeo = new ShapeGeometry(archPath(Shape, 0, 0, SW, SHH), 32);
  T.shaftMask.repeat.set(1 / SW, 1 / SHH);
  T.shaftMask.offset.set(0.5, 0);
  const NS = small ? 18 : 28;
  const shaft = [];
  for (let i = 0; i < NS; i++) {
    const m = new Mesh(
      shaftGeo,
      new MeshBasicMaterial({
        color: 0xffd9a8,
        alphaMap: T.shaftMask,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      })
    );
    m.renderOrder = 5;
    room.add(m);
    shaft.push(m);
  }

  /* ---------------------------------------------------------------- options → targets */

  const raw = (hex) => new Color().setHex(hex, LinearSRGBColorSpace);
  const applyOptions = (snap) => {
    const o = S.opts;
    const mood = MOODS[o.mood] || MOODS.dusk;
    const pal = PALETTES[o.palette] || PALETTES.ivory;
    S.tgt = {
      el: mood.el, az: mood.az, sunI: mood.sunI, hemiI: mood.hemiI, lamp: mood.lamp, cove: mood.cove, art: mood.art,
      env: mood.env, dust: mood.dust, shaft: mood.shaft, exp: mood.exp, sx: mood.sx, sy: mood.sy,
      view: o.view === 'inside' ? 1 : 0,
    };
    S.tgtC = {
      sun: new Color(mood.sun), hemiS: new Color(mood.hemiS), hemiG: new Color(mood.hemiG),
      skyT: raw(mood.skyT), skyB: raw(mood.skyB), hill: raw(mood.hill), glow: raw(mood.glow),
      sofa: new Color(pal.sofa), pillow: new Color(pal.pillow), chair: new Color(pal.chair), rug: new Color(pal.rug),
    };
    const sh = parseFloat(o.shift);
    S.shift = Number.isFinite(sh) ? Math.max(-0.45, Math.min(0.45, sh)) : 0;
    const zm = parseFloat(o.zoom);
    S.zoom = Number.isFinite(zm) && zm > 0 ? zm : 1;
    if (snap || !S.cur) {
      S.cur = { ...S.tgt };
      S.curC = {};
      Object.keys(S.tgtC).forEach((k) => {
        S.curC[k] = S.tgtC[k].clone();
      });
      S.view = S.tgt.view;
    }
  };
  applyOptions(true);

  /* ---------------------------------------------------------------- per-frame update */

  const applyIntro = (it) => {
    let done = true;
    for (const o of S.intro) {
      const x = clamp01((it - o.delay) / o.dur);
      if (x < 1) done = false;
      if (o.kind === 'rise') {
        o.obj.visible = x > 0;
        o.obj.scale.y = Math.max(0.001, easeOut(x));
      } else if (o.kind === 'grow') {
        o.obj.visible = x > 0;
        const g = Math.max(0.001, easeOut(x));
        o.obj.scale.set(g, 1, g);
      } else if (o.kind === 'pop') {
        o.obj.visible = x > 0;
        o.obj.scale.setScalar(Math.max(0.001, easeBack(x)));
      } else {
        o.obj.visible = x > 0;
        o.obj.position.y = o.y + (1 - easeBack(x)) * 1.4;
      }
    }
    groundMat.opacity = 0.85 * easeOut(clamp01(it / 0.9));
    return done;
  };

  const step = (dt) => {
    const t = S.time;
    const { cur, tgt, curC, tgtC } = S;
    const it = S.playing ? t - S.introStart : -1;
    const introRunning = !S.introDone;
    if (introRunning) {
      const done = applyIntro(it);
      if (done && S.playing) S.introDone = true;
    }
    const lightIn = !S.playing ? 0 : reduce ? 1 : easeInOut(clamp01((it - 1.6) / 1.6));

    /* ease toward the selected mood + palette */
    const k = 1 - Math.exp(-dt * 2.2);
    let moving = 0;
    for (const key in tgt) {
      if (key === 'view') continue;
      const d = tgt[key] - cur[key];
      cur[key] += d * k;
      moving = Math.max(moving, Math.abs(d));
    }
    for (const key in tgtC) curC[key].lerp(tgtC[key], k);
    S.view = reduce ? tgt.view : S.view + (tgt.view - S.view) * (1 - Math.exp(-dt * 1.6));
    const v = easeInOut(clamp01(S.view));

    const el = cur.el * D2R;
    const az = cur.az * D2R;
    const d = sunDir.set(-Math.sin(az) * Math.cos(el), -Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
    sun.position.copy(sun.target.position).addScaledVector(d, -16);
    sun.intensity = cur.sunI;
    sun.color.copy(curC.sun);
    hemi.intensity = cur.hemiI;
    hemi.color.copy(curC.hemiS);
    hemi.groundColor.copy(curC.hemiG);
    const flick = reduce ? 1 : 1 + Math.sin(t * 7.3) * 0.012 + Math.sin(t * 13.1) * 0.008;
    lampLight.intensity = cur.lamp * lightIn * flick;
    coveLight.intensity = cur.cove * lightIn;
    artLight.intensity = cur.art * lightIn;
    M.bulb.emissiveIntensity = Math.min(4.5, cur.lamp * 0.32) * lightIn;
    M.shadeIn.emissiveIntensity = cur.lamp * 0.07 * lightIn;
    M.cove.emissiveIntensity = cur.cove * 0.9 * lightIn;
    renderer.toneMappingExposure = cur.exp;
    for (const m of mats) m.envMapIntensity = m.userData.env * cur.env;
    M.sofa.color.copy(curC.sofa);
    M.pillow.color.copy(curC.pillow);
    M.chair.color.copy(curC.chair);
    M.rug.color.copy(curC.rug);
    skyU.top.value.copy(curC.skyT);
    skyU.bot.value.copy(curC.skyB);
    skyU.hill.value.copy(curC.hill);
    skyU.glow.value.copy(curC.glow);
    skyU.sunPos.value.set(cur.sx, cur.sy);

    /* shadows only re-render when something that casts them has moved */
    const sunMoving = Math.abs(tgt.el - cur.el) + Math.abs(tgt.az - cur.az) > 0.02;
    if (introRunning || sunMoving || S.frame % (small ? 8 : 3) === 0) sun.shadow.needsUpdate = true;
    if (lampLight.castShadow && introRunning) lampLight.shadow.needsUpdate = true;

    /* sunbeam: slices + dust follow the live sun direction */
    const dy = Math.min(-0.05, d.y);
    const beamLen = Math.min((WIN.y0 + WIN.h) / -dy, 4.2);
    const shaftK = cur.shaft * lightIn;
    shaft.forEach((m, i) => {
      const f = (i + 0.5) / shaft.length;
      const tt = f * beamLen;
      m.position.set(WIN.cx + d.x * tt, WIN.y0 + 0.05 + d.y * tt, -2.55 + d.z * tt);
      m.material.opacity = shaftK * (1.5 / shaft.length) * Math.pow(1 - f, 1.3);
      m.material.color.copy(curC.sun);
    });
    const td = reduce ? 9 : t;
    for (let i = 0; i < ND; i++) {
      const sd = dustSeed[i];
      const f = (sd[2] + td * 0.012) % 1;
      const px = WIN.cx - WIN.w * 0.45 + sd[0] * WIN.w * 0.9;
      const py = WIN.y0 + 0.1 + sd[1] * (WIN.h - 0.3);
      const len = Math.min(py / -dy, 4.2) * f;
      dustPos[i * 3] = px + d.x * len + Math.sin(td * 0.5 + sd[3]) * 0.04;
      dustPos[i * 3 + 1] = py + d.y * len + Math.sin(td * 0.37 + sd[3] * 2) * 0.05;
      dustPos[i * 3 + 2] = -2.52 + d.z * len + Math.cos(td * 0.43 + sd[3]) * 0.04;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dustMat.opacity = cur.dust * 0.8 * lightIn;
    dustMat.color.copy(curC.sun);

    /* curtain breathing in the breeze + olive tree sway */
    if (!reduce) {
      const arr = curtainGeo.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = curtainBase[i];
        const yy = (ch / 2 - curtainBase[i + 1]) / ch;
        arr[i + 2] = 0.05 * Math.sin(x * 40 + 0.3) + yy * yy * 0.05 * Math.sin(t * 0.9 + x * 3);
      }
      curtainGeo.attributes.position.needsUpdate = true;
      curtainGeo.computeVertexNormals();
      crown.rotation.z = Math.sin(t * 0.7) * 0.012;
      crown.rotation.x = Math.sin(t * 0.53 + 1) * 0.008;
    }

    /* camera: fit the room to the frame, then orbit with drag, hover and idle sway */
    if (S.pointer.inside && !reduce) {
      const r = canvas.getBoundingClientRect();
      S.hover.x = (S.pointer.x - r.left) / Math.max(1, r.width) - 0.5;
      S.hover.y = (S.pointer.y - r.top) / Math.max(1, r.height) - 0.5;
    } else {
      S.hover.x = 0;
      S.hover.y = 0;
    }
    const aspect = S.aspect;
    const shift = S.shift * (1 - v);
    const effA = aspect * (1 - 2 * Math.abs(shift));
    const fovO = 30;
    const hf = 2 * Math.atan(Math.tan((fovO * D2R) / 2) * effA);
    const eff = Math.min(fovO * D2R, hf);
    const distO = 3.95 / Math.sin(eff / 2) / S.zoom;
    const fovI = aspect < 1 ? 66 : 52;
    const lerp = (a, b) => a + (b - a) * v;
    const fov = lerp(fovO, fovI);
    let dist = lerp(distO, 3.3);
    const tx = lerp(-0.3, -0.8);
    const ty = lerp(1.0, 0.95);
    const tz = lerp(-0.2, -0.7);
    const idle = clamp01((t - S.lastInteract - 2.5) / 4);
    const kh = 1 - Math.exp(-dt * 3);
    S.hv.x += (S.hover.x - S.hv.x) * kh;
    S.hv.y += (S.hover.y - S.hv.y) * kh;
    const sway = reduce ? 0 : Math.sin(t * 0.17) * 0.09 * idle;
    const baseYaw = lerp(0.62, 0.74) + sway - S.hv.x * 0.12;
    const basePitch = lerp(0.4, 0.1) + S.hv.y * 0.05;
    const yMin = lerp(0.02, 0.3);
    const yMax = lerp(1.35, 1.2);
    const pMin = lerp(0.12, -0.05);
    const pMax = lerp(0.9, 0.35);
    let yaw = baseYaw + S.drag.yaw;
    if (yaw < yMin) {
      S.drag.yaw += yMin - yaw;
      yaw = yMin;
    }
    if (yaw > yMax) {
      S.drag.yaw -= yaw - yMax;
      yaw = yMax;
    }
    let pitch = basePitch + S.drag.pitch;
    if (pitch < pMin) {
      S.drag.pitch += pMin - pitch;
      pitch = pMin;
    }
    if (pitch > pMax) {
      S.drag.pitch -= pitch - pMax;
      pitch = pMax;
    }
    if (!reduce && it < 3.2) {
      const e = easeInOut(clamp01(it / 3.2));
      yaw += (1 - e) * 0.85;
      dist *= 1 + (1 - e) * 0.55;
      pitch += (1 - e) * 0.12;
    }
    const cpitch = Math.cos(pitch);
    camera.position.set(tx + dist * Math.sin(yaw) * cpitch, ty + dist * Math.sin(pitch), tz + dist * Math.cos(yaw) * cpitch);
    camera.lookAt(tx, ty, tz);
    camera.fov = fov;
    camera.near = Math.max(0.05, dist - 9);
    camera.far = dist + 14;
    if (Math.abs(shift) > 0.001) camera.setViewOffset(S.W, S.H, -shift * S.W, 0, S.W, S.H);
    else if (camera.view && camera.view.enabled) camera.clearViewOffset();
    camera.updateProjectionMatrix();
    ceiling.visible = v > 0.5 && camera.position.y < 3.1;

    renderer.render(scene, camera);
    S.frame += 1;

    const settling = moving > 0.002 || Math.abs(tgt.view - S.view) > 0.001 || S.drag.active;
    if (settling) S.awakeUntil = Math.max(S.awakeUntil, t + 0.5);

    if (!S.firstFrame) {
      S.firstFrame = true;
      resolveReady();
    }
  };

  /* ---------------------------------------------------------------- loop + scheduling */

  const canRun = () => !S.dead && S.compiled && S.onScreen && S.pageVisible && S.W > 0 && S.H > 0;
  /* before play() one (empty) frame is enough; after it, ambient motion keeps the loop
     running unless the visitor prefers reduced motion, in which case frames are drawn
     only while something is changing */
  const wantsFrames = () => {
    if (!S.firstFrame) return true;
    if (!S.playing) return S.time < S.awakeUntil;
    return !reduce || !S.introDone || S.time < S.awakeUntil;
  };

  const loop = (stamp) => {
    S.raf = 0;
    if (!canRun()) return;
    /* the clock follows real time (so the intro keeps its length on slow GPUs), but
       never jumps more than half a second; easing uses a tighter step for stability */
    const elapsed = S.lastStamp ? Math.max(0.001, (stamp - S.lastStamp) / 1000) : 0.016;
    S.lastStamp = stamp;
    S.time += Math.min(0.5, elapsed);
    step(Math.min(0.1, elapsed));
    if (wantsFrames()) schedule();
    else S.lastStamp = 0;
  };
  const schedule = () => {
    if (!S.raf && canRun()) S.raf = requestAnimationFrame(loop);
  };
  const wake = (seconds) => {
    S.awakeUntil = Math.max(S.awakeUntil, S.time + seconds);
    schedule();
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h || S.dead) return;
    if (w === S.W && h === S.H) return;
    renderer.setSize(w, h, false);
    S.W = w;
    S.H = h;
    S.aspect = w / h;
    camera.aspect = S.aspect;
    /* redraw right away so a resized (cleared) canvas never flashes empty */
    if (S.compiled && S.onScreen && S.pageVisible) step(0);
    wake(0.5);
  };

  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    cleanups.push(() => ro.disconnect());
  } else {
    window.addEventListener('resize', resize);
    cleanups.push(() => window.removeEventListener('resize', resize));
  }
  resize();

  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver(
      (entries) => {
        S.onScreen = entries[entries.length - 1].isIntersecting;
        S.lastStamp = 0;
        if (S.onScreen) wake(0.5);
      },
      { threshold: 0 }
    );
    io.observe(canvas);
    cleanups.push(() => io.disconnect());
  }

  const onVisibility = () => {
    S.pageVisible = document.visibilityState !== 'hidden';
    S.lastStamp = 0;
    if (S.pageVisible) wake(0.5);
  };
  document.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

  /* pointer: drag orbits (touch: yaw only, so vertical swipes still scroll), mouse hover parallax */
  const onDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    S.drag.active = true;
    S.drag.id = e.pointerId;
    S.drag.x = e.clientX;
    S.drag.y = e.clientY;
    S.lastInteract = S.time;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    wake(1);
  };
  const onMove = (e) => {
    if (e.pointerType === 'mouse') {
      S.pointer.x = e.clientX;
      S.pointer.y = e.clientY;
      S.pointer.inside = true;
    }
    if (S.drag.active && e.pointerId === S.drag.id) {
      const dx = e.clientX - S.drag.x;
      const dy = e.clientY - S.drag.y;
      S.drag.x = e.clientX;
      S.drag.y = e.clientY;
      S.drag.yaw -= dx * 0.0055;
      if (e.pointerType === 'mouse') S.drag.pitch += dy * 0.0035;
      S.lastInteract = S.time;
      wake(1);
    } else if (e.pointerType === 'mouse' && !reduce) {
      wake(1.2);
    }
  };
  const onUp = (e) => {
    if (e.pointerId !== S.drag.id) return;
    S.drag.active = false;
    S.drag.id = -1;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    wake(1);
  };
  const onLeave = (e) => {
    if (e.pointerType === 'mouse') S.pointer.inside = false;
    wake(1.2);
  };
  const listeners = [
    ['pointerdown', onDown],
    ['pointermove', onMove],
    ['pointerup', onUp],
    ['pointercancel', onUp],
    ['pointerleave', onLeave],
  ];
  listeners.forEach(([type, fn]) => canvas.addEventListener(type, fn));
  cleanups.push(() => listeners.forEach(([type, fn]) => canvas.removeEventListener(type, fn)));

  /* pre-play state: the room has not assembled yet */
  applyIntro(-1);

  /* compile shaders + upload textures up front so the intro never hitches */
  const warmUp = async () => {
    camera.aspect = S.aspect;
    camera.updateProjectionMatrix();
    try {
      await renderer.compileAsync(scene, camera);
    } catch {
      /* compile on first use instead */
    }
    if (S.dead) return;
    T.list.forEach((t) => renderer.initTexture(t));
    S.compiled = true;
    schedule();
  };
  warmUp();

  /* ---------------------------------------------------------------- public API */

  return {
    ready,
    update(partial = {}) {
      if (S.dead) return;
      S.opts = { ...S.opts, ...partial };
      applyOptions(false);
      wake(4);
    },
    play() {
      if (S.dead || S.playing) return;
      S.playing = true;
      S.introStart = reduce ? S.time - 20 : S.time + 0.25;
      wake(1);
    },
    dispose() {
      if (S.dead) return;
      S.dead = true;
      if (S.raf) cancelAnimationFrame(S.raf);
      S.raf = 0;
      cleanups.forEach((fn) => fn());
      const geos = new Set();
      const materials = new Set();
      scene.traverse((o) => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => materials.add(m));
        if (o.isLight && o.shadow) o.shadow.dispose();
        if (o.isInstancedMesh) o.dispose();
      });
      geos.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      T.list.forEach((t) => t.dispose());
      envRT.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
