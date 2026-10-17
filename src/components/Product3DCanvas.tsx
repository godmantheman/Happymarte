import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ProductIconKey, resolveProductIconKey } from './Icons3D';

interface Product3DCanvasProps {
  iconKey?: string;
  name?: string;
  category?: string;
  imageUrl?: string;
  isHovered?: boolean;
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
const activeCards = new Set<RegisteredCard>();
let animFrameId: number | null = null;
let globalClock: THREE.Clock | null = null;

function getSharedRenderer(): {
  renderer: THREE.WebGLRenderer;
  envMap: THREE.Texture;
} {
  if (!sharedRenderer) {
    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    sharedRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    sharedRenderer.setSize(RENDER_W, RENDER_H, false);
    sharedRenderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    sharedRenderer.outputColorSpace = THREE.SRGBColorSpace;
    sharedRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    sharedRenderer.toneMappingExposure = 1.2;

    const pmrem = new THREE.PMREMGenerator(sharedRenderer);
    sharedEnvMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  return { renderer: sharedRenderer, envMap: sharedEnvMap! };
}

function addBrightPedestal(group: THREE.Group): THREE.MeshPhysicalMaterial {
  // Bright White/Cream Toy Platter Base
  const plinthGeo = new THREE.CylinderGeometry(1.06, 1.15, 0.14, 36);
  const plinthMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 0.8,
  });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.y = -0.58;
  group.add(plinth);

  const ringGeo = new THREE.TorusGeometry(1.08, 0.035, 16, 48);
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 0.7,
  });
  const ring = new THREE.Mesh(ringGeo, goldMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.51;
  group.add(ring);

  return goldMat;
}

/**
 * Build a 3D Beveled Showcase Frame with custom uploaded image texture
 */
function buildCustomImage3DModel(imageUrl: string): {
  group: THREE.Group;
  disposeTex: () => void;
} {
  const group = new THREE.Group();
  const goldMat = addBrightPedestal(group);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous');
  const tex = textureLoader.load(imageUrl);
  tex.colorSpace = THREE.SRGBColorSpace;

  // 3D Rounded Showcase Box Frame
  const frameGeo = new THREE.BoxGeometry(1.32, 1.12, 0.18);
  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    metalness: 0.65,
    roughness: 0.22,
    clearcoat: 0.8,
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.y = 0.06;
  group.add(frameMesh);

  // Front & Back Image Planes
  const picGeo = new THREE.PlaneGeometry(1.18, 0.98);
  const picMat = new THREE.MeshBasicMaterial({
    map: tex,
  });

  const frontPic = new THREE.Mesh(picGeo, picMat);
  frontPic.position.set(0, 0.06, 0.095);
  group.add(frontPic);

  const backPic = new THREE.Mesh(picGeo, picMat);
  backPic.position.set(0, 0.06, -0.095);
  backPic.rotation.y = Math.PI;
  group.add(backPic);

  // Top Crown Star Accent
  const topGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), goldMat);
  topGem.position.set(0, 0.74, 0);
  group.add(topGem);

  return {
    group,
    disposeTex: () => {
      tex.dispose();
      picMat.dispose();
    },
  };
}

function build3DModelByKey(key: ProductIconKey): THREE.Group {
  const group = new THREE.Group();
  const goldMat = addBrightPedestal(group);

  if (key === 'choco') {
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
    const pinkMat = new THREE.MeshPhysicalMaterial({
      color: 0xfb7185,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 0.8,
      clearcoat: 1.0,
    });
    const amberMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 0.8,
      clearcoat: 1.0,
    });
    const emeraldMat = new THREE.MeshPhysicalMaterial({
      color: 0x34d399,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 0.8,
      clearcoat: 1.0,
    });

    const gummyRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.16, 24, 36),
      pinkMat
    );
    gummyRing1.position.set(-0.22, -0.05, 0.12);
    gummyRing1.rotation.set(0.5, 0.3, 0);
    group.add(gummyRing1);

    const gummyRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.15, 24, 36),
      amberMat
    );
    gummyRing2.position.set(0.32, 0.18, -0.1);
    gummyRing2.rotation.set(-0.4, -0.3, 0.4);
    group.add(gummyRing2);

    const gummySphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 28, 28),
      emeraldMat
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
        color: 0x38bdf8,
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
        color: 0xfb7185,
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
        color: 0x38bdf8,
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
        color: 0x8b5cf6,
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
      color: 0x60a5fa,
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
      color: 0x34d399,
      roughness: 0.2,
      clearcoat: 0.8,
    });
    const redMat = new THREE.MeshPhysicalMaterial({
      color: 0xfb7185,
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
    const boxMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      roughness: 0.25,
      clearcoat: 0.6,
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

  const tick = () => {
    if (activeCards.size === 0) {
      animFrameId = null;
      return;
    }
    animFrameId = requestAnimationFrame(tick);

    const delta = Math.min(globalClock!.getDelta(), 0.1);
    const elapsed = globalClock!.getElapsedTime();
    const { renderer } = getSharedRenderer();

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
  };

  animFrameId = requestAnimationFrame(tick);
}

export const Product3DCanvas: React.FC<Product3DCanvasProps> = ({
  iconKey,
  name,
  category,
  imageUrl,
  isHovered = false,
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { envMap } = getSharedRenderer();

    const scene = new THREE.Scene();
    scene.environment = envMap;

    const camera = new THREE.PerspectiveCamera(36, RENDER_W / RENDER_H, 0.1, 50);
    camera.position.set(0, 0.65, 3.35);
    camera.lookAt(0, -0.08, 0);

    // Bright Cheerful Classroom Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0xfef3c7, 1.1);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.3);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    let modelGroup: THREE.Group;
    let disposeCustomTex: (() => void) | null = null;

    if (imageUrl) {
      const built = buildCustomImage3DModel(imageUrl);
      modelGroup = built.group;
      disposeCustomTex = built.disposeTex;
    } else {
      modelGroup = build3DModelByKey(resolvedKey);
    }
    scene.add(modelGroup);

    const item: RegisteredCard = {
      canvas,
      ctx,
      scene,
      camera,
      modelGroup,
      rotY: imageUrl ? 0 : Math.random() * Math.PI * 2,
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
      disposeCustomTex?.();
      modelGroup.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const m = node as THREE.Mesh;
          m.geometry.dispose();
        }
      });
    };
  }, [resolvedKey, imageUrl]);

  return (
    <canvas
      ref={canvasRef}
      width={RENDER_W}
      height={RENDER_H}
      className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
    />
  );
};
