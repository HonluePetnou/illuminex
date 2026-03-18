import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Settings2, Maximize2, Home,
  LayoutDashboard, ChevronDown
} from 'lucide-react';
import CustomSlider from './CustomSlider';

/* ── Tokens ── */
const C = {
  bg: '#191A1E',
  surface: '#26272D',
  surface2: '#2B2C35',
  border: '#363741',
  primary: '#5A84D5',
  text: '#FFF',
  muted: '#A0A0A5',
  dim: '#7E7E86',
  input: '#1E1F24',
};

/* ── Field label + input row ── */
function FieldRow({ label, unit, value, onChange, min, max, step = 0.1, type = 'number' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <label style={{ color: C.muted, fontSize: '0.875rem', flexShrink: 0, minWidth: '140px' }}>
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
          style={{
            width: '100%',
            background: C.input,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '0.625rem 2.5rem 0.625rem 0.875rem',
            color: C.text,
            fontSize: '0.9375rem',
            fontWeight: 600,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {unit && (
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: C.dim, fontSize: '0.75rem' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Sélect ── */
function SelectRow({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <label style={{ color: C.muted, fontSize: '0.875rem', flexShrink: 0, minWidth: '140px' }}>
        {label}
      </label>
      <div style={{ position: 'relative', width: '160px' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            background: C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '0.625rem 2rem 0.625rem 0.875rem',
            color: C.text,
            fontSize: '0.8125rem',
            fontWeight: 500,
            outline: 'none',
            appearance: 'none',
            cursor: 'pointer',
          }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: C.surface2 }}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} color={C.dim} style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

/* ── Réflectance slider row ── */
function ReflectanceRow({ label, value, min, max, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <span style={{ color: C.text, fontSize: '0.875rem', minWidth: '60px' }}>{label}</span>
      <span style={{ color: C.dim, fontSize: '0.75rem', minWidth: '30px', textAlign: 'right' }}>{min}%</span>
      <div style={{ flex: 1 }}>
        <CustomSlider value={value} min={min} max={max} onChange={onChange} />
      </div>
      <span style={{ color: C.dim, fontSize: '0.75rem', minWidth: '30px' }}>{max}%</span>
      <div style={{
        background: C.surface2, border: `1px solid ${C.border}`,
        borderRadius: '6px', padding: '0.25rem 0.625rem',
        color: C.text, fontSize: '0.8125rem', fontWeight: 600,
        minWidth: '52px', textAlign: 'center',
      }}>
        {value}%
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════ */
export default function ScreenDimensions({ formData, updateFormData, onNext, onPrev }) {
  const room = formData?.room || { length: 7, width: 6, ceilingHeight: 3, workPlaneHeight: 0.85 };
  const occupation = formData?.occupation || { buildingType: 'Bureau/Administration' };

  const [reflectance, setReflectance] = useState({ plafond: 70, murs: 50, sol: 20 });

  const surface = ((room.length || 0) * (room.width || 0)).toFixed(1);
  const volume  = ((room.length || 0) * (room.width || 0) * (room.ceilingHeight || 0)).toFixed(1);

  const buildingOptions = [
    { value: 'Bureau/Administration', label: 'Bureau / Administration' },
    { value: 'Scolaire',              label: 'Scolaire' },
    { value: 'Santé',                 label: 'Santé' },
    { value: 'Industrie',             label: 'Industrie' },
    { value: 'Commercial',            label: 'Commercial' },
    { value: 'Résidentiel',           label: 'Résidentiel' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      {/* ── Barre de navigation / titre ── */}
      <div style={{
        padding: '1.25rem 2rem',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onPrev} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '6px' }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface2}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: '0.75rem', color: C.dim, marginBottom: '1px' }}>
              Étape 1 / 4
            </div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: C.text, margin: 0 }}>
              Définition de la pièce
            </h1>
          </div>
        </div>

        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: C.surface2, border: `1px solid ${C.border}`,
          padding: '0.5rem 0.875rem', borderRadius: '8px',
          color: C.muted, cursor: 'pointer', fontSize: '0.8125rem',
        }}>
          <Settings2 size={14} /> Mode Expert
        </button>
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', gap: '2rem' }}>

        {/* ─── PRÉVISUALISATION 3D ─── */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>

          {/* Boîte 3D stylisée */}
          <div style={{
            flex: 1,
            background: 'linear-gradient(160deg, #26272D 0%, #191A1E 100%)',
            border: `1px solid ${C.border}`,
            borderRadius: '14px',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', minHeight: '220px',
          }}>
            {/* Room 3D wireframe */}
            <div style={{
              width: '60%', height: '65%',
              border: '1.5px solid rgba(90,132,213,0.3)',
              transform: 'perspective(700px) rotateX(15deg) rotateY(-20deg)',
              position: 'relative',
              background: 'rgba(90,132,213,0.03)',
            }}>
              {/* Luminaires */}
              {[{ left: '25%' }, { left: '65%' }].map((p, i) => (
                <div key={i} style={{ position: 'absolute', top: '10%', ...p, width: '28px', height: '6px', background: '#FFB84D', borderRadius: '3px', boxShadow: '0 0 18px 6px rgba(255,184,77,0.4)' }} />
              ))}
              {/* Paroi droite */}
              <div style={{ position: 'absolute', right: 0, bottom: 0, width: '28%', height: '70%', border: '1.5px solid rgba(90,132,213,0.2)', background: 'rgba(90,132,213,0.02)' }} />
              {/* Plan de travail */}
              <div style={{ position: 'absolute', bottom: '28%', left: '10%', right: '32%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Légende surface */}
            <div style={{
              position: 'absolute', bottom: '14px', left: '14px',
              background: 'rgba(26,27,32,0.85)', backdropFilter: 'blur(8px)',
              border: `1px solid ${C.border}`, borderRadius: '8px',
              padding: '0.5rem 0.875rem',
              display: 'flex', gap: '1.5rem',
            }}>
              <div>
                <div style={{ fontSize: '0.625rem', color: C.dim, marginBottom: '1px' }}>SURFACE</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>{surface} m²</div>
              </div>
              <div>
                <div style={{ fontSize: '0.625rem', color: C.dim, marginBottom: '1px' }}>VOLUME</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>{volume} m³</div>
              </div>
            </div>

            <button style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(26,27,32,0.7)', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px 6px', color: C.dim, cursor: 'pointer', display: 'flex' }}>
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Stats rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Longueur', value: room.length, unit: 'm' },
              { label: 'Largeur',  value: room.width,  unit: 'm' },
              { label: 'Hauteur',  value: room.ceilingHeight, unit: 'm' },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.6875rem', color: C.dim, marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text }}>{s.value}<span style={{ fontSize: '0.75rem', color: C.dim, marginLeft: '2px' }}>{s.unit}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── FORMULAIRE ─── */}
        <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Dimensions */}
          <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LayoutDashboard size={14} /> Dimensions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <FieldRow label="Longueur" unit="m" value={room.length} min={1} max={100} onChange={v => updateFormData('room', { length: v })} />
              <FieldRow label="Largeur"  unit="m" value={room.width}  min={1} max={100} onChange={v => updateFormData('room', { width: v  })} />
              <FieldRow label="Hauteur plafond" unit="m" value={room.ceilingHeight} min={2} max={20} onChange={v => updateFormData('room', { ceilingHeight: v })} />
              <FieldRow label="Plan de travail" unit="m" value={room.workPlaneHeight} min={0} max={2} step={0.05} onChange={v => updateFormData('room', { workPlaneHeight: v })} />
            </div>
          </section>

          {/* Type de bâtiment */}
          <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Home size={14} /> Type de bâtiment
            </h2>
            <SelectRow
              label="Catégorie"
              value={occupation.buildingType}
              onChange={v => updateFormData('occupation', { buildingType: v })}
              options={buildingOptions}
            />
          </section>

          {/* Réflectances */}
          <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
              Réflectance surfaces
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <ReflectanceRow label="Plafond" value={reflectance.plafond} min={50} max={90} onChange={e => setReflectance(r => ({ ...r, plafond: Number(e.target.value) }))} />
              <ReflectanceRow label="Murs"    value={reflectance.murs}    min={20} max={80} onChange={e => setReflectance(r => ({ ...r, murs:    Number(e.target.value) }))} />
              <ReflectanceRow label="Sol"     value={reflectance.sol}     min={10} max={40} onChange={e => setReflectance(r => ({ ...r, sol:     Number(e.target.value) }))} />
            </div>
          </section>
        </div>
      </div>

      {/* ── Pied de page ── */}
      <div style={{
        padding: '1rem 2rem',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(26,27,32,0.6)',
      }}>
        <div style={{ fontSize: '0.9375rem', color: C.muted }}>
          Surface : <strong style={{ color: C.text, fontSize: '1.25rem', marginLeft: '0.5rem' }}>{surface} m²</strong>
          <span style={{ marginLeft: '1.5rem' }}>Volume : <strong style={{ color: C.text }}>{volume} m³</strong></span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onPrev}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <button
            onClick={onNext}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.primary, border: 'none', color: '#FFF', padding: '0.75rem 1.75rem', borderRadius: '8px', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 14px rgba(90,132,213,0.3)' }}
          >
            Luminaires <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
