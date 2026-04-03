import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, ArrowRight, Search, Zap, Check, Settings2, SlidersHorizontal, MapPin
} from 'lucide-react';
import { LUMINAIRES_LIBRARY, FOURNISSEURS, TC_PAR_TYPE_PIECE } from '../data/luminaires-library';
import CustomSlider from './CustomSlider';

/* ── Tokens Design System ── */
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

export default function ScreenLuminaires({ formData, updateFormData, onNext, onPrev }) {
  const luminaire = formData?.luminaire || {};
  const roomType = formData?.room?.type || 'Bureau';
  const tcInfo = TC_PAR_TYPE_PIECE[roomType] || { tc: "4000K", badge: "#93C5FD", label: "Blanc neutre" };
  
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [fluxFilter, setFluxFilter] = useState(15000);

  // Flatten luminaires
  const allLuminaires = useMemo(() => {
    let list = [];
    Object.keys(LUMINAIRES_LIBRARY).forEach(catKey => {
      LUMINAIRES_LIBRARY[catKey].forEach(l => {
        list.push({ ...l, category: catKey });
      });
    });
    return list;
  }, []);

  const categories = ['Tous', 'led', 'fluorescent', 'incandescent', 'halogene'];

  const filtered = allLuminaires.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'Tous' || l.category === activeCategory;
    const matchFlux = l.flux <= fluxFilter;
    return matchSearch && matchCat && matchFlux;
  });

  const selected = allLuminaires.find(l => l.id === luminaire.type);

  const selectLuminaire = (l) => {
    updateFormData('luminaire', {
      type: l.id,
      fluxPerUnit: l.flux,
      powerPerUnit: l.puissance,
      irc: l.irc,
      prix: l.prix,
      haloType: l.haloType,
    });
  };

  const catLabels = {
    'Tous': 'Toutes les technos',
    'led': 'LED',
    'fluorescent': 'Fluorescent',
    'incandescent': 'Incandescent',
    'halogene': 'Halogène',
  };

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
              <Zap size={22} color={C.accent} /> Sélection du Luminaire
            </h1>
            <div style={{ fontSize: '0.8125rem', color: C.dim, marginTop: '2px' }}>
              Étape 3/7 — Choix de la technologie d'éclairage.
            </div>
          </div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.surface2, border: `1px solid ${C.border}`, padding: '0.5rem 1rem', borderRadius: '8px', color: C.muted, cursor: 'pointer', fontSize: '0.8125rem', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}
        >
          <Settings2 size={14} /> Catalogue étendu
        </button>
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ─ Panneau filtres gauche ─ */}
        <div style={{ width: '260px', borderRight: `1px solid ${C.border}`, padding: '1.5rem', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Recommandations norme */}
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Recommandation {roomType}
            </div>
            <div style={{ fontSize: '0.875rem', color: C.text, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              Température : <strong>{tcInfo.tc}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: C.muted }}>
              {tcInfo.label}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Technologie
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  background: activeCategory === cat ? 'rgba(240,165,0,0.15)' : 'transparent',
                  border: `1px solid ${activeCategory === cat ? 'rgba(240,165,0,0.4)' : 'transparent'}`,
                  borderRadius: '8px', padding: '0.5rem 0.875rem',
                  color: activeCategory === cat ? C.accent : C.muted,
                  cursor: 'pointer', textAlign: 'left', fontSize: '0.8125rem', fontWeight: activeCategory === cat ? 600 : 500,
                  transition: 'all 0.2s',
                }}>
                  {catLabels[cat]}
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
            <CustomSlider value={fluxFilter} min={200} max={15000} step={100} onChange={e => setFluxFilter(Number(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.6875rem', color: C.dim }}>
              <span>200</span><span>15 000 lm</span>
            </div>
          </div>

          {/* Luminaire sélectionné */}
          {selected && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: `1px solid rgba(34,197,94,0.3)`, borderRadius: '10px', padding: '1rem', marginTop: 'auto' }}>
              <div style={{ fontSize: '0.6875rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                ✓ Sélectionné
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: C.text, marginBottom: '4px' }}>{selected.name}</div>
              <div style={{ fontSize: '0.75rem', color: C.muted, marginBottom: '2px' }}>{selected.flux} lm · {selected.puissance} W</div>
              <div style={{ fontSize: '0.75rem', color: C.muted }}>Prix: {selected.prix.toLocaleString('fr-FR')} FCFA</div>
            </div>
          )}
        </div>

        {/* ─ Grille luminaires ─ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Barre de recherche */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={16} color={C.dim} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Rechercher par nom..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: C.input, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.625rem 1rem 0.625rem 2.5rem', color: C.text, fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                onBlur={e => e.currentTarget.style.borderColor = C.border}
              />
            </div>
            <span style={{ fontSize: '0.8125rem', color: C.muted }}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {filtered.map(l => {
                const isSelected = luminaire.type === l.id;
                return (
                  <LuminaireCard key={l.id} lum={l} isSelected={isSelected} onClick={() => selectLuminaire(l)} catLabels={catLabels} />
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, padding: '4rem', fontSize: '0.9375rem' }}>
                Aucun luminaire ne correspond à vos critères.
              </div>
            )}

            {/* Section Fournisseurs en bas si sélection */}
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color={C.primary} /> Fournisseurs recommandés pour la région
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {FOURNISSEURS.slice(0, 3).map((f, i) => (
                  <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: C.text, fontSize: '0.875rem', marginBottom: '4px' }}>{f.name}</div>
                    <div style={{ color: C.muted, fontSize: '0.75rem', marginBottom: '0.5rem' }}>{f.city}</div>
                    <a href={f.url} style={{ color: C.primary, fontSize: '0.75rem', textDecoration: 'none' }}>Voir le catalogue ({f.products} prod.)</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pied ── */}
      <div style={{ padding: '1rem 2rem', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,29,46,0.98)' }}>
        <div style={{ fontSize: '0.875rem', color: C.muted }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: selected ? '#22c55e' : C.dim}}/> {selected ? 'Luminaire défini' : 'Attente sélection'}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onPrev} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text, padding: '0.75rem 1.75rem', borderRadius: '10px', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ← Retour
          </button>
          <button
            onClick={onNext}
            disabled={!selected}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: selected ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : 'rgba(255,255,255,0.05)', border: 'none', color: selected ? '#fff' : C.dim, padding: '0.75rem 2.25rem', borderRadius: '10px', fontSize: '0.9375rem', cursor: selected ? 'pointer' : 'not-allowed', fontWeight: 700, boxShadow: selected ? '0 4px 16px rgba(59,130,246,0.4)' : 'none', transition: 'filter 0.2s' }}
            onMouseEnter={e => { if(selected) e.currentTarget.style.filter = 'brightness(1.15)' }}
            onMouseLeave={e => { if(selected) e.currentTarget.style.filter = 'brightness(1)' }}
          >
            Éclairage Naturel →
          </button>
        </div>
      </div>
    </div>
  );
}

