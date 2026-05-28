import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Calendar, MapPin, Cloud, CloudSun, Sun, Moon, Maximize,
  SlidersHorizontal, Compass, Eye, Loader2, Check, Download
} from 'lucide-react';
import { calculateSolarIrradiance, calculateDaylightContribution, approximateSunTimes, approximateSunPosition } from '../utils/solar-calc';
import CustomSlider from './CustomSlider';
import RoomSimulation2D from './RoomSimulation2D';
import RoomSimulation3D from './RoomSimulation3D';
import { CATALOGUE_MATERIAUX } from '../data/materials-library';

const C = {
  bg: '#1C1D24',
  surface: '#23242B',
  surface2: '#2B2C35',
  border: '#3A3A44',
  primary: '#5A84D5',
  accent: '#FFB84D',
  text: '#FFFFFF',
  muted: '#A0A0A5',
  dim: '#6D6D78',
  input: '#15151B',
};

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function ScreenNaturel({ formData, updateFormData, onNext, onPrev, validationError }) {
  const location = formData?.location || { country: 'Bénin', city: 'Cotonou', climate: 'Tropical humide', latitude: 6.37 };
  const room = formData?.room || { length: 7, width: 6 };
  const floorArea = room.length * room.width;

  const initialOrientation = formData?.naturalLight?.orientation || location.buildingOrientation || 'S';
  const naturalLight = formData?.naturalLight || { hasWindows: true, windowArea: 5, orientation: initialOrientation };

  // FIX: synchronise simMonth avec formData.location.month (choisi dans Paramètres de Base)
  const [simMonth, setSimMonth] = useState(
    formData?.results?.solarData?.simMonth
      ?? formData?.location?.month
      ?? (new Date().getMonth() + 1)
  );
  const [simHour, setSimHour] = useState(
    formData?.results?.solarData?.simHour ?? 12
  );
  const handleMonthChange = (newMonth) => {
    setSimMonth(newMonth);
    updateFormData('location', { ...location, month: newMonth });
  };
  const [sunData, setSunData] = useState(() => {
    // Restore cached solar data if available (avoid reload on navigation)
    const sd = formData?.results?.solarData;
    if (sd && sd.eExterieur != null) {
      return { eExterieur: sd.eExterieur, typeCiel: sd.typeCiel || '—', f: sd.f || 0, K: sd.K || 0, skyIcon: 'Sun' };
    }
    return { eExterieur: 0, typeCiel: 'Chargement...', f: 0, K: 0, skyIcon: 'loading' };
  });
  const [sunTimes, setSunTimes] = useState({ sunrise: '06:00', sunset: '18:00' });

  // Right Option Sliders
  const [sunBrightness, setSunBrightness] = useState(100);
  const [skyBrightness, setSkyBrightness] = useState(75);
  const [ambientLight, setAmbientLight] = useState(100);
  const [sunRays, setSunRays] = useState(true);
  const [transparency, setTransparency] = useState(46);

  // Ref to avoid writing duplicate solar data to formData (prevents render loops)
  const lastWrittenKey = React.useRef(null);

  useEffect(() => {
    setSunTimes(approximateSunTimes(location.latitude, simMonth));
    let cancel = false;
    calculateSolarIrradiance({ climate: location.climate, month: simMonth, hour: simHour })
      .then(res => {
        if (!cancel) {
          setSunData(res);
          // Only persist when climate/month/hour combination actually changed
          const key = `${location.climate}|${simMonth}|${simHour}`;
          if (lastWrittenKey.current !== key) {
            lastWrittenKey.current = key;
            updateFormData('results', {
              solarData: {
                eExterieur: res.eExterieur,
                typeCiel:   res.typeCiel,
                f:          res.f,
                K:          res.K,
                ALLSKY:     res.ALLSKY,
                CLRSKY:     res.CLRSKY,
                T2M:        res.T2M,
                WS10M:      res.WS10M,
                simMonth,
                simHour,
                climate:    location.climate,
              }
            });
          }
        }
      });
    return () => { cancel = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.climate, location.latitude, simMonth, simHour]);

  const vitresMatId = formData?.materiaux?.surfaces?.vitres?.materialId;
  const vitresMat = CATALOGUE_MATERIAUX.find(m => m.id === vitresMatId);
  const transmission = vitresMat?.transmittance || 0.70;

  const [viewMode, setViewMode] = useState('3d');

  const luxInterieur = calculateDaylightContribution({
    eExterieur: sunData.eExterieur,
    windowArea: naturalLight.hasWindows ? naturalLight.windowArea : 0,
    floorArea,
    transmission,
    orientation: naturalLight.orientation,
    windowsOpen: naturalLight.windowsOpen !== false,
    doorArea: naturalLight.doorArea || 0,
  });

  // Dynamic simulation results for natural light (N=0)
  const simResults = useMemo(() => {
    const mockLighting = {
      N: 0,
      E_real: 0,
      totalPower: 0,
      S: floorArea,
      CU: 0.60,
      MF: 0.80
    };

    if (!naturalLight.hasWindows || luxInterieur <= 0) {
      const emptyZones = Array.from({ length: 12 }, (_, idx) => ({
        zone: '',
        e: 0,
        u: 0,
        ok: false,
      }));
      return {
        lighting: mockLighting,
        uniformity: { U0: 0, E_min: 0, E_moy: 0, E_max: 0, layout: { cols: 0, rows: 0, spacingX: 0, spacingY: 0 }, positions: [] },
        climate: { naturalLight: { E_natural: 0, windowArea: 0, hasWindows: false } },
        naturalLight: { hourlyProfile: {}, E_natural: 0 },
        zones: emptyZones,
      };
    }

    const zoneRows = 3, zoneCols = 4;

    // Position solaire pour déterminer la répartition dynamique
    const sunPos = approximateSunPosition(location.latitude, simMonth, simHour);
    const altitude = Math.max(0, sunPos.altitude);
    const azimuth = sunPos.azimuth;

    // Angle de la fenêtre (orientation du local)
    const ORIENT_ANGLES = {
      'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
      'S': 180, 'SO': 225, 'O': 270, 'NO': 315,
    };
    const windowAngle = ORIENT_ANGLES[naturalLight.orientation] || 180;

    // Angle relatif entre le soleil et la fenêtre (0 = soleil en face)
    let relAngle = azimuth - windowAngle;
    if (relAngle > 180) relAngle -= 360;
    if (relAngle < -180) relAngle += 360;

    // Altitude normalisée [0,1]
    const altFactor = Math.min(1, altitude / 90);

    // Déplacement latéral : quand le soleil est sur le côté, la lumière se déplace
    // vers un côté de la pièce (rows)
    const lateralDisp = -Math.sin(relAngle * Math.PI / 180) * altFactor * 0.6;

    // Pénetration : soleil haut → pénètre plus profondément dans la pièce
    const penetration = 0.6 + altFactor * 0.8;

    // Distance-based decay from window and open door
    const orient = (naturalLight.orientation || location.buildingOrientation || 'S').trim().toUpperCase();
    let x_win = 0.5, y_win = 1.0; // default Sud
    if (orient === 'N' || orient === 'NORD') { x_win = 0.5; y_win = 0.0; }
    else if (orient === 'S' || orient === 'SUD') { x_win = 0.5; y_win = 1.0; }
    else if (orient === 'O' || orient === 'OUEST' || orient === 'W') { x_win = 0.0; y_win = 0.5; }
    else if (orient === 'E' || orient === 'EST') { x_win = 1.0; y_win = 0.5; }
    else if (orient === 'NE') { x_win = 1.0; y_win = 0.0; }
    else if (orient === 'SE') { x_win = 1.0; y_win = 1.0; }
    else if (orient === 'SO') { x_win = 0.0; y_win = 1.0; }
    else if (orient === 'NO') { x_win = 0.0; y_win = 0.0; }

    const x_door = 0.2, y_door = 1.0; // Door on bottom wall (Sud) at 12% width
    const windowsOpen = naturalLight.windowsOpen !== false;
    const doorArea = parseFloat(naturalLight.doorArea) || 0;
    const windowArea = parseFloat(naturalLight.windowArea) || 0;

    const rawFactors = [];
    for (let r = 0; r < zoneRows; r++) {
      for (let c = 0; c < zoneCols; c++) {
        const x_cell = (c + 0.5) / zoneCols;
        const y_cell = (r + 0.5) / zoneRows;

        // Window distance
        const dx_win = x_cell - x_win;
        const dy_win = y_cell - y_win;
        const d_win = Math.sqrt(dx_win * dx_win + dy_win * dy_win);

        // Door distance
        const dx_door = x_cell - x_door;
        const dy_door = y_cell - y_door;
        const d_door = Math.sqrt(dx_door * dx_door + dy_door * dy_door);

        // Calculate influence from each opening
        // Softening factor 0.25 to prevent division by near-zero at boundaries
        const w_win = (naturalLight.hasWindows && windowArea > 0) ? (windowArea * transmission) / (d_win + 0.25) : 0;
        const w_door = (windowsOpen && doorArea > 0) ? (doorArea * 1.0) / (d_door + 0.25) : 0;

        // Combined opening influence
        const baseFactor = w_win + w_door;

        // Déplacement latéral selon l'angle du soleil
        const rowCenter = (r / (zoneRows - 1)) * 2 - 1;
        const latFactor = 1.0 + lateralDisp * rowCenter;

        const zoneFactor = baseFactor * latFactor * penetration;
        rawFactors.push(zoneFactor);
      }
    }

    // Scale values so that the average zone lux equals luxInterieur
    const avgFactor = rawFactors.reduce((a, b) => a + b, 0) / rawFactors.length;
    const res = rawFactors.map(factor => {
      if (avgFactor > 0) {
        return Math.max(1, Math.round((factor / avgFactor) * luxInterieur));
      }
      return 0;
    });

    const eMin = Math.min(...res);
    const eMax = Math.max(...res);
    const eMoy = Math.round(luxInterieur);
    const u0 = eMoy > 0 ? eMin / eMoy : 0;

    const zonesList = res.map((e, idx) => {
      const colIdx = idx % 4;
      const rowIdx = Math.floor(idx / 4);
      return {
        zone: `${(colIdx * (room.width / 4)).toFixed(1)}–${((colIdx + 1) * (room.width / 4)).toFixed(1)} m × ${(rowIdx * (room.length / 3)).toFixed(1)}–${((rowIdx + 1) * (room.length / 3)).toFixed(1)} m`,
        e,
        u: eMoy > 0 ? Math.round((e / eMoy) * 100) / 100 : 0,
        ok: e >= 100,
      };
    });

    return {
      lighting: mockLighting,
      uniformity: {
        U0: u0,
        E_min: eMin,
        E_moy: eMoy,
        E_max: eMax,
        layout: { cols: 0, rows: 0, spacingX: 0, spacingY: 0 },
        positions: []
      },
      climate: {
        naturalLight: {
          E_natural: luxInterieur,
          windowArea: naturalLight.windowArea,
          hasWindows: true
        }
      },
      naturalLight: {
        hourlyProfile: {},
        E_natural: luxInterieur
      },
      zones: zonesList
    };
  }, [luxInterieur, floorArea, room.width, room.length, naturalLight.windowArea, naturalLight.orientation, naturalLight.doorArea, naturalLight.windowsOpen, transmission, simHour, simMonth, location.latitude]);

  // FIX: protection contre simMonth hors bornes
  const safeMonthLabel = (MONTHS[((simMonth || 1) - 1)] || MONTHS[0]).toLowerCase();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden', color: C.text, fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── Top Header ── */}
      <div style={{ padding: '1.5rem 3rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: C.muted, fontSize: '0.875rem' }}>
          <button onClick={onPrev} style={{ background: 'transparent', border: 'none', color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </button>
          <span>Simulation</span>
          <span style={{ color: C.dim }}>·</span>
          <span style={{ color: C.text }}>Éclairage Naturel</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
           <button style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '0.5rem 1rem', borderRadius: '6px', color: C.muted, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={14} /> Beloyens
           </button>
           <button style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '0.5rem 1rem', borderRadius: '6px', color: C.text, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Luxed <Check size={14} />
           </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 3rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
           
           {/* ── Middle Controls Bar ── */}
           <div className="animate-slide-up" style={{ animationDelay: '0.05s', opacity: 0, display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.625rem 1rem', gap: '1rem', width: '280px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.muted, fontSize: '0.8125rem' }}>
                  <Calendar size={14} /> Date &amp; Heure
                </div>
                <div style={{ color: C.text, fontSize: '0.8125rem', fontWeight: 500 }}>
                  24 {safeMonthLabel}, {simHour}:00
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.625rem 1rem', gap: '1rem', width: '280px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.muted, fontSize: '0.8125rem' }}>
                  <MapPin size={14} /> Localisation
                </div>
                <div style={{ color: C.text, fontSize: '0.8125rem', fontWeight: 500 }}>
                  {location.city}, {location.country}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.625rem 1rem', gap: '1rem', flex: 1, justifyContent: 'flex-start' }}>
                {sunData.skyIcon === 'Cloud' ? <Cloud size={16} color={C.accent} /> : 
                 sunData.skyIcon === 'CloudSun' ? <CloudSun size={16} color={C.accent} /> : 
                 sunData.skyIcon === 'loading' ? <Loader2 size={16} color={C.muted} style={{ animation: 'spin 1s linear infinite' }} /> :
                 <Sun size={16} color={C.accent} />}
                 <span style={{ fontSize: '0.8125rem', color: C.text, fontWeight: 500 }}>{sunData.typeCiel}</span>
                 <div style={{ width: '1px', height: '14px', background: C.border, margin: '0 0.5rem' }} />
                 <span style={{ fontSize: '0.8125rem', color: C.muted }}>
                   {sunData.f > 0 ? `f = ${sunData.f}` : 'Nuit / données indisponibles'}
                 </span>
                 <div style={{ width: '1px', height: '14px', background: C.border, margin: '0 0.5rem' }} />
                 <span style={{ fontSize: '0.8125rem', color: C.accent, fontWeight: 600 }}>
                   {sunData.eExterieur > 0 ? `${sunData.eExterieur.toLocaleString('fr-FR')} Lux ext.` : '—'}
                 </span>
              </div>
           </div>

           {/* ── Main Canvas & Right Options ── */}
           <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: '400px' }}>
              
              {/* Left Canvas - Real Interactive 2D/3D Room Simulation Area */}
              <div className="animate-scale-in" style={{ animationDelay: '0.15s', opacity: 0, flex: 1, background: '#121215', border: `1px solid ${C.border}`, borderRadius: '12px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Internal Toolbar */}
                <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1rem', borderBottom: `1px solid ${C.border}`, background: C.surface, alignItems: 'center', zIndex: 10 }}>
                   <div style={{ display: 'flex', background: C.input, borderRadius: '4px', padding: '2px' }}>
                     <button onClick={() => setViewMode('2d')} style={{ background: viewMode === '2d' ? C.primary : 'transparent', color: viewMode === '2d' ? '#FFF' : C.dim, border: 'none', padding: '4px 12px', borderRadius: '2px', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 600 }}>2D</button>
                     <button onClick={() => setViewMode('3d')} style={{ background: viewMode === '3d' ? C.primary : 'transparent', color: viewMode === '3d' ? '#FFF' : C.dim, border: 'none', padding: '4px 12px', borderRadius: '2px', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 600 }}>3D</button>
                   </div>
                   <span style={{ fontSize: '0.75rem', color: C.muted, marginLeft: 'auto' }}>Simulation Lumière Naturelle Uniquement</span>
                </div>

                <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                   {viewMode === '2d' ? (
                     <RoomSimulation2D 
                       formData={{
                         ...formData,
                         luminaire: { ...formData?.luminaire, nbLuminaires: 0 } // force 0 artificial lights
                       }} 
                       lightingResult={simResults.lighting} 
                       uniformityResult={simResults.uniformity} 
                       climateResult={simResults.climate} 
                       naturalLightResult={simResults.naturalLight} 
                       luxLimit={3000} 
                     />
                   ) : (
                     <RoomSimulation3D 
                       formData={{
                         ...formData,
                         luminaire: { ...formData?.luminaire, nbLuminaires: 0 } // force 0 artificial lights
                       }} 
                       lightingResult={simResults.lighting} 
                       uniformityResult={simResults.uniformity} 
                       climateResult={simResults.climate} 
                       naturalLightResult={simResults.naturalLight} 
                     />
                   )}
                </div>
              </div>

              {/* Right Options Sidebar */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0, width: '280px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Simulation Temporelle</span>
                    <CloudSun size={16} color={C.primary} />
                 </div>

                 {/* Month selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                   <label style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 500 }}>Mois de simulation</label>
                   <select
                     value={simMonth}
                     onChange={e => handleMonthChange(parseInt(e.target.value))}
                     style={{
                       width: '100%',
                       background: C.input,
                       border: `1px solid ${C.border}`,
                       borderRadius: '6px',
                       padding: '0.5rem 0.75rem',
                       color: C.text,
                       fontSize: '0.8125rem',
                       outline: 'none',
                       cursor: 'pointer',
                     }}
                   >
                     {MONTHS.map((m, i) => (
                       <option key={i} value={i + 1} style={{ background: C.surface }}>{m}</option>
                     ))}
                   </select>
                 </div>

                 {/* Hour selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <label style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 500 }}>Heure de simulation</label>
                     <span style={{ fontSize: '0.8125rem', color: C.accent, fontWeight: 600 }}>{simHour}h00</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Sun size={14} color={C.muted} />
                     <CustomSlider
                       value={simHour}
                       min={6}
                       max={19}
                       onChange={e => setSimHour(parseInt(e.target.value))}
                       color={C.accent}
                     />
                     <Moon size={14} color={C.muted} />
                   </div>
                 </div>

                 <div style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: '0.875rem', borderRadius: '6px', fontSize: '0.75rem', color: C.dim, lineHeight: '1.5', flex: 1 }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>La <strong>luminosité du ciel</strong> et l'<strong>ensoleillement</strong> direct sont calculés automatiquement selon les coordonnées de gisement et les bases NASA POWER.</p>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: C.primary, fontWeight: 600, marginTop: '0.5rem' }}>
                      <Check size={14} /><span>Algorithmes solaires actifs</span>
                    </div>
                 </div>
              </div>

           </div>
           
           {/* ── Bottom Heatmap & Uniformity Row ── */}
           <div className="animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0, marginTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                 
                 {/* Real Heatmap Graphic & Uniformity Grid */}
                 <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 1rem', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                      Distribution de l'éclairement naturel (12 zones)
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(4, 1fr)`,
                      gap: 4,
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginBottom: '0.5rem',
                    }}>
                      {simResults.zones.map((z, i) => {
                        const ratio = Math.min(1, z.e / 500);
                        const bgCol = ratio > 0.6 ? '#22c55e' : ratio > 0.3 ? '#f59e0b' : '#ef4444';
                        return (
                          <div key={i} style={{
                            background: `${bgCol}20`,
                            border: `1px solid ${bgCol}50`,
                            borderRadius: 4,
                            padding: '0.5rem',
                            textAlign: 'center',
                          }}>
                            <div style={{ color: bgCol, fontWeight: 700, fontSize: 13 }}>{z.e} Lux</div>
                            <div style={{ color: C.dim, fontSize: 9 }}>U={z.u.toFixed(2)}</div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Légende */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: 10, color: C.dim, marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} /> Proche ouverture
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> Zone intermédiaire
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> Fond de pièce
                      </div>
                    </div>
                 </div>

                 {/* Results & Actions Container */}
                 <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span style={{ color: C.muted }}>Moyenne Écl. Naturel</span>
                          <span style={{ color: C.text, fontWeight: 600 }}>{simResults.uniformity.E_moy} Lux</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span style={{ color: C.muted }}>Minimum</span>
                          <span style={{ color: C.text, fontWeight: 600 }}>{simResults.uniformity.E_min} Lux</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span style={{ color: C.muted }}>Maximum</span>
                          <span style={{ color: C.text, fontWeight: 600 }}>{simResults.uniformity.E_max} Lux</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderTop: `1px solid ${C.border}`, paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                          <span style={{ color: C.primary, fontWeight: 600 }}>Uniformité U0 (naturelle)</span>
                          <span style={{ color: C.primary, fontWeight: 700 }}>{simResults.uniformity.U0.toFixed(2)}</span>
                       </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                       <button style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.65rem', color: C.text, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Download size={14} /> Exporter PNG
                       </button>
                       <button onClick={onNext} style={{ flex: 1, background: C.primary, border: 'none', borderRadius: '6px', padding: '0.65rem', color: '#FFF', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
                         onMouseEnter={e => e.currentTarget.style.background = '#4A74C5'}
                         onMouseLeave={e => e.currentTarget.style.background = C.primary}
                       >
                          Continuer
                       </button>
                    </div>
                 </div>
              </div>
           </div>
         </div>
      </div>
    </div>
  );
}
