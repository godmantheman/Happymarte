import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ProductIconKey, resolveProductIconKey } from './Icons3D';
import { isChristmasSeason } from '../utils/seasonTheme';

interface Product3DCanvasProps {
  iconKey?: string;
  name?: string;
  category?: string;
  imageUrl?: string;
  isHovered?: boolean;
  isChristmas?: boolean;
}

interface RegisteredCard {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  modelGroup: THREE.Group;
  rotY: number;
  targetRotX: number;
  currentRotX: number;
  isHovered: boolean;
  isDragging: boolean;
  phaseOffset: number;
}

const RENDER_W = 360;
const RENDER_H = 240;

let sharedRenderer: THREE.WebGLRenderer | null = null;
let sharedEnvMap: THREE.Texture | null = null;
let sharedIsSoftwareGl: boolean | null = null;
let candyStripeTexture: THREE.CanvasTexture | null = null;
const activeCards = new Set<RegisteredCard>();
let animFrameId: number | null = null;
let globalClock: THREE.Clock | null = null;

function detectSoftwareGl(): boolean {
  if (sharedIsSoftwareGl !== null) return sharedIsSoftwareGl;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) {
      sharedIsSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    sharedIsSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return sharedIsSoftwareGl;
  } catch {
    sharedIsSoftwareGl = true;
    return true;
  }
}

function getSharedRenderer(): {
  renderer: THREE.WebGLRenderer;
  envMap: THREE.Texture;
  isSoftwareGl: boolean;
} {
  const isSoftwareGl = detectSoftwareGl();
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    sharedRenderer.setSize(RENDER_W, RENDER_H, false);
    sharedRenderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    sharedRenderer.outputColorSpace = THREE.SRGBColorSpace;
    sharedRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    sharedRenderer.toneMappingExposure = 1.18;

    const pmrem = new THREE.PMREMGenerator(sharedRenderer);
    sharedEnvMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  return { renderer: sharedRenderer, envMap: sharedEnvMap!, isSoftwareGl };
}

function getCandyStripeTexture(): THREE.CanvasTexture {
  if (candyStripeTexture) return candyStripeTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 34;
  for (let i = -256; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  candyStripeTexture = tex;
  return tex;
}

function addPedestal(group: THREE.Group, isChristmas: boolean): THREE.MeshPhysicalMaterial {
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    metalness: 0.88,
    roughness: 0.18,
    clearcoat: 0.75,
  });

  if (isChristmas) {
    // Festive Snow-Capped Crimson & Gold Holiday Plinth
    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0xb91c1c,
      roughness: 0.28,
      metalness: 0.15,
      clearcoat: 0.65,
    });
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.06, 1.16, 0.16, 36),
      baseMat
    );
    plinth.position.y = -0.6;
    group.add(plinth);

    // Snow Top Layer on Pedestal
    const snowCap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.02, 1.05, 0.06, 36),
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.62,
        metalness: 0.05,
      })
    );
    snowCap.position.y = -0.51;
    group.add(snowCap);

    // Metallic Gold Rim Ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.07, 0.036, 16, 48),
      goldMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.52;
    group.add(ring);

    // Mini Holly Berry Accents on front edge
    const berryMat = new THREE.MeshPhysicalMaterial({
      color: 0xef4444,
      roughness: 0.15,
      clearcoat: 0.9,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.55,
    });
    [-0.08, 0.08].forEach((ox) => {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), leafMat);
      leaf.position.set(ox * 1.6, -0.52, 1.09);
      leaf.rotation.z = ox > 0 ? -1.1 : 1.1;
      leaf.rotation.x = 0.25;
      group.add(leaf);
    });
    const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), berryMat);
    b1.position.set(0, -0.5, 1.12);
    group.add(b1);

    return goldMat;
  }

  // Standard Bright White/Cream Toy Platter Base
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.15, 0.14, 36),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 0.8,
    })
  );
  plinth.position.y = -0.58;
  group.add(plinth);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.035, 16, 48),
    goldMat
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.51;
  group.add(ring);

  return goldMat;
}

