import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MarketplaceListingDto } from '@ticketshield/types';
import {
  createLeftScreenTexture,
  createRightScreenTexture,
  createTicket1Texture,
  createTicket2Texture,
  createTicket3Texture,
} from './textures';
import { soundFX } from './audio';

export interface ConsoleViewer3DProps {
  listing?: MarketplaceListingDto;
  bundleListings?: MarketplaceListingDto[];
  onTicketClick?: () => void;
  onDispenseStateChange?: (dispensed: boolean) => void;
  isDispensed?: boolean;
}

// Helper to create rounded rectangular extruded geometry
function createRoundedBox(
  w: number,
  h: number,
  d: number,
  r: number,
  bevel = 0.04
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  shape.moveTo(-hw, -hh - r);
  shape.lineTo(hw, -hh - r);
  shape.absarc(hw, -hh, r, -Math.PI / 2, 0, false);
  shape.lineTo(hw + r, hh);
  shape.absarc(hw, hh, r, 0, Math.PI / 2, false);
  shape.lineTo(-hw, hh + r);
  shape.absarc(-hw, hh, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-hw - r, -hh);
  shape.absarc(-hw, -hh, r, Math.PI, Math.PI * 1.5, false);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
  });
  geom.center();
  return geom;
}

// Helper to create a true rounded 2D screen plane with custom UV mapping
function createRoundedPlaneGeometry(w: number, h: number, r: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  shape.moveTo(-hw, -hh - r);
  shape.lineTo(hw, -hh - r);
  shape.absarc(hw, -hh, r, -Math.PI / 2, 0, false);
  shape.lineTo(hw + r, hh);
  shape.absarc(hw, hh, r, 0, Math.PI / 2, false);
  shape.lineTo(-hw, hh + r);
  shape.absarc(-hw, hh, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-hw - r, -hh);
  shape.absarc(-hw, -hh, r, Math.PI, Math.PI * 1.5, false);

  const geom = new THREE.ShapeGeometry(shape, 32);
  const pos = geom.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uvs[i * 2] = (x + w / 2) / w;
    uvs[i * 2 + 1] = (y + h / 2) / h;
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geom;
}

