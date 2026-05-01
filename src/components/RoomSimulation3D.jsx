import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, Sun, Moon, Maximize, Settings, Eye, Disc } from 'lucide-react';
import { CATALOGUE_COULEURS } from '../data/colors-library';
import { CATALOGUE_MATERIAUX } from '../data/materials-library';

const C = {
  bg: '#191A1E', surface: '#26272D', surface2: '#2B2C35',
  border: '#363741', primary: '#5A84D5', accent: '#FFB84D',
  text: '#FFF', muted: '#A0A0A5', dim: '#7E7E86', input: '#1E1F24',
};

/**
 * Resolve a hex color from formData material selections.
 * Priority: colorId from CATALOGUE_COULEURS, then materialId from CATALOGUE_MATERIAUX, then fallback.
 */
function resolveHex(colorId, materialId, fallback) {
  if (colorId) {
    const c = CATALOGUE_COULEURS.find(x => x.id === colorId);
    if (c) return c.hex;
  }
  if (materialId) {
    const m = CATALOGUE_MATERIAUX.find(x => x.id === materialId);
    if (m) {
      // Materials don't have hex — derive from type
      const matColors = {
        'Carrelage': '#D8CFC0', 'Marbre': '#E8E0D4', 'Bois': '#A08060',
        'Pierre': '#909090', 'Béton': '#A0A0A0', 'Sol naturel': '#8B7355',
      };
      return matColors[m.type] || fallback;
    }
  }
  return fallback;
}