function build3DModelByKey(key: ProductIconKey, isChristmas: boolean, isSoftwareGl: boolean): THREE.Group {
  const group = new THREE.Group();
  const goldMat = addPedestal(group, isChristmas);

  if (key === 'tree') {
    // 1. Composite 3D Christmas Tree
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
    const redMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      metalness: 0.55,
      roughness: 0.15,
      clearcoat: 0.95,
    });
    const iceMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.5,
      roughness: 0.15,
      clearcoat: 0.95,
    });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.36, 16), trunkMat);
    trunk.position.y = -0.32;
    group.add(trunk);

    const tiers = [
      { y: -0.05, r: 0.68, h: 0.54 },
      { y: 0.25, r: 0.52, h: 0.48 },
      { y: 0.52, r: 0.36, h: 0.42 },
    ];
    tiers.forEach((t, ti) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 20), pineMat);
      cone.position.y = t.y;
      group.add(cone);

      const snow = new THREE.Mesh(new THREE.ConeGeometry(t.r * 0.68, t.h * 0.42, 20), snowMat);
      snow.position.y = t.y + t.h * 0.29;
      group.add(snow);

      const cnt = ti === 2 ? 4 : 6;
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * Math.PI * 2 + ti * 0.6;
        const m = (i + ti) % 3 === 0 ? redMat : (i + ti) % 3 === 1 ? goldMat : iceMat;
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 14), m);
        orb.position.set(Math.cos(a) * t.r * 0.86, t.y - t.h * 0.34, Math.sin(a) * t.r * 0.86);
        group.add(orb);
      }
    });

    // Golden 5-point Star Topper
    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.22 : 0.1;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    starShape.closePath();
    const starGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    starGeo.center();
    const star = new THREE.Mesh(starGeo, goldMat);
    star.position.y = 0.82;
    group.add(star);
  } else if (key === 'snowman') {
    // 2. Composite 3D Snowman
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
    const coalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.72 });
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
    const hatMat = new THREE.MeshPhysicalMaterial({ color: 0x111827, roughness: 0.28, clearcoat: 0.4 });

    const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.46, 28, 28), snowMat);
    bottom.position.y = -0.14;
    group.add(bottom);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 28, 28), snowMat);
    head.position.y = 0.36;
    group.add(head);

    // Crimson Scarf + Draping Tail
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.075, 16, 32), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.13;
    group.add(scarf);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.06), scarfMat);
    tail.position.set(0.2, -0.02, 0.26);
    tail.rotation.z = 0.22;
    group.add(tail);

    // Carrot Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.26, 14), carrotMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.36, 0.38);
    group.add(nose);

    // Coal Eyes & Buttons
    [-0.1, 0.1].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), coalMat);
      eye.position.set(ex, 0.44, 0.28);
      group.add(eye);
    });
    [-0.04, -0.19].forEach((by) => {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), coalMat);
      btn.position.set(0, by, 0.43);
      group.add(btn);
    });

    // Top Hat with Gold Band
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 24), hatMat);
    brim.position.y = 0.62;
    brim.rotation.z = -0.08;
    group.add(brim);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.32, 24), hatMat);
    crown.position.set(0.02, 0.78, 0);
    crown.rotation.z = -0.08;
    group.add(crown);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.248, 0.07, 24), goldMat);
    band.position.set(0.01, 0.67, 0);
    band.rotation.z = -0.08;
    group.add(band);
  } else if (key === 'santa') {
    // 3. Composite 3D Plush Santa Hat
    const velvetMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.72 });
    const furMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.88 });

    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.15, 18, 36), furMat);
    brim.rotation.x = Math.PI / 2;
    brim.position.y = -0.26;
    group.add(brim);

    const lowerCone = new THREE.Mesh(new THREE.ConeGeometry(0.54, 0.75, 28), velvetMat);
    lowerCone.position.set(-0.04, 0.14, 0);
    lowerCone.rotation.z = -0.22;
    group.add(lowerCone);

    const upperTip = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.56, 20), velvetMat);
    upperTip.position.set(0.32, 0.42, 0.02);
    upperTip.rotation.z = -1.25;
    group.add(upperTip);

    const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 20), furMat);
    pompom.position.set(0.58, 0.28, 0.04);
    group.add(pompom);

    const miniBell = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), goldMat);
    miniBell.position.set(0.58, 0.09, 0.06);
    group.add(miniBell);
  } else if (key === 'candycane') {
    // 4. Composite 3D Candy Cane with Procedural Spiral Texture & Holly Bow
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, -0.44, 0),
      new THREE.Vector3(-0.18, 0.22, 0),
      new THREE.Vector3(-0.12, 0.52, 0),
      new THREE.Vector3(0.12, 0.62, 0),
      new THREE.Vector3(0.34, 0.48, 0),
      new THREE.Vector3(0.36, 0.24, 0),
    ]);
    const caneGeo = new THREE.TubeGeometry(curve, 48, 0.12, 20, false);
    const caneMat = new THREE.MeshPhysicalMaterial({
      map: getCandyStripeTexture(),
      roughness: 0.12,
      clearcoat: 1.0,
    });
    const cane = new THREE.Mesh(caneGeo, caneMat);
    group.add(cane);

    // End caps
    const capMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1.0 });
    const cap1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), capMat);
    cap1.position.set(-0.18, -0.44, 0);
    group.add(cap1);
    const cap2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), capMat);
    cap2.position.set(0.36, 0.24, 0);
    group.add(cap2);

    // Green Ribbon Bow on Stem
    const greenRibbon = new THREE.MeshPhysicalMaterial({ color: 0x16a34a, roughness: 0.35, clearcoat: 0.5 });
    const bowL = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 14, 24), greenRibbon);
    bowL.position.set(-0.32, 0.05, 0.1);
    bowL.rotation.y = 0.4;
    group.add(bowL);

    const bowR = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 14, 24), greenRibbon);
    bowR.position.set(-0.04, 0.05, 0.1);
    bowR.rotation.y = -0.4;
    group.add(bowR);

    const centerKnot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), goldMat);
    centerKnot.position.set(-0.18, 0.05, 0.12);
    group.add(centerKnot);
  } else if (key === 'wreath') {
    // 5. Composite 3D Christmas Wreath
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72 });
    const darkPineMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
    const redMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      roughness: 0.22,
      clearcoat: 0.85,
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.17, 18, 36), pineMat);
    ring.position.y = 0.14;
    group.add(ring);

    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.09, 12, 24), darkPineMat);
    innerRing.position.set(0, 0.14, 0.06);
    group.add(innerRing);

    // Red Ribbon Bow at Top
    const bowL = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 14, 24), redMat);
    bowL.position.set(-0.14, 0.64, 0.12);
    bowL.rotation.z = 0.4;
    group.add(bowL);
    const bowR = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 14, 24), redMat);
    bowR.position.set(0.14, 0.64, 0.12);
    bowR.rotation.z = -0.4;
    group.add(bowR);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), redMat);
    knot.position.set(0, 0.62, 0.16);
    group.add(knot);

    // 8 Gold & Red Berries around wreath
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.068, 14, 14),
        i % 2 === 0 ? goldMat : redMat
      );
      b.position.set(Math.cos(a) * 0.5, 0.14 + Math.sin(a) * 0.5, 0.16);
      group.add(b);
    }
  } else if (key === 'bell') {
    // 6. Sculpted Brushed-Gold Christmas Bell (LatheGeometry)
    const points = [
      new THREE.Vector2(0.01, 0.55),
      new THREE.Vector2(0.18, 0.52),
      new THREE.Vector2(0.32, 0.36),
      new THREE.Vector2(0.36, 0.12),
      new THREE.Vector2(0.48, -0.18),
      new THREE.Vector2(0.56, -0.3),
      new THREE.Vector2(0.5, -0.34),
      new THREE.Vector2(0.44, -0.28),
    ];
    const bellGeo = new THREE.LatheGeometry(points, 32);
    const bellMesh = new THREE.Mesh(bellGeo, goldMat);
    bellMesh.position.y = 0.06;
    bellMesh.rotation.z = 0.14;
    group.add(bellMesh);

    const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 18), goldMat);
    clapper.position.set(0.06, -0.26, 0);
    group.add(clapper);

    const redRibbon = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.25, clearcoat: 0.7 });
    const bowL = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 14, 24), redRibbon);
    bowL.position.set(-0.22, 0.62, 0.04);
    bowL.rotation.z = 0.35;
    group.add(bowL);
    const bowR = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 14, 24), redRibbon);
    bowR.position.set(0.08, 0.66, 0.04);
    bowR.rotation.z = -0.35;
    group.add(bowR);
  } else if (key === 'gingerbread') {
    // 7. Composite 3D Gingerbread Cookie
    const doughMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.78 });
    const icingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const redGum = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.15, clearcoat: 0.9 });
    const greenGum = new THREE.MeshPhysicalMaterial({ color: 0x16a34a, roughness: 0.15, clearcoat: 0.9 });

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.15, 24), doughMat);
    head.rotation.x = Math.PI / 2;
    head.position.y = 0.44;
    group.add(head);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.15), doughMat);
    torso.position.y = 0.04;
    group.add(torso);

    // Arms & Legs
    const armGeo = new THREE.CapsuleGeometry(0.1, 0.22, 8, 14);
    const armL = new THREE.Mesh(armGeo, doughMat);
    armL.position.set(-0.34, 0.12, 0);
    armL.rotation.z = 1.2;
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, doughMat);
    armR.position.set(0.34, 0.12, 0);
    armR.rotation.z = -1.2;
    group.add(armR);

    const legGeo = new THREE.CapsuleGeometry(0.1, 0.24, 8, 14);
    const legL = new THREE.Mesh(legGeo, doughMat);
    legL.position.set(-0.15, -0.32, 0);
    legL.rotation.z = 0.15;
    group.add(legL);
    const legR = new THREE.Mesh(legGeo, doughMat);
    legR.position.set(0.15, -0.32, 0);
    legR.rotation.z = -0.15;
    group.add(legR);

    // Icing Eyes & Gumdrop Buttons
    [-0.09, 0.09].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), icingMat);
      eye.position.set(ex, 0.48, 0.085);
      group.add(eye);
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 10, 16, Math.PI), icingMat);
    smile.rotation.z = Math.PI;
    smile.position.set(0, 0.41, 0.085);
    group.add(smile);

    const btn1 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), redGum);
    btn1.position.set(0, 0.14, 0.09);
    group.add(btn1);
    const btn2 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), greenGum);
    btn2.position.set(0, -0.04, 0.09);
    group.add(btn2);
  } else if (key === 'choco') {
    const chocoMat = new THREE.MeshPhysicalMaterial({
      color: 0x451a03,
      roughness: 0.26,
      metalness: 0.05,
      clearcoat: 0.5,
    });
    const marshMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.45,
    });

    const bottomLayer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.72, 0.24, 36),
      chocoMat
    );
    bottomLayer.position.y = -0.32;
    group.add(bottomLayer);

    const midLayer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.73, 0.73, 0.2, 36),
      marshMat
    );
    midLayer.position.y = -0.1;
    group.add(midLayer);

    const topLayer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.76, 0.24, 36),
      chocoMat
    );
    topLayer.position.y = 0.12;
    group.add(topLayer);

    const swirl = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.045, 16, 36),
      goldMat
    );
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = 0.26;
    group.add(swirl);

    const berryMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      roughness: 0.12,
      clearcoat: 1.0,
    });
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), berryMat);
    berry.position.y = 0.36;
    group.add(berry);
  } else if (key === 'jelly') {
    const makeJellyMat = (hex: number) =>
      new THREE.MeshPhysicalMaterial({
        color: hex,
        roughness: 0.12,
        transmission: isSoftwareGl ? 0 : 0.55,
        transparent: isSoftwareGl,
        opacity: isSoftwareGl ? 0.85 : 1,
        thickness: 0.8,
        clearcoat: 1.0,
      });

    const gummyRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.16, 24, 36),
      makeJellyMat(0xfb7185)
    );
    gummyRing1.position.set(-0.22, -0.05, 0.12);
    gummyRing1.rotation.set(0.5, 0.3, 0);
    group.add(gummyRing1);

    const gummyRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.15, 24, 36),
      makeJellyMat(0xfbbf24)
    );
    gummyRing2.position.set(0.32, 0.18, -0.1);
    gummyRing2.rotation.set(-0.4, -0.3, 0.4);
    group.add(gummyRing2);

    const gummySphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 28, 28),
      makeJellyMat(0x34d399)
    );
    gummySphere.position.set(0.15, -0.22, 0.35);
    group.add(gummySphere);
  } else if (key === 'pencil') {
    const rubber = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.28, 0.96),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    rubber.position.set(-0.26, -0.22, 0.08);
    rubber.rotation.y = 0.35;
    group.add(rubber);

    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.31, 0.6),
      new THREE.MeshPhysicalMaterial({
        color: isChristmas ? 0x16a34a : 0x38bdf8,
        roughness: 0.2,
        clearcoat: 0.7,
      })
    );
    sleeve.position.set(-0.3, -0.22, -0.02);
    sleeve.rotation.y = 0.35;
    group.add(sleeve);

    const penGroup = new THREE.Group();
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 1.25, 24),
      new THREE.MeshPhysicalMaterial({
        color: isChristmas ? 0xdc2626 : 0xfb7185,
        roughness: 0.18,
        clearcoat: 0.85,
      })
    );
    penGroup.add(barrel);

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.28, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xfef08a,
        metalness: 0.8,
        roughness: 0.15,
      })
    );
    tip.position.y = -0.76;
    tip.rotation.z = Math.PI;
    penGroup.add(tip);

    penGroup.position.set(0.32, 0.05, 0);
    penGroup.rotation.z = 0.45;
    group.add(penGroup);
  } else if (key === 'star') {
    const starShape = new THREE.Shape();
    const pts = 5;
    const outerR = 0.68;
    const innerR = 0.32;
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const starGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    });
    starGeo.center();

    const starMesh = new THREE.Mesh(starGeo, goldMat);
    starMesh.position.y = 0.08;
    group.add(starMesh);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.035, 16, 48),
      new THREE.MeshPhysicalMaterial({
        color: isChristmas ? 0xef4444 : 0x38bdf8,
        metalness: 0.5,
        roughness: 0.15,
      })
    );
    halo.position.y = 0.08;
    halo.rotation.y = 0.5;
    group.add(halo);
  } else if (key === 'ticket') {
    const shape = new THREE.Shape();
    shape.moveTo(-0.82, -0.44);
    shape.lineTo(0.82, -0.44);
    shape.lineTo(0.82, 0.44);
    shape.lineTo(-0.82, 0.44);
    shape.closePath();

    const ticketGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    ticketGeo.center();

    const ticket = new THREE.Mesh(ticketGeo, goldMat);
    ticket.position.y = 0.06;
    ticket.rotation.z = 0.12;
    group.add(ticket);

    const centerBadge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.16, 28),
      new THREE.MeshStandardMaterial({
        color: isChristmas ? 0xdc2626 : 0x8b5cf6,
        roughness: 0.25,
        metalness: 0.3,
      })
    );
    centerBadge.rotation.x = Math.PI / 2;
    centerBadge.rotation.z = 0.12;
    centerBadge.position.y = 0.06;
    group.add(centerBadge);
  } else if (key === 'music') {
    const bandMat = new THREE.MeshPhysicalMaterial({
      color: isChristmas ? 0xdc2626 : 0x60a5fa,
      roughness: 0.2,
      metalness: 0.3,
      clearcoat: 0.8,
    });
    const cupMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.1,
    });

    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.075, 16, 36, Math.PI),
      bandMat
    );
    headband.position.y = 0.05;
    group.add(headband);

    const leftCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.18, 24),
      cupMat
    );
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(-0.54, -0.02, 0);
    group.add(leftCup);

    const rightCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.18, 24),
      cupMat
    );
    rightCup.rotation.z = Math.PI / 2;
    rightCup.position.set(0.54, -0.02, 0);
    group.add(rightCup);

    const leftGold = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.21, 24),
      goldMat
    );
    leftGold.rotation.z = Math.PI / 2;
    leftGold.position.set(-0.55, -0.02, 0);
    group.add(leftGold);

    const rightGold = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.21, 24),
      goldMat
    );
    rightGold.rotation.z = Math.PI / 2;
    rightGold.position.set(0.55, -0.02, 0);
    group.add(rightGold);
  } else if (key === 'toy') {
    const tealMat = new THREE.MeshPhysicalMaterial({
      color: isChristmas ? 0x16a34a : 0x34d399,
      roughness: 0.2,
      clearcoat: 0.8,
    });
    const redMat = new THREE.MeshPhysicalMaterial({
      color: isChristmas ? 0xdc2626 : 0xfb7185,
      roughness: 0.2,
      clearcoat: 0.8,
    });

    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.34, 0.84), tealMat);
    b1.position.y = -0.26;
    group.add(b1);

    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.34, 0.84), redMat);
    b2.position.y = 0.08;
    b2.rotation.y = 0.25;
    group.add(b2);

    const studGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 20);
    [
      [-0.2, -0.2],
      [0.2, -0.2],
      [-0.2, 0.2],
      [0.2, 0.2],
    ].forEach(([ox, oz]) => {
      const stud = new THREE.Mesh(studGeo, goldMat);
      stud.position.set(ox, 0.3, oz);
      group.add(stud);
    });
  } else {
    // Festive Gift Box
    const boxMat = new THREE.MeshPhysicalMaterial({
      color: isChristmas ? 0xdc2626 : 0xf43f5e,
      roughness: 0.25,
      clearcoat: 0.65,
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.68, 0.82), boxMat);
    box.position.y = -0.1;
    group.add(box);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.16, 0.88), boxMat);
    lid.position.y = 0.26;
    group.add(lid);

    const rib1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.76, 0.16), goldMat);
    rib1.position.y = -0.05;
    group.add(rib1);

    const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.76, 0.9), goldMat);
    rib2.position.y = -0.05;
    group.add(rib2);

    const bow1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.045, 16, 28),
      goldMat
    );
    bow1.position.set(-0.12, 0.42, 0);
    bow1.rotation.z = 0.4;
    group.add(bow1);

    const bow2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.045, 16, 28),
      goldMat
    );
    bow2.position.set(0.12, 0.42, 0);
    bow2.rotation.z = -0.4;
    group.add(bow2);
  }

  return group;
}