export const ConsoleViewer3D: React.FC<ConsoleViewer3DProps> = ({
  listing,
  bundleListings = [],
  onTicketClick,
  onDispenseStateChange,
  isDispensed = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [btnOverlayRect, setBtnOverlayRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const rightScreenTexRef = useRef<{
    setPressed: (p: boolean) => void;
    isButtonUV: (uv: THREE.Vector2) => boolean;
  } | null>(null);

  // Dispense & rotation interpolation refs
  const dispenseProgress = useRef(0);
  const targetDispense = useRef(isDispensed ? 1 : 0);
  const targetRotY = useRef(0);
  const targetRotZ = useRef(0);
  const targetRotX = useRef(0);

  // Update target when prop changes
  useEffect(() => {
    targetDispense.current = isDispensed ? 1 : 0;
  }, [isDispensed]);

  // Handle Dispense / Retract Toggle
  const triggerDispense = useCallback(() => {
    const nextState = targetDispense.current === 0;
    targetDispense.current = nextState ? 1 : 0;

    if (onDispenseStateChange) {
      onDispenseStateChange(nextState);
    }
  }, [onDispenseStateChange]);

  // Direct Click on the In-Screen "XEM & MUA →" Button
  const handleCtaButtonClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    rightScreenTexRef.current?.setPressed(true);
    setTimeout(() => {
      rightScreenTexRef.current?.setPressed(false);
    }, 180);

    // Eject tickets if retracted
    if (targetDispense.current === 0) {
      triggerDispense();
    }

    // Open ticket details modal
    if (onTicketClick) {
      onTicketClick();
    }
  };

  // Hover handlers on Cabinet container:
  // 1. Pulls tickets out smoothly on hover
  // 2. Subtly rotates/tilts the cabinet in 3D
  const handleMouseEnter = () => {
    targetDispense.current = 1;
    targetRotY.current = 0.020; // Hơi xoay nhẹ ~1.1 độ
    targetRotZ.current = -0.008; // Hơi nghiêng nhẹ ~0.4 độ
    targetRotX.current = 0.008; // Hơi ngửa nhẹ
    if (onDispenseStateChange) onDispenseStateChange(true);
  };

  const handleMouseLeave = () => {
    targetDispense.current = 0;
    targetRotY.current = 0;
    targetRotZ.current = 0;
    targetRotX.current = 0;
    if (onDispenseStateChange) onDispenseStateChange(false);
  };

  // Calculate pixel bounds of the in-screen CTA button for HTML overlay
  const updateOverlayButtonPosition = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    if (w === 0 || h === 0) return;

    const scale = h / 2.62;
    const cx = w / 2 + 1.03 * scale;
    const cy = h / 2 - -0.394 * scale;
    const bw = 1.10 * scale;
    const bh = 0.32 * scale;

    setBtnOverlayRect({
      left: Math.round(cx - bw / 2),
      top: Math.round(cy - bh / 2),
      width: Math.round(bw),
      height: Math.round(bh),
    });
  }, []);

  // Main Three.js Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 250;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Orthographic Camera with Cabinet 30° Projection (vH = 2.62 for calibrated 200px cell)
    const aspect = width / height;
    const viewHeight = 2.62;
    const viewWidth = viewHeight * aspect;
    const orthoCamera = new THREE.OrthographicCamera(
      -viewWidth / 2,
      viewWidth / 2,
      viewHeight / 2,
      -viewHeight / 2,
      0.1,
      100
    );
    orthoCamera.position.set(0, 0, 10);
    orthoCamera.lookAt(0, 0, 0);
    orthoCameraRef.current = orthoCamera;

    // 3. Renderer with high brightness & tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
    keyLight.position.set(4.0, 7.5, 7.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    scene.add(keyLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 3.0);
    topLight.position.set(0.0, 8.5, 1.8);
    scene.add(topLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 2.0);
    fillLight.position.set(-6.0, 3.5, 4.0);
    scene.add(fillLight);

    const warmSlot = new THREE.DirectionalLight(0xffedd5, 2.4);
    warmSlot.position.set(6.0, 0.5, 3.5);
    scene.add(warmSlot);

    // Root Group
    const rootGroup = new THREE.Group();
    rootGroup.position.set(-0.15, 0, 0);
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    // ---------------------------------------------------------
    // 5. CHASSIS ARCHITECTURE
    // ---------------------------------------------------------
    const chassisGeom = createRoundedBox(4.30, 2.02, 0.82, 0.22, 0.035);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1a212d, // Satin Dark Obsidian
      roughness: 0.38,
      metalness: 0.65,
    });
    const chassis = new THREE.Mesh(chassisGeom, chassisMat);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    rootGroup.add(chassis);

    // Continuous glowing neon LED rim - TicketShield Orange
    const rimShape = new THREE.Shape();
    const rimW = 4.18 / 2 - 0.20;
    const rimH = 1.90 / 2 - 0.20;
    const rimR = 0.20;
    rimShape.moveTo(-rimW, -rimH - rimR);
    rimShape.lineTo(rimW, -rimH - rimR);
    rimShape.absarc(rimW, -rimH, rimR, -Math.PI / 2, 0, false);
    rimShape.lineTo(rimW + rimR, rimH);
    rimShape.absarc(rimW, rimH, rimR, 0, Math.PI / 2, false);
    rimShape.lineTo(-rimW, rimH + rimR);
    rimShape.absarc(-rimW, rimH, rimR, Math.PI / 2, Math.PI, false);
    rimShape.lineTo(-rimW - rimR, -rimH);
    rimShape.absarc(-rimW, -rimH, rimR, Math.PI, Math.PI * 1.5, false);

    const rimPoints = rimShape.getPoints(80);
    const rimCurve = new THREE.CatmullRomCurve3(
      rimPoints.map((p) => new THREE.Vector3(p.x, p.y, 0)),
      true
    );
    const rimTubeGeom = new THREE.TubeGeometry(rimCurve, 80, 0.016, 8, true);
    const rimTubeMat = new THREE.MeshBasicMaterial({ color: 0xff5a36 });
    const frontGlowTube = new THREE.Mesh(rimTubeGeom, rimTubeMat);
    frontGlowTube.position.set(0, 0, 0.45);
    rootGroup.add(frontGlowTube);

    // ---------------------------------------------------------
    // 6. TWO LARGE RECESSED AMOLED SCREENS
    // ---------------------------------------------------------
    const screenBezelMat = new THREE.MeshStandardMaterial({
      color: 0x07090e,
      roughness: 0.85,
      metalness: 0.25,
    });

    const leftPocketGeom = createRoundedBox(2.36, 1.72, 0.03, 0.14, 0.012);
    const leftPocket = new THREE.Mesh(leftPocketGeom, screenBezelMat);
    leftPocket.position.set(-0.80, 0, 0.43);
    rootGroup.add(leftPocket);

    const rightPocketGeom = createRoundedBox(1.30, 1.72, 0.03, 0.14, 0.012);
    const rightPocket = new THREE.Mesh(rightPocketGeom, screenBezelMat);
    rightPocket.position.set(1.18, 0, 0.43);
    rootGroup.add(rightPocket);

    const dividerMat = new THREE.MeshStandardMaterial({
      color: 0x333b49,
      roughness: 0.35,
      metalness: 0.85,
    });
    const pillarGeom = createRoundedBox(0.08, 1.74, 0.04, 0.02, 0.01);
    const pillar = new THREE.Mesh(pillarGeom, dividerMat);
    pillar.position.set(0.45, 0, 0.45);
    rootGroup.add(pillar);

    // Dynamic Bundle info calculation
    const effectiveListings = bundleListings.length > 0 ? bundleListings : (listing ? [listing] : []);
    const count = listing?.bundleTotalTickets || (effectiveListings.length > 1 ? effectiveListings.length : 3);
    const totalResalePrice = effectiveListings.length > 1
      ? effectiveListings.reduce((sum, item) => sum + (item.resalePrice || 0), 0)
      : (listing?.bundleTotalTickets && listing.bundleTotalTickets >= 2
        ? listing.resalePrice * listing.bundleTotalTickets
        : listing?.resalePrice || 150000);

    // Left Screen
    const { texture: leftTex, update: updateLeftScreen } = createLeftScreenTexture(listing, count);
    const leftScreenMat = new THREE.MeshBasicMaterial({
      map: leftTex,
      transparent: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const leftScreenGeom = createRoundedPlaneGeometry(2.32, 1.68, 0.12);
    const leftScreenMesh = new THREE.Mesh(leftScreenGeom, leftScreenMat);
    leftScreenMesh.position.set(-0.80, 0, 0.47);
    rootGroup.add(leftScreenMesh);

    // Right Screen
    const rightTexObj = createRightScreenTexture(listing, totalResalePrice);
    rightScreenTexRef.current = rightTexObj;

    const rightScreenMat = new THREE.MeshBasicMaterial({
      map: rightTexObj.texture,
      transparent: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const rightScreenGeom = createRoundedPlaneGeometry(1.26, 1.68, 0.12);
    const rightScreenMesh = new THREE.Mesh(rightScreenGeom, rightScreenMat);
    rightScreenMesh.position.set(1.18, 0, 0.47);
    rootGroup.add(rightScreenMesh);

    // ---------------------------------------------------------
    // 7. MECHANICAL RIGHT SLOT & TICKETS
    // ---------------------------------------------------------
    const slotCavityGeom = new THREE.BoxGeometry(1.10, 1.36, 0.45);
    const slotCavityMat = new THREE.MeshBasicMaterial({ color: 0x020306 });
    const slotCavity = new THREE.Mesh(slotCavityGeom, slotCavityMat);
    slotCavity.position.set(1.50, 0, 0.0);
    rootGroup.add(slotCavity);

    const slotBezelGeom = createRoundedBox(0.04, 1.42, 0.48, 0.04, 0.01);
    const slotBezel = new THREE.Mesh(slotBezelGeom, dividerMat);
    slotBezel.position.set(2.10, 0, 0.0);
    rootGroup.add(slotBezel);

    const lipGeom = new THREE.BoxGeometry(0.05, 1.38, 0.12);
    const lipMesh = new THREE.Mesh(lipGeom, chassisMat);
    lipMesh.position.set(2.105, 0, 0.14);
    rootGroup.add(lipMesh);

    // Compact ticket geometry to save grid space
    const ticketGeom = new THREE.PlaneGeometry(0.88, 1.22);

    const t1Item = effectiveListings[0];
    const t2Item = effectiveListings[1] || effectiveListings[0];
    const t3Item = effectiveListings[2] || effectiveListings[0];

    const ticketTex1 = createTicket1Texture(listing, t1Item);
    const ticketTex2 = createTicket2Texture(listing, t2Item);
    const ticketTex3 = createTicket3Texture(listing, t3Item);

    const ticketMat1 = new THREE.MeshStandardMaterial({
      map: ticketTex1,
      roughness: 0.28,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });
    const ticketMat2 = new THREE.MeshStandardMaterial({
      map: ticketTex2,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const ticketMat3 = new THREE.MeshStandardMaterial({
      map: ticketTex3,
      roughness: 0.45,
      metalness: 0.25,
      side: THREE.DoubleSide,
    });

    const ticketsGroup = new THREE.Group();
    rootGroup.add(ticketsGroup);

    const idleTicketX1 = 1.76;
    const idleTicketX2 = 1.83;
    const idleTicketX3 = 1.90;

    const t3 = new THREE.Mesh(ticketGeom, ticketMat3);
    t3.position.set(idleTicketX3, -0.01, -0.10);
    t3.castShadow = true;
    ticketsGroup.add(t3);

    const t2 = new THREE.Mesh(ticketGeom, ticketMat2);
    t2.position.set(idleTicketX2, 0.0, 0.0);
    t2.castShadow = true;
    ticketsGroup.add(t2);

    const t1 = new THREE.Mesh(ticketGeom, ticketMat1);
    t1.position.set(idleTicketX1, 0.01, 0.10);
    t1.castShadow = true;
    ticketsGroup.add(t1);

    // ---------------------------------------------------------
    // 8. CABINET 30° PROJECTION MATRIX
    // ---------------------------------------------------------
    const updateCabinetProjection = (w: number, h: number) => {
      const asp = w / h;
      const vH = 2.62;
      const vW = vH * asp;

      orthoCamera.left = -vW / 2;
      orthoCamera.right = vW / 2;
      orthoCamera.top = vH / 2;
      orthoCamera.bottom = -vH / 2;
      orthoCamera.near = 0.1;
      orthoCamera.far = 100;
      orthoCamera.updateProjectionMatrix();

      const angleRad = (30 * Math.PI) / 180;
      const depthScale = 0.38;

      const sx = -depthScale * Math.cos(angleRad);
      const sy = -depthScale * Math.sin(angleRad);

      const m = orthoCamera.projectionMatrix.elements;
      const e0 = m[0];
      const e5 = m[5];
      const zTarget = -orthoCamera.position.z;

      m[8] = e0 * sx;
      m[12] = -e0 * sx * zTarget;
      m[9] = e5 * sy;
      m[13] = -e5 * sy * zTarget;

      orthoCamera.projectionMatrixInverse.copy(orthoCamera.projectionMatrix).invert();
    };

    updateCabinetProjection(width, height);
    updateOverlayButtonPosition();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          renderer.setSize(newW, newH);
          updateCabinetProjection(newW, newH);
          updateOverlayButtonPosition();
        }
      }
    });
    resizeObserver.observe(container);

    // ---------------------------------------------------------
    // 9. ANIMATION LOOP
    // ---------------------------------------------------------
    const clock = new THREE.Clock();
    let animId: number;
    let frame = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth dispense slide animation
      dispenseProgress.current +=
        (targetDispense.current - dispenseProgress.current) * 0.12;
      const p = dispenseProgress.current;

      // Sliding positions (thu nhỏ tối đa cự ly trượt theo yêu cầu)
      t1.position.x = idleTicketX1 + p * 0.10;
      t2.position.x = idleTicketX2 + p * 0.16;
      t3.position.x = idleTicketX3 + p * 0.22;

      // Subtle fanning tilt of tickets when pulled out
      t1.rotation.z = p * -0.008;
      t2.rotation.z = p * 0.012;
      t3.rotation.z = p * 0.020;

      // Subtle 3D tilt of the entire cabinet on hover
      rootGroup.rotation.y += (targetRotY.current - rootGroup.rotation.y) * 0.08;
      rootGroup.rotation.z += (targetRotZ.current - rootGroup.rotation.z) * 0.08;
      rootGroup.rotation.x += (targetRotX.current - rootGroup.rotation.x) * 0.08;

      // Update screen telemetry
      frame++;
      if (frame % 8 === 0) {
        updateLeftScreen(elapsedTime);
      }

      renderer.render(scene, orthoCamera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [listing, bundleListings, updateOverlayButtonPosition]);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center select-none overflow-hidden cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onTicketClick?.()}
    >
      {/* 3D Canvas Mount */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 100% FLUSH TOUCHSCREEN CLICK TRIGGER (TRANSPARENT OVERLAY ON THE SCREEN) */}
      {btnOverlayRect && (
        <button
          onClick={handleCtaButtonClick}
          className="absolute z-30 bg-transparent border-0 outline-none cursor-pointer select-none rounded-xl transition-colors hover:bg-white/[0.04] active:bg-white/[0.08]"
          style={{
            left: `${btnOverlayRect.left}px`,
            top: `${btnOverlayRect.top}px`,
            width: `${btnOverlayRect.width}px`,
            height: `${btnOverlayRect.height}px`,
          }}
          title="Chạm nút cảm ứng: Xem & Mua Vé"
          aria-label="XEM & MUA →"
        />
      )}
    </div>
  );
};
