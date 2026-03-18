import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Play, Pause, Sun, Moon, Maximize, Settings, Eye, Disc } from 'lucide-react';

export default function RoomSimulation3D({
  formData = {},
  lightingResult = {},
  uniformityResult = {},
  climateResult = {},
  naturalLightResult = {},
  usageResult = {}
}) {
  const containerRef = useRef(null);
  
  // States
  const [currentHour, setCurrentHour] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [showCeiling, setShowCeiling] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showShadows, setShowShadows] = useState(true);

  // Manual Camera Orbit State 
  // (We use refs to avoid re-initializing the entire ThreeJS scene on every tiny movement)
  const cameraAngleRef = useRef({ theta: 45, phi: 40, radius: 15 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // ThreeJS Refs
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const reqAnimRef = useRef(null);
  
  // Dynamic Objects Refs
  const luminairesRef = useRef([]);
  const sunObjRef = useRef(null);
  const sunLightRef = useRef(null);
  const ambientLightRef = useRef(null);
  const heatmapCellsRef = useRef([]);
  const ceilingRef = useRef(null);

  // Extracts
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

  // Derive Profile per Hour
  const getActiveProfileAtHour = useCallback((hour) => {
    if (naturalLightResult?.hourlyProfile?.[hour]) {
      return naturalLightResult.hourlyProfile[hour];
    }
    const isOccupied = usageResult?.timeline?.[hour]?.active || false;
    const isDay = hour >= 7 && hour <= 18;
    
    let mode = 'Inactif';
    let N_active = 0;
    let E_nat = 0;
    
    if (isOccupied) {
      if (isDay) {
        E_nat = climateResult?.naturalLight?.E_natural || 0;
        // Simple day bell curve for sun intensity fallback
        const sunPeak = 1 - Math.abs(12 - hour) / 6; 
        E_nat = Math.max(0, E_nat * sunPeak);

        N_active = climateResult?.adjusted?.N_adjusted ?? N_total;
        mode = N_active === 0 ? 'Naturel' : 'Mixte';
      } else {
        N_active = N_total;
        mode = 'Artificiel';
      }
    }
    if (N_active > N_total) N_active = N_total;

    return { N_active, E_nat, mode, isOccupied, isDay };
  }, [naturalLightResult, usageResult, climateResult, N_total]);


  // ============================================
  // THREE.JS SCENE INITIALIZATION (Run Once)
  // ============================================
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight || 500;
    
    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerW, containerH);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = showShadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a2e); // Dark blue background night sky
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspect = containerW / containerH;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    cameraRef.current = camera;
    
    // Auto-adjust start radius based on room size to see everything
    const maxDim = Math.max(length, width);
    cameraAngleRef.current.radius = maxDim * 1.5;

    // 3. Room Floor
    const floorGeo = new THREE.PlaneGeometry(length, width);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xD4C5A9 }); // beige wood
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(centerX, 0, centerZ);
    floor.receiveShadow = true;
    scene.add(floor);

    // 4. Work Plane (Invisible shadow receiver)
    const workGeo = new THREE.PlaneGeometry(length, width);
    const workMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const workPlane = new THREE.Mesh(workGeo, workMat);
    workPlane.rotation.x = -Math.PI / 2;
    workPlane.position.set(centerX, workPlaneHeight, centerZ);
    workPlane.receiveShadow = true;
    scene.add(workPlane);

    // 5. Walls (Semi-transparent)
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F0, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    
    // Back Wall (z = 0)
    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(length, ceilingHeight), wallMat);
    wallBack.position.set(centerX, ceilingHeight / 2, 0);
    wallBack.receiveShadow = true;
    scene.add(wallBack);
    // Front Wall (z = width)
    const wallFront = new THREE.Mesh(new THREE.PlaneGeometry(length, ceilingHeight), wallMat);
    wallFront.position.set(centerX, ceilingHeight / 2, width);
    wallFront.receiveShadow = true;
    scene.add(wallFront);
    // Left Wall (x = 0)
    const wallLeft = new THREE.Mesh(new THREE.PlaneGeometry(width, ceilingHeight), wallMat);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.position.set(0, ceilingHeight / 2, centerZ);
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);
    // Right Wall (x = length)
    const wallRight = new THREE.Mesh(new THREE.PlaneGeometry(width, ceilingHeight), wallMat);
    wallRight.rotation.y = Math.PI / 2;
    wallRight.position.set(length, ceilingHeight / 2, centerZ);
    wallRight.receiveShadow = true;
    scene.add(wallRight);

    // 6. Ceiling
    const ceilGeo = new THREE.PlaneGeometry(length, width);
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(centerX, ceilingHeight, centerZ);
    ceiling.visible = showCeiling;
    ceilingRef.current = ceiling;
    scene.add(ceiling);

    // 7. Luminaires
    luminairesRef.current = [];
    positions.forEach((pos) => {
      const px = pos.x;
      const pz = pos.y; // 2D y is 3D z
      const py = ceilingHeight - 0.05;

      const group = new THREE.Group();
      group.position.set(px, py, pz);

      // Housing box
      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.05, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
      );
      group.add(housing);

      // Emissive Panel downward
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x444444 })
      );
      panel.position.y = -0.026;
      panel.rotation.x = Math.PI / 2; // face down
      group.add(panel);

      // PointLight (initially intensity 0)
      const light = new THREE.PointLight(0xFFF8DC, 0, Math.sqrt(fluxPerUnit) * 1.5, 2);
      light.position.y = -0.1;
      light.castShadow = showShadows;
      // Soften shadows a bit
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.bias = -0.001; 
      group.add(light);

      scene.add(group);
      luminairesRef.current.push({ group, housing, panel, light });
    });

    // 8. Window
    const hasWindows = formData?.naturalLight?.hasWindows;
    if (hasWindows) {
      const orientation = formData?.naturalLight?.orientation || 'Sud';
      const windowArea = parseFloat(formData?.naturalLight?.windowArea) || 2;
      
      const windowW = Math.min(windowArea / 1.5, Math.max(length, width) * 0.6);
      const windowH = windowArea / windowW;
      
      const winGeo = new THREE.PlaneGeometry(windowW, windowH);
      const winMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const windowMesh = new THREE.Mesh(winGeo, winMat);
      
      const wy = workPlaneHeight + windowH/2;
      
      if (orientation === 'Nord') {
        windowMesh.position.set(centerX, wy, 0.01);
      } else if (orientation === 'Sud') {
        windowMesh.position.set(centerX, wy, width - 0.01);
      } else if (orientation === 'Est') {
        windowMesh.position.set(length - 0.01, wy, centerZ);
        windowMesh.rotation.y = Math.PI / 2;
      } else if (orientation === 'Ouest') {
        windowMesh.position.set(0.01, wy, centerZ);
        windowMesh.rotation.y = Math.PI / 2;
      }
      scene.add(windowMesh);
    }

    // 9. Sun (Geometry + Directional Light)
    const sunObj = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xFFD700 })
    );
    scene.add(sunObj);
    sunObjRef.current = sunObj;

    const sunLight = new THREE.DirectionalLight(0xFFFFF0, 0); // Intensity set in render loop
    sunLight.target.position.set(centerX, 0, centerZ);
    sunLight.castShadow = showShadows;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.left = -maxDim;
    sunLight.shadow.camera.right = maxDim;
    sunLight.shadow.camera.top = maxDim;
    sunLight.shadow.camera.bottom = -maxDim;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);
    scene.add(sunLight.target);
    sunLightRef.current = sunLight;

    // 10. Ambient Light
    const ambient = new THREE.AmbientLight(0x404060, 0.3);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    // 11. Heatmap Floor Grids (10x10 segments)
    heatmapCellsRef.current = [];
    const segCountX = 10;
    const segCountZ = 10;
    const segW = length / segCountX;
    const segZ = width / segCountZ;

    for (let x = 0; x < segCountX; x++) {
      for (let z = 0; z < segCountZ; z++) {
        const segCenterMx = x * segW + segW/2;
        const segCenterMz = z * segZ + segZ/2;

        const hmPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(segW, segZ),
          // We use BasicMaterial so shadows don't blacken the heatmap entirely
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        hmPlane.rotation.x = -Math.PI / 2;
        hmPlane.position.set(segCenterMx, 0.02, segCenterMz); // slightly above floor
        scene.add(hmPlane);
        
        heatmapCellsRef.current.push({
          mesh: hmPlane,
          cx: segCenterMx,
          cz: segCenterMz
        });
      }
    }

    // Window Resize Handler
    const onResize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight || 500;
      renderer.setSize(cw, ch);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // Initial Camera Position
    updateCameraMath();

    // Start Animation Loop once
    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount!


  // ============================================
  // CAMERA MATH (Manual Orbit Controls)
  // ============================================
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const updateCameraMath = useCallback(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    let { theta, phi, radius } = cameraAngleRef.current;
    
    const thetaRad = theta * Math.PI / 180;
    const phiRad = phi * Math.PI / 180;
    
    cam.position.x = centerX + radius * Math.sin(phiRad) * Math.sin(thetaRad);
    cam.position.y = radius * Math.cos(phiRad);
    cam.position.z = centerZ + radius * Math.sin(phiRad) * Math.cos(thetaRad);
    
    // Look at center of room at height workPlane
    cam.lookAt(centerX, workPlaneHeight, centerZ);
  }, [centerX, centerZ, workPlaneHeight]);

  // Mouse / Touch Events (Attached to container div)
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
    
    cameraAngleRef.current.theta += deltaX * 0.5;
    // Don't let camera go under floor (phi max 89) or too high straight down (phi min 5)
    cameraAngleRef.current.phi = clamp(cameraAngleRef.current.phi - deltaY * 0.5, 5, 89);
    
    lastMouseRef.current = { x: clientX, y: clientY };
    updateCameraMath();
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  const onWheel = (e) => {
    // Zoom in/out
    const zoomAmount = e.deltaY * 0.05;
    cameraAngleRef.current.radius = clamp(cameraAngleRef.current.radius + zoomAmount, 2, 50);
    updateCameraMath();
  };

  // Preset Buttons
  const setCameraPreset = (preset) => {
    const maxDim = Math.max(length, width);
    switch (preset) {
      case 'top': 
        cameraAngleRef.current = { theta: 0, phi: 5, radius: maxDim * 1.2 }; break;
      case 'front': 
        cameraAngleRef.current = { theta: 0, phi: 60, radius: maxDim * 1.5 }; break;
      case 'corner': 
        cameraAngleRef.current = { theta: 45, phi: 45, radius: maxDim * 1.5 }; break;
      default: break;
    }
    updateCameraMath();
  };


  // ============================================
  // UPDATE LOOP (React states -> ThreeJS updates)
  // ============================================
  useEffect(() => {
    if (!sceneRef.current) return;
    const profile = getActiveProfileAtHour(currentHour);

    // 1. Update Sun Position & Light
    if (sunObjRef.current && sunLightRef.current && ambientLightRef.current) {
      // isDay from 7 to 18 roughly. At 12h, omega = 0 (highest)
      const omega = (currentHour - 12) * 15 * Math.PI / 180;
      
      // Elevation curve
      const elevation = Math.cos(omega) * Math.PI/2 * 0.8; // Peak at noon
      
      const sunRad = Math.max(length, width) * 2;
      const sunX = centerX + sunRad * Math.cos(elevation) * Math.sin(omega);
      const sunY = sunRad * Math.sin(elevation);
      const sunZ = centerZ - sunRad * Math.cos(elevation) * Math.cos(omega);
      
      sunObjRef.current.position.set(sunX, sunY, sunZ);

      if (profile.isDay && sunY > 0) {
         sunObjRef.current.visible = true;
         // Intensity based on natural light / 100k lux max scale
         const intensityStr = (profile.E_nat / 50000); 
         sunLightRef.current.intensity = Math.min(1.5, Math.max(0.1, intensityStr));
         sunLightRef.current.position.copy(sunObjRef.current.position);
         rendererRef.current.setClearColor(0x87CEEB); // Sky blue
         ambientLightRef.current.intensity = 0.6;
      } else {
         sunObjRef.current.visible = false;
         sunLightRef.current.intensity = 0;
         rendererRef.current.setClearColor(0x1a1a2e); // Night
         ambientLightRef.current.intensity = 0.2;
      }
    }

    // 2. Update Luminaires
    luminairesRef.current.forEach((lum, idx) => {
      const isActive = idx < profile.N_active && profile.isOccupied;
      
      lum.housing.material.color.setHex(isActive ? 0xFFD700 : 0x888888);
      lum.panel.material.color.setHex(isActive ? 0xFFFFFF : 0xaaadbf);
      
      if (isActive) {
        lum.light.intensity = fluxPerUnit / 1500; // ThreeJS intensity ratio
      } else {
        lum.light.intensity = 0;
      }
    });

    // 3. Update Heatmap
    if (showHeatmap && profile.isOccupied) {
      heatmapCellsRef.current.forEach(cell => {
        let totalE = profile.E_nat || 0; // Natural base
        
        // Add artificial contribution (Inverse square law)
        for (let i = 0; i < profile.N_active; i++) {
           const p = positions[i];
           if (!p) continue;
           const dx = cell.cx - p.x;
           const dz = cell.cz - p.y;
           const dy = ceilingHeight;
           let dSquare = (dx*dx) + (dy*dy) + (dz*dz);
           if (dSquare < 0.5) dSquare = 0.5;
           
           totalE += (fluxPerUnit / (4 * Math.PI * dSquare));
        }

        cell.mesh.visible = true;
        if (totalE >= E_required) cell.mesh.material.color.setHex(0x86efac); // green
        else if (totalE >= E_required * 0.5) cell.mesh.material.color.setHex(0xfde68a); // yellow
        else cell.mesh.material.color.setHex(0xfca5a5); // red
      });
    } else {
      heatmapCellsRef.current.forEach(cell => cell.mesh.visible = false);
    }

    // Toggle Settings Updates
    if (ceilingRef.current) ceilingRef.current.visible = showCeiling;
    if (rendererRef.current) rendererRef.current.shadowMap.enabled = showShadows;

  }, [currentHour, showHeatmap, showCeiling, showShadows, getActiveProfileAtHour, centerX, centerZ, positions, fluxPerUnit, E_required, ceilingHeight, length, width]);


  // ============================================
  // PLAYBACK SYSTEM
  // ============================================
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentHour(h => (h + 1) % 24);
      }, playSpeed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, playSpeed]);


  // Helpers for UI
  const getModeColor = (mode) => {
    switch (mode) {
      case 'Naturel': return 'bg-green-100 text-green-800 border-green-200';
      case 'Mixte': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Artificiel': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const currentProfile = getActiveProfileAtHour(currentHour);
  const powerUsed = currentProfile.N_active * powerPerUnit;

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col w-full text-slate-200 border border-slate-700">
      
      {/* ---------------- TOP BAR ---------------- */}
      <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Disc size={20} className="text-indigo-400" />
          Simulation 3D — Vue Interactive
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="text-3xl font-mono font-bold tracking-tight">
            {currentHour.toString().padStart(2, '0')}<span className="text-slate-500">h00</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getModeColor(currentProfile.mode)}`}>
            {currentProfile.mode}
          </span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row">
        
        {/* ---------------- LEFT PANEL CONTROLS ---------------- */}
        <div className="w-full xl:w-64 bg-slate-800/50 p-6 border-r border-slate-700 font-medium">
          <div className="space-y-6">
            
            {/* Hour Slider */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 flex justify-between">
                <span>Heure du jour</span>
                <span>{currentHour}h</span>
              </label>
              <div className="flex items-center gap-2">
                <Moon size={16} className="text-slate-500" />
                <input 
                  type="range" min="0" max="23" 
                  value={currentHour} 
                  onChange={(e) => { setCurrentHour(Number(e.target.value)); setIsPlaying(false); }}
                  className="flex-1 accent-indigo-500"
                />
                <Sun size={16} className="text-amber-400" />
              </div>
            </div>

            {/* Play controls */}
            <div className="p-3 bg-slate-900 rounded-lg flex flex-col gap-3 border border-slate-700">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${isPlaying ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? 'Pause' : 'Lecture 24h'}
              </button>
              
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Vitesse :</span>
                <select 
                  value={playSpeed} 
                  onChange={(e) => setPlaySpeed(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded p-1 text-slate-200 outline-none"
                >
                  <option value={2000}>Lente</option>
                  <option value={1000}>Normale</option>
                  <option value={500}>Rapide</option>
                </select>
              </div>
            </div>

            {/* Camera Presets */}
            <div className="space-y-2 pt-2">
               <h3 className="text-xs uppercase text-slate-500 font-bold mb-2">Caméra (Glisser pour orbite)</h3>
               <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => setCameraPreset('top')} className="text-xs bg-slate-700 hover:bg-slate-600 p-2 rounded">Dessus</button>
                 <button onClick={() => setCameraPreset('front')} className="text-xs bg-slate-700 hover:bg-slate-600 p-2 rounded">Façade</button>
                 <button onClick={() => setCameraPreset('corner')} className="text-xs bg-slate-700 hover:bg-slate-600 p-2 rounded text-indigo-300">Coin</button>
               </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase text-slate-500 font-bold mb-2">Options 3D</h3>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white"><Sun size={16} /> Heatmap Sol</span>
                <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} className="accent-indigo-500 w-4 h-4" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white"><Maximize size={16} /> Afficher Plafond</span>
                <input type="checkbox" checked={showCeiling} onChange={e => setShowCeiling(e.target.checked)} className="accent-indigo-500 w-4 h-4" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white"><Eye size={16} /> Ombres actives</span>
                <input type="checkbox" checked={showShadows} onChange={e => setShowShadows(e.target.checked)} className="accent-indigo-500 w-4 h-4" />
              </label>
            </div>
          </div>
        </div>

        {/* ---------------- CENTER CANVAS (THREE.JS) ---------------- */}
        <div 
           ref={containerRef} 
           className="flex-1 bg-black relative overflow-hidden cursor-grab active:cursor-grabbing min-h-[400px]"
           onPointerDown={onPointerDown}
           onPointerMove={onPointerMove}
           onPointerUp={onPointerUp}
           onPointerLeave={onPointerUp}
           onWheel={onWheel}
           style={{ touchAction: 'none' }} // Prevent scrolling while touching canvas
        >
           {/* ThreeJS injects the <canvas> here */}
           <div className="absolute top-2 left-2 text-[10px] text-white/50 bg-black/50 px-2 py-1 rounded pointer-events-none">
             Glissez pour tourner | Molette pour zoomer
           </div>
        </div>

        {/* ---------------- RIGHT PANEL STATS ---------------- */}
        <div className="w-full xl:w-64 bg-slate-800/50 p-6 border-l border-slate-700">
           <h3 className="text-xs uppercase text-slate-500 font-bold mb-4 flex items-center gap-2">
             <Settings size={14} /> Statistiques du moment
           </h3>
           
           <div className="space-y-4">
             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 border-l-4 border-l-green-500">
                <div className="text-xs text-slate-400 mb-1">Lumière Naturelle (Sol)</div>
                <div className="text-xl font-bold text-green-400">{Math.round(currentProfile.E_nat)} <span className="text-sm font-normal text-slate-500">lux</span></div>
             </div>
             
             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 border-l-4 border-l-amber-500">
                <div className="text-xs text-slate-400 mb-1">Luminaires sollicités</div>
                <div className="text-xl font-bold text-amber-400">{currentProfile.N_active} <span className="text-sm font-normal text-slate-500">/ {N_total}</span></div>
             </div>

             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 border-l-4 border-l-blue-500">
                <div className="text-xs text-slate-400 mb-1">Charge Électrique active</div>
                <div className="text-xl font-bold text-blue-400">{Math.round(powerUsed)} <span className="text-sm font-normal text-slate-500">W</span></div>
             </div>
           </div>
        </div>
      </div>

      {/* ---------------- BOTTOM TIMELINE ---------------- */}
      <div className="bg-slate-900 p-4 border-t border-slate-700 flex flex-col gap-2">
         <div className="text-xs text-slate-500 uppercase font-bold">Profil Horodaté (24h)</div>
         <div className="flex h-8 w-full rounded-md overflow-hidden border border-slate-700 cursor-pointer">
            {Array.from({ length: 24 }).map((_, h) => {
               const p = getActiveProfileAtHour(h);
               let bg = 'bg-slate-800'; 
               if (p.mode === 'Naturel') bg = 'bg-green-500/80';
               else if (p.mode === 'Mixte') bg = 'bg-amber-500/80';
               else if (p.mode === 'Artificiel') bg = 'bg-red-500/80';
               
               const isCurrent = h === currentHour;

               return (
                 <div 
                   key={h} 
                   onClick={() => { setCurrentHour(h); setIsPlaying(false); }}
                   className={`flex-1 relative transition-all hover:brightness-125 ${bg} ${isCurrent ? 'ring-2 ring-white ring-inset z-10 scale-110 shadow-lg' : 'border-r border-slate-900/50'}`}
                   title={`${h}h: ${p.mode}`}
                 >
                    {h % 4 === 0 && (
                      <span className="absolute -bottom-5 text-[10px] text-slate-400 -ml-1 select-none pointer-events-none">{h}h</span>
                    )}
                 </div>
               )
            })}
         </div>
         <div className="h-4"></div>
      </div>

    </div>
  );
}
