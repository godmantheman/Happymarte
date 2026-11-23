import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createSoftParticleTexture(isSnowflake: boolean): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  if (isSnowflake) {
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(232, 246, 255, 0.9)');
    grad.addColorStop(0.7, 'rgba(186, 230, 253, 0.3)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  } else {
    grad.addColorStop(0, 'rgba(255, 248, 220, 1)');
    grad.addColorStop(0.35, 'rgba(253, 224, 71, 0.65)');
    grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  if (isSnowflake) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(half, half);
      ctx.lineTo(half + Math.cos(a) * 18, half + Math.sin(a) * 18);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAwningTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const stripes = 8;
  const w = canvas.width / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#DC2626' : '#FFFBEB';
    ctx.fillRect(i * w, 0, w, canvas.height);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function groundHeightAt(x: number, z: number): number {
  return (
    Math.sin(x * 0.08) * Math.cos(z * 0.07) * 1.15 +
    Math.sin((x + z) * 0.045) * 0.65 -
    1.8
  );
}

/**
 * Composite multi-part 3D Christmas Tree with snow layers, ornaments, and golden star topper
 */
function buildHeroChristmasTree(
  scale: number,
  mats: {
    trunk: THREE.Material;
    foliage: THREE.Material;
    snow: THREE.Material;
    gold: THREE.Material;
    redBall: THREE.Material;
    iceBall: THREE.Material;
  }
): { group: THREE.Group; star: THREE.Mesh } {
  const group = new THREE.Group();

  // Trunk (pivot at bottom-center)
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.1, 12), mats.trunk);
  trunk.position.y = 0.55;
  group.add(trunk);

  // 4 sculpted evergreen foliage tiers with snow caps
  const tiers = [
    { y: 1.55, r: 1.65, h: 1.65 },
    { y: 2.55, r: 1.32, h: 1.45 },
    { y: 3.45, r: 0.98, h: 1.25 },
    { y: 4.22, r: 0.64, h: 1.05 },
  ];

  tiers.forEach((t, idx) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 16), mats.foliage);
    cone.position.y = t.y;
    group.add(cone);

    // Snow mantle near top of each tier
    const snowCap = new THREE.Mesh(
      new THREE.ConeGeometry(t.r * 0.72, t.h * 0.42, 16),
      mats.snow
    );
    snowCap.position.y = t.y + t.h * 0.3;
    group.add(snowCap);

    // Ornaments around lower rim of tier
    const ballCount = idx === 3 ? 4 : 6;
    for (let b = 0; b < ballCount; b++) {
      const ang = (b / ballCount) * Math.PI * 2 + idx * 0.65;
      const orbMat =
        (b + idx) % 3 === 0 ? mats.redBall : (b + idx) % 3 === 1 ? mats.gold : mats.iceBall;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), orbMat);
      orb.position.set(
        Math.cos(ang) * (t.r * 0.86),
        t.y - t.h * 0.36,
        Math.sin(ang) * (t.r * 0.86)
      );
      group.add(orb);
    }
  });

  // 5-Point Extruded Golden Star Topper
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? 0.42 : 0.19;
    const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const sx = Math.cos(ang) * rad;
    const sy = Math.sin(ang) * rad;
    if (i === 0) starShape.moveTo(sx, sy);
    else starShape.lineTo(sx, sy);
  }
  starShape.closePath();

  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  starGeo.center();
  const star = new THREE.Mesh(starGeo, mats.gold);
  star.position.y = 4.95;
  group.add(star);

  group.scale.setScalar(scale);
  return { group, star };
}

/**
 * Composite 3D Christmas Market Wooden Chalet Booth with snowy roof, awning, glowing window & lantern
 */
function buildMarketChalet(
  mats: {
    wood: THREE.Material;
    darkWood: THREE.Material;
    snow: THREE.Material;
    awning: THREE.Material;
    glowWindow: THREE.Material;
    gold: THREE.Material;
    redBall: THREE.Material;
  }
): THREE.Group {
  const group = new THREE.Group();

  // Base wooden cabin body
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.4), mats.wood);
  body.position.y = 1.1;
  group.add(body);

  // Corner timber posts
  const postGeo = new THREE.BoxGeometry(0.22, 2.3, 0.22);
  [
    [-1.58, -1.18],
    [1.58, -1.18],
    [-1.58, 1.18],
    [1.58, 1.18],
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(postGeo, mats.darkWood);
    post.position.set(px, 1.15, pz);
    group.add(post);
  });

  // Glowing warm counter window
  const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.05, 0.16), mats.glowWindow);
  windowMesh.position.set(0, 1.35, 1.18);
  group.add(windowMesh);

  // Wooden sales counter sill
  const sill = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.45), mats.darkWood);
  sill.position.set(0, 0.78, 1.32);
  group.add(sill);

  // Red & white striped market awning
  const awning = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.9), mats.awning);
  awning.position.set(0, 1.98, 1.45);
  awning.rotation.x = 0.34;
  group.add(awning);

  // Pitched chalet roof (2 angled planes + snow layer)
  const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.16, 3.0), mats.darkWood);
  roofLeft.position.set(-0.92, 2.68, 0);
  roofLeft.rotation.z = 0.56;
  group.add(roofLeft);

  const roofRight = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.16, 3.0), mats.darkWood);
  roofRight.position.set(0.92, 2.68, 0);
  roofRight.rotation.z = -0.56;
  group.add(roofRight);

  const snowLeft = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 3.08), mats.snow);
  snowLeft.position.set(-0.92, 2.8, 0);
  snowLeft.rotation.z = 0.56;
  group.add(snowLeft);

  const snowRight = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 3.08), mats.snow);
  snowRight.position.set(0.92, 2.8, 0);
  snowRight.rotation.z = -0.56;
  group.add(snowRight);

  // Chimney with snow rim
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.95, 0.45), mats.darkWood);
  chimney.position.set(0.85, 3.05, -0.5);
  group.add(chimney);

  // Hanging golden lantern on front corner
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mats.glowWindow);
  lantern.position.set(1.38, 1.78, 1.45);
  group.add(lantern);

  // Mini festive wreath above awning
  const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 10, 20), mats.redBall);
  wreath.position.set(0, 2.45, 1.24);
  group.add(wreath);

  return group;
}

