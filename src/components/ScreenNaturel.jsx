import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, MapPin, Sun, CloudSun, CloudRain,
  Wind, Compass, Eye, Calendar, SunMedium
} from 'lucide-react';

const C = {
  bg: '#191A1E', surface: '#26272D', surface2: '#2B2C35',
  border: '#363741', primary: '#5A84D5', accent: '#FFB84D',
  text: '#FFF', muted: '#A0A0A5', dim: '#7E7E86', input: '#1E1F24',
};

/* Données climato par zone béninoise */
const ZONES = {
  'Sud (Cotonou, Porto-Novo)': {
    lat: 6.37, lon: 2.42,
    irr_annuel: '1800–1950 kWh/m²/an',
    soleil: '2 500 h/an',
    pluie: '1 200–1 400 mm/an',
    saisons: 'Deux saisons des pluies (avr–juil, oct–nov)',
    icon: CloudSun, color: '#FFB84D',
    lux_midi: 80000,
  },
  'Centre (Bohicon, Abomey)': {
    lat: 7.17, lon: 1.99,
    irr_annuel: '1 900–2 050 kWh/m²/an',
    soleil: '2 600 h/an',
    pluie: '1 100–1 200 mm/an',
    saisons: 'Une saison sèche longue (nov–avr)',
    icon: SunMedium, color: '#F59E0B',
    lux_midi: 90000,
  },
  'Nord (Parakou, Natitingou)': {
    lat: 9.34, lon: 2.63,
    irr_annuel: '2 000–2 200 kWh/m²/an',
    soleil: '2 800 h/an',
    pluie: '900–1 100 mm/an',
    saisons: 'Sahélien semi-aride (pluies mai–sept)',
    icon: Sun, color: '#EF4444',
    lux_midi: 100000,
  },
};

const ORIENTATIONS = [
  { value: 'Nord',    label: 'Nord',     angle: 0 },
  { value: 'Est',     label: 'Est',     angle: 90 },
  { value: 'Sud',     label: 'Sud',     angle: 180 },
  { value: 'Ouest',   label: 'Ouest',   angle: 270 },
  { value: 'Nord-Est', label: 'N-E',    angle: 45 },
  { value: 'Nord-Ouest', label: 'N-O',  angle: 315 },
  { value: 'Sud-Est', label: 'S-E',     angle: 135 },
  { value: 'Sud-Ouest', label: 'S-O',   angle: 225 },
];

