import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Calendar, MapPin, Cloud, CloudSun, Sun, Moon, Maximize,
  SlidersHorizontal, Compass, Eye, Loader2, Check, Download
} from 'lucide-react';
import { calculateSolarIrradiance, calculateDaylightContribution, approximateSunTimes } from '../utils/solar-calc';
import CustomSlider from './CustomSlider';

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

export default function ScreenNaturel({ formData, updateFormData, onNext, onPrev }) {
  const location = formData?.location || { country: 'Bénin', city: 'Cotonou', climate: 'Tropical humide', latitude: 6.37 };
  const room = formData?.room || { length: 7, width: 6 };
  const floorArea = room.length * room.width;

  const initialOrientation = formData?.naturalLight?.orientation || location.buildingOrientation || 'S';
  const naturalLight = formData?.naturalLight || { hasWindows: true, windowArea: 5, orientation: initialOrientation };

  const [simMonth, setSimMonth] = useState(4); // April setting
  const [simHour, setSimHour] = useState(12);
  const [sunData, setSunData] = useState({ eExterieur: 0, typeCiel: 'Chargement...', f: 0, K: 0, skyIcon: 'loading' });
  const [sunTimes, setSunTimes] = useState({ sunrise: '06:00', sunset: '18:00' });

  // Right Option Sliders
  const [sunBrightness, setSunBrightness] = useState(100);
  const [skyBrightness, setSkyBrightness] = useState(75);
  const [ambientLight, setAmbientLight] = useState(100);
  const [sunRays, setSunRays] = useState(true);
  const [transparency, setTransparency] = useState(46);

  useEffect(() => {
    setSunTimes(approximateSunTimes(location.latitude, simMonth));
    let cancel = false;
    calculateSolarIrradiance({ climate: location.climate, month: simMonth, hour: simHour })
      .then(res => {
        if (!cancel) setSunData(res);
      });
    return () => cancel = true;
  }, [location.climate, location.latitude, simMonth, simHour]);

  const luxInterieur = calculateDaylightContribution({
    eExterieur: sunData.eExterieur,
    windowArea: naturalLight.hasWindows ? naturalLight.windowArea : 0,
    floorArea,
    orientation: naturalLight.orientation,
  });

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
                  <Calendar size={14} /> Date & Heure
                </div>
                <div style={{ color: C.text, fontSize: '0.8125rem', fontWeight: 500 }}>
                  24 {MONTHS[simMonth-1].toLowerCase()}, {simHour}:00
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
                 <Sun size={16} color={C.accent} />}
                <span style={{ fontSize: '0.8125rem', color: C.text, fontWeight: 500 }}>15°C</span>
                <div style={{ width: '1px', height: '14px', background: C.border, margin: '0 0.5rem' }} />
                <span style={{ fontSize: '0.8125rem', color: C.muted }}>34 % (Couverture)</span>
              </div>
           </div>

           {/* Transparency Row */}
           <div className="animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0, display: 'flex', alignItems: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.5rem 1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: C.muted, marginRight: '1rem', width: '120px' }}>Transparency {transparency}</span>
              <input type="range" min={0} max={100} value={transparency} onChange={e => setTransparency(Number(e.target.value))} style={{ flex: 1, cursor: 'pointer', appearance: 'none', background: C.border, height: '4px', borderRadius: '2px' }} />
           </div>

           {/* ── Main Canvas & Right Options ── */}
           <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: '350px' }}>
              
              {/* Left Canvas (Faux 3D Area) */}
              <div className="animate-scale-in" style={{ animationDelay: '0.15s', opacity: 0, flex: 1, background: '#121215', border: `2px solid #000`, borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                 {/* Faux 3D Room Render via CSS */}
                 <div style={{ 
                    position: 'absolute', inset: 0, 
                    background: `radial-gradient(ellipse at top, rgba(44, 45, 53, 0.8) 0%, rgba(21, 22, 26, 0.5) 100%)`,
                    transition: 'background 0.3s'
                  }}>
                    {/* Walls with transparency */}
                    <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '30%', background: `linear-gradient(to bottom, rgba(17,17,17,${1-transparency/100}), rgba(51,51,51,${1-transparency/100}))`, transform: 'perspective(500px) rotateX(-20deg)', transformOrigin: 'top', transition: 'background 0.3s' }} />
                    <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: 0, width: '20%', background: `linear-gradient(to right, rgba(17,17,17,${1-transparency/100}), rgba(44,45,53,${1-transparency/100}))`, transform: 'perspective(500px) rotateY(20deg)', transformOrigin: 'left', transition: 'background 0.3s' }} />
                    <div style={{ position: 'absolute', top: '10%', bottom: '10%', right: 0, width: '20%', background: `linear-gradient(to left, rgba(17,17,17,${1-transparency/100}), rgba(44,45,53,${1-transparency/100}))`, transform: 'perspective(500px) rotateY(-20deg)', transformOrigin: 'right', transition: 'background 0.3s' }} />
                    {/* Floor grid */}
                    <div style={{ position: 'absolute', top: '20%', bottom: '5%', left: '15%', right: '15%', border: '1px solid rgba(68, 68, 68, 0.4)', backgroundImage: 'linear-gradient(rgba(68, 68, 68, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(68, 68, 68, 0.5) 1px, transparent 1px)', backgroundSize: '40px 40px', transform: 'perspective(500px) rotateX(40deg)', transformOrigin: 'bottom', opacity: 0.5, transition: 'opacity 0.3s' }} />
                    {/* Window light */}
                    <div style={{ position: 'absolute', top: '5%', left: '40%', right: '40%', height: '15%', background: `rgba(255, 253, 240, 0.9)`, boxShadow: `0 0 40px rgba(255, 253, 240, 0.8)`, zIndex: 2, transition: 'all 0.3s' }} />
                    {/* Volumetric Rays */}
                    <div style={{ position: 'absolute', top: '15%', left: '30%', width: '40%', height: '70%', background: `linear-gradient(170deg, rgba(255,255,200,0.5) 0%, rgba(255,255,200,0) 80%)`, transform: 'perspective(500px) rotateX(40deg)', transformOrigin: 'top', filter: 'blur(8px)', zIndex: 3, transition: 'background 0.3s' }} />
                 </div>
              </div>

              {/* Right Options Sidebar */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0, width: '280px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Calcul Automatique</span>
                    <CloudSun size={14} color={C.primary} />
                 </div>

                 <div style={{ background: C.surface2, border: `1px solid ${C.border}`, padding: '1rem', borderRadius: '6px', fontSize: '0.8125rem', color: C.dim, lineHeight: '1.6', flex: 1 }}>
                    <p style={{ margin: '0 0 1rem 0' }}>En accord avec la nouvelle directive, la <strong>luminosité du ciel</strong> et l'<strong>ensoleillement</strong> direct ne sont pas choisis manuellement par l'utilisateur.</p>
                    <p style={{ margin: '0 0 1rem 0' }}>Ces valeurs sont <strong>extraites automatiquement</strong> à partir des tables climatiques (modélisation météorologique via les formules de calcul du PDF).</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '0.5rem', background: 'rgba(90, 132, 213, 0.1)', color: C.primary, borderRadius: '4px' }}>
                      <Check size={16} /><span>Base données intégrée active</span>
                    </div>
                    <div style={{ marginTop: '1rem', color: C.text, fontSize: '0.75rem', background: C.input, padding: '0.5rem', borderRadius: '4px' }}>
                       Climat: <span style={{ color: C.accent }}>{location.climate}</span>
                    </div>
                 </div>
              </div>

           </div>
           

           {/* ── Bottom Heatmap Row ── */}
           <div className="animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0, marginTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.875rem', color: C.muted, marginBottom: '0.75rem' }}>
                 Avrg. rlorte: <span style={{ color: C.text }}>{Math.round(luxInterieur)} Lux</span>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                 
                 {/* Heatmap Graphic */}
                 <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1rem', position: 'relative' }}>
                    {/* Mock Heatmap */}
                    <div style={{ height: '80px', width: '100%', borderRadius: '4px', background: 'radial-gradient(ellipse at center, #FFFDF0 0%, #FDE047 20%, #4ADE80 50%, #1E3A8A 100%)', position: 'relative' }}>
                       {/* Light sources mock */}
                       <div style={{ position: 'absolute', top: '50%', left: '25%', width: '12px', height: '12px', background: '#FFF', transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px #FFF' }} />
                       <div style={{ position: 'absolute', top: '50%', left: '50%', width: '12px', height: '12px', background: '#FFF', transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px #FFF' }} />
                       <div style={{ position: 'absolute', top: '50%', left: '75%', width: '12px', height: '12px', background: '#FFF', transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px #FFF' }} />
                    </div>
                    {/* Axis numbers */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', color: C.dim, marginTop: '8px' }}>
                       {Array.from({ length: 30 }).map((_, i) => <span key={i}>{i * 10}</span>)}
                    </div>
                 </div>

                 {/* Results & Actions Container */}
                 <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span style={{ color: C.muted }}>Averenne</span>
                          <span style={{ color: C.text }}>{Math.round(luxInterieur)} Lux</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span style={{ color: C.muted }}>Max</span>
                          <span style={{ color: C.text }}>{Math.round(luxInterieur * 2.6)} Lux</span>
                       </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'flex-end' }}>
                       <button style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.75rem', color: C.text, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <Download size={14} /> Exporter les
                       </button>
                       <button onClick={onNext} style={{ flex: 1, background: C.primary, border: 'none', borderRadius: '6px', padding: '0.75rem', color: '#FFF', fontSize: '0.8125rem', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(90,132,213,0.3)' }}
                         onMouseEnter={e => e.currentTarget.style.background = '#4A74C5'}
                         onMouseLeave={e => e.currentTarget.style.background = C.primary}
                       >
                          Continuer l'analyse
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
