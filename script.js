// ============================================================
// JS Animations
// ============================================================

let container = document.getElementById("container");
let canvas, ctx, renderer, scene, camera, torus;

let width = window.innerWidth;
let height = window.innerHeight;
let mode = 0; // 0〜4
let t = 0;

// ============================================================
// ボタン制御
// ============================================================
const switchButton = document.getElementById("switch");
switchButton.onclick = () => {
  mode = (mode + 1) % 5;
  switchScene();
};

// ============================================================
// Canvasを再生成
// ============================================================
function createCanvas() {
  if (canvas) canvas.remove();
  canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  ctx = canvas.getContext("2d");
}

// ============================================================
// Three.jsの初期化
// ============================================================
function initTorus() {
  createCanvas(); // キャンバスを新しく作成し、Three.jsに渡す
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(width, height);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;

  const geometry = new THREE.TorusKnotGeometry(1, 0.3, 256, 64);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x00ffff,
    emissive: 0x0077ff,
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 1.0,
    emissiveIntensity: 2.0,
  });
  torus = new THREE.Mesh(geometry, material);
  scene.add(torus);

  const light = new THREE.PointLight(0xffffff, 2, 100);
  light.position.set(10, 10, 10);
  scene.add(light);
}

// ============================================================
// モード別セットアップ
// ============================================================
function switchScene() {
  cleanup();
  if (mode === 1) {
    initTorus();
  } else {
    createCanvas();
  }
  console.log(`🌈 Scene switched to mode ${mode}`);
}

// ============================================================
// 各モード別のデータ構造
// ============================================================

// 🌊 パーリンノイズ粒子群
function noise(x, y, t) {
  return (Math.sin(x * 0.01 + t * 0.005) + Math.sin(y * 0.01 - t * 0.004)) * 0.5;
}
class FlowParticle {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.hue = Math.random() * 360;
  }
  update(t) {
    const n = noise(this.x, this.y, t);
    const a = n * Math.PI * 2;
    this.x += Math.cos(a) * 1.5;
    this.y += Math.sin(a) * 1.5;
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }
  draw(ctx) {
    ctx.fillStyle = `hsla(${this.hue},100%,60%,0.5)`;
    ctx.fillRect(this.x, this.y, 1.5, 1.5);
  }
}
const flowParticles = Array.from({ length: 1000 }, () => new FlowParticle());

// 🌈 マウス波紋
const waves = [];
window.addEventListener("mousemove", (e) => {
  if (mode === 2) {
    waves.push({ x: e.clientX, y: e.clientY, r: 0, hue: Math.random() * 360 });
  }
});

// 🌀 渦
class Vortex {
  constructor(cx, cy, s, hue) {
    this.cx = cx;
    this.cy = cy;
    this.scale = s;
    this.hue = hue;
  }
  draw(ctx, t) {
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.1) {
      const r = this.scale * Math.sin(a * 2 + t * 0.02);
      const x = this.cx + Math.cos(a) * r;
      const y = this.cy + Math.sin(a) * r;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsla(${this.hue + t * 0.2},100%,60%,0.6)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
const vortices = [
  new Vortex(width * 0.3, height * 0.5, 100, 200),
  new Vortex(width * 0.7, height * 0.5, 140, 40),
  new Vortex(width * 0.5, height * 0.5, 180, 320),
];

// ✨ 光の渦
class SpiralParticle {
  constructor(angle, radius) {
    this.angle = angle;
    this.radius = radius;
    this.angleVelocity = 0.002 + Math.random() * 0.004;
    this.hue = Math.random() * 360;
    this.history = [];
  }
  update(time) {
    this.radius += Math.sin(time * 0.001 + this.angle * 3) * 0.2;
    this.angle += this.angleVelocity;
    this.hue += 0.2;
    const x = width / 2 + Math.cos(this.angle) * this.radius;
    const y = height / 2 + Math.sin(this.angle) * this.radius;
    this.history.push({ x, y });
    if (this.history.length > 25) this.history.shift();
  }
  draw(ctx) {
    ctx.beginPath();
    for (let i = 0; i < this.history.length - 1; i++) {
      const p1 = this.history[i];
      const p2 = this.history[i + 1];
      const alpha = i / this.history.length;
      ctx.strokeStyle = `hsla(${this.hue},80%,60%,${alpha})`;
      ctx.lineWidth = 2;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
  }
}
let spiralParticles = Array.from({ length: 300 }, () =>
  new SpiralParticle(Math.random() * Math.PI * 2, 50 + Math.random() * 300)
);

// ============================================================
// メインループ
// ============================================================
function animate() {
  requestAnimationFrame(animate);
  t++;

  if (mode !== 1 && ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 0, width, height);
  }

  switch (mode) {
    case 0:
      flowParticles.forEach((p) => { p.update(t); p.draw(ctx); });
      break;
    case 1:
      if (renderer && torus && scene && camera) {
        torus.rotation.x += 0.01;
        torus.rotation.y += 0.015;
        torus.scale.setScalar(1 + Math.sin(t * 0.05) * 0.2);
        renderer.render(scene, camera);
      }
      break;
    case 2:
      waves.forEach((w) => {
        w.r += 4;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${w.hue},100%,60%,${1 - w.r / 400})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      });
      break;
    case 3:
      vortices.forEach((v) => v.draw(ctx, t));
      break;
    case 4:
      spiralParticles.forEach((p) => { p.update(t); p.draw(ctx); });
      break;
  }
}

// ============================================================
// リソースクリーンアップ
// ============================================================
function cleanup() {
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer = null;
  }
  scene = null;
  camera = null;
  torus = null;
}

// ============================================================
// 初期起動
// ============================================================
createCanvas();
animate();
