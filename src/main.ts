import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const $ = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let running = false,
  view = "finished",
  explode = 0,
  speed = 0.6,
  filmTime = -1,
  filmPaused = false;
let audio: AudioContext | undefined,
  gain: GainNode | undefined,
  sound = false;
const filmButton = $<HTMLButtonElement>("#film");
const motionButton = $<HTMLButtonElement>("#motion");
const assembly = $<HTMLInputElement>("#assembly");
const speedInput = $<HTMLInputElement>("#speed");
const status = $("#scene-status");
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  sculpture: THREE.Group;
const rings: THREE.Group[] = [];
const surfaces: THREE.MeshStandardMaterial[] = [];
let core: THREE.Mesh;
const timer = new THREE.Timer();
let elapsed = 0;
const captions = [
  "A shared center. Three possibilities.",
  "Independent parts. A deliberate assembly.",
  "One composition. Set in motion.",
];
const story = document.createElement("div");
story.className = "story-caption";
story.innerHTML =
  '<span id="chapter-label">03 / ACTIVATE</span><p id="chapter-caption">One composition. Set in motion.</p><div class="sequence-track"><span id="sequence-progress"></span></div>';
$("#stage").append(story);
const playback = document.createElement("button");
playback.id = "exit-sequence";
playback.textContent = "Exit sequence";
playback.hidden = true;
filmButton.after(playback);
playback.onclick = () => interrupt();
function showChapter(index: number) {
  document
    .querySelectorAll<HTMLButtonElement>("[data-chapter]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(Number(b.dataset.chapter) === index),
      ),
    );
  $("#chapter-label").textContent = [
    "01 / IMAGINE",
    "02 / CONSTRUCT",
    "03 / ACTIVATE",
  ][index];
  $("#chapter-caption").textContent = captions[index];
}
const cameraActions = document.createElement("div");
cameraActions.className = "camera-actions";
cameraActions.setAttribute("aria-label", "Camera controls");
cameraActions.innerHTML =
  '<button data-camera="left" aria-label="Rotate sculpture view left">←</button><button data-camera="right" aria-label="Rotate sculpture view right">→</button><button data-camera="in" aria-label="Zoom in on sculpture">+</button><button data-camera="out" aria-label="Zoom out from sculpture">−</button>';
$(".actions").after(cameraActions);
function adjustCamera(action: string) {
  interrupt();
  const offset = camera.position.clone().sub(controls.target);
  if (action === "left" || action === "right")
    offset.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      action === "left" ? -0.2 : 0.2,
    );
  else
    offset.setLength(
      THREE.MathUtils.clamp(
        offset.length() * (action === "in" ? 0.9 : 1.1),
        5,
        14,
      ),
    );
  camera.position.copy(controls.target).add(offset);
  controls.update();
}
document
  .querySelectorAll<HTMLButtonElement>("[data-camera]")
  .forEach((b) => (b.onclick = () => adjustCamera(b.dataset.camera!)));
// Outputs remain readable without announcing every frame of the sequence.
$("#assembly-value").setAttribute("aria-live", "off");
$("#speed-value").setAttribute("aria-live", "off");

let renderedExplode = 0,
  activePart = -1;