function startGlobalLoop() {
  if (animFrameId !== null) return;
  if (!globalClock) globalClock = new THREE.Clock();

  const { renderer, isSoftwareGl } = getSharedRenderer();

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (activeCards.size === 0) {
        if (sync) gl.deleteSync(sync);
        animFrameId = null;
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        animFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        animFrameId = window.setTimeout(cb, 80);
      }
    };
    animFrameId = window.setTimeout(poll, 5);
  }

  const tick = () => {
    if (activeCards.size === 0) {
      animFrameId = null;
      return;
    }

    const delta = Math.min(globalClock!.getDelta(), 0.1);
    const elapsed = globalClock!.getElapsedTime();

    activeCards.forEach((item) => {
      const speed = item.isHovered ? 1.8 : 0.55;
      if (!item.isDragging) {
        item.rotY += delta * speed;
      }
      item.currentRotX = THREE.MathUtils.damp(
        item.currentRotX,
        item.targetRotX,
        8,
        delta
      );

      item.modelGroup.rotation.y = item.rotY;
      item.modelGroup.rotation.x = item.currentRotX;
      item.modelGroup.position.y =
        Math.sin(elapsed * 2.2 + item.phaseOffset) * 0.04;

      renderer.render(item.scene, item.camera);
      item.ctx.clearRect(0, 0, RENDER_W, RENDER_H);
      item.ctx.drawImage(renderer.domElement, 0, 0, RENDER_W, RENDER_H);
    });

    if (isSoftwareGl) afterDraw(tick);
    else animFrameId = requestAnimationFrame(tick);
  };

  if (isSoftwareGl) animFrameId = window.setTimeout(tick, 16);
  else animFrameId = requestAnimationFrame(tick);
}

