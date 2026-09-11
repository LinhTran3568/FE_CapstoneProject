import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import * as THREE from 'three';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import './TicketMachineSection.css';

interface TicketTheme {
  name: string;
  code: string;
  event: string;
  gradStart: string;
  gradMid: string;
  gradEnd: string;
  textColor: string;
  badge: string;
}

const ticketThemes: TicketTheme[] = [
  {
    name: 'CYBER CYAN',
    code: 'TS-8801',
    event: 'ANH TRAI SAY HI 2025',
    gradStart: '#00f5ff',
    gradMid: '#38bdf8',
    gradEnd: '#0284c7',
    textColor: '#031726',
    badge: 'VIP ACCESS'
  },
  {
    name: 'SUNSET AMBER',
    code: 'TS-4920',
    event: 'VƯỢT NGÀN CHÔNG GAI LIVE',
    gradStart: '#ff4b72',
    gradMid: '#f97316',
    gradEnd: '#fbbf24',
    textColor: '#1a0600',
    badge: 'ALL ACCESS'
  },
  {
    name: 'EMERALD MINT',
    code: 'TS-3382',
    event: '8WONDER MUSIC FESTIVAL',
    gradStart: '#05ffa1',
    gradMid: '#10b981',
    gradEnd: '#065f46',
    textColor: '#012014',
    badge: 'STAGE PASS'
  },
  {
    name: 'ELECTRIC COBALT',
    code: 'TS-9104',
    event: 'HÀ ANH TUẤN — STORII TOUR',
    gradStart: '#00d2ff',
    gradMid: '#2563eb',
    gradEnd: '#1e3a8a',
    textColor: '#02102e',
    badge: 'EXCLUSIVE'
  },
  {
    name: 'SOLAR GOLD',
    code: 'TS-7019',
    event: 'VŨ. — BẢO TÀNG NUỐI TIẾC',
    gradStart: '#fde047',
    gradMid: '#f59e0b',
    gradEnd: '#d97706',
    textColor: '#261600',
    badge: 'PREMIUM PASS'
  },
  {
    name: 'HYPER CORAL',
    code: 'TS-6145',
    event: 'RAP VIỆT ALL-STAR CONCERT',
    gradStart: '#fb7185',
    gradMid: '#f43f5e',
    gradEnd: '#be123c',
    textColor: '#1f030a',
    badge: 'EARLY BIRD'
  }
];

