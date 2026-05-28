import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, Sun, Moon, Maximize, Settings, Eye, Disc } from 'lucide-react';
import { CATALOGUE_COULEURS } from '../data/colors-library';
import { CATALOGUE_MATERIAUX } from '../data/materials-library';
import { addFurnitureForRoom, addDoor, addWindow } from '../utils/roomFurniture3D';

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
  const [webGLFailed, setWebGLFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [showCeiling, setShowCeiling] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const [viewMode, setViewMode] = useState('exterior'); // 'exterior' | 'interior'

  const cameraAngleRef = useRef({ theta: 45, phi: 40, radius: 12 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frontWallsRef = useRef([]); // murs avant (droit + face avant) rendus transparents en mode extérieur
  const reqAnimRef = useRef(null);

  const luminairesRef = useRef([]);
  const sunObjRef = useRef(null);
  const sunLightRef = useRef(null);
  const ambientLightRef = useRef(null);
  const heatmapCellsRef = useRef([]);
  const ceilingRef = useRef(null);

  const length = parseFloat(formData?.room?.length) || 7;
  const width = parseFloat(formData?.room?.width) || 6;
  const ceilingHeight = parseFloat(formData?.room?.ceilingHeight) || 3.0;
  const workPlaneHeight = parseFloat(formData?.room?.workPlaneHeight) || 0.85;
  const E_required = lightingResult?.E_required || 500;
  const fluxPerUnit = parseFloat(formData?.luminaire?.fluxPerUnit) || 3000;
  const powerPerUnit = parseFloat(formData?.luminaire?.powerPerUnit) || 0;
  const N_total = lightingResult?.N || 0;

  // Si uniformityResult n'a pas encore de positions, on genere une grille reguliere de fallback
  // pour que la scene 3D soit toujours peuplee de luminaires visibles
  const positions = React.useMemo(() => {
    const raw = uniformityResult?.positions;
    if (raw && raw.length > 0) return raw;
    if (N_total <= 0) return [];
    // Grille uniforme de fallback
    const cols = Math.max(1, Math.round(Math.sqrt(N_total * (length / width))));
    const rows = Math.ceil(N_total / cols);
    const pts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (pts.length >= N_total) break;
        pts.push({
          x: (length / (cols + 1)) * (c + 1),
          y: (width  / (rows + 1)) * (r + 1),
        });
      }
    }
    return pts;
  }, [uniformityResult, N_total, length, width]);
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
        // N_adjusted peut valoir 0 si la lumiere naturelle suffit —
        // mais on garde quand meme les luminaires allumes en 3D pour la visualisation
        const N_adj = climateResult?.adjusted?.N_adjusted;
        N_active = (N_adj !== undefined && N_adj !== null) ? Math.max(0, N_adj) : N_total;
        mode = N_active === 0 ? 'Naturel' : 'Mixte';
      } else {
        N_active = N_total; mode = 'Artificiel';
      }
    }
    // Fallback: si pas de donnees de simulation, allumer tous les luminaires
    if (N_active === 0 && N_total > 0) {
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
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch (err) {
      console.warn("WebGL non supporté ou erreur d'initialisation :", err);
      setWebGLFailed(true);
      return;
    }
    setWebGLFailed(false);
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

    // ── Murs — 4 murs complets, pièce fermée ──
    const wallMatStd = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    frontWallsRef.current = [];

    const walls = [
      // [label, w, h, px, py, pz, ry, isFront]
      ['back',   length, ceilingHeight, centerX,   ceilingHeight / 2, 0,         0,            false],
      ['front',  length, ceilingHeight, centerX,   ceilingHeight / 2, width,     Math.PI,      true],
      ['left',   width,  ceilingHeight, 0,          ceilingHeight / 2, centerZ,  Math.PI / 2,  false],
      ['right',  width,  ceilingHeight, length,    ceilingHeight / 2, centerZ,  -Math.PI / 2, true],
    ];

    walls.forEach(([, gw, gh, px, py, pz, ry, isFront]) => {
      const geo = new THREE.PlaneGeometry(gw, gh);
      const wmat = wallMatStd.clone();
      const mesh = new THREE.Mesh(geo, wmat);
      mesh.position.set(px, py, pz);
      mesh.rotation.y = ry;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Edge lines
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x7a6e5e, opacity: 0.4, transparent: true })
      );
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      scene.add(edges);

      if (isFront) frontWallsRef.current.push({ mesh, edges });
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
      const windowType = formData?.room?.windowType || 'Battante';
      addWindow(scene, THREE, windowType, windowArea, ceilingHeight, 'back', centerX, centerZ);
      // Lumière de soleil qui passe par la fenêtre
      const winLight = new THREE.RectAreaLight(0xFFF9E6, 2.0, Math.min(windowArea, 3), Math.min(windowArea * 0.7, 2));
      winLight.position.set(centerX, ceilingHeight * 0.55, 0.2);
      winLight.lookAt(centerX, ceilingHeight * 0.3, centerZ);
      scene.add(winLight);
    }

    // ── Porte ──
    addDoor(scene, THREE, formData?.room?.doorType || 'Porte en bois plein', length, width, ceilingHeight);

    // ── Mobilier selon type de pièce ──
    const roomType = formData?.room?.type || 'Bureau';
    addFurnitureForRoom(scene, THREE, roomType, length, width, ceilingHeight);

    // ── Luminaires — forme adaptée selon le type sélectionné ──
    // Detection de forme 3D basee sur l'ID du luminaire (format: 'led-dalle-600-36w', 'flu-t8-36w', etc.)
    const luminaireId = (formData?.luminaire?.type || '').toLowerCase();
    const luminaireName = (formData?.luminaire?.name || '').toLowerCase();
    const luminaireStr = luminaireId + ' ' + luminaireName;
    const isDalle = luminaireStr.includes('dalle') || luminaireStr.includes('panel') || luminaireStr.includes('downlight');
    const isTube  = luminaireStr.includes('t8') || luminaireStr.includes('tube') || luminaireStr.includes('reglette') || luminaireStr.includes('réglette') || luminaireStr.includes('flu-') || luminaireStr.includes('industrielle') || luminaireStr.includes('highbay');
    const isSpot  = luminaireStr.includes('spot') || luminaireStr.includes('gu10') || luminaireStr.includes('e27');
    const Hm = ceilingHeight;
    const coneRadius = Math.min(Hm * 0.45, 1.0);
    const coneHeight = Hm * 0.9;

    const maxRealLights = 20;
    const lightStep = Math.max(1, Math.floor(positions.length / maxRealLights));
    let realLightsAdded = 0;

    luminairesRef.current = [];
    positions.forEach((pos, idx) => {
      const px = pos.x;
      const pz = pos.y;
      const py = ceilingHeight - 0.02;
      const group = new THREE.Group();
      group.position.set(px, py, pz);

      let housing, panel;

      if (isDalle) {
        // Dalle LED rectangulaire (600×600)
        housing = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.04, 0.6),
          new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.3, metalness: 0.3 })
        );
        panel = new THREE.Mesh(
          new THREE.BoxGeometry(0.58, 0.01, 0.58),
          new THREE.MeshBasicMaterial({ color: 0x444444 })
        );
        panel.position.y = -0.025;
      } else if (isTube) {
        // Réglette / tube fluorescent
        housing = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.04, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x909090, roughness: 0.4, metalness: 0.2 })
        );
        panel = new THREE.Mesh(
          new THREE.BoxGeometry(1.18, 0.02, 0.08),
          new THREE.MeshBasicMaterial({ color: 0x444444 })
        );
        panel.position.y = -0.02;
      } else {
        // Spot encastré rond (E27, GU10, downlight...)
        housing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 0.03, 16),
          new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.5 })
        );
        panel = new THREE.Mesh(
          new THREE.CircleGeometry(0.07, 16),
          new THREE.MeshBasicMaterial({ color: 0x444444 })
        );
        panel.position.y = -0.016;
        panel.rotation.x = Math.PI / 2;
      }

      // Ajouter au groupe
      housing.castShadow = true;
      group.add(housing);
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

      // Add real lights only for a limited number of luminaires to avoid WebGL shader limits and pitch black walls
      let light = null, pointLight = null;
      if (idx % lightStep === 0 && realLightsAdded < maxRealLights) {
        light = new THREE.SpotLight(0xFFF0CC, 0, Hm * 2, Math.PI / 4.5, 0.75, 1.5);
        light.position.y = -0.05;
        const target = new THREE.Object3D();
        target.position.set(0, -Hm, 0);
        group.add(target);
        light.target = target;
        light.castShadow = false;
        group.add(light);

        pointLight = new THREE.PointLight(0xFFE0A0, 0, Hm * 2, 1.5);
        pointLight.position.y = -0.2;
        group.add(pointLight);
        
        realLightsAdded++;
      }

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

    // Dim ambient but bright enough so nothing is 100% black
    const ambient = new THREE.AmbientLight(0x404050, 0.15);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    // Hemisphere light for soft fill
    const hemiLight = new THREE.HemisphereLight(0xfff5e6, 0x202020, 0.15);
    scene.add(hemiLight);

    // ── Heatmap InstancedMesh ──
    const segCountX = Math.max(6, Math.round(length * 1.5));
    const segCountZ = Math.max(6, Math.round(width * 1.5));
    const totalCells = segCountX * segCountZ;
    const segW = length / segCountX;
    const segZ = width / segCountZ;

    const hmGeo = new THREE.PlaneGeometry(segW * 0.95, segZ * 0.95);
    const hmMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    
    const instancedHM = new THREE.InstancedMesh(hmGeo, hmMat, totalCells);
    instancedHM.position.set(0, 0.015, 0); // Position at floor level
    instancedHM.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    scene.add(instancedHM);
    heatmapCellsRef.current = instancedHM;

    const dummy = new THREE.Object3D();
    const cellData = [];

    for (let x = 0; x < segCountX; x++) {
      for (let z = 0; z < segCountZ; z++) {
        const idx = x * segCountZ + z;
        const cx = x * segW + segW / 2;
        const cz = z * segZ + segZ / 2;
        
        dummy.position.set(cx, 0, cz); // World coordinates
        dummy.rotation.x = -Math.PI / 2; // Make the plane lie flat
        dummy.updateMatrix();
        instancedHM.setMatrixAt(idx, dummy.matrix);
        cellData.push({ cx, cz });
      }
    }
    instancedHM.userData.cellData = cellData;
    instancedHM.instanceMatrix.needsUpdate = true;

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

    // ── Animation loop — slow auto-rotate for life ──
    let autoAngle = cameraAngleRef.current.theta;
    const animate = (time) => {
      reqAnimRef.current = requestAnimationFrame(animate);
      // Slow orbital rotation when not dragging
      if (!isDraggingRef.current) {
        autoAngle += 0.04;
        cameraAngleRef.current.theta = autoAngle;
        updateCameraMath();
      }
      // Gentle luminaire flicker via emissive pulsing
      const t = time * 0.001;
      luminairesRef.current.forEach((lum, i) => {
        if (lum.light && lum.light.intensity > 0) {
          const flicker = 1.0 + Math.sin(t * 2.3 + i * 1.7) * 0.04;
          lum.light.intensity = lum.light._baseIntensity * flicker;
          lum.pointLight.intensity = lum.pointLight._baseIntensity * flicker;
        }
      });
      renderer.render(scene, camera);
    };
    animate(0);

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
    // Si beaucoup de luminaires, on compense l'éclairage global pour éclairer la pièce
    // vu qu'on a limité le nombre de PointLights à 20 max.
    const activeLumRatio = N_total > 0 ? (profile.N_active / N_total) : 0;
    const globalLumIntensity = activeLumRatio * (fluxPerUnit / 2000);
    
    if (ambientLightRef.current && !profile.isDay) {
      ambientLightRef.current.intensity = 0.15 + Math.min(0.8, globalLumIntensity * 0.5);
    } else if (ambientLightRef.current) {
      // Day time, sun provides ambient
    }

    const intensityScale = N_total > 0 ? Math.min(1, 20 / N_total) : 1;
    // La transparence des cônes diminue drastiquement s'il y a des centaines de luminaires
    // pour éviter l'éblouissement total (mur de lumière blanc).
    const coneBaseOpacity = 0.1 * Math.min(1, 10 / Math.sqrt(N_total || 1));

    luminairesRef.current.forEach((lum, idx) => {
      const isActive = idx < profile.N_active;

      if (isActive) {
        lum.housing.material.color.setHex(0xDDC060);
        lum.housing.material.emissive = new THREE.Color(0x886600);
        lum.housing.material.emissiveIntensity = 0.3;
        lum.panel.material.color.setHex(0xFFFDE0);

        if (lum.light) {
          const baseSpot  = (fluxPerUnit / 2500) * intensityScale;
          const basePt    = (fluxPerUnit / 6000) * intensityScale;
          lum.light.intensity = baseSpot;
          lum.light._baseIntensity = baseSpot;
          lum.pointLight.intensity = basePt;
          lum.pointLight._baseIntensity = basePt;
        }

        lum.cone.material.opacity = coneBaseOpacity;
        lum.cone.visible = true;
        lum.glow.material.opacity = coneBaseOpacity * 1.5;
        lum.glow.visible = true;
      } else {
        lum.housing.material.color.setHex(0x555555);
        if (lum.housing.material.emissive) lum.housing.material.emissive.setHex(0x000000);
        lum.panel.material.color.setHex(0x333333);
        if (lum.light) {
          lum.light.intensity = 0;
          lum.light._baseIntensity = 0;
          lum.pointLight.intensity = 0;
          lum.pointLight._baseIntensity = 0;
        }
        lum.cone.visible = false;
        lum.glow.visible = false;
      }
    });

    // Heatmap (visible si lumière présente)
    const instancedHM = heatmapCellsRef.current;
    const hasAnyLight3D = profile.N_active > 0 || profile.E_nat > 0;
    
    if (instancedHM && showHeatmap && hasAnyLight3D) {
      const cellData = instancedHM.userData.cellData;
      const color = new THREE.Color();
      
      cellData.forEach((cell, idx) => {
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
        
        // Green/yellow/red like a real heatmap
        if (totalE >= E_required) {
          color.setHex(0x7CB342);
        } else if (totalE >= E_required * 0.6) {
          color.setHex(0xE6C832);
        } else {
          color.setHex(0xE65100);
        }
        instancedHM.setColorAt(idx, color);
      });
      instancedHM.visible = true;
      if (instancedHM.instanceColor) instancedHM.instanceColor.needsUpdate = true;
    } else if (instancedHM) {
      instancedHM.visible = false;
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
  React.useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => setCurrentHour(h => (h + 1) % 24), playSpeed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, playSpeed]);

  // Visibilite des murs avant + position camera selon le mode de vue
  React.useEffect(() => {
    frontWallsRef.current.forEach(({ mesh, edges }) => {
      if (viewMode === 'exterior') {
        // Mode exterieur : murs avant transparents pour voir l'interieur
        mesh.material.transparent = true;
        mesh.material.opacity = 0.08;
        edges.material.opacity = 0.15;
      } else {
        // Mode interieur : tous les murs opaques
        mesh.material.transparent = false;
        mesh.material.opacity = 1.0;
        edges.material.opacity = 0.5;
      }
    });

    if (ceilingRef.current) {
      if (viewMode === 'interior') {
        ceilingRef.current.material.transparent = true;
        ceilingRef.current.material.opacity = 0.0;
      }
    }

    // Repositionner la camera
    if (cameraRef.current) {
      const cam = cameraAngleRef.current;
      if (viewMode === 'interior') {
        // Vue interieure : camera au centre de la piece, regard vers le fond
        cameraRef.current.position.set(length / 2, ceilingHeight * 0.55, width * 0.6);
        cameraRef.current.lookAt(length / 2, ceilingHeight * 0.4, 0);
        cam.theta = 180; cam.phi = 10; cam.radius = 0.1;
      } else {
        // Vue exterieure : retour a la position isometrique
        cam.theta = 45; cam.phi = 40; cam.radius = Math.max(length, width) * 2.2;
      }
    }
  }, [viewMode, length, width, ceilingHeight]);

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
          Simulation 3D
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

          {/* Toggle interieur / exterieur */}
          <div style={{ display: 'flex', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
            {[
              { key: 'exterior', label: 'Vue exterieure' },
              { key: 'interior', label: 'Vue interieure' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                style={{
                  padding: '0.35rem 0.875rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === key ? '#8B5CF6' : 'transparent',
                  color: viewMode === key ? '#fff' : C.muted,
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

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
        <div style={{ flex: 1, minHeight: '500px', height: '500px', position: 'relative', overflow: 'hidden', background: '#000' }}>
          {webGLFailed ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, background: C.surface2, textAlign: 'center', padding: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}><Disc size={48} color={C.dim} /></div>
              <h3 style={{ fontSize: '1.25rem', color: C.text, marginBottom: '0.5rem' }}>Aperçu 3D non disponible</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5, maxWidth: '400px' }}>Votre environnement (ou votre carte graphique) ne supporte pas l'accélération matérielle WebGL requise pour afficher cette scène en 3D. L'application continuera de fonctionner normalement pour les calculs.</p>
            </div>
          ) : (
            <div ref={containerRef} style={{ width: '100%', height: '100%', outline: 'none', cursor: isDraggingRef.current ? 'grabbing' : 'grab', touchAction: 'none' }} tabIndex={0}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}
            />
          )}
          {!webGLFailed && (
            <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>
              Glissez pour tourner | Molette pour zoom
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ width: '220px', background: C.surface2, padding: '1.25rem', borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
          <h3 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: C.dim, fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={12} /> Stats directes
          </h3>
          <button 
            onClick={() => {
              if (rendererRef.current) {
                window.__capture3D_DataUrl = rendererRef.current.domElement.toDataURL('image/png');
                alert('📸 Scène 3D capturée ! Elle sera utilisée comme couverture sur votre rapport PDF.');
              }
            }}
            style={{
              background: C.primary, color: '#fff', border: 'none', borderRadius: '6px', 
              padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Eye size={14} /> Capturer pour le PDF
          </button>
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