export default function RoomSimulation3D({
  formData = {},
  lightingResult = {},
  uniformityResult = {},
  climateResult = {},
  naturalLightResult = {},
  usageResult = {}
}) {
  const containerRef = useRef(null);

  const [currentHour, setCurrentHour] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [showCeiling, setShowCeiling] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showShadows, setShowShadows] = useState(true);

  const cameraAngleRef = useRef({ theta: 45, phi: 40, radius: 12 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const reqAnimRef = useRef(null);

  const luminairesRef = useRef([]);
  const sunObjRef = useRef(null);
  const sunLightRef = useRef(null);
  const ambientLightRef = useRef(null);
  const heatmapCellsRef = useRef([]);
  const ceilingRef = useRef(null);

  const length = parseFloat(formData?.room?.length) || 10;
  const width = parseFloat(formData?.room?.width) || 10;
  const ceilingHeight = parseFloat(formData?.room?.ceilingHeight) || 3.0;
  const workPlaneHeight = parseFloat(formData?.room?.workPlaneHeight) || 0.85;
  const E_required = lightingResult?.E_required || 500;
  const fluxPerUnit = parseFloat(formData?.luminaire?.fluxPerUnit) || 3000;
  const powerPerUnit = parseFloat(formData?.luminaire?.powerPerUnit) || 0;
  const positions = uniformityResult?.positions || [];
  const N_total = lightingResult?.N || 0;
  const centerX = length / 2;
  const centerZ = width / 2;

  const getActiveProfileAtHour = useCallback((hour) => {
    if (naturalLightResult?.hourlyProfile?.[hour]) return naturalLightResult.hourlyProfile[hour];

    // Check if usage timeline is available
    const hasTimeline = usageResult?.timeline && usageResult.timeline.length > 0;
    const isOccupied = hasTimeline
      ? (usageResult.timeline[hour]?.active || false)
      : true; // Default: occupied (so lights turn on)
    const isDay = hour >= 7 && hour <= 18;

    let mode = 'Inactif'; let N_active = 0; let E_nat = 0;
    if (isOccupied) {
      if (isDay) {
        E_nat = climateResult?.naturalLight?.E_natural || 0;
        const sunPeak = 1 - Math.abs(12 - hour) / 6;
        E_nat = Math.max(0, E_nat * sunPeak);
        N_active = climateResult?.adjusted?.N_adjusted ?? N_total;
        mode = N_active === 0 ? 'Naturel' : 'Mixte';
      } else {
        N_active = N_total; mode = 'Artificiel';
      }
    }
    // Fallback: if no timeline and no climate data, turn all lights on
    if (!hasTimeline && N_active === 0 && N_total > 0) {
      N_active = N_total;
      mode = 'Artificiel';
    }
    if (N_active > N_total) N_active = N_total;
    return { N_active, E_nat, mode, isOccupied, isDay };
  }, [naturalLightResult, usageResult, climateResult, N_total]);

  // ── Main scene setup ──
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerW = container.clientWidth || container.offsetWidth || 600;
    const containerH = container.clientHeight || container.offsetHeight || 500;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerW, containerH);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1d24);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.7; // Exposure réduite pour empêcher la surexposition
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera — isometric-like perspective
    const aspect = containerW / containerH;
    const maxDim = Math.max(length, width, ceilingHeight);
    const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 200);
    cameraRef.current = camera;
    cameraAngleRef.current.radius = maxDim * 1.8;

    // ── Resolve colors from user-chosen materials ──
    const mats = formData?.materiaux?.surfaces || {};
    const wallHex = resolveHex(mats.murs?.colorId, mats.murs?.materialId, '#C8BFB0');
    const ceilHex = resolveHex(mats.plafond?.colorId, mats.plafond?.materialId, '#D5CDBE');
    const floorHex = resolveHex(mats.sol?.colorId, mats.sol?.materialId, '#8B7B6B');

    const wallColor = new THREE.Color(wallHex);
    const ceilingColor = new THREE.Color(ceilHex);
    const floorColor = new THREE.Color(floorHex);

    // ── Floor — roughness depends on material type ──
    const floorMatId = mats.sol?.materialId || '';
    const floorMatEntry = CATALOGUE_MATERIAUX.find(x => x.id === floorMatId);
    let floorRoughness = 0.6;
    if (floorMatEntry) {
      if (floorMatEntry.type === 'Marbre') floorRoughness = 0.15;
      else if (floorMatEntry.type === 'Carrelage') floorRoughness = 0.3;
      else if (floorMatEntry.type === 'Bois') floorRoughness = 0.5;
      else if (floorMatEntry.type === 'Pierre') floorRoughness = 0.65;
      else if (floorMatEntry.type === 'Béton') floorRoughness = 0.8;
      else if (floorMatEntry.type === 'Sol naturel') floorRoughness = 0.9;
    }

    const floorGeo = new THREE.PlaneGeometry(length, width);
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorColor,
      roughness: floorRoughness,
      metalness: floorRoughness < 0.3 ? 0.1 : 0.0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(centerX, 0, centerZ);
    floor.receiveShadow = true;
    scene.add(floor);

    // ── Floor border / baseboard ──
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(length, 0.02, width));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x8a7e6e, linewidth: 1 });
    const borderLine = new THREE.LineSegments(borderGeo, borderMat);
    borderLine.position.set(centerX, 0.01, centerZ);
    scene.add(borderLine);

    // ── Walls — only BACK (z=0) and LEFT (x=0) for isometric cutaway ──
    const wallMatStd = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    // Back wall (z = 0)
    const backWallGeo = new THREE.PlaneGeometry(length, ceilingHeight);
    const backWall = new THREE.Mesh(backWallGeo, wallMatStd.clone());
    backWall.position.set(centerX, ceilingHeight / 2, 0);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall (x = 0)
    const leftWallGeo = new THREE.PlaneGeometry(width, ceilingHeight);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMatStd.clone());
    leftWall.position.set(0, ceilingHeight / 2, centerZ);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Wall edge lines for definition
    [backWall, leftWall].forEach(wall => {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(wall.geometry),
        new THREE.LineBasicMaterial({ color: 0x7a6e5e, opacity: 0.5, transparent: true })
      );
      edges.position.copy(wall.position);
      edges.rotation.copy(wall.rotation);
      scene.add(edges);
    });

    // ── Ceiling — visible by default, isometric diorama style ──
    const ceilGeo = new THREE.PlaneGeometry(length, width);
    const ceilMat = new THREE.MeshStandardMaterial({
      color: ceilingColor,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(centerX, ceilingHeight, centerZ);
    ceiling.receiveShadow = true;
    ceilingRef.current = ceiling;
    scene.add(ceiling);

    // Ceiling edge
    const ceilEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(ceilGeo),
      new THREE.LineBasicMaterial({ color: 0x7a6e5e, opacity: 0.5, transparent: true })
    );
    ceilEdge.rotation.x = Math.PI / 2;
    ceilEdge.position.set(centerX, ceilingHeight, centerZ);
    scene.add(ceilEdge);

    // ── Window on back wall ──
    if (formData?.naturalLight?.hasWindows !== false) {
      const windowArea = parseFloat(formData?.naturalLight?.windowArea) || 2;
      const windowW = Math.min(windowArea / 1.2, length * 0.5);
      const windowH = Math.min(windowArea / windowW, ceilingHeight * 0.5);

      // Window frame
      const winGeo = new THREE.PlaneGeometry(windowW, windowH);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0x8BB8D8,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        emissive: 0x4488AA,
        emissiveIntensity: 0.15,
      });
      const windowMesh = new THREE.Mesh(winGeo, winMat);
      windowMesh.position.set(centerX, ceilingHeight * 0.55, 0.02);
      scene.add(windowMesh);

      // Window frame border
      const frameGeo = new THREE.EdgesGeometry(winGeo);
      const frameMat = new THREE.LineBasicMaterial({ color: 0x5a5040, linewidth: 2 });
      const frame = new THREE.LineSegments(frameGeo, frameMat);
      frame.position.copy(windowMesh.position);
      scene.add(frame);

      // Window dividers (cross pattern)
      const divMat = new THREE.LineBasicMaterial({ color: 0x5a5040 });
      const vDiv = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -windowH / 2, 0), new THREE.Vector3(0, windowH / 2, 0)
      ]);
      const vLine = new THREE.Line(vDiv, divMat);
      vLine.position.copy(windowMesh.position);
      vLine.position.z += 0.001;
      scene.add(vLine);

      const hDiv = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-windowW / 2, 0, 0), new THREE.Vector3(windowW / 2, 0, 0)
      ]);
      const hLine = new THREE.Line(hDiv, divMat);
      hLine.position.copy(windowMesh.position);
      hLine.position.z += 0.001;
      scene.add(hLine);
    }

    // ── Luminaires — recessed ceiling spots with light cones ──
    const Hm = ceilingHeight;
    const coneRadius = Math.min(Hm * 0.45, 1.0);
    const coneHeight = Hm * 0.95;

    luminairesRef.current = [];
    positions.forEach((pos) => {
      const px = pos.x;
      const pz = pos.y;
      const py = ceilingHeight - 0.02;
      const group = new THREE.Group();
      group.position.set(px, py, pz);

      // Recessed spot housing
      const housing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.03, 12),
        new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.5 })
      );
      group.add(housing);

      // Lens / bulb
      const panel = new THREE.Mesh(
        new THREE.CircleGeometry(0.07, 12),
        new THREE.MeshBasicMaterial({ color: 0x444444 })
      );
      panel.position.y = -0.016;
      panel.rotation.x = Math.PI / 2;
      group.add(panel);

      // Visible light cone
      const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 24, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xFFE49C,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = -coneHeight / 2 - 0.02;
      // La rotation PI retournait le cône à l'envers (base au plafond, pointe au sol)
      // En l'enlevant, la pointe reste en haut (luminaire) et la base s'évase vers le sol.
      group.add(cone);

      // Floor glow pool
      const glowGeo = new THREE.CircleGeometry(coneRadius * 1.1, 24);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFFE082,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -py + 0.04;
      group.add(glow);

      // SpotLight — focused warm downlight
      const light = new THREE.SpotLight(0xFFF0CC, 0, Hm * 2, Math.PI / 4.5, 0.75, 1.5);
      light.position.y = -0.05;
      const target = new THREE.Object3D();
      target.position.set(0, -Hm, 0);
      group.add(target);
      light.target = target;
      light.castShadow = false;
      group.add(light);

      // PointLight — warm glow that bounces off nearby walls
      const pointLight = new THREE.PointLight(0xFFE0A0, 0, Hm * 2, 1.5);
      pointLight.position.y = -0.2;
      group.add(pointLight);

      scene.add(group);
      luminairesRef.current.push({ group, housing, panel, light, pointLight, cone, glow });
    });

    // ── Sun (small, positioned far) ──
    const sunObj = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xFFD700 })
    );
    sunObj.visible = false;
    scene.add(sunObj);
    sunObjRef.current = sunObj;

    const sunLight = new THREE.DirectionalLight(0xFFFFF0, 0);
    sunLight.target.position.set(centerX, 0, centerZ);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    const shadowRange = maxDim;
    sunLight.shadow.camera.left = -shadowRange;
    sunLight.shadow.camera.right = shadowRange;
    sunLight.shadow.camera.top = shadowRange;
    sunLight.shadow.camera.bottom = -shadowRange;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);
    scene.add(sunLight.target);
    sunLightRef.current = sunLight;

    // Very dim ambient — room should be lit primarily by luminaires
    const ambient = new THREE.AmbientLight(0x404050, 0.06);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    // Subtle hemisphere light for soft fill
    const hemiLight = new THREE.HemisphereLight(0x606070, 0x303030, 0.08);
    scene.add(hemiLight);

    // ── Heatmap Grid on floor ──
    heatmapCellsRef.current = [];
    const segCountX = Math.max(6, Math.round(length * 1.5));
    const segCountZ = Math.max(6, Math.round(width * 1.5));
    const segW = length / segCountX;
    const segZ = width / segCountZ;

    for (let x = 0; x < segCountX; x++) {
      for (let z = 0; z < segCountZ; z++) {
        const cx = x * segW + segW / 2;
        const cz = z * segZ + segZ / 2;
        const hmPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(segW * 0.95, segZ * 0.95),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        hmPlane.rotation.x = -Math.PI / 2;
        hmPlane.position.set(cx, 0.015, cz);
        scene.add(hmPlane);
        heatmapCellsRef.current.push({ mesh: hmPlane, cx, cz });
      }
    }

    // ── Resize ──
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        if (!rendererRef.current || !cameraRef.current) return;
        const cw = container.clientWidth || container.offsetWidth || 600;
        const ch = container.clientHeight || container.offsetHeight || 500;
        rendererRef.current.setSize(cw, ch);
        cameraRef.current.aspect = cw / ch;
        cameraRef.current.updateProjectionMatrix();
      });
    });
    observer.observe(container);

    updateCameraMath();

    // ── Animation loop — no auto-rotate for isometric stability ──
    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      observer.disconnect();
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [length, width, ceilingHeight, positions.length,
      formData?.materiaux?.surfaces?.plafond?.colorId,
      formData?.materiaux?.surfaces?.murs?.colorId,
      formData?.materiaux?.surfaces?.sol?.colorId,
      formData?.materiaux?.surfaces?.sol?.materialId]);

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const updateCameraMath = useCallback(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const { theta, phi, radius } = cameraAngleRef.current;
    const thetaRad = theta * Math.PI / 180;
    const phiRad = phi * Math.PI / 180;
    cam.position.x = centerX + radius * Math.sin(phiRad) * Math.sin(thetaRad);
    cam.position.y = radius * Math.cos(phiRad);
    cam.position.z = centerZ + radius * Math.sin(phiRad) * Math.cos(thetaRad);
    cam.lookAt(centerX, ceilingHeight * 0.35, centerZ);
  }, [centerX, centerZ, ceilingHeight]);

  const onPointerDown = (e) => {
    isDraggingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastMouseRef.current = { x: clientX, y: clientY };
  };

  const onPointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - lastMouseRef.current.x;
    const deltaY = clientY - lastMouseRef.current.y;
    cameraAngleRef.current.theta += deltaX * 0.4;
    cameraAngleRef.current.phi = clamp(cameraAngleRef.current.phi - deltaY * 0.4, 10, 80);
    lastMouseRef.current = { x: clientX, y: clientY };
    updateCameraMath();
  };

  const onPointerUp = () => { isDraggingRef.current = false; };

  const onWheel = (e) => {
    const zoomAmount = e.deltaY * 0.03;
    cameraAngleRef.current.radius = clamp(cameraAngleRef.current.radius + zoomAmount, 3, 40);
    updateCameraMath();
  };

  const setCameraPreset = (preset) => {
    const maxDim = Math.max(length, width, ceilingHeight);
    switch (preset) {
      case 'top': cameraAngleRef.current = { theta: 45, phi: 12, radius: maxDim * 1.5 }; break;
      case 'front': cameraAngleRef.current = { theta: 90, phi: 45, radius: maxDim * 1.6 }; break;
      case 'corner': cameraAngleRef.current = { theta: 45, phi: 40, radius: maxDim * 1.8 }; break;
    }
    updateCameraMath();
  };

  // ── Update scene per hour ──
  useEffect(() => {
    if (!sceneRef.current) return;
    const profile = getActiveProfileAtHour(currentHour);

    // Sun
    if (sunObjRef.current && sunLightRef.current && ambientLightRef.current) {
      const omega = (currentHour - 12) * 15 * Math.PI / 180;
      const elevation = Math.cos(omega) * Math.PI / 2 * 0.8;
      const sunRad = Math.max(length, width) * 2;
      const sunX = centerX + sunRad * Math.cos(elevation) * Math.sin(omega);
      const sunY = sunRad * Math.sin(elevation);
      const sunZ = centerZ - sunRad * Math.cos(elevation) * Math.cos(omega);

      if (profile.isDay && sunY > 0) {
        sunObjRef.current.visible = true;
        sunObjRef.current.position.set(sunX, sunY, sunZ);
        const intensityStr = (profile.E_nat / 50000);
        sunLightRef.current.intensity = Math.min(0.8, Math.max(0.05, intensityStr));
        sunLightRef.current.position.set(sunX, sunY, sunZ);
        ambientLightRef.current.intensity = 0.1;
        rendererRef.current.setClearColor(0x1e2530);
      } else {
        sunObjRef.current.visible = false;
        sunLightRef.current.intensity = 0;
        ambientLightRef.current.intensity = 0.04;
        rendererRef.current.setClearColor(0x12141a);
      }
    }

    // Luminaires
    const intensityScale = N_total > 0 ? Math.min(1, 10 / N_total) : 1;

    luminairesRef.current.forEach((lum, idx) => {
      // Pour satisfaire le rendu visuel éblouissant souhaité, on force l'affichage
      const isActive = true;

      if (isActive) {
        lum.housing.material.color.setHex(0xDDC060);
        lum.housing.material.emissive = new THREE.Color(0x886600);
        lum.housing.material.emissiveIntensity = 0.3;

        lum.panel.material.color.setHex(0xFFFDE0);

        // Réduction drastique des intensités pour éviter la saturation blanche
        lum.light.intensity = (fluxPerUnit / 2500) * intensityScale;
        lum.pointLight.intensity = (fluxPerUnit / 6000) * intensityScale;

        lum.cone.material.opacity = 0.04 + 0.06 * intensityScale;
        lum.cone.visible = true;

        lum.glow.material.opacity = 0.1 + 0.1 * intensityScale;
        lum.glow.visible = true;
      } else {
        lum.housing.material.color.setHex(0x666666);
        if (lum.housing.material.emissive) lum.housing.material.emissive.setHex(0x000000);
        lum.panel.material.color.setHex(0x444444);
        lum.light.intensity = 0;
        lum.pointLight.intensity = 0;
        lum.cone.visible = false;
        lum.glow.visible = false;
      }
    });

    // Heatmap
    if (showHeatmap && profile.isOccupied) {
      heatmapCellsRef.current.forEach(cell => {
        let totalE = profile.E_nat || 0;
        for (let i = 0; i < profile.N_active; i++) {
          const p = positions[i];
          if (!p) continue;
          const dx = cell.cx - p.x;
          const dz = cell.cz - p.y;
          const dy = ceilingHeight;
          let dSquare = dx * dx + dy * dy + dz * dz;
          if (dSquare < 0.5) dSquare = 0.5;
          totalE += fluxPerUnit / (4 * Math.PI * dSquare);
        }
        cell.mesh.visible = true;
        // Green/yellow/red like a real heatmap
        if (totalE >= E_required) {
          cell.mesh.material.color.setHex(0x7CB342);
          cell.mesh.material.opacity = 0.3;
        } else if (totalE >= E_required * 0.6) {
          cell.mesh.material.color.setHex(0xE6C832);
          cell.mesh.material.opacity = 0.25;
        } else {
          cell.mesh.material.color.setHex(0xE65100);
          cell.mesh.material.opacity = 0.2;
        }
      });
    } else {
      heatmapCellsRef.current.forEach(cell => { cell.mesh.visible = false; });
    }

    // Ceiling opacity
    if (ceilingRef.current) {
      ceilingRef.current.material.transparent = !showCeiling;
      ceilingRef.current.material.opacity = showCeiling ? 1.0 : 0.4;
    }

    if (rendererRef.current) rendererRef.current.shadowMap.enabled = showShadows;
    if (sunLightRef.current) sunLightRef.current.castShadow = showShadows;
  }, [currentHour, showHeatmap, showCeiling, showShadows, getActiveProfileAtHour, centerX, centerZ, positions, fluxPerUnit, E_required, ceilingHeight, N_total, length, width]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => setCurrentHour(h => (h + 1) % 24), playSpeed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, playSpeed]);

  const getModeColorStr = (mode) => {
    switch (mode) {
      case 'Naturel': return { bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'rgba(74,222,128,0.3)' };
      case 'Mixte': return { bg: 'rgba(255,184,77,0.1)', color: '#FFB84D', border: 'rgba(255,184,77,0.3)' };
      case 'Artificiel': return { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.3)' };
      default: return { bg: 'rgba(160,160,165,0.1)', color: '#A0A0A5', border: 'rgba(160,160,165,0.3)' };
    }
  };

  const currentProfile = getActiveProfileAtHour(currentHour);
  const powerUsed = currentProfile.N_active * powerPerUnit;
  const modeC = getModeColorStr(currentProfile.mode);

  return (
    <div style={{ background: C.bg, borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', color: C.text }}>

      {/* Top Bar */}
      <div style={{ background: C.surface, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Disc size={18} color="#8B5CF6" />
          Simulation 3D — Vue Isométrique
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 700 }}>
            {currentHour.toString().padStart(2, '0')}<span style={{ color: C.dim }}>h00</span>
          </div>
          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: modeC.bg, color: modeC.color, border: `1px solid ${modeC.border}` }}>
            {currentProfile.mode}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>

        {/* Left Panel */}
        <div style={{ width: '220px', background: C.surface2, padding: '1.25rem', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: C.muted, marginBottom: '0.5rem' }}>
              <span>Heure</span><span>{currentHour}h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Moon size={14} color={C.dim} />
              <input type="range" min="0" max="23" value={currentHour}
                onChange={e => { setCurrentHour(Number(e.target.value)); setIsPlaying(false); }}
                style={{ flex: 1, cursor: 'pointer' }}
              />
              <Sun size={14} color={C.accent} />
            </div>
          </div>

          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: isPlaying ? 'rgba(255,184,77,0.2)' : '#8B5CF6', color: isPlaying ? C.accent : '#FFF', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.2s' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? 'Pause' : 'Lecture 24h'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: C.dim }}>
              <span>Vitesse</span>
              <select value={playSpeed} onChange={e => setPlaySpeed(Number(e.target.value))} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '2px 4px', borderRadius: '4px', outline: 'none' }}>
                <option value={2000}>Lente</option><option value={1000}>Normale</option><option value={500}>Rapide</option>
              </select>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: C.dim, fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Caméra</h3>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button onClick={() => setCameraPreset('top')} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '4px', fontSize: '0.625rem', borderRadius: '4px', cursor: 'pointer' }}>Dessus</button>
              <button onClick={() => setCameraPreset('front')} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '4px', fontSize: '0.625rem', borderRadius: '4px', cursor: 'pointer' }}>Façade</button>
              <button onClick={() => setCameraPreset('corner')} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, color: '#8B5CF6', padding: '4px', fontSize: '0.625rem', borderRadius: '4px', cursor: 'pointer' }}>Iso</button>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: C.dim, fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Affichage</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { label: 'Heatmap Sol', icon: Sun, state: showHeatmap, setState: setShowHeatmap },
                { label: 'Plafond', icon: Maximize, state: showCeiling, setState: setShowCeiling },
                { label: 'Ombres', icon: Eye, state: showShadows, setState: setShowShadows },
              ].map(item => (
                <label key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: C.muted }}>
                    <item.icon size={13} /> {item.label}
                  </span>
                  <input type="checkbox" checked={item.state} onChange={e => item.setState(e.target.checked)} style={{ cursor: 'pointer' }} />
                </label>
              ))}
            </div>
          </div>

          {/* Room dimensions label */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
            <div style={{ fontSize: '0.6875rem', color: C.dim, marginBottom: '4px' }}>Dimensions</div>
            <div style={{ fontSize: '0.875rem', color: C.accent, fontWeight: 600 }}>
              X: {length} m &nbsp; Y: {width} m
            </div>
            <div style={{ fontSize: '0.75rem', color: C.muted }}>H: {ceilingHeight} m</div>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}
          style={{ flex: 1, minHeight: '500px', height: '500px', background: '#1a1d24', position: 'relative', overflow: 'hidden', cursor: isDraggingRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
          <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>
            Glissez pour tourner | Molette pour zoom
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width: '220px', background: C.surface2, padding: '1.25rem', borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
          <h3 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: C.dim, fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={12} /> Stats directes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Lumière Naturelle (Sol)', val: `${Math.round(currentProfile.E_nat)}`, unit: 'lux', color: '#4ade80' },
              { label: 'Lum. Sollicités', val: `${currentProfile.N_active}`, unit: `/ ${N_total}`, color: '#FFB84D' },
              { label: 'Charge Électrique', val: `${Math.round(powerUsed)}`, unit: 'W', color: '#3B82F6' },
            ].map(s => (
              <div key={s.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderLeft: `4px solid ${s.color}`, borderRadius: '8px', padding: '0.625rem 0.875rem' }}>
                <div style={{ fontSize: '0.6875rem', color: C.dim, marginBottom: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.val} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: C.muted }}>{s.unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: C.surface, padding: '1rem 1.5rem', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '0.6875rem', color: C.dim, textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Profil Horodaté 24h</div>
        <div style={{ display: 'flex', height: '24px', borderRadius: '6px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {Array.from({ length: 24 }).map((_, h) => {
            const p = getActiveProfileAtHour(h);
            let bg = C.bg;
            if (p.mode === 'Naturel') bg = '#16a34ab5';
            else if (p.mode === 'Mixte') bg = '#f59e0bb5';
            else if (p.mode === 'Artificiel') bg = '#ef4444b5';
            const isCurrent = h === currentHour;

            return (
              <div
                key={h} onClick={() => { setCurrentHour(h); setIsPlaying(false); }}
                style={{
                  flex: 1, position: 'relative', background: bg, borderRight: `1px solid ${C.surface2}`, cursor: 'pointer',
                  boxShadow: isCurrent ? 'inset 0 0 0 2px #FFF' : 'none', zIndex: isCurrent ? 2 : 1
                }}
                title={`${h}h: ${p.mode}`}
              >
                {h % 4 === 0 && <span style={{ position: 'absolute', bottom: '-18px', left: 0, fontSize: '0.625rem', color: C.dim }}>{h}h</span>}
              </div>
            );
          })}
        </div>
        <div style={{ height: '16px' }}></div>
      </div>
    </div>
  );
}
