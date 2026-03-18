import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Search, Filter, Zap, Check,
  Settings2, SlidersHorizontal
} from 'lucide-react';
import CustomSlider from './CustomSlider';

const C = {
  bg: '#191A1E', surface: '#26272D', surface2: '#2B2C35',
  border: '#363741', primary: '#5A84D5', accent: '#FFB84D',
  text: '#FFF', muted: '#A0A0A5', dim: '#7E7E86', input: '#1E1F24',
};

const LUMINAIRES = [
  {
    id: 'led_philips_150',
    name: 'Dalle LED Philips 150×150',
    lm: 2250, w: 18,
    eff: 125, tc: '4000 K', irc: '>80',
    dims: '150×150 mm',
    category: 'Dalle',
    color: '#3B82F6',
  },
  {
    id: 'led_osram_300',
    name: 'Dalle LED Osram 300×300',
    lm: 3600, w: 30,
    eff: 120, tc: '4000 K', irc: '>80',
    dims: '300×300 mm',
    category: 'Dalle',
    color: '#8B5CF6',
  },
  {
    id: 'led_general_600',
    name: 'Dalle LED Gen. 600×600',
    lm: 4200, w: 36,
    eff: 117, tc: '4000 K', irc: '>80',
    dims: '600×600 mm',
    category: 'Dalle',
    color: '#10b981',
  },
  {
    id: 'tube_led_t8',
    name: 'Tube LED T8 120 cm',
    lm: 2000, w: 18,
    eff: 111, tc: '4000 K', irc: '>80',
    dims: '1200×26 mm',
    category: 'Tube',
    color: '#F59E0B',
  },
  {
    id: 'highbay_led',
    name: 'Highbay LED 100W',
    lm: 12000, w: 100,
    eff: 120, tc: '5000 K', irc: '>80',
    dims: 'Ø 280 mm',
    category: 'Industriel',
    color: '#EF4444',
  },
  {
    id: 'downlight_led',
    name: 'Downlight LED Encastré',
    lm: 800, w: 9,
    eff: 89, tc: '3000 K', irc: '>80',
    dims: 'Ø 90 mm',
    category: 'Encastré',
    color: '#EC4899',
  },
];