function LuminaireCard({ lum, isSelected, onClick, catLabels }) {
  const [hovered, setHovered] = useState(false);
  const colorCat = {
    'led': '#3B82F6',
    'fluorescent': '#10b981',
    'incandescent': '#F59E0B',
    'halogene': '#EF4444',
  };
  const color = colorCat[lum.category] || '#F0A500';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? `rgba(59,130,246,0.1)` : hovered ? 'rgba(255,255,255,0.05)' : C.surface,
        border: `1.5px solid ${isSelected ? C.primary : hovered ? 'rgba(255,255,255,0.15)' : C.border}`,
        borderRadius: '14px', overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isSelected ? '0 0 0 1px rgba(59,130,246,0.3)' : 'none',
      }}
    >
      {/* Visuel du luminaire */}
      <div style={{
        height: '110px',
        background: `linear-gradient(160deg, rgba(30,34,55,1) 0%, rgba(20,24,35,1) 100%)`,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {lum.category === 'fluorescent' ? (
          /* Tube */
          <div style={{ width: '70%', height: '12px', background: `linear-gradient(90deg, ${color}80, ${color}, ${color}80)`, borderRadius: '6px', boxShadow: `0 0 24px 8px ${color}50` }} />
        ) : lum.category === 'halogene' ? (
          /* Spot */
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, ${color}40 60%, transparent 100%)`, boxShadow: `0 0 30px 10px ${color}40` }} />
        ) : (
          /* Encastré / Dalle */
          <div style={{ width: '65px', height: '12px', borderRadius: '6px', background: `${color}cc`, boxShadow: `0 0 24px 8px ${color}50` }} />
        )}

        {/* Badge catégorie */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.625rem', fontWeight: 700, color: color, letterSpacing: '0.05em' }}>
          {catLabels[lum.category]?.toUpperCase() || lum.category.toUpperCase()}
        </div>

        {/* Check sélection */}
        {isSelected && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={13} color="#fff" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Infos */}
      <div style={{ padding: '1rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', lineHeight: 1.3 }}>{lum.name}</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {[
            { label: 'Flux max',    value: `${lum.flux.toLocaleString()} lm` },
            { label: 'Puissance',   value: `${lum.puissance} W` },
            { label: 'Efficacité',  value: `${Math.round(lum.flux / lum.puissance)} lm/W` },
            { label: 'IRC',         value: `> ${lum.irc}` },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '0.625rem', color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>{s.value}</div>
            </div>
          ))}
        </div>
        
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.5rem', fontSize: '0.75rem', color: C.muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>{lum.description}</span>
          <span style={{ fontWeight: 600, color: C.accent }}>{lum.prix.toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>
    </div>
  );
}
