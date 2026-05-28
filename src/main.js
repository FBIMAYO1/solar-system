import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLANETS } from './planets.js';
import { showPlanetInfo, setupUI } from './ui.js';
import './style.css';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 30, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 100;

const pointLight = new THREE.PointLight(0xffffff, 2, 200);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const glowGeometry = new THREE.SphereGeometry(5.5, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffaa00,
  transparent: true,
  opacity: 0.3,
});
const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(sunGlow);


const starsGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(3000);
for (let i = 0; i < 3000; i++) {
  starPositions[i] = (Math.random() - 0.5) * 400;
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 });
scene.add(new THREE.Points(starsGeometry, starsMaterial));

function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 28px Microsoft YaHei, sans-serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 40);
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(4, 1, 1);
  return sprite;
}

const planetMeshes = [];


PLANETS.forEach((planetData) => {
  const geometry = new THREE.SphereGeometry(planetData.radius, 24, 24);
  const material = new THREE.MeshPhongMaterial({
    color: planetData.color,
    shininess: 30,
  });
  const mesh = new THREE.Mesh(geometry, material);

  const pivot = new THREE.Group();
  pivot.add(mesh);
  mesh.position.x = planetData.distance;
  scene.add(pivot);

  const orbitCurve = new THREE.EllipseCurve(0, 0, planetData.distance, planetData.distance);
  const orbitPoints = orbitCurve.getPoints(64);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
    orbitPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
  );
  const orbitLine = new THREE.Line(
    orbitGeometry,
    new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.4 })
  );
  scene.add(orbitLine);

  const label = createTextSprite(planetData.name);
  label.position.set(0, planetData.radius + 0.8, 0);
  mesh.add(label);

  planetMeshes.push({ mesh, pivot, data: planetData });
});


const saturnEntry = planetMeshes.find((p) => p.data.name === '土星');
if (saturnEntry) {
  const ringGeo = new THREE.RingGeometry(2.2, 3.2, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xccaa66,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.5;
  saturnEntry.mesh.add(ring);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDownPos.x = event.clientX;
  pointerDownPos.y = event.clientY;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  const dx = event.clientX - pointerDownPos.x;
  const dy = event.clientY - pointerDownPos.y;
  if (Math.sqrt(dx * dx + dy * dy) > 5) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const meshes = planetMeshes.map((p) => p.mesh);
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const hit = planetMeshes.find((p) => p.mesh === intersects[0].object);
    if (hit) showPlanetInfo(hit.data);
  }
});


function animate() {
  requestAnimationFrame(animate);

  planetMeshes.forEach(({ mesh, pivot, data }) => {
    pivot.rotation.y += data.orbitalSpeed * 0.1;
    mesh.rotation.y += data.rotationSpeed;
  });

  const scale = 1 + Math.sin(Date.now() * 0.002) * 0.03;
  sunGlow.scale.set(scale, scale, scale);

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupUI();
