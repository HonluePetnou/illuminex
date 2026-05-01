import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Settings2, Maximize2, Home,
  LayoutDashboard, ChevronDown, MapPin, Compass, Globe
} from 'lucide-react';
import { DEFAULT_LOCATIONS } from '../data/default-locations';

/* ── Tokens Design System ── */
const C = {
  bg: '#1C1D24',
  surface: '#23242B',
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

/* ── Field label + input row ── */
function FieldRow({ label, unit, value, onChange, min, max, step = 0.1, type = 'number' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <label style={{ color: C.muted, fontSize: '0.875rem', flexShrink: 0, minWidth: '130px', fontWeight: 500 }}>
        {label}
      </label>
      <div style={{ position: 'relative', width: '160px' }}>
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(Number(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            background: C.input,
            border: `1px solid ${focused ? C.borderFocus : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            padding: '0.625rem 2.5rem 0.625rem 0.875rem',
            color: C.text,
            fontSize: '0.9375rem',
            fontWeight: 600,
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
        />
        {unit && (
          <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: C.dim, fontSize: '0.8125rem' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Sélect ── */
function SelectRow({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <label style={{ color: C.muted, fontSize: '0.875rem', flexShrink: 0, minWidth: '130px', fontWeight: 500 }}>
        {label}
      </label>
      <div style={{ position: 'relative', width: '160px' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            background: C.surface2,
            border: `1px solid ${focused ? C.borderFocus : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            padding: '0.625rem 2rem 0.625rem 0.875rem',
            color: C.text,
            fontSize: '0.8125rem',
            fontWeight: 500,
            outline: 'none',
            appearance: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#1E2237' }}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} color={C.dim} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════ */
export default function ScreenDimensions({ formData, updateFormData, onNext, onPrev }) {
  const room = formData?.room || { length: 7, width: 6, ceilingHeight: 3, workPlaneHeight: 0.85, type: 'Bureau' };
  const occupation = formData?.occupation || { buildingType: 'Bureau/Administration', occupants: 4, hoursPerDay: 8, daysPerWeek: 5 };
  const location = formData?.location || { country: 'Bénin', climate: 'Tropical humide', buildingOrientation: 'N' };

  const surface = ((room.length || 0) * (room.width || 0)).toFixed(1);
  const volume  = ((room.length || 0) * (room.width || 0) * (room.ceilingHeight || 0)).toFixed(1);

  const buildingOptions = [
    { value: 'Bureau/Administration', label: 'Bureau / Admin' },
    { value: 'Scolaire',              label: 'Scolaire / École' },
    { value: 'Santé',                 label: 'Santé / Hôpital' },
    { value: 'Industrie',             label: 'Industriel' },
    { value: 'Commercial',            label: 'Commerce détail' },
    { value: 'Résidentiel',           label: 'Résidentiel' },
  ];

  const orientationOptions = [
    { value: 'N', label: 'Nord' },
    { value: 'NE', label: 'Nord-Est' },
    { value: 'E', label: 'Est' },
    { value: 'SE', label: 'Sud-Est' },
    { value: 'S', label: 'Sud' },
    { value: 'SO', label: 'Sud-Ouest' },
    { value: 'O', label: 'Ouest' },
    { value: 'NO', label: 'Nord-Ouest' },
  ];

  const handleCountryChange = (countryName) => {
    const loc = DEFAULT_LOCATIONS.find(l => l.country === countryName);
    if (loc) {
      updateFormData('location', {
        country: loc.country,
        climate: loc.climate,
        city: loc.representativeCity,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
    }
  };

  const countriesWithRegions = [
    { region: 'Afrique de l\'Ouest',     list: DEFAULT_LOCATIONS.filter(l => ['Bénin','Togo','Nigeria','Côte d\'Ivoire','Ghana','Sénégal','Mali','Burkina Faso','Niger','Guinée','Mauritanie'].includes(l.country)) },
    { region: 'Afrique Centrale & Est',  list: DEFAULT_LOCATIONS.filter(l => ['Cameroun','RDC','Gabon','Tchad','Kenya','Tanzanie','Éthiopie'].includes(l.country)) },
    { region: 'Afrique Australe / OC',   list: DEFAULT_LOCATIONS.filter(l => ['Mozambique','Madagascar'].includes(l.country)) },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      {/* ── Barre de navigation / titre ── */}
      <div style={{
        padding: '1.25rem 2rem 1rem',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#1C1D24',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutDashboard size={22} color={C.primary} /> Paramètres de Base
            </h1>
            <div style={{ fontSize: '0.8125rem', color: C.dim, marginTop: '2px' }}>
              Étape 1/7 — Dimensions, localisation et usages.
            </div>
          </div>
        </div>

        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: C.surface2, border: `1px solid ${C.border}`,
          padding: '0.5rem 1rem', borderRadius: '8px',
          color: C.muted, cursor: 'pointer', fontSize: '0.8125rem',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = C.text}
        onMouseLeave={e => e.currentTarget.style.color = C.muted}
        >
          <Settings2 size={14} /> Options expertes
        </button>
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', gap: '2rem' }}>

        {/* ─── PRÉVISUALISATION 3D ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

          {/* Boîte 3D stylisée */}
          <div className="animate-scale-in" style={{
            flex: 1,
            background: 'linear-gradient(160deg, #1E2237 0%, #131624 100%)',
            border: `1px solid ${C.border}`,
            borderRadius: '16px',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', minHeight: '300px',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
            opacity: 0,
            animationDelay: '0.05s'
          }}>
            {/* Room 3D wireframe */}
            <div style={{
              width: '55%', height: '60%',
              border: `1.5px solid rgba(59,130,246,0.4)`,
              transform: 'perspective(800px) rotateX(15deg) rotateY(-20deg)',
              position: 'relative',
              background: 'rgba(59,130,246,0.03)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}>
              {/* Luminaires */}
              {[{ left: '25%' }, { left: '65%' }].map((p, i) => (
                <div key={i} style={{ position: 'absolute', top: '10%', ...p, width: '28px', height: '6px', background: C.accent, borderRadius: '3px', boxShadow: `0 0 15px 4px rgba(240,165,0,0.4)` }} />
              ))}
              {/* Paroi droite */}
              <div style={{ position: 'absolute', right: 0, bottom: 0, width: '28%', height: '70%', border: `1.5px solid rgba(59,130,246,0.25)`, background: 'rgba(59,130,246,0.02)' }} />
              
              {/* Plan de travail (Grille) */}
              <div style={{ position: 'absolute', bottom: '26%', left: '10%', right: '32%', height: '1px', background: 'rgba(255,255,255,0.15)', boxShadow: '0 0 10px rgba(255,255,255,0.1)' }} />
              
              {/* Indication orientation sur le sol */}
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) translateY(50%) rotateX(-90deg)', fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '2px' }}>
                {location.buildingOrientation}
              </div>
            </div>

            {/* Légende surface (gauche) */}
            <div style={{
              position: 'absolute', bottom: '16px', left: '16px',
              background: '#23242B', backdropFilter: 'blur(8px)',
              border: `1px solid ${C.border}`, borderRadius: '10px',
              padding: '0.625rem 1rem',
              display: 'flex', gap: '1.5rem',
            }}>
              <div>
                <div style={{ fontSize: '0.625rem', color: C.dim, marginBottom: '2px', fontWeight: 600, letterSpacing: '0.05em' }}>SURFACE</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: C.text }}>{surface} <span style={{fontSize:'0.75rem', color:C.muted}}>m²</span></div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <div style={{ fontSize: '0.625rem', color: C.dim, marginBottom: '2px', fontWeight: 600, letterSpacing: '0.05em' }}>VOLUME</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: C.text }}>{volume} <span style={{fontSize:'0.75rem', color:C.muted}}>m³</span></div>
              </div>
            </div>

            {/* Climat badge (droite) */}
            <div style={{
              position: 'absolute', top: '16px', left: '16px',
              background: 'rgba(240,165,0,0.1)', border: `1px solid rgba(240,165,0,0.2)`,
              borderRadius: '8px', padding: '0.4rem 0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <Globe size={16} color={C.accent} style={{ flexShrink: 0 }} />
              <div>
                 <div style={{ fontSize: '0.625rem', color: C.accent, fontWeight: 700, letterSpacing: '0.05em' }}>{location.country.toUpperCase()}</div>
                 <div style={{ fontSize: '0.6875rem', color: '#fff', opacity: 0.9 }}>{location.climate}</div>
              </div>
            </div>

            <button style={{ position: 'absolute', top: '16px', right: '16px', background: '#23242B', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '6px', color: C.muted, cursor: 'pointer', display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Stats rapides (Dimensions raw) */}
          <div className="animate-scale-in" style={{ animationDelay: '0.15s', opacity: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Longueur (L)', value: room.length, unit: 'm' },
              { label: 'Largeur (W)',  value: room.width,  unit: 'm' },
              { label: 'Hauteur (H)',  value: room.ceilingHeight, unit: 'm' },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '0.875rem 1rem' }}>
                <div style={{ fontSize: '0.6875rem', color: C.dim, marginBottom: '6px', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text }}>{s.value}<span style={{ fontSize: '0.8125rem', color: C.muted, marginLeft: '4px' }}>{s.unit}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── FORMULAIRE ─── */}
        <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Dimensions */}
          <section className="animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: C.text, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutDashboard size={16} color={C.primary} /> Dimensions de la pièce
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FieldRow label="Longueur" unit="m" value={room.length} min={1} max={100} onChange={v => updateFormData('room', { length: v })} />
              <FieldRow label="Largeur"  unit="m" value={room.width}  min={1} max={100} onChange={v => updateFormData('room', { width: v  })} />
              <FieldRow label="Hauteur totale" unit="m" value={room.ceilingHeight} min={2} max={20} onChange={v => updateFormData('room', { ceilingHeight: v })} />
              <FieldRow label="Plan de travail" unit="m" value={room.workPlaneHeight} min={0} max={2} step={0.05} onChange={v => updateFormData('room', { workPlaneHeight: v })} />
            </div>
          </section>

          {/* Localisation et Orientation */}
          <section className="animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: C.text, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color={C.accent} /> Localisation & Apports Solaire
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Selecteur Pays complexe */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <label style={{ color: C.muted, fontSize: '0.875rem', flexShrink: 0, minWidth: '130px', fontWeight: 500 }}>Pays (Climat)</label>
                <div style={{ position: 'relative', width: '160px' }}>
                  <select
                    value={location.country}
                    onChange={e => handleCountryChange(e.target.value)}
                    style={{
                      width: '100%', background: C.surface2, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '8px',
                      padding: '0.625rem 2rem 0.625rem 0.875rem', color: C.text, fontSize: '0.8125rem', fontWeight: 500,
                      outline: 'none', appearance: 'none', cursor: 'pointer',
                    }}
                  >
                    {countriesWithRegions.map(g => (
                      <optgroup key={g.region} label={g.region} style={{ background: '#1E2237', color: C.muted, fontStyle: 'normal' }}>
                        {g.list.map(l => (
                          <option key={l.country} value={l.country} style={{ color: '#fff' }}>{l.country}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown size={13} color={C.dim} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>
              <SelectRow
                label="Orientation façade"
                value={location.buildingOrientation}
                onChange={v => updateFormData('location', { ...location, buildingOrientation: v })}
                options={orientationOptions}
              />
              <div style={{ marginTop: '0.25rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: C.muted }}>
                Climat chargé: <strong style={{color:'#fff'}}>{location.climate}</strong> <br/>
                Ville gisement: <span style={{color:'#fff'}}>{location.city || location.country}</span>
              </div>
              
              <FieldRow 
                label="Surface Vitrée" 
                unit="m²" 
                value={formData?.naturalLight?.windowArea || 0} 
                min={0} max={50} step={0.5} 
                onChange={v => updateFormData('naturalLight', { ...formData?.naturalLight, windowArea: v, hasWindows: v > 0 })} 
              />
              <SelectRow
                label="Type de vitrage"
                value={room.glazingType || 'Double standard'}
                onChange={v => updateFormData('room', { ...room, glazingType: v })}
                options={[
                  {value: 'Simple vitrage', label: 'Simple vitrage'},
                  {value: 'Double standard', label: 'Double standard'},
                  {value: 'Double low-E', label: 'Double low-E'},
                  {value: 'Triple vitrage', label: 'Triple vitrage'},
                  {value: 'Vitrage teinté', label: 'Vitrage teinté'}
                ]}
              />
              <SelectRow
                label="État des fenêtres"
                value={formData?.naturalLight?.windowsOpen === false ? 'Fermées' : 'Ouvertes'}
                onChange={v => updateFormData('naturalLight', { ...formData?.naturalLight, windowsOpen: v === 'Ouvertes' })}
                options={[
                  {value: 'Ouvertes', label: 'Ouvertes (Ventilées)'},
                  {value: 'Fermées', label: 'Fermées'}
                ]}
              />
            </div>
          </section>

          {/* Occupation et Bâtiment */}
          <section className="animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: C.text, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={16} color={C.primary} /> Usage & Occupation
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <SelectRow
                label="Bâtiment"
                value={occupation.buildingType || 'Bureau/Administration'}
                onChange={v => updateFormData('occupation', { buildingType: v })}
                options={buildingOptions}
              />
              <FieldRow label="Nb d'occupants" unit="pers." value={occupation.occupants} min={1} max={500} step={1} onChange={v => updateFormData('occupation', { occupants: v })} />
              <FieldRow label="Horaires / Jour" unit="h" value={occupation.hoursPerDay} min={1} max={24} step={0.5} onChange={v => updateFormData('occupation', { hoursPerDay: v })} />
              <FieldRow label="Jours / Sem." unit="j" value={occupation.daysPerWeek} min={1} max={7} step={1} onChange={v => updateFormData('occupation', { daysPerWeek: v })} />
            </div>
          </section>

        </div>
      </div>

      {/* ── Pied de page ── */}
      <div style={{
        padding: '1rem 2rem',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#1C1D24',
      }}>
        <div style={{ fontSize: '0.875rem', color: C.muted }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: C.primary}}/> Étape validée</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onPrev}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text, padding: '0.75rem 1.75rem', borderRadius: '10px', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ← Projets
          </button>
          <button
            onClick={onNext}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff', padding: '0.75rem 2.25rem', borderRadius: '10px', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 16px rgba(59,130,246,0.4)', transition: 'filter 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            Matériaux & Surfaces →
          </button>
        </div>
      </div>
    </div>
  );
}
