import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Eye, Compass, Sun, CloudRain,
  Sunset, Sunrise, MapPin, Gauge, CloudSun, Cloud, Loader2, CheckCircle2
} from 'lucide-react';
import { calculateSolarIrradiance, calculateDaylightContribution, approximateSunTimes } from '../utils/solar-calc';
import CustomSlider from './CustomSlider';

const C = {
  bg: '#1A1D2E',
  surface: 'rgba(30,34,55,0.85)',
  surface2: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  borderFocus: 'rgba(59,130,246,0.5)',
  primary: '#3B82F6',
  accent: '#F0A500',
  text: '#fff',
  muted: '#94A3B8',
  dim: '#64748B',
  input: 'rgba(0,0,0,0.2)',
};

const ORIENTATIONS = [
  { value: 'N',  label: 'Nord',      angle: 0 },
  { value: 'NE', label: 'Nord-Est',  angle: 45 },
  { value: 'E',  label: 'Est',       angle: 90 },
  { value: 'SE', label: 'Sud-Est',   angle: 135 },
  { value: 'S',  label: 'Sud',       angle: 180 },
  { value: 'SO', label: 'Sud-Ouest', angle: 225 },
  { value: 'O',  label: 'Ouest',     angle: 270 },
  { value: 'NO', label: 'Nord-Ouest',angle: 315 },
];

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function CompassRose({ value, onChange }) {
  return (
    <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
      {/* Cercle de fond */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${C.border}`, background: C.surface2 }} />
      <div style={{ position: 'absolute', inset: '15px', borderRadius: '50%', border: `1px dashed ${C.border}` }} />
      
      {/* Points cardinaux */}
      {ORIENTATIONS.slice(0, 4).map((o, i) => { // Afficher seulement N, E, S, O sur la boussole principale
        const main = ['N', 'E', 'S', 'O'][i];
        const rad = (o.angle - 90) * Math.PI / 180;
        const r = 52;
        const x = 75 + r * Math.cos(rad);
        const y = 75 + r * Math.sin(rad);
        const isSelected = value === main;
        return (
          <button
            key={main}
            onClick={() => onChange(main)}
            style={{
              position: 'absolute', left: x - 14, top: y - 14,
              width: 28, height: 28, borderRadius: '50%',
              background: isSelected ? C.primary : 'rgba(30,34,55,0.9)',
              border: `1.5px solid ${isSelected ? C.primary : C.border}`,
              color: isSelected ? '#fff' : C.muted,
              fontSize: '0.6875rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', boxShadow: isSelected ? '0 0 10px rgba(59,130,246,0.6)' : 'none'
            }}
          >
            {main}
          </button>
        );
      })}
      {/* Centre */}
      <div style={{ position: 'absolute', left: 70, top: 70, width: 10, height: 10, borderRadius: '50%', background: C.accent, boxShadow: `0 0 10px ${C.accent}` }} />
    </div>
  );
}

export default function ScreenNaturel({ formData, updateFormData, onNext, onPrev }) {
  const location = formData?.location || { country: 'Bénin', climate: 'Tropical humide', latitude: 6.37 };
  const room = formData?.room || { length: 7, width: 6 };
  const floorArea = room.length * room.width;

  // Initialize from location orientation if naturalLight not set
  const initialOrientation = formData?.naturalLight?.orientation || location.buildingOrientation || 'S';
  const naturalLight = formData?.naturalLight || { hasWindows: true, windowArea: 5, orientation: initialOrientation };

  // Local state for interactive 3D/Simulator
  const [simMonth, setSimMonth] = useState(6); // Juin (1-indexed for NASA)
  const [simHour, setSimHour] = useState(12); // Midi
  const [sunData, setSunData] = useState({ eExterieur: 0, typeCiel: 'Chargement...', f: 0, K: 0, skyIcon: 'loading' });
  const [sunTimes, setSunTimes] = useState({ sunrise: '06:00', sunset: '18:00' });

  useEffect(() => {
    // Calcul temps
    setSunTimes(approximateSunTimes(location.latitude, simMonth));

    // Calcul illumination exterior via NASA Power
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

  const flj = naturalLight.hasWindows ? ((naturalLight.windowArea * 0.5) / floorArea * 100).toFixed(1) : 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      {/* ── Barre titre ── */}
      <div style={{
        padding: '1.25rem 2rem 1rem', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(26,29,46,0.95)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sun size={22} color={C.accent} /> Éclairage Naturel
            </h1>
            <div style={{ fontSize: '0.8125rem', color: C.dim, marginTop: '2px' }}>
              Étape 4/7 — Intégration de la lumière du jour et climat.
            </div>
          </div>
        </div>
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

        {/* ─── Colonne Configuration ─── */}
        <div style={{ flex: 1, minWidth: '320px', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Location Info */}
          <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', background: 'rgba(240,165,0,0.08)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <MapPin size={20} color={C.accent} />
               <div>
                  <div style={{ fontSize: '0.75rem', color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contexte Climatique (NASA POWER)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>{location.country} — {location.climate}</div>
               </div>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sunrise size={16} color={C.dim} /><span style={{ fontSize: '0.875rem', color: C.muted }}>Lever du soleil</span></div>
                 <div style={{ fontWeight: 600, color: C.text }}>{sunTimes.sunrise} (Mois {simMonth})</div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sunset size={16} color={C.dim} /><span style={{ fontSize: '0.875rem', color: C.muted }}>Coucher du soleil</span></div>
                 <div style={{ fontWeight: 600, color: C.text }}>{sunTimes.sunset} (Mois {simMonth})</div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CloudRain size={16} color={C.dim} /><span style={{ fontSize: '0.875rem', color: C.muted }}>Couverture nuageuse moy.</span></div>
                 <div style={{ fontWeight: 600, color: C.text }}>~{(sunData.f * 100).toFixed(0)}%</div>
               </div>
            </div>
          </section>

          {/* Fenêtres configuration */}
          <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: C.text, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} color={C.primary} /> Configuration des ouvertures
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ color: C.muted, fontWeight: 500, fontSize: '0.875rem' }}>Présence de fenêtres</span>
              <button
                onClick={() => updateFormData('naturalLight', { hasWindows: !naturalLight.hasWindows })}
                style={{
                  width: '46px', height: '26px', borderRadius: '13px',
                  background: naturalLight.hasWindows ? C.primary : 'rgba(255,255,255,0.1)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: naturalLight.hasWindows ? '23px' : '3px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

            {naturalLight.hasWindows && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: C.muted, fontSize: '0.875rem', fontWeight: 500 }}>Surface vitrée</span>
                  <div style={{ position: 'relative', width: '130px' }}>
                    <input
                      type="number" value={naturalLight.windowArea} min={0} max={100} step={0.5}
                      onChange={e => updateFormData('naturalLight', { windowArea: Number(e.target.value) })}
                      style={{ width: '100%', background: C.input, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '8px', padding: '0.625rem 2.25rem 0.625rem 0.875rem', color: C.text, fontSize: '0.9375rem', fontWeight: 600, outline: 'none' }}
                      onFocus={e => e.currentTarget.style.border = `1px solid ${C.borderFocus}`}
                      onBlur={e => e.currentTarget.style.border = `1px solid rgba(255,255,255,0.1)`}
                    />
                    <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: C.dim, fontSize: '0.8125rem' }}>m²</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <CompassRose
                    value={naturalLight.orientation}
                    onChange={v => updateFormData('naturalLight', { orientation: v })}
                  />
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '0.75rem', color: C.dim, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orientation précise</div>
                     <select 
                       value={naturalLight.orientation}
                       onChange={e => updateFormData('naturalLight', { orientation: e.target.value })}
                       style={{ width: '100%', padding: '0.625rem', background: C.input, border: `1px solid rgba(255,255,255,0.1)`, color: C.text, borderRadius: '8px', outline: 'none' }}
                     >
                       {ORIENTATIONS.map(o => <option key={o.value} value={o.value} style={{background: '#1E2237'}}>{o.label} ({o.value})</option>)}
                     </select>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ─── Colonne Simulateur Live ─── */}
        <div style={{ flex: 1.5, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gauge size={18} color={C.primary} /> Simulateur d'apport naturel (Temps Réel)
             </h2>
             <p style={{ fontSize: '0.8125rem', color: C.muted, marginBottom: '1.5rem' }}>Aperçu de la luminosité basé sur l'irradiation solaire {location.climate} à la latitude {location.latitude}°.</p>

             {/* Contrôles Simulateur */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Mois (Moyenne)</span>
                      <span style={{ fontSize: '0.8125rem', color: C.text, fontWeight: 600 }}>{MONTHS[simMonth - 1]}</span>
                   </div>
                   <CustomSlider value={simMonth} min={1} max={12} step={1} onChange={e => setSimMonth(Number(e.target.value))} />
                </div>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Heure de la journée</span>
                      <span style={{ fontSize: '0.8125rem', color: C.text, fontWeight: 600 }}>{simHour}h00</span>
                   </div>
                   <CustomSlider value={simHour} min={6} max={19} step={1} onChange={e => setSimHour(Number(e.target.value))} />
                </div>
             </div>

             {/* Visualisation Box */}
             <div style={{ 
               flex: 1, 
               background: `linear-gradient(180deg, ${simHour < 7 || simHour > 18 ? '#0f172a' : simHour > 8 && simHour < 17 ? '#38bdf820' : '#f59e0b20'} 0%, rgba(30,34,55,1) 100%)`, 
               border: `1px solid ${C.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column',
               padding: '1.5rem', position: 'relative', overflow: 'hidden'
             }}>
                
                {/* Icône Météo */}
                <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.8 }}>
                   {sunData.skyIcon === 'Cloud' ? <Cloud size={48} color={C.muted} /> : 
                    sunData.skyIcon === 'CloudSun' ? <CloudSun size={48} color={C.muted} /> : 
                    sunData.skyIcon === 'Sun' ? <Sun size={48} color={C.accent} /> : 
                    <Loader2 size={48} color={C.muted} />}
                </div>

                <div style={{ fontSize: '0.875rem', color: C.text, fontWeight: 600, marginBottom: '0.25rem' }}>Météo simulée ({sunData.typeCiel})</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: C.accent, marginBottom: '1.5rem' }}>
                  {sunData.eExterieur.toLocaleString('fr-FR')} <span style={{ fontSize: '1rem', color: C.muted, fontWeight: 500 }}>lux extérieurs</span>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                   {/* Apport intérieur */}
                   {naturalLight.hasWindows ? (
                     <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '1.25rem', width: '100%', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: -14, left: 16, background: C.primary, color: '#fff', fontSize: '0.6875rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                           INTÉRIEUR (Apport direct)
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                           <div>
                              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                {luxInterieur.toLocaleString('fr-FR')} <span style={{ fontSize: '1.125rem', color: C.muted, fontWeight: 500 }}>lux</span>
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: C.muted, marginTop: '8px' }}>
                                Économie calculée sur cet instant. Facteur de Lumière du Jour (FLJ): ~{flj}%
                              </div>
                           </div>
                           {luxInterieur > 300 && (
                             <div style={{ padding: '0.5rem 1rem', background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <CheckCircle2 size={16} /> Éclairage suffisant
                             </div>
                           )}
                        </div>
                     </div>
                   ) : (
                     <div style={{ padding: '1.5rem', textAlign: 'center', width: '100%', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', color: C.dim, fontSize: '0.875rem' }}>
                        Pas de fenêtres. 0 apport naturel. L'éclairage artificiel fonctionnera à 100%.
                     </div>
                   )}
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* ── Pied de page ── */}
      <div style={{ padding: '1rem 2rem', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,29,46,0.98)' }}>
        <div style={{ fontSize: '0.875rem', color: C.muted }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: C.primary}}/> Paramètres environnementaux validés</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onPrev} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text, padding: '0.75rem 1.75rem', borderRadius: '10px', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ← Luminaires
          </button>
          <button onClick={onNext} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#FFF', padding: '0.75rem 2.25rem', borderRadius: '10px', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 16px rgba(59,130,246,0.4)', transition: 'filter 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            Lancer l'Analyse →
          </button>
        </div>
      </div>
    </div>
  );
}