/**
 * Full-screen Three.js 3D Christmas Winter Village & Snowfall Backdrop
 */
export const Christmas3DBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(0x0b1a2b);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(0x0d2136, 0.022);

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      140
    );
    camera.position.set(0, 4.4, 17.5);
    camera.lookAt(0, 1.6, -4);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.95);
    scene.add(hemiLight);

    const moonKey = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    moonKey.position.set(-10, 18, 12);
    scene.add(moonKey);

    const warmVillageLightL = new THREE.PointLight(0xfbbf24, 24, 24, 1.4);
    warmVillageLightL.position.set(-8.5, 3.2, 4.5);
    scene.add(warmVillageLightL);

    const warmVillageLightR = new THREE.PointLight(0xf59e0b, 24, 24, 1.4);
    warmVillageLightR.position.set(8.5, 3.2, 4.5);
    scene.add(warmVillageLightR);

    // Shared PBR Materials
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xeef6ff,
      roughness: 0.72,
      metalness: 0.04,
    });
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.92,
      metalness: 0.02,
    });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x14532d,
      roughness: 0.84,
      metalness: 0.04,
    });
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      metalness: 0.88,
      roughness: 0.2,
      clearcoat: 0.7,
    });
    const redBallMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.28,
      metalness: 0.5,
      roughness: 0.18,
      clearcoat: 0.9,
    });
    const iceBallMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      emissive: 0x0284c7,
      emissiveIntensity: 0.22,
      metalness: 0.4,
      roughness: 0.15,
      clearcoat: 0.9,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x7c4a26,
      roughness: 0.86,
      metalness: 0.04,
    });
    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.9,
      metalness: 0.04,
    });
    const glowWindowMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
      roughness: 0.25,
    });
    const awningTex = createAwningTexture();
    const awningMat = new THREE.MeshStandardMaterial({
      map: awningTex,
      roughness: 0.65,
    });

    // 1. Undulating Snow-Covered Alpine Terrain
    const terrainGeo = new THREE.PlaneGeometry(110, 90, 56, 48);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, groundHeightAt(vx, vz));
    }
    terrainGeo.computeVertexNormals();
    const terrain = new THREE.Mesh(terrainGeo, snowMat);
    scene.add(terrain);

    // 2. Two Hero Decorated 3D Christmas Trees flanking left & right
    const heroMats = {
      trunk: trunkMat,
      foliage: foliageMat,
      snow: snowMat,
      gold: goldMat,
      redBall: redBallMat,
      iceBall: iceBallMat,
    };

    const leftTree = buildHeroChristmasTree(1.28, heroMats);
    leftTree.group.position.set(-10.2, groundHeightAt(-10.2, 2.2) - 0.15, 2.2);
    scene.add(leftTree.group);

    const rightTree = buildHeroChristmasTree(1.32, heroMats);
    rightTree.group.position.set(10.5, groundHeightAt(10.5, 1.8) - 0.15, 1.8);
    scene.add(rightTree.group);

    // 3. Two 3D Christmas Wooden Market Chalets flanking midground
    const chaletMats = {
      wood: woodMat,
      darkWood: darkWoodMat,
      snow: snowMat,
      awning: awningMat,
      glowWindow: glowWindowMat,
      gold: goldMat,
      redBall: redBallMat,
    };

    const leftChalet = buildMarketChalet(chaletMats);
    leftChalet.position.set(-12.5, groundHeightAt(-12.5, -5.8) - 0.25, -5.8);
    leftChalet.rotation.y = 0.52;
    scene.add(leftChalet);

    const rightChalet = buildMarketChalet(chaletMats);
    rightChalet.position.set(12.2, groundHeightAt(12.2, -6.2) - 0.25, -6.2);
    rightChalet.rotation.y = -0.48;
    scene.add(rightChalet);

    // 4. Instanced Evergreen Forest Backdrop (natural perimeter framing the valley)
    const treePositions: [number, number, number][] = [];
    for (let i = 0; i < 42; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const spreadX =
        i < 24
          ? side * (11 + Math.random() * 24)
          : (Math.random() - 0.5) * 56;
      const spreadZ = i < 24 ? -2 - Math.random() * 28 : -16 - Math.random() * 24;
      const sc = 0.72 + Math.random() * 0.75;
      treePositions.push([spreadX, spreadZ, sc]);
    }

    const instTrunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 1.0, 8);
    const instCone1Geo = new THREE.ConeGeometry(1.25, 2.2, 10);
    const instCone2Geo = new THREE.ConeGeometry(0.85, 1.8, 10);

    const instTrunks = new THREE.InstancedMesh(instTrunkGeo, trunkMat, treePositions.length);
    const instCones1 = new THREE.InstancedMesh(instCone1Geo, foliageMat, treePositions.length);
    const instCones2 = new THREE.InstancedMesh(instCone2Geo, foliageMat, treePositions.length);

    const dummy = new THREE.Object3D();
    const tintColor = new THREE.Color();

    treePositions.forEach(([tx, tz, sc], idx) => {
      const ty = groundHeightAt(tx, tz) - 0.15;

      dummy.position.set(tx, ty + 0.5 * sc, tz);
      dummy.scale.setScalar(sc);
      dummy.rotation.y = idx * 0.9;
      dummy.updateMatrix();
      instTrunks.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(tx, ty + 1.85 * sc, tz);
      dummy.updateMatrix();
      instCones1.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(tx, ty + 3.05 * sc, tz);
      dummy.updateMatrix();
      instCones2.setMatrixAt(idx, dummy.matrix);

      tintColor.setHSL(0.39 + (Math.random() - 0.5) * 0.04, 0.58, 0.18 + Math.random() * 0.08);
      instCones1.setColorAt(idx, tintColor);
      instCones2.setColorAt(idx, tintColor);
    });

    instTrunks.computeBoundingSphere();
    instCones1.computeBoundingSphere();
    instCones2.computeBoundingSphere();
    scene.add(instTrunks, instCones1, instCones2);

    // 5. Starry Twilight Sky Dome
    const starTex = createSoftParticleTexture(false);
    const starCount = 180;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 90;
      starPos[i * 3 + 1] = 8 + Math.random() * 28;
      starPos[i * 3 + 2] = -25 - Math.random() * 35;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      map: starTex,
      size: 0.85,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 6. 3D Falling Snowflakes Particle Field
    const snowTex = createSoftParticleTexture(true);
    const snowCount = 520;
    const snowPositions = new Float32Array(snowCount * 3);
    const snowSpeeds = new Float32Array(snowCount);
    const snowPhases = new Float32Array(snowCount);

    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 44;
      snowPositions[i * 3 + 1] = Math.random() * 22 - 2;
      snowPositions[i * 3 + 2] = Math.random() * 28 - 14;
      snowSpeeds[i] = 0.75 + Math.random() * 1.15;
      snowPhases[i] = Math.random() * Math.PI * 2;
    }

    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snowPointsMat = new THREE.PointsMaterial({
      map: snowTex,
      size: 0.48,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const snowPoints = new THREE.Points(snowGeo, snowPointsMat);
    scene.add(snowPoints);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Smooth pointer parallax tracking (no GC in render loop)
    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    let contextLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      if (contextLost) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Gentle falling snowflakes with winter breeze sway
        const pos = snowGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < snowCount; i++) {
          let sy = pos.getY(i) - snowSpeeds[i] * delta;
          let sx = pos.getX(i) + Math.sin(elapsed * 0.9 + snowPhases[i]) * 0.35 * delta;
          if (sy < -2.5) {
            sy = 20;
            sx = (Math.random() - 0.5) * 44;
          }
          pos.setXY(i, sx, sy);
        }
        pos.needsUpdate = true;

        // Rotating glowing star toppers
        leftTree.star.rotation.y = elapsed * 0.7;
        rightTree.star.rotation.y = -elapsed * 0.65;

        // Warm village lantern gentle shimmer
        warmVillageLightL.intensity = 22 + Math.sin(elapsed * 2.1) * 3;
        warmVillageLightR.intensity = 22 + Math.cos(elapsed * 1.9) * 3;
      }

      // Smooth damped camera parallax
      camera.position.x = THREE.MathUtils.damp(camera.position.x, pointerX * 1.1, 3.2, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, 4.4 - pointerY * 0.45, 3.2, delta);
      camera.lookAt(0, 1.6, -4);

      renderer.render(scene, camera);

      if (prefersReducedMotion) return;
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material.dispose();
          }
        }
      });
      starGeo.dispose();
      starMat.dispose();
      starTex.dispose();
      snowGeo.dispose();
      snowPointsMat.dispose();
      snowTex.dispose();
      awningTex.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-b from-[#091625] via-[#0F2438] to-[#15313E]"
    />
  );
};
