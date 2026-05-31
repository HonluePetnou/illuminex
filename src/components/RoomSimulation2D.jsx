import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, Sun, Moon, Download, Layers, Grid as GridIcon, Users, Tag, Settings } from 'lucide-react';
import { CATALOGUE_MATERIAUX } from '../data/materials-library';

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
  const [currentHour, setCurrentHour] = useState(
    formData?.results?.solarData?.simHour ?? 12
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showWindows, setShowWindows] = useState(true);
  const [showOccupants, setShowOccupants] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const heatmapCacheRef = useRef({ key: null, canvas: null });

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

  const naturalDecayGrid = useMemo(() => {
    const hasWindows = formData?.naturalLight?.hasWindows !== false;
    const windowArea = parseFloat(formData?.naturalLight?.windowArea) || 0;
    const doorArea = parseFloat(formData?.naturalLight?.doorArea) || 0;
    const windowsOpen = formData?.naturalLight?.windowsOpen !== false;
    const orientation = formData?.naturalLight?.orientation || formData?.location?.buildingOrientation || 'S';
    
    const vitresMatId = formData?.materiaux?.surfaces?.vitres?.materialId;
    const vitresMat = CATALOGUE_MATERIAUX.find(m => m.id === vitresMatId);
    const transmission = vitresMat?.transmittance || 0.70;

    const orient = (orientation || '').trim().toUpperCase();
    let x_win = 0.5, y_win = 1.0;
    if (orient === 'N' || orient === 'NORD') { x_win = 0.5; y_win = 0.0; }
    else if (orient === 'S' || orient === 'SUD') { x_win = 0.5; y_win = 1.0; }
    else if (orient === 'O' || orient === 'OUEST' || orient === 'W') { x_win = 0.0; y_win = 0.5; }
    else if (orient === 'E' || orient === 'EST') { x_win = 1.0; y_win = 0.5; }
    else if (orient === 'NE') { x_win = 1.0; y_win = 0.0; }
    else if (orient === 'SE') { x_win = 1.0; y_win = 1.0; }
    else if (orient === 'SO') { x_win = 0.0; y_win = 1.0; }
    else if (orient === 'NO') { x_win = 0.0; y_win = 0.0; }

    const x_door = 0.2, y_door = 1.0;
    const effectiveDoorArea = windowsOpen ? doorArea : 0;

    const grid = [];
    let sumFactor = 0;
    for (let cx = 0; cx < 30; cx++) {
      const row = [];
      const x_cell = (cx + 0.5) / 30;
      for (let cy = 0; cy < 30; cy++) {
        const y_cell = (cy + 0.5) / 30;

        const dx_win = x_cell - x_win;
        const dy_win = y_cell - y_win;
        const d_win = Math.sqrt(dx_win * dx_win + dy_win * dy_win);

        const dx_door = x_cell - x_door;
        const dy_door = y_cell - y_door;
        const d_door = Math.sqrt(dx_door * dx_door + dy_door * dy_door);

        const w_win = (hasWindows && windowArea > 0) ? (windowArea * transmission) / (d_win + 0.25) : 0;
        const w_door = (effectiveDoorArea > 0) ? (effectiveDoorArea * 1.0) / (d_door + 0.25) : 0;

        const factor = w_win + w_door;
        row.push(factor);
        sumFactor += factor;
      }
      grid.push(row);
    }

    const avgFactor = sumFactor / 900;
    return grid.map(row => row.map(val => (avgFactor > 0 ? val / avgFactor : 1.0)));
  }, [formData]);

  const getActiveProfileAtHour = useCallback((hour) => {
    if (naturalLightResult?.hourlyProfile?.[hour]) {
      return naturalLightResult.hourlyProfile[hour];
    }

    // Robustness : si timeline absente ou vide → pièce occupée par défaut
    const hasTimeline = Array.isArray(usageResult?.timeline) && usageResult.timeline.length > 0;
    const isOccupied = hasTimeline
      ? (usageResult.timeline[hour]?.active ?? false)
      : true;  // défaut : occupée

    const isDay = hour >= 7 && hour <= 18;

    let mode = 'Inactif';
    let N_active = 0;
    let E_nat = 0;

    if (isOccupied) {
      if (isDay) {
        const rawENat = climateResult?.naturalLight?.E_natural || 0;
        const sunPeak = Math.max(0, 1 - Math.abs(12 - hour) / 6);
        E_nat = rawENat * sunPeak;
        N_active = climateResult?.adjusted?.N_adjusted ?? N_total;
        mode = N_active === 0 ? 'Naturel' : 'Mixte';
      } else {
        N_active = N_total;
        mode = 'Artificiel';
      }
    }

    // Fallback final : si pas de timeline et pas de climat → tout allumé
    if (!hasTimeline && N_active === 0 && N_total > 0) {
      N_active = N_total;
      mode = 'Artificiel';
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

    // 3. Heatmap (always visible when there's any light — artificial or natural)
    const hasAnyLight = profile.N_active > 0 || profile.E_nat > 0;
    if (showHeatmap && hasAnyLight) {
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

      const cacheKey = `${activeCount}-${profile.E_nat}-${luxLimit}-${roomPixelW.toFixed(1)}-${roomPixelH.toFixed(1)}`;
      
      if (heatmapCacheRef.current.key !== cacheKey || !heatmapCacheRef.current.canvas) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = roomPixelW;
        offCanvas.height = roomPixelH;
        const offCtx = offCanvas.getContext('2d');
        
        const cellW = roomPixelW / 30; // Higher resolution grid
        const cellH = roomPixelH / 30;
        
        for (let cx = 0; cx < 30; cx++) {
          for (let cy = 0; cy < 30; cy++) {
            const cellPx = cx * cellW + cellW/2;
            const cellPy = cy * cellH + cellH/2;
            
            let e_local = (profile.E_nat || 0) * naturalDecayGrid[cx][cy];
            for (let i = 0; i < activeCount; i++) {
              const p = positions[i];
              if (!p) continue;
              const dx = cellPx - (p.x * scale);
              const dy = cellPy - (p.y * scale);
              const dz = (parseFloat(formData?.room?.ceilingHeight) || 3) * scale;
              let d = Math.sqrt(dx*dx + dy*dy + dz*dz) / scale;
              if (d < 0.5) d = 0.5;
              e_local += (fluxPerUnit / (4 * Math.PI * d * d)) * 2; // Added multiplier for realistic scaling
            }
            
            offCtx.fillStyle = getFalseColor(e_local);
            offCtx.fillRect(cx * cellW, cy * cellH, cellW + 0.5, cellH + 0.5); // Add 0.5 to prevent bleeding
          }
        }
        heatmapCacheRef.current.canvas = offCanvas;
        heatmapCacheRef.current.key = cacheKey;
      }
      
      ctx.drawImage(heatmapCacheRef.current.canvas, originX, originY);
      ctx.globalAlpha = 1.0;
    }

    // 4. Fenêtre (vue de dessus)
    if (showWindows && (formData?.naturalLight?.hasWindows !== false)) {
      const orientation = formData?.naturalLight?.orientation || formData?.location?.buildingOrientation || 'Sud';
      const windowType  = formData?.room?.windowType || 'Battante';
      const isSunUp = currentHour >= 7 && currentHour <= 18;
      const windowArea  = parseFloat(formData?.naturalLight?.windowArea) || 2;
      const wPx = Math.min(roomPixelW * 0.35, windowArea * scale * 0.8);

      // position selon orientation
      let wx, wy, isHoriz, sunX, sunY;
      const orientNorm = orientation.toUpperCase().trim();
      if (orientNorm === 'NORD' || orientNorm === 'N') {
        wx = originX + (roomPixelW - wPx) / 2; wy = originY; isHoriz = true;
        sunX = wx + wPx / 2; sunY = wy - 18;
      } else if (orientNorm === 'SUD' || orientNorm === 'S') {
        wx = originX + (roomPixelW - wPx) / 2; wy = originY + roomPixelH; isHoriz = true;
        sunX = wx + wPx / 2; sunY = wy + 18;
      } else if (orientNorm === 'OUEST' || orientNorm === 'O' || orientNorm === 'W') {
        wx = originX; wy = originY + (roomPixelH - wPx) / 2; isHoriz = false;
        sunX = wx - 18; sunY = wy + wPx / 2;
      } else {
        wx = originX + roomPixelW; wy = originY + (roomPixelH - wPx) / 2; isHoriz = false;
        sunX = wx + 18; sunY = wy + wPx / 2;
      }

      // Corps fenêtre
      ctx.strokeStyle = '#60A5FA'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath();
      if (isHoriz) { ctx.moveTo(wx, wy); ctx.lineTo(wx + wPx, wy); }
      else          { ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wPx); }
      ctx.stroke();

      // Arc battant (vue de dessus = arc vers l'intérieur)
      if (windowType === 'Battante' || windowType === 'Oscillo-battante') {
        ctx.strokeStyle = 'rgba(96,165,250,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
        ctx.beginPath();
        const r = wPx * 0.5;
        if (isHoriz) {
          ctx.arc(wx + wPx / 2, wy, r, orientation === 'Nord' ? 0 : Math.PI, orientation === 'Nord' ? Math.PI : 2 * Math.PI);
        } else {
          ctx.arc(wx, wy + wPx / 2, r, orientation === 'Ouest' ? -Math.PI/2 : Math.PI/2, orientation === 'Ouest' ? Math.PI/2 : -Math.PI/2);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }

      // Jalousies (lamelles)
      if (windowType?.includes('Jalousie')) {
        ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 1;
        const steps = 5;
        for (let s = 1; s < steps; s++) {
          ctx.beginPath();
          if (isHoriz) { const x = wx + s * wPx / steps; ctx.moveTo(x, wy - 4); ctx.lineTo(x, wy + 4); }
          else         { const y = wy + s * wPx / steps; ctx.moveTo(wx - 4, y); ctx.lineTo(wx + 4, y); }
          ctx.stroke();
        }
      }

      // Soleil / nuit
      ctx.fillStyle = isSunUp ? '#FCD34D' : '#6366F1';
      ctx.font = '13px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(isSunUp ? '☀' : '🌙', sunX, sunY);
    }

    // 4b. Porte (vue de dessus)
    {
      const doorType = formData?.room?.doorType || 'Porte en bois plein';
      const dPx = Math.min(roomPixelW * 0.15, 0.9 * scale);
      // Porte sur le mur bas (z=W en coordonnées scène = bas de la vue 2D)
      const dx = originX + roomPixelW * 0.12;
      const dy = originY + roomPixelH;

      // Cadre
      ctx.strokeStyle = '#D97706'; ctx.lineWidth = 4; ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + dPx, dy); ctx.stroke();

      // Arc battant
      ctx.strokeStyle = 'rgba(217,119,6,0.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(dx, dy, dPx, -Math.PI / 2, 0); ctx.stroke(); ctx.setLineDash([]);

      // Poignée
      ctx.fillStyle = '#B45309';
      ctx.beginPath(); ctx.arc(dx + dPx - 4, dy - 4, 3, 0, Math.PI * 2); ctx.fill();

      // Label
      ctx.fillStyle = '#92400E'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('P', dx + 2, dy - 8);
    }

    // 4c. Mobilier vue de dessus
    {
      const roomType = formData?.room?.type || 'Bureau';
      const s = scale;
      ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1.5; ctx.fillStyle = 'rgba(100,116,139,0.18)';

      const rect = (rx, ry, rw, rh, label) => {
        const px = originX + rx * s; const py = originY + ry * s;
        ctx.fillRect(px, py, rw * s, rh * s);
        ctx.strokeRect(px, py, rw * s, rh * s);
        if (label) {
          ctx.fillStyle = '#94A3B8'; ctx.font = `${Math.max(8, s * 0.13)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(label, px + rw * s / 2, py + rh * s / 2);
          ctx.fillStyle = 'rgba(100,116,139,0.18)';
        }
      };

      if (roomType === 'Bureau' || roomType === 'Salle de réunion') {
        rect(0.3, length < 6 ? 0.3 : 0.5, 1.4, 0.65, 'Bureau');
        rect(0.5, length < 6 ? 1.1 : 1.3, 0.55, 0.55, '🪑');
        rect(width - 1.5, 0.5, 0.35, 1.0, '📚');
      } else if (roomType === 'Salon') {
        rect(width * 0.15, length * 0.5, 1.8, 0.75, 'Canapé');
        rect(width * 0.65, length * 0.45, 0.7, 0.65, 'Fauteuil');
        rect(width * 0.38, length * 0.35, 0.8, 0.55, 'Table basse');
      } else if (roomType === 'Salle de classe') {
        const rows = 3; const cols = Math.min(4, Math.floor(width / 1.5));
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          rect(0.4 + c * (width - 0.8) / Math.max(cols, 1), 0.6 + r * (length * 0.3), 0.6, 0.45, '');
        }
        rect(width * 0.3, 0.1, 1.4, 0.55, 'Prof');
      } else if (roomType === 'Chambre') {
        rect(0.1, length * 0.3, 1.6, 2.0, 'Lit');
        rect(width - 0.8, length * 0.2, 0.6, 1.2, 'Armoire');
      } else if (roomType === 'Commerce') {
        for (let i = 0; i < 2; i++) rect(0.3, length * 0.3 + i * length * 0.25, width * 0.6, 0.35, 'Gondole');
        rect(width - 1.0, 0.1, 0.8, 0.6, 'Caisse');
      }
    }

    // 5. Luminaires
    const lumType = (formData?.luminaire?.type || '').toLowerCase();
    const lumIsDalle = lumType.includes('dalle') || lumType.includes('panel');
    const lumIsTube  = lumType.includes('tube') || lumType.includes('réglette') || lumType.includes('fluor');
    const lumSize = Math.max(scale * 0.25, 8);

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const px = originX + pos.x * scale;
      const py = originY + pos.y * scale;
      const isActive = i < activeCount;

      if (isActive) {
        const pulse = Math.sin(timestamp / 400 + i) * 2;
        const effRadius = Math.max(15, lumSize * 1.8 + pulse);
        const grd = ctx.createRadialGradient(px, py, 0, px, py, effRadius);
        grd.addColorStop(0, 'rgba(255, 220, 120, 0.85)');
        grd.addColorStop(0.5, 'rgba(255, 184, 77, 0.25)');
        grd.addColorStop(1, 'rgba(255, 184, 77, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(px, py, effRadius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFE082'; ctx.strokeStyle = '#F59E0B';
      } else {
        ctx.fillStyle = '#2B2C35'; ctx.strokeStyle = '#4B5563';
      }

      ctx.lineWidth = 1.5;
      if (lumIsDalle) {
        // Dalle : carré
        const half = lumSize * 0.85;
        ctx.fillRect(px - half, py - half, half * 2, half * 2);
        ctx.strokeRect(px - half, py - half, half * 2, half * 2);
      } else if (lumIsTube) {
        // Tube : rectangle allongé
        ctx.fillRect(px - lumSize * 1.6, py - lumSize * 0.3, lumSize * 3.2, lumSize * 0.6);
        ctx.strokeRect(px - lumSize * 1.6, py - lumSize * 0.3, lumSize * 3.2, lumSize * 0.6);
      } else {
        // Spot / downlight : cercle
        ctx.beginPath(); ctx.arc(px, py, lumSize * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      if (showLabels) {
        ctx.fillStyle = isActive ? '#1C1D24' : '#A0A0A5';
        ctx.font = `bold ${Math.max(9, lumSize * 0.6)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, px, py + lumSize + 5);
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
    getActiveProfileAtHour, formData, E_required, fluxPerUnit, N_total, naturalDecayGrid
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
                { label: 'Distribution lumineuse', icon: Sun, state: showHeatmap, setState: setShowHeatmap },
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