export default function ScreenLuminaires({ formData, updateFormData, onNext, onPrev }) {
  const luminaire = formData?.luminaire || {};
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [fluxFilter, setFluxFilter] = useState(15000);

  const categories = ['Tous', ...new Set(LUMINAIRES.map(l => l.category))];

  const filtered = LUMINAIRES.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'Tous' || l.category === activeCategory;
    const matchFlux = l.lm <= fluxFilter;
    return matchSearch && matchCat && matchFlux;
  });

  const selected = LUMINAIRES.find(l => l.id === luminaire.type);

  const selectLuminaire = (l) => {
    updateFormData('luminaire', {
      type: l.id,
      fluxPerUnit: l.lm,
      powerPerUnit: l.w,
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      {/* ── Barre titre ── */}
      <div style={{
        padding: '1.25rem 2rem', borderBottom: `1px solid ${C.border}`,
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
            <div style={{ fontSize: '0.75rem', color: C.dim }}>Étape 2 / 4</div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: C.text, margin: 0 }}>
              Sélection du Luminaire
            </h1>
          </div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.surface2, border: `1px solid ${C.border}`, padding: '0.5rem 0.875rem', borderRadius: '8px', color: C.muted, cursor: 'pointer', fontSize: '0.8125rem' }}>
          <Settings2 size={14} /> Mode Expert
        </button>
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ─ Panneau filtres gauche ─ */}
        <div style={{ width: '220px', borderRight: `1px solid ${C.border}`, padding: '1.25rem', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={13} /> Catégorie
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  background: activeCategory === cat ? `${C.primary}20` : 'transparent',
                  border: `1px solid ${activeCategory === cat ? C.primary : 'transparent'}`,
                  borderRadius: '6px', padding: '0.4rem 0.75rem',
                  color: activeCategory === cat ? C.primary : C.muted,
                  cursor: 'pointer', textAlign: 'left', fontSize: '0.8125rem', fontWeight: activeCategory === cat ? 600 : 400,
                }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={13} /> Flux max
              </h3>
              <span style={{ fontSize: '0.75rem', color: C.text, fontWeight: 600 }}>{fluxFilter.toLocaleString()} lm</span>
            </div>
            <CustomSlider value={fluxFilter} min={500} max={15000} onChange={e => setFluxFilter(Number(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.625rem', color: C.dim }}>
              <span>500</span><span>15 000 lm</span>
            </div>
          </div>

          {/* Luminaire sélectionné */}
          {selected && (
            <div style={{ background: `${C.primary}12`, border: `1px solid ${C.primary}40`, borderRadius: '10px', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.6875rem', color: C.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                ✓ Sélectionné
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: C.text, marginBottom: '0.375rem' }}>{selected.name}</div>
              <div style={{ fontSize: '0.75rem', color: C.muted }}>{selected.lm} lm · {selected.w} W</div>
              <div style={{ fontSize: '0.75rem', color: C.muted }}>{selected.eff} lm/W · {selected.tc}</div>
            </div>
          )}
        </div>

        {/* ─ Grille luminaires ─ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Barre de recherche */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
              <Search size={15} color={C.dim} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Rechercher un luminaire..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: C.input, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.5rem 1rem 0.5rem 2.25rem', color: C.text, fontSize: '0.8125rem', outline: 'none' }}
              />
            </div>
            <span style={{ alignSelf: 'center', fontSize: '0.8125rem', color: C.dim }}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {filtered.map(l => {
                const isSelected = luminaire.type === l.id;
                return (
                  <LuminaireCard key={l.id} lum={l} isSelected={isSelected} onClick={() => selectLuminaire(l)} />
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: C.dim, padding: '3rem', fontSize: '0.875rem' }}>
                Aucun luminaire ne correspond aux filtres.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pied ── */}
      <div style={{ padding: '1rem 2rem', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,27,32,0.6)' }}>
        <div style={{ fontSize: '0.875rem', color: C.muted }}>
          {selected
            ? <><Zap size={14} style={{ color: C.accent, verticalAlign: 'middle', marginRight: '6px' }} /><strong style={{ color: C.text }}>{selected.name}</strong> — {selected.lm} lm / {selected.w} W</>
            : <span style={{ color: '#ef4444' }}>⚠ Aucun luminaire sélectionné</span>
          }
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onPrev} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Retour
          </button>
          <button
            onClick={onNext}
            disabled={!selected}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: selected ? C.primary : '#363741', border: 'none', color: selected ? '#FFF' : C.dim, padding: '0.75rem 1.75rem', borderRadius: '8px', fontSize: '0.875rem', cursor: selected ? 'pointer' : 'not-allowed', fontWeight: 600, boxShadow: selected ? '0 4px 14px rgba(90,132,213,0.3)' : 'none', transition: 'all 0.2s' }}
          >
            Éclairage Naturel <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LuminaireCard({ lum, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const C2 = { bg: '#26272D', border: '#363741', primary: '#5A84D5' };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? `rgba(90,132,213,0.1)` : hovered ? '#2B2C35' : C2.bg,
        border: `1.5px solid ${isSelected ? C2.primary : hovered ? '#4A4B55' : C2.border}`,
        borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isSelected ? '0 0 0 1px rgba(90,132,213,0.3)' : 'none',
      }}
    >
      {/* Visuel du luminaire */}
      <div style={{
        height: '100px',
        background: `linear-gradient(160deg, #1A1B20 0%, #22232A 100%)`,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: `1px solid ${C2.border}`,
      }}>
        {lum.category === 'Tube' ? (
          /* Tube LED */
          <div style={{ width: '70%', height: '12px', background: `linear-gradient(90deg, ${lum.color}80, ${lum.color}, ${lum.color}80)`, borderRadius: '6px', boxShadow: `0 0 24px 8px ${lum.color}50` }} />
        ) : lum.category === 'Industriel' ? (
          /* Highbay */
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `radial-gradient(circle, ${lum.color} 0%, ${lum.color}40 60%, transparent 100%)`, boxShadow: `0 0 30px 10px ${lum.color}40` }} />
        ) : (
          /* Dalle / Downlight */
          <div style={{ width: lum.category === 'Encastré' ? '42px' : '65px', height: lum.category === 'Encastré' ? '42px' : '12px', borderRadius: lum.category === 'Encastré' ? '50%' : '6px', background: `${lum.color}cc`, boxShadow: `0 0 24px 8px ${lum.color}50` }} />
        )}

        {/* Badge catégorie */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(26,27,32,0.85)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 700, color: lum.color, letterSpacing: '0.05em' }}>
          {lum.category.toUpperCase()}
        </div>

        {/* Check sélection */}
        {isSelected && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', borderRadius: '50%', background: C2.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={13} color="#fff" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Infos */}
      <div style={{ padding: '0.875rem' }}>
        <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFF', marginBottom: '0.625rem', lineHeight: 1.3 }}>{lum.name}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
          {[
            { label: 'Flux',    value: `${lum.lm.toLocaleString()} lm` },
            { label: 'Pssance', value: `${lum.w} W` },
            { label: 'Efficac', value: `${lum.eff} lm/W` },
            { label: 'Couleur', value: lum.tc },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '0.5625rem', color: '#7E7E86', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFF' }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: '#7E7E86' }}>IRC {lum.irc} · {lum.dims}</div>
      </div>
    </div>
  );
}