/* ── Bouton d'orientation en roue ── */
function CompassRose({ value, onChange }) {
  return (
    <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
      {/* Cercle de fond */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${C.border}`, background: `${C.surface2}` }} />
      {/* Points cardinaux */}
      {ORIENTATIONS.slice(0, 4).map(o => {
        const rad = (o.angle - 90) * Math.PI / 180;
        const r = 56;
        const x = 80 + r * Math.cos(rad);
        const y = 80 + r * Math.sin(rad);
        const isSelected = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              position: 'absolute',
              left: x - 14, top: y - 14,
              width: 28, height: 28, borderRadius: '50%',
              background: isSelected ? C.primary : C.surface,
              border: `1.5px solid ${isSelected ? C.primary : C.border}`,
              color: isSelected ? '#fff' : C.muted,
              fontSize: '0.625rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
      {/* Centre */}
      <div style={{ position: 'absolute', left: 72, top: 72, width: 16, height: 16, borderRadius: '50%', background: C.accent, boxShadow: `0 0 12px ${C.accent}` }} />
    </div>
  );
}

/* ═══════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════ */
export default function ScreenNaturel({ formData, updateFormData, onNext, onPrev }) {
  const location = formData?.location || { zone: 'Sud (Cotonou, Porto-Novo)' };
  const naturalLight = formData?.naturalLight || { hasWindows: true, orientation: 'Sud', windowArea: 5 };

  const zoneData = ZONES[location.zone] || ZONES['Sud (Cotonou, Porto-Novo)'];
  const ZoneIcon = zoneData.icon;

  const facteurJour = Math.min(100, (naturalLight.windowArea || 0) * 2).toFixed(0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      {/* ── Barre titre ── */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onPrev} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '6px' }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface2}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: '0.75rem', color: C.dim }}>Étape 3 / 4</div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: C.text, margin: 0 }}>
              Éclairage Naturel — Zone Béninoise
            </h1>
          </div>
        </div>
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

        {/* ─── Colonne gauche : Configuration ─── */}
        <div style={{ flex: 1.2, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Sélecteur zone */}
          <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} /> Zone géographique
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {Object.keys(ZONES).map(zone => {
                const z = ZONES[zone];
                const ZIcon = z.icon;
                const isSelected = location.zone === zone;
                return (
                  <button
                    key={zone}
                    onClick={() => updateFormData('location', { zone })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '0.75rem 1rem', borderRadius: '10px',
                      background: isSelected ? `rgba(90,132,213,0.12)` : 'transparent',
                      border: `1.5px solid ${isSelected ? C.primary : C.border}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: `${z.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ZIcon size={16} color={z.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: C.text }}>{zone}</div>
                      <div style={{ fontSize: '0.6875rem', color: C.dim }}>IRR : {z.irr_annuel}</div>
                    </div>
                    {isSelected && <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Fenêtres */}
          <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={13} /> Fenêtres & Apports
            </h2>

            {/* Toggle fenêtres */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: C.muted, fontSize: '0.875rem' }}>Présence de fenêtres</span>
              <button
                onClick={() => updateFormData('naturalLight', { hasWindows: !naturalLight.hasWindows })}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: naturalLight.hasWindows ? C.primary : C.surface2,
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: naturalLight.hasWindows ? '23px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#FFF', transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }} />
              </button>
            </div>

            {naturalLight.hasWindows && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: C.muted, fontSize: '0.875rem' }}>Surface vitrée</span>
                  <div style={{ position: 'relative', width: '130px' }}>
                    <input
                      type="number" value={naturalLight.windowArea} min={0} max={100} step={0.5}
                      onChange={e => updateFormData('naturalLight', { windowArea: Number(e.target.value) })}
                      style={{ width: '100%', background: C.input, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.5rem 2rem 0.5rem 0.75rem', color: C.text, fontSize: '0.875rem', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: C.dim, fontSize: '0.75rem' }}>m²</span>
                  </div>
                </div>

                {/* Facteur de jour */}
                <div style={{ background: C.surface2, borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: C.muted }}>Facteur de jour estimé</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 700, color: facteurJour >= 50 ? '#4ade80' : C.accent }}>
                    {facteurJour} %
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ─── Colonne droite : Stats & Orientation ─── */}
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Fiche zone */}
          <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', background: `${zoneData.color}12`, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${zoneData.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ZoneIcon size={20} color={zoneData.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: C.dim }}>Zone active</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: C.text }}>{location.zone}</div>
              </div>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { icon: Sun,       label: 'Irradiation',    val: zoneData.irr_annuel },
                { icon: CloudSun,  label: 'Heures de soleil', val: zoneData.soleil },
                { icon: CloudRain, label: 'Pluviométrie',   val: zoneData.pluie },
                { icon: Wind,      label: 'Saisons',        val: zoneData.saisons },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                  <s.icon size={14} color={C.dim} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: C.dim }}>{s.label}</div>
                    <div style={{ fontSize: '0.8125rem', color: C.text, fontWeight: 500 }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rose des vents — orientation */}
          {naturalLight.hasWindows && (
            <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={13} /> Orientation des fenêtres
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <CompassRose
                  value={naturalLight.orientation}
                  onChange={v => updateFormData('naturalLight', { orientation: v })}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ORIENTATIONS.map(o => (
                    <button key={o.value} onClick={() => updateFormData('naturalLight', { orientation: o.value })} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: naturalLight.orientation === o.value ? `${C.primary}20` : 'transparent',
                      border: `1px solid ${naturalLight.orientation === o.value ? C.primary : C.border}`,
                      borderRadius: '6px', padding: '0.375rem 0.75rem',
                      color: naturalLight.orientation === o.value ? C.primary : C.muted,
                      cursor: 'pointer', fontSize: '0.75rem', fontWeight: naturalLight.orientation === o.value ? 700 : 400,
                    }}>
                      {o.label}
                      {naturalLight.orientation === o.value && <span style={{ marginLeft: 'auto', fontSize: '0.625rem' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Conseil lux */}
          <div style={{ background: '#FFB84D10', border: '1px solid #FFB84D30', borderRadius: '12px', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Sun size={20} color={C.accent} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: C.text, marginBottom: '4px' }}>
                Apport naturel moyen ({location.zone})
              </div>
              <div style={{ fontSize: '0.8125rem', color: C.muted, lineHeight: 1.4 }}>
                Éclairez extérieur jusqu'à <strong style={{ color: C.accent }}>{zoneData.lux_midi.toLocaleString()} lux</strong> à midi. L'application vous calculera l'économie réalisée grâce à ce facteur.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pied ── */}
      <div style={{ padding: '1rem 2rem', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,27,32,0.6)' }}>
        <div style={{ fontSize: '0.875rem', color: C.muted }}>
          <SunMedium size={15} style={{ verticalAlign: 'middle', marginRight: '6px', color: C.accent }} />
          Zone : <strong style={{ color: C.text }}>{location.zone}</strong>
          {naturalLight.hasWindows && <> · Fenêtres : <strong style={{ color: C.text }}>{naturalLight.windowArea} m² ({naturalLight.orientation})</strong></>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onPrev} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Retour
          </button>
          <button onClick={onNext} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.primary, border: 'none', color: '#FFF', padding: '0.75rem 1.75rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 14px rgba(90,132,213,0.3)' }}>
            Voir les Résultats <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