const filmStart = new THREE.Vector3();
const smooth = (x: number) => {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const componentNames = [
  "Outer frame",
  "Intermediate ring",
  "Inner ring",
  "Luminous core",
];
const componentCopy = [
  "The largest ring establishes the silhouette. Its edge markings make rotation easier to read.",
  "A second axis introduces a counter-motion, revealing depth as the rings move past each other.",
  "The smallest ring frames the center. Its independent orientation completes the nested composition.",
  "An emissive center provides a visual anchor. It suggests energy without claiming a physical power source.",
];
let selectedComponent = -1;
const inspect = document.createElement("div");
inspect.className = "component-inspector";
inspect.innerHTML =
  '<div><p class="eyebrow">COMPONENT STUDY</p><h3>Read the mechanism.</h3></div><div class="component-buttons" aria-label="Sculpture components">' +
  componentNames
    .map(
      (name, i) =>
        `<button data-component="${i}" aria-pressed="false">0${i + 1} ${name}</button>`,
    )
    .join("") +
  '</div><p id="component-copy">Choose a component to highlight it in the sculpture. These are artistic construction details, not a physical engineering specification.</p><button id="clear-component">Clear highlight</button>';
$("#controls").append(inspect);
const marker = document.createElement("div");
marker.className = "component-marker";
marker.hidden = true;
$("#stage").append(marker);
document.querySelectorAll<HTMLButtonElement>("[data-component]").forEach(
  (b) =>
    (b.onclick = () => {
      selectedComponent = Number(b.dataset.component);
      document
        .querySelectorAll<HTMLButtonElement>("[data-component]")
        .forEach((other) =>
          other.setAttribute("aria-pressed", String(other === b)),
        );
      $("#component-copy").textContent = componentCopy[selectedComponent];
      marker.textContent = `0${selectedComponent + 1} / ${componentNames[selectedComponent]}`;
      marker.hidden = false;
    }),
);
$("#clear-component").onclick = () => {
  selectedComponent = -1;
  marker.hidden = true;
  document
    .querySelectorAll<HTMLButtonElement>("[data-component]")
    .forEach((b) => b.setAttribute("aria-pressed", "false"));
  $("#component-copy").textContent =
    "Choose a component to highlight it in the sculpture.";
};
function motionLabel() {
  motionButton.textContent = running ? "Pause motion" : "Start motion";
  motionButton.setAttribute("aria-pressed", String(running));
}
function setView(next: string) {
  view = next;
  document
    .querySelectorAll<HTMLButtonElement>("[data-view]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.view === view)),
    );
  if (!scene) return;
  const blueprint = view === "blueprint";
  if (reduced.matches)
    scene.background = new THREE.Color(blueprint ? "#102b3b" : "#111310");
  surfaces.forEach((m) => {
    m.wireframe = view !== "finished";
    m.color.set(blueprint ? "#b8deeb" : "#b7a17d");
    m.metalness = view === "finished" ? 0.85 : 0;
    m.roughness = 0.32;
  });
  status.textContent = `${view[0].toUpperCase() + view.slice(1)} / ${explode > 0.05 ? "exploded" : "assembled"}`;
}
function setAssembly(value: number) {
  explode = value;
  const rounded = String(Math.round(value * 100));
  if (assembly.value !== rounded) assembly.value = rounded;
  const label = `${rounded}%`;
  if ($("#assembly-value").textContent !== label)
    $("#assembly-value").textContent = label;
  const state = `${view[0].toUpperCase() + view.slice(1)} / ${explode > 0.05 ? "exploded" : "assembled"}`;
  if (status.textContent !== state) status.textContent = state;
}
function chapter(index: number) {
  showChapter(index);
  setView(index === 0 ? "blueprint" : index === 1 ? "wireframe" : "finished");
  setAssembly(index === 1 ? 0.8 : 0);
  running = index === 2 && !reduced.matches;
  motionLabel();
}
function stopFilm() {
  filmTime = -1;
  filmPaused = false;
  playback.hidden = true;
  $("#sequence-progress").style.width = "0%";
  filmButton.innerHTML = "Replay the sequence <span>↗</span>";
  if (controls) {
    controls.enabled = true;
    controls.target.set(0, 0, 0);
    controls.update();
  }
}
function interrupt() {
  if (filmTime >= 0) stopFilm();
}
try {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  $("#canvas").append(renderer.domElement);
  renderer.domElement.setAttribute(
    "aria-label",
    "Sculpture view. Left and right arrows rotate; up, down, plus and minus zoom.",
  );
  renderer.domElement.setAttribute("tabindex", "0");
  renderer.domElement.addEventListener("keydown", (e) => {
    const actions: Record<string, string> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "in",
      ArrowDown: "out",
      "+": "in",
      "=": "in",
      "-": "out",
    };
    if (actions[e.key]) {
      e.preventDefault();
      adjustCamera(actions[e.key]);
    }
  });
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#111310");
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(environment, 0.04).texture;
  environment.dispose();
  pmrem.dispose();
  scene.environmentIntensity = 0.65;
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(5, 3.4, 7.5);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced.matches;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 14;
  controls.target.set(0, 0, 0);
  controls.addEventListener("start", interrupt);
  scene.add(new THREE.HemisphereLight("#f8eddb", "#2f3b2b", 0.9));
  const key = new THREE.DirectionalLight("#ffe1ad", 3);
  key.position.set(3, 6, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#c6d8ea", 2.5);
  rim.position.set(-4, 2, -3);
  scene.add(rim);
  const fill = new THREE.PointLight("#e5bf73", 5, 8);
  fill.position.set(0, 0, 1);
  scene.add(fill);
  sculpture = new THREE.Group();
  scene.add(sculpture);
  const metal = () => {
    const m = new THREE.MeshStandardMaterial({
      color: "#b7a17d",
      metalness: 0.85,
      roughness: 0.32,
    });
    surfaces.push(m);
    return m;
  };
  [2.05, 1.57, 1.08].forEach((radius, index) => {
    const ring = new THREE.Group();
    const mat = metal();
    const body = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.065, 12, 144),
      mat,
    );
    ring.add(body);
    const markings = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.04, 0.025, 0.095),
      mat,
      48,
    );
    const stamp = new THREE.Object3D();
    for (let n = 0; n < 48; n++) {
      const a = (n / 48) * Math.PI * 2;
      stamp.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      stamp.rotation.z = a;
      stamp.scale.x = n % 4 === 0 ? 2 : 1;
      stamp.updateMatrix();
      markings.setMatrixAt(n, stamp.matrix);
    }
    ring.add(markings);
    [-1, 1].forEach((sign) => {
      const bearing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.24, 24),
        mat,
      );
      bearing.rotation.z = Math.PI / 2;
      bearing.position.x = sign * radius;
      ring.add(bearing);
    });
    rings.push(ring);
    sculpture.add(ring);
    ring.rotation.set(index * 0.65, index * 0.8, index * 0.3);
  });
  core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.36, 1),
    new THREE.MeshStandardMaterial({
      color: "#ffe7ae",
      emissive: "#e4b75f",
      emissiveIntensity: 0.7,
      metalness: 0.3,
      roughness: 0.25,
    }),
  );
  sculpture.add(core);
  const axle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 1.7, 24),
    metal(),
  );
  sculpture.add(axle);
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.3, 0.18, 64),
    new THREE.MeshStandardMaterial({
      color: "#282c24",
      metalness: 0.65,
      roughness: 0.4,
    }),
  );
  pedestal.position.y = -2.52;
  scene.add(pedestal);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.15, 0.45, 32),
    metal(),
  );
  stem.position.y = -2.2;
  scene.add(stem);
  const resize = () => {
    const rect = $("#canvas").getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    camera.aspect = rect.width / rect.height;
    camera.fov = rect.width < 500 || camera.aspect < 1.2 ? 48 : 36;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe($("#canvas"));
  resize();
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    $("#canvas").hidden = true;
    $("#fallback").hidden = false;
    running = false;
    stopFilm();
    disable3D();
  });
  renderer.setAnimationLoop((timestamp) => {
    timer.update(timestamp);
    const wall = Math.min(timer.getDelta(), 0.25);
    const dt = Math.min(wall, 0.05);
    if (document.hidden) return;
    if (running && filmTime < 0) elapsed += dt * speed;
    if (filmTime >= 0 && !filmPaused) {
      filmTime += wall;
      const part = filmTime < 6 ? 0 : filmTime < 12 ? 1 : 2;
      if (part !== activePart) {
        activePart = part;
        setView(
          part === 0 ? "blueprint" : part === 1 ? "wireframe" : "finished",
        );
        showChapter(part);
      }
      $("#sequence-progress").style.width =
        `${Math.min((filmTime / 18) * 100, 100)}%`;
      setAssembly(
        0.85 * (smooth((filmTime - 4) / 3) - smooth((filmTime - 10) / 4)),
      );
      elapsed += dt * (0.12 + 0.3 * smooth((filmTime - 12) / 5));
      const a = 0.55 + 1.25 * smooth(filmTime / 18);
      const distance = 9.8 - 0.7 * smooth(filmTime / 18);
      camera.position.lerpVectors(
        filmStart,
        new THREE.Vector3(
          Math.sin(a) * distance,
          3.4 - 0.6 * smooth(filmTime / 18),
          Math.cos(a) * distance,
        ),
        smooth(filmTime / 1.5),
      );
      camera.lookAt(0, 0, 0);
      if (filmTime >= 18) {
        stopFilm();
        running = false;
        motionLabel();
      }
    }
    if (!filmPaused || filmTime < 0)
      renderedExplode = reduced.matches
        ? explode
        : THREE.MathUtils.damp(renderedExplode, explode, 5, dt);
    rings.forEach((ring, i) => {
      ring.rotation.set(
        i * 0.65 + elapsed * (i === 1 ? 0.2 : 0.08),
        i * 0.8 + elapsed * (i === 2 ? -0.24 : 0.14),
        i * 0.3 + elapsed * 0.06,
      );
      ring.position.y = (i - 1) * renderedExplode * 1.25;
      ring.position.x = (i - 1) * renderedExplode * 0.4;
      surfaces[i].emissive.set(selectedComponent === i ? "#705228" : "#000000");
      surfaces[i].emissiveIntensity = 0.45;
    });
    core.rotation.y = elapsed * 0.4;
    scene.background = (scene.background as THREE.Color).lerp(
      new THREE.Color(view === "blueprint" ? "#102b3b" : "#111310"),
      reduced.matches ? 1 : 1 - Math.exp(-dt * 4),
    );
    (core.material as THREE.MeshStandardMaterial).emissiveIntensity =
      selectedComponent === 3 ? 1.2 : 0.7;
    if (selectedComponent >= 0) {
      const point = (
        selectedComponent === 3
          ? core.getWorldPosition(new THREE.Vector3())
          : rings[selectedComponent].localToWorld(
              new THREE.Vector3([2.05, 1.57, 1.08][selectedComponent], 0, 0),
            )
      ).project(camera);
      const rect = $("#canvas").getBoundingClientRect();
      marker.style.left = `${THREE.MathUtils.clamp((point.x * 0.5 + 0.5) * rect.width, 80, rect.width - 100)}px`;
      marker.style.top = `${THREE.MathUtils.clamp((-point.y * 0.5 + 0.5) * rect.height, 70, rect.height - 90)}px`;
    }
    if (filmTime < 0) controls.update();
    renderer.render(scene, camera);
  });
} catch {
  $("#canvas").hidden = true;
  $("#fallback").hidden = false;
  disable3D();
}
function disable3D() {
  document
    .querySelectorAll<HTMLButtonElement | HTMLInputElement>(
      ".controls button,.controls input,[data-chapter],#film",
    )
    .forEach((b) => (b.disabled = true));
  if (typeof renderer !== "undefined") renderer.setAnimationLoop(null);
  marker.hidden = true;
  story.hidden = true;
  status.textContent = "Illustrated fallback";
}
document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach(
  (b) =>
    (b.onclick = () => {
      interrupt();
      setView(b.dataset.view!);
    }),
);
document.querySelectorAll<HTMLButtonElement>("[data-chapter]").forEach(
  (b) =>
    (b.onclick = () => {
      interrupt();
      chapter(Number(b.dataset.chapter));
    }),
);
assembly.oninput = () => {
  interrupt();
  setAssembly(Number(assembly.value) / 100);
  setView(view);
};
speedInput.oninput = () => {
  speed = Number(speedInput.value) / 100;
  $("#speed-value").textContent = `${speed.toFixed(1)}×`;
};
motionButton.onclick = () => {
  interrupt();
  running = !running;
  motionLabel();
};
$("#reset").onclick = () => {
  interrupt();
  elapsed = 0;
  setAssembly(0);
  setView("finished");
  running = false;
  motionLabel();
  camera.position.set(5, 3.4, 7.5);
  controls.target.set(0, 0, 0);
  controls.update();
  showChapter(2);
  $("#clear-component").click();
  speed = 0.6;
  speedInput.value = "60";
  $("#speed-value").textContent = "0.6×";
};
filmButton.onclick = () => {
  if (reduced.matches) {
    chapter(0);
    status.textContent = "Reduced motion: use the chapter controls to explore.";
    return;
  }
  if (filmTime >= 0) {
    filmPaused = !filmPaused;
    filmButton.textContent = filmPaused
      ? "Resume sequence ↗"
      : "Pause sequence Ⅱ";
    return;
  }
  filmStart.copy(camera.position);
  playback.hidden = false;
  $("#clear-component").click();
  filmTime = 0;
  elapsed = 0;
  activePart = -1;
  filmPaused = false;
  controls.enabled = false;
  running = false;
  motionLabel();
  filmButton.textContent = "Pause sequence Ⅱ";
};
if (reduced.matches) filmButton.textContent = "Explore the chapters ↗";
reduced.addEventListener("change", () => {
  if (controls) controls.enableDamping = !reduced.matches;
  if (reduced.matches) {
    interrupt();
    running = false;
    motionLabel();
  }
  filmButton.textContent = reduced.matches
    ? "Explore the chapters ↗"
    : "Play the sequence ↗";
});
$("#sound").onclick = async () => {
  try {
    audio ??= new AudioContext();
    await audio.resume();
    if (!gain) {
      gain = audio.createGain();
      gain.gain.value = 0;
      gain.connect(audio.destination);
      [110, 164.81, 220].forEach((freq, i) => {
        const oscillator = audio!.createOscillator();
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        const level = audio!.createGain();
        level.gain.value = 0.025 / (i + 1);
        oscillator.connect(level);
        level.connect(gain!);
        oscillator.start();
      });
    }
    sound = !sound;
    gain.gain.setTargetAtTime(sound ? 1 : 0, audio.currentTime, 0.25);
    $("#sound").textContent = sound ? "Sound on" : "Sound off";
    $("#sound").setAttribute("aria-pressed", String(sound));
  } catch {
    $("#sound").textContent = "Sound unavailable";
  }
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (filmTime >= 0) {
      filmPaused = true;
      filmButton.textContent = "Resume sequence ↗";
    }
    audio?.suspend();
  } else if (sound) audio?.resume();
});