// Generate High-Res Ticket Texture
function createThemedTicketTexture(theme: TicketTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Multi-stop Gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 240);
  grad.addColorStop(0, theme.gradStart);
  grad.addColorStop(0.5, theme.gradMid);
  grad.addColorStop(1, theme.gradEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 240);

  // Holographic Iridescent Sheen
  const sheen = ctx.createRadialGradient(230, 85, 15, 256, 120, 260);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.4)');
  sheen.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 512, 240);

  // Holographic diagonal security lines
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#ffffff';
  for (let i = -100; i < 620; i += 22) {
    ctx.fillRect(i, 0, 9, 240);
  }
  ctx.restore();

  // Border & Perforated tear line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 488, 216);

  ctx.setLineDash([7, 5]);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(375, 12);
  ctx.lineTo(375, 228);
  ctx.stroke();
  ctx.setLineDash([]);

  // Typography
  ctx.fillStyle = theme.textColor;
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('ADMIT ONE  •  ' + theme.badge, 32, 44);

  ctx.font = '900 38px "Space Grotesk", sans-serif, monospace';
  ctx.fillText('TICKET', 32, 102);

  ctx.font = 'bold 13px monospace';
  ctx.fillText('NO. ' + theme.code + '  |  01 SPECIMEN', 32, 146);

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = 'rgba(5, 10, 25, 0.88)';
  ctx.fillText(theme.event, 32, 182);

  ctx.font = 'bold 9px monospace';
  ctx.fillText('★ TICKETSHIELD AUTHENTIC PASS ★', 32, 204);

  // Barcode
  ctx.fillStyle = '#060a14';
  const startX = 395;
  const barPattern = [3, 2, 4, 1, 5, 2, 2, 4, 1, 3, 2, 5, 1, 3, 2, 4, 1, 3, 4, 2];
  let curX = startX;
  for (const b of barPattern) {
    ctx.fillRect(curX, 36, b, 128);
    curX += b + 2.5;
  }
  ctx.font = '10px monospace';
  ctx.fillStyle = '#060a14';
  ctx.fillText(theme.code.replace('-', ' '), 396, 190);

  // Semicircular notches
  ctx.fillStyle = '#0b0e19';
  ctx.beginPath();
  ctx.arc(0, 120, 24, 0, Math.PI * 2);
  ctx.arc(512, 120, 24, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

// Generate Soft Circular Particle Texture
function createSoftParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const radGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
    radGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

export const TicketMachineSection: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleProtectedNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (token && token.trim() !== '') {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    const width = container.clientWidth || window.innerWidth || 1200;
    const height = container.clientHeight || 860;

    // Scene & Camera setup (Spans entire section)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(2.8, 1.8, 4.6);
    camera.lookAt(0, 0.35, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    container.appendChild(renderer.domElement);

    // No opaque scene.fog so transparent tickets fade out to true 100% alpha without dark artifacting

    // --- BALANCED HIGH-END STUDIO LIGHTING (CLEAN WHITE + ACCENTS) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    mainKeyLight.position.set(4, 7, 5);
    scene.add(mainKeyLight);

    // Soft neutral fill light from front-left
    const softFillLight = new THREE.DirectionalLight(0xf1f5f9, 1.8);
    softFillLight.position.set(-4, 3, 4);
    scene.add(softFillLight);

    // Soft rim light from rear-right
    const softRimLight = new THREE.PointLight(0xe2e8f0, 2.5, 9);
    softRimLight.position.set(3.4, 3.2, -1.2);
    scene.add(softRimLight);

    // Electric Cyan Laser glow inside mouth slot (illuminates tickets)
    const mouthGlowLight = new THREE.PointLight(0x00f5ff, 3.5, 2.5);
    mouthGlowLight.position.set(0, 0.58, 0.65);
    scene.add(mouthGlowLight);

    // Master Group & Machine Rig (Scaled down for compact, sleek presentation)
    const masterGroup = new THREE.Group();
    masterGroup.scale.set(0.82, 0.82, 0.82);
    scene.add(masterGroup);

    const printerRig = new THREE.Group();
    masterGroup.add(printerRig);

    // --- INDUSTRIAL MATTE CHARCOAL GREY MATERIALS (NHÁM MỜ, XÁM ĐEN, KHÔNG BÓNG) ---
    const matChassisMatte = new THREE.MeshStandardMaterial({
      color: 0x24272c,       // Pure dark charcoal gray (xám đen trung tính, không trùng nền xanh)
      metalness: 0.12,       // Low metalness -> no mirror reflections
      roughness: 0.88,       // Super matte texture (nhám mờ tán sắc)
    });

    const matUpperMatte = new THREE.MeshStandardMaterial({
      color: 0x32363e,       // Graphite dark gray for bevel & top housing
      metalness: 0.15,
      roughness: 0.82,       // Matte finish
    });

    const matDarkBezel = new THREE.MeshStandardMaterial({
      color: 0x16181b,       // Deep anthracite base
      metalness: 0.10,
      roughness: 0.90,       // Ultra matte
    });

    const matChromeAccent = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,       // Brushed matte titanium cutter bar
      metalness: 0.65,
      roughness: 0.35,
    });

    // 1. Base Pedestal
    const baseGeo = new THREE.BoxGeometry(2.0, 0.16, 2.1);
    const baseMesh = new THREE.Mesh(baseGeo, matDarkBezel);
    baseMesh.position.y = -0.45;
    printerRig.add(baseMesh);

    // 2. Main Housing (Charcoal Dark Grey Matte)
    const bodyGeo = new THREE.BoxGeometry(1.92, 0.95, 2.0);
    const bodyMesh = new THREE.Mesh(bodyGeo, matChassisMatte);
    bodyMesh.position.y = 0.08;
    printerRig.add(bodyMesh);

    // 3. Top Lid (Graphite Gray Matte)
    const lidGeo = new THREE.BoxGeometry(1.88, 0.32, 1.4);
    const lidMesh = new THREE.Mesh(lidGeo, matUpperMatte);
    lidMesh.position.set(0, 0.62, -0.25);
    printerRig.add(lidMesh);

    // Triple Multi-Color Status LEDs (Cyan, Magenta, Emerald)
    const ledGeo = new THREE.SphereGeometry(0.035, 16, 16);
    
    const ledMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
    const ledCyan = new THREE.Mesh(ledGeo, ledMatCyan);
    ledCyan.position.set(0.54, 0.76, 0.32);
    printerRig.add(ledCyan);

    const ledMatMagenta = new THREE.MeshBasicMaterial({ color: 0xd946ef });
    const ledMagenta = new THREE.Mesh(ledGeo, ledMatMagenta);
    ledMagenta.position.set(0.64, 0.76, 0.32);
    printerRig.add(ledMagenta);

    const ledMatEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledEmerald = new THREE.Mesh(ledGeo, ledMatEmerald);
    ledEmerald.position.set(0.74, 0.76, 0.32);
    printerRig.add(ledEmerald);

    // 4. CLEAN DISPENSER MOUTH
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, 0.54, 0.58);
    mouthGroup.rotation.x = -Math.PI * 0.16;
    printerRig.add(mouthGroup);

    // Main mouth bevel housing
    const mouthBevelGeo = new THREE.BoxGeometry(1.72, 0.28, 0.32);
    const mouthBevel = new THREE.Mesh(mouthBevelGeo, matUpperMatte);
    mouthGroup.add(mouthBevel);

    // Clean recessed inner aperture (dark cavity)
    const slotInnerGeo = new THREE.BoxGeometry(1.48, 0.06, 0.1);
    const slotInnerMat = new THREE.MeshBasicMaterial({ color: 0x08090b });
    const slotInner = new THREE.Mesh(slotInnerGeo, slotInnerMat);
    slotInner.position.set(0, 0.01, 0.12);
    mouthGroup.add(slotInner);

    // Brushed titanium cutter bar
    const cutterGeo = new THREE.BoxGeometry(1.46, 0.016, 0.03);
    const cutterMesh = new THREE.Mesh(cutterGeo, matChromeAccent);
    cutterMesh.position.set(0, 0.048, 0.165);
    mouthGroup.add(cutterMesh);

    // Laser Edge Glow Slit
    const laserSlitGeo = new THREE.BoxGeometry(1.42, 0.008, 0.01);
    const laserSlitMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
    const laserSlit = new THREE.Mesh(laserSlitGeo, laserSlitMat);
    laserSlit.position.set(0, -0.01, 0.168);
    mouthGroup.add(laserSlit);

    // Base Accent Trim Line
    const trimGeo = new THREE.BoxGeometry(1.94, 0.02, 2.02);
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.y = -0.12;
    printerRig.add(trimMesh);

    // --- COMPACT 6 FLOATING TICKETS (ATTACHED TO PRINTER RIG TO MOVE WITH MOUSE) ---
    interface TicketItemMesh {
      mesh: THREE.Mesh;
      phase: number;
      spreadX: number;
      fanAngle: number;
      flightSpeed: number;
      flutterSpeed: number;
      curveBias: number;
    }

    const ticketMeshes: TicketItemMesh[] = [];
    const ticketGeo = new THREE.PlaneGeometry(0.72, 0.34, 12, 6);

    ticketThemes.forEach((theme, index) => {
      const mat = new THREE.MeshPhongMaterial({
        map: createThemedTicketTexture(theme),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        specular: 0xffffff,
        shininess: 90,
        reflectivity: 0.75,
      });

      const mesh = new THREE.Mesh(ticketGeo, mat);
      printerRig.add(mesh); // Mounted inside printerRig so tickets tilt and move with mouse

      const normalizedIndex = index / (ticketThemes.length - 1);
      const spreadX = (normalizedIndex - 0.5) * 2.0;
      const fanAngle = (normalizedIndex - 0.5) * 0.48;

      ticketMeshes.push({
        mesh,
        phase: index / ticketThemes.length,
        spreadX,
        fanAngle,
        flightSpeed: 0.16 + (index % 2) * 0.03,
        flutterSpeed: 2.2 + index * 0.35,
        curveBias: (index % 2 === 0 ? 1 : -1) * 0.20,
      });
    });

    // --- MULTI-CHROMATIC CYBER PARTICLES MOVING WITH RIG ---
    const particleCount = 85;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pCol = new Float32Array(particleCount * 3);

    const sparkColors = [
      new THREE.Color(0x00f5ff), // Electric Cyan
      new THREE.Color(0xd946ef), // Neon Magenta / Fuchsia
      new THREE.Color(0x38bdf8), // Sky Blue
      new THREE.Color(0x10b981), // Emerald Mint
      new THREE.Color(0xfbbf24), // Amber Gold
      new THREE.Color(0xfb923c), // Orange
      new THREE.Color(0xa855f7), // Neon Purple
    ];

    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 5.0;
      pPos[i * 3 + 1] = Math.random() * 3.8 - 0.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 4.2;

      const col = sparkColors[i % sparkColors.length];
      pCol[i * 3] = col.r;
      pCol[i * 3 + 1] = col.g;
      pCol[i * 3 + 2] = col.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.11,
      map: createSoftParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const particles = new THREE.Points(pGeo, pMat);
    printerRig.add(particles);

    // Mouse Tracking on Hover Across Entire Section
    let isHovered = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetFollowX = 0;
    let targetFollowY = 0;

    const onPointerEnter = () => {
      isHovered = true;
    };

    const onPointerLeave = () => {
      isHovered = false;
      targetFollowX = 0;
      targetFollowY = 0;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      isHovered = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = renderer.domElement.getBoundingClientRect();

      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        mouseX = ((clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = ((clientY - rect.top) / rect.height - 0.5) * 2;
        targetFollowY = mouseX * 0.45;
        targetFollowX = mouseY * 0.32;
      } else {
        isHovered = false;
        targetFollowX = 0;
        targetFollowY = 0;
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mouseenter', onPointerEnter, { passive: true });
    dom.addEventListener('mouseleave', onPointerLeave, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    // Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 1. Natural Organic Multi-Axis Free Floating
      const freeFloatY = Math.sin(elapsedTime * 1.4) * 0.10 + Math.cos(elapsedTime * 0.8) * 0.03;
      const freeFloatX = Math.cos(elapsedTime * 1.1) * 0.03;
      const freeRotZ = Math.sin(elapsedTime * 0.9) * 0.025;
      const freeRotY = Math.sin(elapsedTime * 0.6) * 0.05;

      masterGroup.position.y = freeFloatY;
      masterGroup.position.x = freeFloatX;

      // 2. Mouse Tracking on Hover (Printer + Particles + Tickets all tilt synchronously)
      let activeTargetRotX = 0;
      let activeTargetRotY = 0;
      if (isHovered) {
        activeTargetRotX = targetFollowX;
        activeTargetRotY = targetFollowY;
      }

      printerRig.rotation.y += (activeTargetRotY + freeRotY - printerRig.rotation.y) * 0.06;
      printerRig.rotation.x += (activeTargetRotX - printerRig.rotation.x) * 0.06;
      printerRig.rotation.z += (freeRotZ - printerRig.rotation.z) * 0.05;

      // 3. TICKET EJECTION TRAJECTORY (Soaring Gracefully in 3D Space)
      ticketMeshes.forEach((item, idx) => {
        const progress = (elapsedTime * item.flightSpeed + item.phase) % 1.0;
        const t = progress;

        // Position: Emerge from mouth and soar forward + outwards in a graceful arc
        const spreadProgress = Math.sin(t * Math.PI * 0.85);
        const x = item.spreadX * spreadProgress + Math.sin(elapsedTime * 1.2 + idx) * 0.04;
        const y = 0.50 + t * 1.55 + Math.sin(t * Math.PI * 0.82) * 0.28;
        const z = 0.65 + Math.sin(t * Math.PI * 0.55) * 1.30 + item.curveBias * t;

        item.mesh.position.set(x, y, z);

        // Rotation & Flutter
        const basePitch = -Math.PI * 0.16;
        item.mesh.rotation.x = basePitch + t * 0.55 + Math.sin(elapsedTime * item.flutterSpeed) * 0.08;
        item.mesh.rotation.y = item.fanAngle + Math.sin(elapsedTime * 1.5 + item.phase * 4.0) * 0.11;
        item.mesh.rotation.z = item.fanAngle * 0.85 + Math.cos(elapsedTime * item.flutterSpeed * 0.7) * 0.07;

        // Scale & Opacity: Flying Page Burst + Graceful High-Altitude Fade Out
        let scale = 1.0;
        let opacity = 1.0;

        if (t < 0.10) {
          // Burst In from mouth (small -> full)
          const enterProgress = t / 0.10;
          scale = enterProgress * 1.0;
          opacity = enterProgress * 0.98;
        } else if (t > 0.60) {
          // Fade OUT + Shrink smoothly as it reaches peak altitude
          const exitProgress = (t - 0.60) / 0.40; // 0 to 1
          scale = 1.0 - exitProgress * 0.55;
          opacity = 0.98 * Math.max(0, 1.0 - Math.pow(exitProgress, 1.3));
        } else {
          scale = 1.0;
          opacity = 0.98;
        }

        item.mesh.scale.set(scale, scale, scale);
        const mat = item.mesh.material as THREE.MeshPhongMaterial;
        mat.opacity = Math.max(0, opacity);
      });

      // 4. Particle Slow Drift inside Rig
      const posArray = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += 0.005;
        if (posArray[i * 3 + 1] > 3.4) {
          posArray[i * 3 + 1] = -0.5;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth || 1200;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mouseenter', onPointerEnter);
      dom.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, []);

  return (
    <section className="ticket-machine-section" id="ticket-dispenser">
      {/* 1. Top Header Content & CTA Stack */}
      <motion.div
        className="tm-header-content"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="tm-title">
          Sẵn Sàng <span className="tm-title-gradient">Sở Hữu Vé Chính Chủ?</span>
        </h2>

        <p className="tm-description">
          Trải nghiệm chuyển nhượng vé số tức thì với cơ chế đổi chủ trực tiếp cùng Ban tổ chức. 
          Tiền giữ an toàn trong két độc lập, giải ngân sau 24h bảo vệ quyền lợi trọn vẹn.
        </p>

        {/* CTA Actions */}
        <div className="tm-cta-stack">
          <Link
            to="/dashboard"
            onClick={handleProtectedNavigation}
            className="tm-btn-primary"
          >
            <span>Khám Phá Sàn Vé Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/login"
            className="tm-btn-secondary"
          >
            <span>Đăng Bán Vé Chính Chủ</span>
          </Link>
        </div>
      </motion.div>

      {/* 2. 3D Ticket Machine Stage (Placed Below the Header Text) */}
      <motion.div
        className="tm-stage-wrapper"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="tm-ambient-glow" />
        <div ref={mountRef} className="tm-canvas-mount" />
      </motion.div>
    </section>
  );
};

export default TicketMachineSection;
