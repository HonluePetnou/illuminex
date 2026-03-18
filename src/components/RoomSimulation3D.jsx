import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, Sun, Moon, Maximize, Settings, Eye, Disc } from 'lucide-react';

/* ── Tokens ── */
const C = {
  bg: '#191A1E', surface: '#26272D', surface2: '#2B2C35',
  border: '#363741', primary: '#5A84D5', accent: '#FFB84D',
  text: '#FFF', muted: '#A0A0A5', dim: '#7E7E86', input: '#1E1F24',
};

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
  const [showCeiling, setShowCeiling] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showShadows, setShowShadows] = useState(true);

  const cameraAngleRef = useRef({ theta: 45, phi: 40, radius: 15 });
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
    
    const isOccupied = usageResult?.timeline?.[hour]?.active || false;
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
    if (N_active > N_total) N_active = N_total;
    return { N_active, E_nat, mode, isOccupied, isDay };
  }, [naturalLightResult, usageResult, climateResult, N_total]);


  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight || 500;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerW, containerH);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = showShadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a2e);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspect = containerW / containerH;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    cameraRef.current = camera;
    
    const maxDim = Math.max(length, width);
    cameraAngleRef.current.radius = maxDim * 1.5;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(length, width);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xD4C5A9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(centerX, 0, centerZ); floor.receiveShadow = true;
    scene.add(floor);

    // Work Plane
    const workGeo = new THREE.PlaneGeometry(length, width);
    const workMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const workPlane = new THREE.Mesh(workGeo, workMat);
    workPlane.rotation.x = -Math.PI / 2; workPlane.position.set(centerX, workPlaneHeight, centerZ); workPlane.receiveShadow = true;
    scene.add(workPlane);

    // Walls
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F0, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const wallPts = [
      { p: [centerX, ceilingHeight / 2, 0], r: [0,0,0], s: [length, ceilingHeight] }, // Back
      { p: [centerX, ceilingHeight / 2, width], r: [0,0,0], s: [length, ceilingHeight] }, // Front
      { p: [0, ceilingHeight / 2, centerZ], r: [0,Math.PI/2,0], s: [width, ceilingHeight] }, // Left
      { p: [length, ceilingHeight / 2, centerZ], r: [0,Math.PI/2,0], s: [width, ceilingHeight] }, // Right
    ];
    wallPts.forEach(w => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w.s[0], w.s[1]), wallMat);
      mesh.position.set(...w.p); mesh.rotation.set(...w.r); mesh.receiveShadow = true;
      scene.add(mesh);
    });

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(length, width);
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2; ceiling.position.set(centerX, ceilingHeight, centerZ); ceiling.visible = showCeiling;
    ceilingRef.current = ceiling; scene.add(ceiling);

    // Luminaires
    luminairesRef.current = [];
    positions.forEach((pos) => {
      const px = pos.x; const pz = pos.y; const py = ceilingHeight - 0.05;
      const group = new THREE.Group(); group.position.set(px, py, pz);

      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
      group.add(housing);

      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x444444 }));
      panel.position.y = -0.026; panel.rotation.x = Math.PI / 2; group.add(panel);

      const light = new THREE.PointLight(0xFFF8DC, 0, Math.sqrt(fluxPerUnit) * 1.5, 2);
      light.position.y = -0.1; light.castShadow = showShadows;
      light.shadow.mapSize.width = 512; light.shadow.mapSize.height = 512; light.shadow.bias = -0.001; 
      group.add(light);

      scene.add(group); luminairesRef.current.push({ group, housing, panel, light });
    });

    // Windows
    if (formData?.naturalLight?.hasWindows) {
      const orientation = formData?.naturalLight?.orientation || 'Sud';
      const windowArea = parseFloat(formData?.naturalLight?.windowArea) || 2;
      const windowW = Math.min(windowArea / 1.5, Math.max(length, width) * 0.6);
      const windowH = windowArea / windowW;
      
      const winGeo = new THREE.PlaneGeometry(windowW, windowH);
      const winMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const windowMesh = new THREE.Mesh(winGeo, winMat);
      
      const wy = workPlaneHeight + windowH/2;
      if (orientation === 'Nord') windowMesh.position.set(centerX, wy, 0.01);
      else if (orientation === 'Sud') windowMesh.position.set(centerX, wy, width - 0.01);
      else if (orientation === 'Est') { windowMesh.position.set(length - 0.01, wy, centerZ); windowMesh.rotation.y = Math.PI / 2; }
      else if (orientation === 'Ouest') { windowMesh.position.set(0.01, wy, centerZ); windowMesh.rotation.y = Math.PI / 2; }
      scene.add(windowMesh);
    }

    // Sun & Ambient
    const sunObj = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFFD700 }));
    scene.add(sunObj); sunObjRef.current = sunObj;

    const sunLight = new THREE.DirectionalLight(0xFFFFF0, 0);
    sunLight.target.position.set(centerX, 0, centerZ);
    sunLight.castShadow = showShadows;
    sunLight.shadow.mapSize.width = 1024; sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.left = -maxDim; sunLight.shadow.camera.right = maxDim;
    sunLight.shadow.camera.top = maxDim; sunLight.shadow.camera.bottom = -maxDim;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight); scene.add(sunLight.target); sunLightRef.current = sunLight;

    const ambient = new THREE.AmbientLight(0x404060, 0.3); scene.add(ambient); ambientLightRef.current = ambient;

    // Heatmap Grid
    heatmapCellsRef.current = [];
    const segCountX = 10; const segCountZ = 10;
    const segW = length / segCountX; const segZ = width / segCountZ;

    for (let x = 0; x < segCountX; x++) {
      for (let z = 0; z < segCountZ; z++) {
        const segCenterMx = x * segW + segW/2; const segCenterMz = z * segZ + segZ/2;
        const hmPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(segW, segZ),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        hmPlane.rotation.x = -Math.PI / 2; hmPlane.position.set(segCenterMx, 0.02, segCenterMz);
        scene.add(hmPlane);
        heatmapCellsRef.current.push({ mesh: hmPlane, cx: segCenterMx, cz: segCenterMz });
      }
    }

    const onResize = () => {
      const cw = container.clientWidth; const ch = container.clientHeight || 500;
      renderer.setSize(cw, ch); camera.aspect = cw / ch; camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    updateCameraMath();

    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (rendererRef.current) { container.removeChild(rendererRef.current.domElement); rendererRef.current.dispose(); }
      scene.traverse(obj => { if (obj.geometry) obj.geometry.dispose(); if (obj.material) obj.material.dispose(); });
    };
  }, []);

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const updateCameraMath = useCallback(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    let { theta, phi, radius } = cameraAngleRef.current;
    const thetaRad = theta * Math.PI / 180; const phiRad = phi * Math.PI / 180;
    cam.position.x = centerX + radius * Math.sin(phiRad) * Math.sin(thetaRad);
    cam.position.y = radius * Math.cos(phiRad);
    cam.position.z = centerZ + radius * Math.sin(phiRad) * Math.cos(thetaRad);
    cam.lookAt(centerX, workPlaneHeight, centerZ);
  }, [centerX, centerZ, workPlaneHeight]);

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
    const deltaX = clientX - lastMouseRef.current.x; const deltaY = clientY - lastMouseRef.current.y;
    cameraAngleRef.current.theta += deltaX * 0.5;
    cameraAngleRef.current.phi = clamp(cameraAngleRef.current.phi - deltaY * 0.5, 5, 89);
    lastMouseRef.current = { x: clientX, y: clientY };
    updateCameraMath();
  };

  const onPointerUp = () => { isDraggingRef.current = false; };

  const onWheel = (e) => {
    const zoomAmount = e.deltaY * 0.05;
    cameraAngleRef.current.radius = clamp(cameraAngleRef.current.radius + zoomAmount, 2, 50);
    updateCameraMath();
  };

  const setCameraPreset = (preset) => {
    const maxDim = Math.max(length, width);
    switch (preset) {
      case 'top': cameraAngleRef.current = { theta: 0, phi: 5, radius: maxDim * 1.2 }; break;
      case 'front': cameraAngleRef.current = { theta: 0, phi: 60, radius: maxDim * 1.5 }; break;
      case 'corner': cameraAngleRef.current = { theta: 45, phi: 45, radius: maxDim * 1.5 }; break;
    }
    updateCameraMath();
  };

  useEffect(() => {
    if (!sceneRef.current) return;
    const profile = getActiveProfileAtHour(currentHour);

    if (sunObjRef.current && sunLightRef.current && ambientLightRef.current) {
      const omega = (currentHour - 12) * 15 * Math.PI / 180;
      const elevation = Math.cos(omega) * Math.PI/2 * 0.8; 
      const sunRad = Math.max(length, width) * 2;
      const sunX = centerX + sunRad * Math.cos(elevation) * Math.sin(omega);
      const sunY = sunRad * Math.sin(elevation);
      const sunZ = centerZ - sunRad * Math.cos(elevation) * Math.cos(omega);
      sunObjRef.current.position.set(sunX, sunY, sunZ);

      if (profile.isDay && sunY > 0) {
         sunObjRef.current.visible = true;
         const intensityStr = (profile.E_nat / 50000); 
         sunLightRef.current.intensity = Math.min(1.5, Math.max(0.1, intensityStr));
         sunLightRef.current.position.copy(sunObjRef.current.position);
         rendererRef.current.setClearColor(0x87CEEB); 
         ambientLightRef.current.intensity = 0.6;
      } else {
         sunObjRef.current.visible = false; sunLightRef.current.intensity = 0;
         rendererRef.current.setClearColor(0x1a1a2e); ambientLightRef.current.intensity = 0.2;
      }
    }

    luminairesRef.current.forEach((lum, idx) => {
      const isActive = idx < profile.N_active && profile.isOccupied;
      lum.housing.material.color.setHex(isActive ? 0xFFD700 : 0x888888);
      lum.panel.material.color.setHex(isActive ? 0xFFFFFF : 0xaaadbf);
      if (isActive) lum.light.intensity = fluxPerUnit / 1500;
      else lum.light.intensity = 0;
    });

    if (showHeatmap && profile.isOccupied) {
      heatmapCellsRef.current.forEach(cell => {
        let totalE = profile.E_nat || 0;
        for (let i = 0; i < profile.N_active; i++) {
           const p = positions[i]; if (!p) continue;
           const dx = cell.cx - p.x; const dz = cell.cz - p.y; const dy = ceilingHeight;
           let dSquare = (dx*dx) + (dy*dy) + (dz*dz);
           if (dSquare < 0.5) dSquare = 0.5;
           totalE += (fluxPerUnit / (4 * Math.PI * dSquare));
        }
        cell.mesh.visible = true;
        if (totalE >= E_required) cell.mesh.material.color.setHex(0x86efac);
        else if (totalE >= E_required * 0.5) cell.mesh.material.color.setHex(0xfde68a);
        else cell.mesh.material.color.setHex(0xfca5a5);
      });
    } else {
      heatmapCellsRef.current.forEach(cell => cell.mesh.visible = false);
    }

    if (ceilingRef.current) ceilingRef.current.visible = showCeiling;
    if (rendererRef.current) rendererRef.current.shadowMap.enabled = showShadows;
  }, [currentHour, showHeatmap, showCeiling, showShadows, getActiveProfileAtHour, centerX, centerZ, positions, fluxPerUnit, E_required, ceilingHeight, length, width]);

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
      
      {/* ── Top Bar ── */}
      <div style={{ background: C.surface, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Disc size={18} color="#8B5CF6" />
          Simulation 3D — Vue Interactive
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
        
        {/* ── Left Panel ── */}
        <div style={{ width: '220px', background: C.surface2, padding: '1.25rem', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: C.muted, marginBottom: '0.5rem' }}>
              <span>Heure</span><span>{currentHour}h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Moon size={14} color={C.dim} />
              <input 
                type="range" min="0" max="23" value={currentHour} 
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
             <h3 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: C.dim, fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Caméra Presets</h3>
             <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
               <button onClick={() => setCameraPreset('top')} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '4px', fontSize: '0.625rem', borderRadius: '4px', cursor: 'pointer' }}>Dessus</button>
               <button onClick={() => setCameraPreset('front')} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '4px', fontSize: '0.625rem', borderRadius: '4px', cursor: 'pointer' }}>Façade</button>
               <button onClick={() => setCameraPreset('corner')} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, color: '#8B5CF6', padding: '4px', fontSize: '0.625rem', borderRadius: '4px', cursor: 'pointer' }}>Coin</button>
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
        </div>

        {/* ── Canvas ── */}
        <div 
          ref={containerRef}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}
          style={{ flex: 1, minWidth: '300px', background: '#000', cursor: isDraggingRef.current ? 'grabbing' : 'grab', touchAction: 'none', position: 'relative' }}
        >
           <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>
             Glissez pour tourner | Molette pour zoom
           </div>
        </div>

        {/* ── Right Panel ── */}
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

      {/* ── Timeline Bottom ── */}
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
