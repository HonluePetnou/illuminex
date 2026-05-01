import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, Sun, Moon, Download, Layers, Grid as GridIcon, Users, Tag, Settings } from 'lucide-react';

/* ── Tokens ── */
const C = {
  bg: '#191A1E', surface: '#26272D', surface2: '#2B2C35',
  border: '#363741', primary: '#5A84D5', accent: '#FFB84D',
  text: '#FFF', muted: '#A0A0A5', dim: '#7E7E86', input: '#1E1F24',
};

export default function RoomSimulation2D({
  formData = {},
  lightingResult = {},
  uniformityResult = {},
  climateResult = {},
  naturalLightResult = {},
  usageResult = {},
  luxLimit = 3000
}) {
  const [currentHour, setCurrentHour] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showWindows, setShowWindows] = useState(true);
  const [showOccupants, setShowOccupants] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const length = parseFloat(formData?.room?.length) || 10;
  const width = parseFloat(formData?.room?.width) || 10;
  const E_required = lightingResult?.E_required || 500;
  const fluxPerUnit = parseFloat(formData?.luminaire?.fluxPerUnit) || 3000;
  const N_total = lightingResult?.N || 0;
  const occupants = parseInt(formData?.occupation?.occupants) || 5;
  const positions = uniformityResult?.positions || [];

  const randomOccupants = useMemo(() => {
    const occs = [];
    for (let i = 0; i < occupants; i++) {
      const sx = Math.abs(Math.sin(length * 100 + i * 123)) * 0.9 + 0.05;
      const sy = Math.abs(Math.cos(width * 100 + i * 321)) * 0.9 + 0.05;
      occs.push({ x: sx * length, y: sy * width });
    }
    return occs;
  }, [occupants, length, width]);

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
        N_active = climateResult?.adjusted?.N_adjusted ?? N_total;
        mode = N_active === 0 ? 'Naturel' : 'Mixte';
      } else {
        N_active = N_total;
        mode = 'Artificiel';
      }
    }
    
    if (N_active > N_total) N_active = N_total;

    return { N_active, E_nat: isDay ? E_nat : 0, mode, isOccupied };
  }, [naturalLightResult, usageResult, climateResult, N_total]);


  const drawSimulation = useCallback((timestamp = 0) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = 500;
    
    const ctx = canvas.getContext('2d');
    const CANVAS_W = canvas.width;
    const CANVAS_H = canvas.height;
    const PADDING = 60;

    const scale = Math.min((CANVAS_W - 2 * PADDING) / length, (CANVAS_H - 2 * PADDING) / width);
    
    const roomPixelW = length * scale;
    const roomPixelH = width * scale;
    const originX = (CANVAS_W - roomPixelW) / 2;
    const originY = (CANVAS_H - roomPixelH) / 2;

    const profile = getActiveProfileAtHour(currentHour);
    const activeCount = profile.N_active;

    // 1. Background
    ctx.fillStyle = '#111216';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#1A1B20';
    ctx.strokeStyle = '#363741';
    ctx.lineWidth = 3;
    ctx.fillRect(originX, originY, roomPixelW, roomPixelH);
    ctx.strokeRect(originX, originY, roomPixelW, roomPixelH);

    // 2. Grid
    if (showGrid) {
      ctx.strokeStyle = '#2B2C35';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < length; x++) {
        const px = originX + x * scale;
        ctx.moveTo(px, originY); ctx.lineTo(px, originY + roomPixelH);
      }
      for (let y = 1; y < width; y++) {
        const py = originY + y * scale;
        ctx.moveTo(originX, py); ctx.lineTo(originX + roomPixelW, py);
      }
      ctx.stroke();
      
      ctx.fillStyle = '#7E7E86';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      for (let x = 0; x <= length; x++) ctx.fillText(`${x}m`, originX + x * scale, originY - 10);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let y = 0; y <= width; y++) ctx.fillText(`${y}m`, originX - 10, originY + y * scale);
    }

    // 3. Heatmap (False Color Lux Representation)
    if (showHeatmap && profile.isOccupied) {
      ctx.globalAlpha = 0.85; // Increase opacity for better false colors
      
      const falseColors = [
        { v: 0.1,  c: '#000000' }, { v: 0.2,  c: '#1a0519' }, { v: 0.3,  c: '#340a33' },
        { v: 0.5,  c: '#4b0082' }, { v: 0.75, c: '#8a2be2' }, { v: 1.0,  c: '#0000ff' },
        { v: 3.0,  c: '#1e90ff' }, { v: 5.0,  c: '#00bfff' }, { v: 7.5,  c: '#00ffff' },
        { v: 10,   c: '#40e0d0' }, { v: 20,   c: '#00fa9a' }, { v: 30,   c: '#00ff00' },
        { v: 50,   c: '#adff2f' }, { v: 75,   c: '#ffff00' }, { v: 100,  c: '#ffd700' },
        { v: 200,  c: '#ffa500' }, { v: 300,  c: '#ff4500' }, { v: 500,  c: '#ff0000' },
        { v: 750,  c: '#b22222' }, { v: 1000, c: '#8b0000' }, { v: 2000, c: '#a52a2a' },
        { v: 3000, c: '#d2691e' }, { v: 5000, c: '#ff8c00' }, { v: 10000, c: '#ffb6c1' },
        { v: 15000, c: '#ffffff' }
      ];

      const getFalseColor = (lux) => {
        if (lux > luxLimit) return '#111216'; // Mask out if above user limit to simulate dynamic clipping
        const match = falseColors.find(s => s.v >= lux);
        return match ? match.c : falseColors[falseColors.length - 1].c;
      };

      const cellW = roomPixelW / 30; // Higher resolution grid
      const cellH = roomPixelH / 30;
      
      for (let cx = 0; cx < 30; cx++) {
        for (let cy = 0; cy < 30; cy++) {
          const cellPx = originX + cx * cellW + cellW/2;
          const cellPy = originY + cy * cellH + cellH/2;
          
          let e_local = profile.E_nat || 0;
          for (let i = 0; i < activeCount; i++) {
            const p = positions[i];
            if (!p) continue;
            const dx = cellPx - (originX + p.x * scale);
            const dy = cellPy - (originY + p.y * scale);
            const dz = (parseFloat(formData?.room?.ceilingHeight) || 3) * scale;
            let d = Math.sqrt(dx*dx + dy*dy + dz*dz) / scale;
            if (d < 0.5) d = 0.5;
            e_local += (fluxPerUnit / (4 * Math.PI * d * d)) * 2; // Added multiplier for realistic scaling
          }
          
          ctx.fillStyle = getFalseColor(e_local);
          ctx.fillRect(originX + cx * cellW, originY + cy * cellH, cellW + 0.5, cellH + 0.5); // Add 0.5 to prevent bleeding
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // 4. Windows
    if (showWindows && (formData?.naturalLight?.hasWindows !== false)) {
      const orientation = formData?.naturalLight?.orientation || formData?.location?.buildingOrientation || 'Sud';
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      
      const isSunUp = currentHour >= 7 && currentHour <= 18;
      let wx, wy, wLen, sunX, sunY;
      
      if (orientation === 'Nord') {
        wx = originX + roomPixelW * 0.3; wy = originY; wLen = roomPixelW * 0.4;
        ctx.moveTo(wx, wy); ctx.lineTo(wx + wLen, wy);
        sunX = wx + wLen/2; sunY = wy - 15;
      } else if (orientation === 'Sud') {
        wx = originX + roomPixelW * 0.3; wy = originY + roomPixelH; wLen = roomPixelW * 0.4;
        ctx.moveTo(wx, wy); ctx.lineTo(wx + wLen, wy);
        sunX = wx + wLen/2; sunY = wy + 15;
      } else if (orientation === 'Ouest') {
        wx = originX; wy = originY + roomPixelH * 0.3; wLen = roomPixelH * 0.4;
        ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wLen);
        sunX = wx - 15; sunY = wy + wLen/2;
      } else {
        wx = originX + roomPixelW; wy = originY + roomPixelH * 0.3; wLen = roomPixelH * 0.4;
        ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wLen);
        sunX = wx + 15; sunY = wy + wLen/2;
      }
      ctx.stroke();

      ctx.fillStyle = '#FFF';
      ctx.font = '16px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(isSunUp ? 'Soleil' : 'Nuit', sunX, sunY);
    }

    // 5. Luminaires
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const px = originX + pos.x * scale;
      const py = originY + pos.y * scale;
      
      // Forcer l'affichage allumé pour le rendu visuel 2D comme demandé
      const isActive = true;

      if (isActive) {
        const pulse = Math.sin(timestamp / 400 + i) * 2;
        const effRadius = Math.max(15, 35 + pulse);
        const grd = ctx.createRadialGradient(px, py, 0, px, py, effRadius);
        grd.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
        grd.addColorStop(0.5, 'rgba(255, 184, 77, 0.3)');
        grd.addColorStop(1, 'rgba(255, 184, 77, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(px, py, effRadius, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFD080';
        ctx.strokeStyle = '#D97706';
      } else {
        ctx.fillStyle = '#2B2C35';
        ctx.strokeStyle = '#363741';
      }

      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      if (showLabels) {
        ctx.fillStyle = isActive ? '#000' : '#A0A0A5';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, px, py + 14);
      }
    }

    // 6. Occupants
    if (showOccupants && profile.isOccupied) {
      ctx.fillStyle = C.text;
      randomOccupants.forEach((occ, idx) => {
        const driftX = Math.sin(timestamp / 800 + idx) * 3;
        const driftY = Math.cos(timestamp / 800 + idx) * 3;
        ctx.beginPath();
        ctx.arc(originX + occ.x * scale + driftX, originY + occ.y * scale + driftY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.bg;
        ctx.stroke();
      });
    }

    // 7. Mini Overlay
    ctx.fillStyle = 'rgba(26, 27, 32, 0.85)';
    ctx.strokeStyle = '#363741';
    ctx.lineWidth = 1;
    ctx.fillRect(10, 10, 190, 85);
    ctx.strokeRect(10, 10, 190, 85);
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Heure: ${currentHour.toString().padStart(2, '0')}h00`, 20, 30);
    
    ctx.fillStyle = '#A0A0A5';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Mode:`, 20, 50);
    
    ctx.font = 'bold 12px sans-serif';
    if (profile.mode === 'Naturel') ctx.fillStyle = '#4ade80';
    else if (profile.mode === 'Mixte') ctx.fillStyle = '#FFB84D';
    else if (profile.mode === 'Artificiel') ctx.fillStyle = '#f87171';
    else ctx.fillStyle = '#A0A0A5';
    ctx.fillText(profile.mode, 60, 50);

    ctx.fillStyle = '#A0A0A5';
    ctx.font = '11px sans-serif';
    ctx.fillText(`Luminaires: ${activeCount} / ${N_total}`, 20, 68);
    ctx.fillText(`Apport ext.: ${Math.round(profile.E_nat)} lux`, 20, 82);

    // 8. Compass
    const cx = CANVAS_W - 30; const cy = 30;
    ctx.fillStyle = '#26272D';
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#363741'; ctx.stroke();
    
    ctx.fillStyle = '#A0A0A5';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - 10); ctx.fillText('S', cx, cy + 10);
    ctx.fillText('E', cx + 10, cy); ctx.fillText('O', cx - 10, cy);

    // 9. Scale
    const scaleY = CANVAS_H - 15;
    ctx.strokeStyle = '#A0A0A5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, scaleY); ctx.lineTo(20 + 2 * scale, scaleY);
    ctx.moveTo(20, scaleY - 4); ctx.lineTo(20, scaleY + 4);
    ctx.moveTo(20 + 2 * scale, scaleY - 4); ctx.lineTo(20 + 2 * scale, scaleY + 4);
    ctx.stroke();
    ctx.fillStyle = '#FFF';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2 mètres', 20 + scale, scaleY - 8);

  }, [
    currentHour, length, width, showGrid, showHeatmap, showWindows, 
    showOccupants, showLabels, positions, randomOccupants, 
    getActiveProfileAtHour, formData, E_required, fluxPerUnit, N_total
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId;
    const observer = new ResizeObserver(() => {
      // Container resized, the loop handles redrawing inherently.
    });
    observer.observe(container);

    const loop = () => {
      drawSimulation(Date.now());
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      observer.disconnect();
      if (animId) cancelAnimationFrame(animId);
    };
  }, [drawSimulation]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentHour(h => (h + 1) % 24);
      }, playSpeed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, playSpeed]);

  const exportCanvasAsPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      const link = document.createElement('a');
      link.download = `simulation_2D_ILLUMINEX_${currentHour}h.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
    });
  };

  const getModeColorStr = (mode) => {
    switch (mode) {
      case 'Naturel': return { bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'rgba(74,222,128,0.3)' };
      case 'Mixte': return { bg: 'rgba(255,184,77,0.1)', color: '#FFB84D', border: 'rgba(255,184,77,0.3)' };
      case 'Artificiel': return { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.3)' };
      default: return { bg: 'rgba(160,160,165,0.1)', color: '#A0A0A5', border: 'rgba(160,160,165,0.3)' };
    }
  };

  const currentProfile = getActiveProfileAtHour(currentHour);
  const powerUsed = currentProfile.N_active * (parseFloat(formData?.luminaire?.powerPerUnit) || 0);

  const modeC = getModeColorStr(currentProfile.mode);

  return (
    <div style={{ background: C.bg, borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', color: C.text }}>
      
      {/* ── Top Bar ── */}
      <div style={{ background: C.surface, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color={C.primary} />
          Simulation 2D — Vue de dessus
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
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: isPlaying ? 'rgba(255,184,77,0.2)' : C.primary, color: isPlaying ? C.accent : '#FFF', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.2s' }}
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
            <h3 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: C.dim, fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Affichage</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { label: 'Grille', icon: GridIcon, state: showGrid, setState: setShowGrid },
                { label: 'Heatmap', icon: Sun, state: showHeatmap, setState: setShowHeatmap },
                { label: 'Fenêtres', icon: Layers, state: showWindows, setState: setShowWindows, disabled: formData?.naturalLight?.hasWindows === false },
                { label: 'Occupants', icon: Users, state: showOccupants, setState: setShowOccupants },
                { label: 'Étiquettes', icon: Tag, state: showLabels, setState: setShowLabels },
              ].map(item => (
                <label key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.5 : 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: C.muted }}>
                    <item.icon size={13} /> {item.label}
                  </span>
                  <input type="checkbox" checked={item.state} onChange={e => item.setState(e.target.checked)} disabled={item.disabled} style={{ cursor: 'pointer' }} />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Canvas ── */}
        <div ref={containerRef} style={{ flex: 1, minWidth: '300px', minHeight: '500px', background: '#111216', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
           <canvas ref={canvasRef} style={{ maxWidth: '100%', borderRadius: '8px', border: `1px solid ${C.border}`, background: '#1A1B20', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }} />
        </div>

        {/* ── Right Panel ── */}
        <div style={{ width: '220px', background: C.surface2, padding: '1.25rem', borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
           <h3 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: C.dim, fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Settings size={12} /> Stats directes
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             {[
               { label: 'Lumière Naturelle', val: `${Math.round(currentProfile.E_nat)}`, unit: 'lux', color: '#4ade80' },
               { label: 'Lum. Sollicités', val: `${currentProfile.N_active}`, unit: `/ ${N_total}`, color: '#FFB84D' },
               { label: 'Puissance', val: `${Math.round(powerUsed)}`, unit: 'W', color: '#3B82F6' },
               { label: 'Énergie / heure', val: `${(powerUsed / 1000).toFixed(2)}`, unit: 'kWh', color: '#8B5CF6' },
             ].map(s => (
               <div key={s.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.625rem 0.875rem' }}>
                  <div style={{ fontSize: '0.6875rem', color: C.dim, marginBottom: '2px' }}>{s.label}</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: s.color }}>{s.val} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: C.muted }}>{s.unit}</span></div>
               </div>
             ))}
           </div>
           
           <button onClick={exportCanvasAsPNG} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: C.surface, border: `1px solid ${C.border}`, padding: '0.625rem', borderRadius: '8px', color: C.text, fontSize: '0.8125rem', cursor: 'pointer', transition: 'background 0.2s' }}>
              <Download size={14} /> Exporter PNG
           </button>
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
