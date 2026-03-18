import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, Sun, Moon, Download, Layers, Grid as GridIcon, Users, Tag, Settings } from 'lucide-react';

export default function RoomSimulation2D({
  formData = {},
  lightingResult = {},
  uniformityResult = {},
  climateResult = {},
  naturalLightResult = {},
  usageResult = {}
}) {
  // State variables
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

  // Extract dimensions and safely fallback
  const length = parseFloat(formData?.room?.length) || 10;
  const width = parseFloat(formData?.room?.width) || 10;
  const E_required = lightingResult?.E_required || 500;
  const fluxPerUnit = parseFloat(formData?.luminaire?.fluxPerUnit) || 3000;
  const N_total = lightingResult?.N || 0;
  const occupants = parseInt(formData?.occupation?.occupants) || 5;
  const positions = uniformityResult?.positions || [];

  // Generate deterministic occupant positions
  const randomOccupants = useMemo(() => {
    const occs = [];
    // Pseudo-random based on room dimensions to keep them fixed
    for (let i = 0; i < occupants; i++) {
      const sx = Math.abs(Math.sin(length * 100 + i * 123)) * 0.9 + 0.05; // 0.05 to 0.95
      const sy = Math.abs(Math.cos(width * 100 + i * 321)) * 0.9 + 0.05;
      occs.push({ x: sx * length, y: sy * width });
    }
    return occs;
  }, [occupants, length, width]);

  // Derived profile per hour (fallback if naturalLightResult is not perfectly formed)
  const getActiveProfileAtHour = useCallback((hour) => {
    if (naturalLightResult?.hourlyProfile?.[hour]) {
      return naturalLightResult.hourlyProfile[hour];
    }
    
    const isOccupied = usageResult?.timeline?.[hour]?.active || false;
    const isDay = hour >= 7 && hour <= 18; // approx daylight hours
    
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
    
    // Cap N_active to N_total
    if (N_active > N_total) N_active = N_total;

    return {
      N_active,
      E_nat: isDay ? E_nat : 0,
      mode,
      isOccupied
    };
  }, [naturalLightResult, usageResult, climateResult, N_total]);


  const drawSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Make canvas responsive to its container
    canvas.width = container.clientWidth;
    canvas.height = 500; // Fixed height, responsive width
    
    const ctx = canvas.getContext('2d');
    const CANVAS_W = canvas.width;
    const CANVAS_H = canvas.height;
    const PADDING = 60;

    // Calculate scale and origin
    const scale = Math.min(
      (CANVAS_W - 2 * PADDING) / length,
      (CANVAS_H - 2 * PADDING) / width
    );
    
    const roomPixelW = length * scale;
    const roomPixelH = width * scale;
    const originX = (CANVAS_W - roomPixelW) / 2;
    const originY = (CANVAS_H - roomPixelH) / 2;

    const profile = getActiveProfileAtHour(currentHour);
    const activeCount = profile.N_active;

    // 1. drawBackground
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.fillRect(originX, originY, roomPixelW, roomPixelH);
    ctx.strokeRect(originX, originY, roomPixelW, roomPixelH);

    // 2. drawGrid
    if (showGrid) {
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Vertical lines
      for (let x = 1; x < length; x++) {
        const px = originX + x * scale;
        ctx.moveTo(px, originY);
        ctx.lineTo(px, originY + roomPixelH);
      }
      // Horizontal lines
      for (let y = 1; y < width; y++) {
        const py = originY + y * scale;
        ctx.moveTo(originX, py);
        ctx.lineTo(originX + roomPixelW, py);
      }
      ctx.stroke();
      
      // Axis labels
      ctx.fillStyle = '#64748B';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      for (let x = 0; x <= length; x++) {
        ctx.fillText(`${x}m`, originX + x * scale, originY - 10);
      }
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let y = 0; y <= width; y++) {
        ctx.fillText(`${y}m`, originX - 10, originY + y * scale);
      }
    }

    // 3. drawHeatmap
    if (showHeatmap && profile.isOccupied) {
      ctx.globalAlpha = 0.5;
      const cellCountX = 20;
      const cellCountY = 20;
      const cellW = length / cellCountX;
      const cellH = width / cellCountY;
      
      for (let cx = 0; cx < cellCountX; cx++) {
        for (let cy = 0; cy < cellCountY; cy++) {
          const cellPx = cx * cellW + cellW/2;
          const cellPy = cy * cellH + cellH/2;
          
          let e_local = profile.E_nat || 0; // base natural light
          
          // Add artificial light contribution
          for (let i = 0; i < activeCount; i++) {
            const p = positions[i];
            if (!p) continue;
            // distance in meters
            const dx = cellPx - p.x;
            const dy = cellPy - p.y;
            // assume ceiling height is used for 3D distance
            const dz = parseFloat(formData?.room?.ceilingHeight) || 3;
            let d = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (d < 0.5) d = 0.5; // prevent infinity
            
            // Simplified inverse square law (lux contribution)
            e_local += (fluxPerUnit / (4 * Math.PI * d * d));
          }
          
          if (e_local >= E_required) ctx.fillStyle = '#86efac';
          else if (e_local >= E_required * 0.5) ctx.fillStyle = '#fde68a';
          else ctx.fillStyle = '#fca5a5';
          
          ctx.fillRect(
             originX + cx * (roomPixelW/cellCountX), 
             originY + cy * (roomPixelH/cellCountY), 
             roomPixelW/cellCountX, 
             roomPixelH/cellCountY
          );
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // 4. drawWindows
    const hasWindows = formData?.naturalLight?.hasWindows;
    if (showWindows && hasWindows) {
      const orientation = formData?.naturalLight?.orientation || 'Sud';
      ctx.strokeStyle = '#3B82F6'; // Blue for windows
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      
      const isSunUp = currentHour >= 7 && currentHour <= 18;
      
      let wx, wy, wLen, sunX, sunY;
      
      // Default: 40% of wall length
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
      } else { // Est
        wx = originX + roomPixelW; wy = originY + roomPixelH * 0.3; wLen = roomPixelH * 0.4;
        ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wLen);
        sunX = wx + 15; sunY = wy + wLen/2;
      }
      ctx.stroke();

      if (isSunUp) {
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☀️', sunX, sunY);
      } else {
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌙', sunX, sunY);
      }
    }

    // 5. drawLuminaires
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const px = originX + pos.x * scale;
      const py = originY + pos.y * scale;
      const isActive = i < activeCount && profile.isOccupied;

      if (isActive) {
        const haloRadius = 25;
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, haloRadius);
        gradient.addColorStop(0, 'rgba(253, 224, 71, 0.6)'); // yellow-300
        gradient.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FCD34D'; // amber-300
        ctx.strokeStyle = '#92400E'; // amber-900
      } else {
        ctx.fillStyle = '#CBD5E1'; // slate-300
        ctx.strokeStyle = '#475569'; // slate-600
      }

      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (showLabels) {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, px, py + 14);
      }
    }

    // 6. drawOccupants
    if (showOccupants && profile.isOccupied) {
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      randomOccupants.forEach(occ => {
        const ox = originX + occ.x * scale;
        const oy = originY + occ.y * scale;
        ctx.fillText('🧑', ox, oy);
      });
    }

    // 7. drawInfoOverlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.fillRect(10, 10, 180, 85);
    ctx.strokeRect(10, 10, 180, 85);
    
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🕐 ${currentHour.toString().padStart(2, '0')}h00`, 20, 30);
    
    ctx.font = '12px sans-serif';
    ctx.fillText(`Mode:`, 20, 50);
    
    // Mode color
    ctx.font = 'bold 12px sans-serif';
    if (profile.mode === 'Naturel') ctx.fillStyle = '#16A34A';
    else if (profile.mode === 'Mixte') ctx.fillStyle = '#D97706';
    else if (profile.mode === 'Artificiel') ctx.fillStyle = '#DC2626';
    else ctx.fillStyle = '#64748B';
    ctx.fillText(profile.mode, 60, 50);

    ctx.fillStyle = '#334155';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Luminaires: ${activeCount} / ${N_total}`, 20, 68);
    ctx.fillText(`Apport ext.: ${Math.round(profile.E_nat)} lux`, 20, 84);

    // 8. drawCompass
    const cx = CANVAS_W - 40;
    const cy = 40;
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#94A3B8'; ctx.stroke();
    
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - 12);
    ctx.fillText('S', cx, cy + 12);
    ctx.fillText('E', cx + 12, cy);
    ctx.fillText('O', cx - 12, cy);

    // 9. drawScale
    const scaleY = CANVAS_H - 20;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, scaleY);
    ctx.lineTo(20 + 2 * scale, scaleY);
    ctx.moveTo(20, scaleY - 4); ctx.lineTo(20, scaleY + 4);
    ctx.moveTo(20 + 2 * scale, scaleY - 4); ctx.lineTo(20 + 2 * scale, scaleY + 4);
    ctx.stroke();
    
    ctx.fillStyle = '#0F172A';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2 mètres', 20 + scale, scaleY - 8);

  }, [
    currentHour, length, width, showGrid, showHeatmap, showWindows, 
    showOccupants, showLabels, positions, randomOccupants, 
    getActiveProfileAtHour, formData, E_required, fluxPerUnit, N_total
  ]);

  // Redraw when state/props change
  useEffect(() => {
    drawSimulation();
  }, [drawSimulation]);

  // Handle Play Animation
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

  const getModeColor = (mode) => {
    switch (mode) {
      case 'Naturel': return 'bg-green-100 text-green-800 border-green-200';
      case 'Mixte': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Artificiel': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const currentProfile = getActiveProfileAtHour(currentHour);
  const powerUsed = currentProfile.N_active * (parseFloat(formData?.luminaire?.powerPerUnit) || 0);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col w-full text-slate-200 border border-slate-700">
      
      {/* Top bar */}
      <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers size={20} className="text-blue-400" />
          Simulation 2D — Vue de dessus
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

      <div className="flex flex-col md:flex-row">
        
        {/* Left panel — Controls */}
        <div className="w-full md:w-64 bg-slate-800/50 p-6 border-r border-slate-700 font-medium">
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
                  className="flex-1 accent-blue-500"
                />
                <Sun size={16} className="text-amber-400" />
              </div>
            </div>

            {/* Play controls */}
            <div className="p-3 bg-slate-900 rounded-lg flex flex-col gap-3 border border-slate-700">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${isPlaying ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
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

            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase text-slate-500 font-bold mb-3">Affichage</h3>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white"><GridIcon size={16} /> Grille métrique</span>
                <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="accent-blue-500 w-4 h-4" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white"><Sun size={16} /> Heatmap (Lux)</span>
                <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} className="accent-blue-500 w-4 h-4" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white"><Layers size={16} /> Fenêtres</span>
                <input type="checkbox" checked={showWindows} onChange={e => setShowWindows(e.target.checked)} className="accent-blue-500 w-4 h-4" disabled={!formData?.naturalLight?.hasWindows} />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white"><Users size={16} /> Occupants</span>
                <input type="checkbox" checked={showOccupants} onChange={e => setShowOccupants(e.target.checked)} className="accent-blue-500 w-4 h-4" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white"><Tag size={16} /> Étiquettes</span>
                <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} className="accent-blue-500 w-4 h-4" />
              </label>
            </div>
            
          </div>
        </div>

        {/* Center — Canvas */}
        <div ref={containerRef} className="flex-1 bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
           <canvas 
             ref={canvasRef} 
             className="max-w-full rounded-lg shadow-inner bg-white"
             style={{ display: 'block' }}
           />
        </div>

        {/* Right panel — Live stats */}
        <div className="w-full md:w-64 bg-slate-800/50 p-6 border-l border-slate-700">
           <h3 className="text-xs uppercase text-slate-500 font-bold mb-4 flex items-center gap-2">
             <Settings size={14} /> Statistiques directes
           </h3>
           
           <div className="space-y-4">
             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Lumière Naturelle estimée</div>
                <div className="text-lg font-bold text-green-400">{Math.round(currentProfile.E_nat)} <span className="text-sm font-normal text-slate-500">lux</span></div>
             </div>
             
             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Luminaires sollicités</div>
                <div className="text-lg font-bold text-amber-400">{currentProfile.N_active} <span className="text-sm font-normal text-slate-500">/ {N_total}</span></div>
             </div>

             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Puissance électrique</div>
                <div className="text-lg font-bold text-blue-400">{Math.round(powerUsed)} <span className="text-sm font-normal text-slate-500">W</span></div>
             </div>

             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Énergie (cette heure)</div>
                <div className="text-lg font-bold text-indigo-400">{(powerUsed / 1000).toFixed(2)} <span className="text-sm font-normal text-slate-500">kWh</span></div>
             </div>

             {/* Export Button */}
             <button 
                onClick={exportCanvasAsPNG}
                className="w-full mt-4 flex justify-center items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white p-2 rounded-lg transition-colors text-sm font-medium"
             >
                <Download size={16} /> Exporter PNG
             </button>
           </div>
        </div>
      </div>

      {/* Bottom bar — Timeline */}
      <div className="bg-slate-900 p-4 border-t border-slate-700 flex flex-col gap-2">
         <div className="text-xs text-slate-500 uppercase font-bold">Profil Horodaté (24h)</div>
         <div className="flex h-8 w-full rounded-md overflow-hidden border border-slate-700 cursor-pointer">
            {Array.from({ length: 24 }).map((_, h) => {
               const p = getActiveProfileAtHour(h);
               let bg = 'bg-slate-800'; // inactif
               if (p.mode === 'Naturel') bg = 'bg-green-500/80';
               else if (p.mode === 'Mixte') bg = 'bg-amber-500/80';
               else if (p.mode === 'Artificiel') bg = 'bg-red-500/80';
               
               const isCurrent = h === currentHour;

               return (
                 <div 
                   key={h} 
                   onClick={() => { setCurrentHour(h); setIsPlaying(false); }}
                   className={`flex-1 relative transition-all hover:brightness-125 ${bg} ${isCurrent ? 'ring-2 ring-white ring-inset z-10' : 'border-r border-slate-900/50'}`}
                   title={`${h}h: ${p.mode}`}
                 >
                    {h % 4 === 0 && (
                      <span className="absolute -bottom-5 text-[10px] text-slate-500 -ml-1 select-none pointer-events-none">{h}h</span>
                    )}
                 </div>
               )
            })}
         </div>
         <div className="h-4"></div>{/* spacing for the labels */}
      </div>

    </div>
  );
}