export const Product3DCanvas: React.FC<Product3DCanvasProps> = ({
  iconKey,
  name,
  category,
  imageUrl,
  isHovered = false,
  isChristmas = isChristmasSeason(),
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<RegisteredCard | null>(null);

  const resolvedKey = resolveProductIconKey(iconKey, name, category);

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.isHovered = isHovered;
      cardRef.current.targetRotX = isHovered ? 0.16 : 0.05;
    }
  }, [isHovered]);

  useEffect(() => {
    if (imageUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { envMap, isSoftwareGl } = getSharedRenderer();

    const scene = new THREE.Scene();
    scene.environment = envMap;

    const camera = new THREE.PerspectiveCamera(36, RENDER_W / RENDER_H, 0.1, 50);
    camera.position.set(0, 0.65, 3.35);
    camera.lookAt(0, -0.08, 0);

    // Warm/Cool Lighting Rig
    const hemi = new THREE.HemisphereLight(
      isChristmas ? 0xe0f2fe : 0xffffff,
      isChristmas ? 0x451a03 : 0xfef3c7,
      isChristmas ? 1.15 : 1.1
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(isChristmas ? 0xfef3c7 : 0xfffbeb, 2.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(isChristmas ? 0x93c5fd : 0x7dd3fc, 1.45);
    rimLight.position.set(-3, 2.4, -3);
    scene.add(rimLight);

    const modelGroup = build3DModelByKey(resolvedKey, isChristmas, isSoftwareGl);
    scene.add(modelGroup);

    const item: RegisteredCard = {
      canvas,
      ctx,
      scene,
      camera,
      modelGroup,
      rotY: Math.random() * Math.PI * 2,
      targetRotX: 0.05,
      currentRotX: 0.05,
      isHovered: false,
      isDragging: false,
      phaseOffset: Math.random() * 6,
    };

    cardRef.current = item;
    activeCards.add(item);
    startGlobalLoop();

    let lastX = 0;
    const onPointerDown = (e: PointerEvent) => {
      item.isDragging = true;
      lastX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!item.isDragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      item.rotY += dx * 0.015;
    };
    const onPointerUp = () => {
      item.isDragging = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      activeCards.delete(item);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      modelGroup.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const m = node as THREE.Mesh;
          m.geometry.dispose();
        }
      });
    };
  }, [resolvedKey, imageUrl, isChristmas]);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || '물품 이미지'}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain p-2 select-none pointer-events-none"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={RENDER_W}
      height={RENDER_H}
      className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
    />
  );
};
