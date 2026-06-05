import React, { useState, useMemo } from 'react';
import {
  Search, Check, X, Zap, Eye, Filter, ChevronDown,
  LayoutGrid, Home, Building2, GraduationCap, ShoppingBag, Factory, Lightbulb, BarChart3, Palette,
  ExternalLink, ShoppingCart
} from 'lucide-react';
import { LUMINAIRES_LIBRARY } from '../data/luminaires-library';

/* ── Boutiques en ligne par pays ──────────────────────────────────────── */
const MARKET_LINKS = {
  'Cameroun': { url: 'https://connectik-group.com/',                           label: 'Connectik Group', flag: '🇨🇲' },
  'Bénin':    { url: 'https://www.latourboutique.com/fr/164-luminaires',        label: 'La Tour Boutique', flag: '🇧🇯' },
  'Niger':    { url: 'https://kratosenergyltd.com/product-categories/luminaire',label: 'Kratos Energy',   flag: '🇳🇪' },
  'Sénégal':  { url: 'https://orcatrend.com/502-luminaires',                    label: 'Orca Trend',      flag: '🇸🇳' },
};

/* ── Design Tokens ── */
const C = {
  bg:          '#1C1D24',
  surface:     '#23242B',
  surface2:    '#2B2C35',
  border:      '#3A3A44',
  borderFocus: '#5A84D5',
  primary:     '#5A84D5',
  accent:      '#FFB84D',
  text:        '#FFFFFF',
  muted:       '#A0A0A5',
  dim:         '#6D6D78',
  input:       '#15151B',
  green:       '#4ade80',
};

/* ── Catégories disponibles ── */
const CATEGORIES = [
  { key: 'all',         label: 'Tous',        icon: LayoutGrid },
  { key: 'Résidentiel', label: 'Résidentiel', icon: Home },
  { key: 'Tertiaire',   label: 'Tertiaire',   icon: Building2 },
  { key: 'Scolaire',    label: 'Scolaire',    icon: GraduationCap },
  { key: 'Commerce',    label: 'Commerce',    icon: ShoppingBag },
  { key: 'Industriel',  label: 'Industriel',  icon: Factory },
];

/* ── Courbe photométrique simplifiée ── */
function PhotometricCurve({ color = '#FFB84D', haloType, flux }) {
  const focused = haloType === 'halogene' || haloType === 'incandescent';
  const w = focused ? 18 : 38;
  const bottom = 88 + ((flux % 1000) / 200);
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '120px' }}>
      {[12, 24, 36, 48].map(r => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={C.border} strokeWidth="0.5" />
      ))}
      <line x1="2"  y1="50" x2="98" y2="50"  stroke={C.border} strokeWidth="0.5" />
      <line x1="50" y1="2"  x2="50" y2="98"  stroke={C.border} strokeWidth="0.5" />
      <path
        d={`M 50 50 C ${50 + w} 50, ${50 + w * 1.4} 68, 50 ${bottom} C ${50 - w * 1.4} 68, ${50 - w} 50, 50 50 Z`}
        fill={`${color}22`}
        stroke={color}
        strokeWidth="1.2"
      />
      <circle cx="50" cy="50" r="3" fill={color} opacity="0.8" />
    </svg>
  );
}

/* ── Badge catégorie coloré ── */
const CAT_COLORS = {
  Résidentiel: '#FFB84D',
  Tertiaire:   '#5A84D5',
  Scolaire:    '#34d399',
  Commerce:    '#f472b6',
  Industriel:  '#fb923c',
};

/* ── Carte luminaire ── */
function LuminaireCard({ l, isSelected, onSelect }) {
  const catColor = CAT_COLORS[l.categorie] || C.muted;
  const efficacite = Math.round(l.flux / l.puissance);

  return (
    <div
      onClick={() => onSelect(l)}
      style={{
        background:    isSelected ? `${C.primary}18` : C.surface,
        border:        `1px solid ${isSelected ? C.primary : C.border}`,
        borderRadius:  '10px',
        padding:       '1.25rem',
        cursor:        'pointer',
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.75rem',
        transition:    'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        transform:     isSelected ? 'translateY(-3px)' : 'none',
        boxShadow:     isSelected ? `0 8px 32px -8px ${C.primary}55` : 'none',
        position:      'relative',
        overflow:      'hidden',
      }}
    >
      {/* Sélectionné — checkmark */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          background: C.primary, borderRadius: '50%', width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={13} color="#fff" />
        </div>
      )}

      {/* Badge catégorie */}
      <span style={{
        display:    'inline-flex',
        alignItems: 'center',
        alignSelf:  'flex-start',
        background: `${catColor}18`,
        color:      catColor,
        border:     `1px solid ${catColor}44`,
        borderRadius: '4px',
        padding:    '2px 8px',
        fontSize:   '0.6875rem',
        fontWeight: 600,
      }}>
        {l.categorie}
      </span>

      {/* Nom */}
      <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
        {l.name}
      </h3>

      {/* Courbe photométrique */}
      <PhotometricCurve color={isSelected ? C.primary : catColor} haloType={l.haloType} flux={l.flux} />

      {/* Specs grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {[
          { label: 'Flux',       value: `${l.flux.toLocaleString('fr')} lm`, icon: Lightbulb },
          { label: 'Puissance',  value: `${l.puissance} W`,                  icon: Zap },
          { label: 'Efficacité', value: `${efficacite} lm/W`,                icon: BarChart3 },
          { label: 'IRC',        value: `≥ ${l.irc}`,                        icon: Palette },
        ].map(({ label, value, icon: IconComponent }) => (
          <div key={label} style={{
            background: C.input, borderRadius: '6px', padding: '0.4rem 0.6rem',
          }}>
            <div style={{ fontSize: '0.625rem', color: C.dim, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconComponent size={10} color={isSelected ? C.primary : catColor} />
              <span>{label}</span>
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Prix */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        borderTop:      `1px solid ${C.border}`,
        paddingTop:     '0.75rem',
      }}>
        <div>
          <div style={{ fontSize: '0.625rem', color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prix unitaire</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: C.accent }}>
            {l.prix.toLocaleString('fr')} <span style={{ fontSize: '0.75rem', color: C.muted }}>FCFA</span>
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: C.muted, fontStyle: 'italic', textAlign: 'right', maxWidth: '55%' }}>
          {l.description}
        </div>
      </div>

      {/* Bouton sélection */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(l); }}
        style={{
          width:      '100%',
          padding:    '0.55rem',
          background: isSelected ? C.primary : 'transparent',
          border:     `1px solid ${isSelected ? C.primary : C.border}`,
          borderRadius: '6px',
          color:      isSelected ? '#fff' : C.muted,
          fontSize:   '0.8125rem',
          fontWeight: isSelected ? 600 : 400,
          cursor:     'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = C.primary;
            e.currentTarget.style.color = C.primary;
          }
        }}
        onMouseLeave={e => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.muted;
          }
        }}
      >
        {isSelected ? '✓ Sélectionné' : 'Choisir ce luminaire'}
      </button>
    </div>
  );
}

/* ── Composant principal ── */
export default function ScreenLuminaires({ formData, updateFormData, onNext, onPrev, validationError }) {
  const luminaire = formData?.luminaire || {};

  const [search,      setSearch]      = useState('');
  const [activeTab,   setActiveTab]   = useState('all');
  const [maxFlux,     setMaxFlux]     = useState(20000);
  const [maxWatt,     setMaxWatt]     = useState(500);
  const [minIrc,      setMinIrc]      = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  /* Aplatissement de toute la bibliothèque */
  const allLuminaires = useMemo(() => {
    const list = [];
    Object.keys(LUMINAIRES_LIBRARY).forEach(catKey => {
      LUMINAIRES_LIBRARY[catKey].forEach(l => {
        list.push({ ...l, haloTypeKey: catKey });
      });
    });
    return list;
  }, []);

  /* Filtrage */
  const filtered = useMemo(() => {
    return allLuminaires.filter(l => {
      const matchSearch   = l.name.toLowerCase().includes(search.toLowerCase())
                         || l.description.toLowerCase().includes(search.toLowerCase());
      const matchCat      = activeTab === 'all' || l.categorie === activeTab;
      const matchFlux     = l.flux      <= maxFlux;
      const matchWatt     = l.puissance <= maxWatt;
      const matchIrc      = (l.irc || 80) >= minIrc;
      return matchSearch && matchCat && matchFlux && matchWatt && matchIrc;
    });
  }, [allLuminaires, search, activeTab, maxFlux, maxWatt, minIrc]);

  /* Sélection */
  const selectLuminaire = (l) => {
    updateFormData('luminaire', {
      type:         l.id,
      name:         l.name,
      fluxPerUnit:  l.flux,
      powerPerUnit: l.puissance,
      irc:          l.irc,
      prix:         l.prix,
      haloType:     l.haloType,
      categorie:    l.categorie,
    });
  };

  const selectedId = luminaire.type;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden', color: C.text, fontFamily: 'Inter, sans-serif' }}>

      {/* ── En-tête ── */}
      <div style={{ padding: '1.5rem 2rem 0', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 600 }}>Sélection du luminaire</h1>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '0.8125rem' }}>
              {filtered.length} référence{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
              {selectedId && (
                <span style={{ color: C.green, marginLeft: '1rem' }}>
                  ✓ {luminaire.name || selectedId} sélectionné
                </span>
              )}
            </p>
          </div>

          {/* Barre de recherche */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color={C.dim} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background:   C.input,
                  border:       `1px solid ${C.border}`,
                  borderRadius: '6px',
                  padding:      '0.5rem 1rem 0.5rem 2.125rem',
                  color:        C.text,
                  fontSize:     '0.8125rem',
                  width:        '220px',
                  outline:      'none',
                }}
                onFocus={e  => e.currentTarget.style.border = `1px solid ${C.primary}`}
                onBlur={e   => e.currentTarget.style.border = `1px solid ${C.border}`}
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                background:   showFilters ? `${C.primary}22` : C.surface,
                border:       `1px solid ${showFilters ? C.primary : C.border}`,
                borderRadius: '6px',
                padding:      '0.5rem 0.875rem',
                color:        showFilters ? C.primary : C.muted,
                fontSize:     '0.8125rem',
                cursor:       'pointer',
              }}
            >
              <Filter size={14} /> Filtres <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
          </div>
        </div>

        {/* Filtres avancés (pliables) */}
        {showFilters && (
          <div style={{
            display:       'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:           '1rem',
            padding:       '1rem',
            background:    C.surface,
            borderRadius:  '8px',
            marginBottom:  '1rem',
            border:        `1px solid ${C.border}`,
          }}>
            {[
              { label: `Flux max : ${maxFlux.toLocaleString('fr')} lm`, value: maxFlux, onChange: setMaxFlux, min: 100, max: 20000, step: 100 },
              { label: `Puissance max : ${maxWatt} W`,                  value: maxWatt, onChange: setMaxWatt, min: 5,   max: 200,   step: 5  },
              { label: `IRC minimum : ${minIrc}`,                        value: minIrc,  onChange: setMinIrc,  min: 80,  max: 100,   step: 5  },
            ].map(({ label, value, onChange, min, max, step }) => (
              <div key={label}>
                <div style={{ fontSize: '0.75rem', color: C.muted, marginBottom: '0.5rem' }}>{label}</div>
                <input
                  type="range"
                  min={min} max={max} step={step}
                  value={value}
                  onChange={e => onChange(Number(e.target.value))}
                  style={{ width: '100%', accentColor: C.primary }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Onglets catégorie */}
        <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
          {CATEGORIES.map(cat => {
            const count = cat.key === 'all'
              ? allLuminaires.length
              : allLuminaires.filter(l => l.categorie === cat.key).length;
            const active = activeTab === cat.key;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '6px',
                  padding:      '0.6rem 1rem',
                  background:   active ? C.primary : 'transparent',
                  border:       'none',
                  borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
                  color:        active ? '#fff' : C.muted,
                  fontSize:     '0.8125rem',
                  fontWeight:   active ? 600 : 400,
                  cursor:       'pointer',
                  whiteSpace:   'nowrap',
                  borderRadius: active ? '6px 6px 0 0' : '6px 6px 0 0',
                  transition:   'all 0.2s',
                }}
              >
                {Icon && <Icon size={14} />}
                <span>{cat.label}</span>
                <span style={{
                  marginLeft:   '6px',
                  background:   active ? 'rgba(255,255,255,0.25)' : C.surface,
                  borderRadius: '10px',
                  padding:      '1px 6px',
                  fontSize:     '0.6875rem',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bandeau boutique pays ── */}
      {(() => {
        const country = formData?.location?.country || '';
        const shop = MARKET_LINKS[country];
        if (!shop) return null;
        return (
          <div style={{
            margin: '0.75rem 2rem 0',
            padding: '0.65rem 1rem',
            background: 'linear-gradient(90deg, rgba(90,132,213,0.12) 0%, rgba(255,184,77,0.10) 100%)',
            border: '1px solid rgba(255,184,77,0.25)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}>
            <ShoppingCart size={15} color="#FFB84D" style={{ flexShrink: 0 }} />
            <span style={{ color: '#A0A0A5', fontSize: 12, flex: 1, minWidth: 160 }}>
              {shop.flag} Voir les prix actuels du marché <strong style={{ color: '#fff' }}>{country}</strong> :
            </span>
            <a
              href={shop.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFB84D',
                color: '#000',
                fontWeight: 700,
                fontSize: 12,
                padding: '0.4rem 0.9rem',
                borderRadius: 7,
                textDecoration: 'none',
                flexShrink: 0,
                transition: 'filter 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.12)'}
              onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <ExternalLink size={12} />
              {shop.label}
            </a>
          </div>
        );
      })()}

      {/* ── Grille des luminaires ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, padding: '4rem 0' }}>
            <Eye size={40} color={C.dim} style={{ marginBottom: '1rem' }} />
            <div style={{ fontSize: '1rem' }}>Aucun luminaire ne correspond à vos critères</div>
            <button
              onClick={() => { setSearch(''); setActiveTab('all'); setMaxFlux(20000); setMaxWatt(200); setMinIrc(80); }}
              style={{ marginTop: '1rem', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer' }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div style={{
            display:               'grid',
            gridTemplateColumns:   'repeat(auto-fill, minmax(260px, 1fr))',
            gap:                   '1.25rem',
          }}>
            {filtered.map((l) => (
              <LuminaireCard
                key={l.id}
                l={l}
                isSelected={selectedId === l.id}
                onSelect={selectLuminaire}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Barre de validation ── */}
      <div style={{
        padding:        '1rem 2rem',
        borderTop:      `1px solid ${C.border}`,
        background:     C.surface,
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        gap:            '1rem',
      }}>
        {/* Récap luminaire sélectionné */}
        <div style={{ flex: 1 }}>
          {selectedId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text }}>{luminaire.name || selectedId}</div>
                <div style={{ fontSize: '0.75rem', color: C.muted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {luminaire.fluxPerUnit?.toLocaleString('fr')} lm · {luminaire.powerPerUnit} W ·
                  <input
                    type="number"
                    value={luminaire.prix ?? ''}
                    min={0}
                    onChange={e => { const v = parseInt(e.target.value); updateFormData('luminaire', { ...luminaire, prix: isNaN(v) ? '' : v }); }}
                    style={{
                      width: 72, background: C.input, border: `1px solid ${C.border}`,
                      borderRadius: 4, padding: '2px 6px', color: C.accent, fontSize: '0.75rem',
                      fontWeight: 700, outline: 'none', textAlign: 'right',
                    }}
                  /> FCFA
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: C.dim }}>Aucun luminaire sélectionné</div>
          )}
        </div>

        {/* Erreur validation */}
        {validationError && (
          <div style={{
            background:   'rgba(239,68,68,0.12)',
            border:       '1px solid rgba(239,68,68,0.4)',
            color:        '#f87171',
            padding:      '0.5rem 1rem',
            borderRadius: '6px',
            fontSize:     '0.8125rem',
          }}>
            ⚠ {validationError}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onPrev}
            style={{
              background:   C.surface2,
              border:       `1px solid ${C.border}`,
              color:        C.text,
              borderRadius: '6px',
              padding:      '0.75rem 1.5rem',
              fontSize:     '0.875rem',
              cursor:       'pointer',
              transition:   'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.border}
            onMouseLeave={e => e.currentTarget.style.background = C.surface2}
          >
            ← Retour
          </button>
          <button
            onClick={onNext}
            style={{
              background:   C.primary,
              border:       'none',
              color:        '#fff',
              borderRadius: '6px',
              padding:      '0.75rem 2rem',
              fontSize:     '0.875rem',
              fontWeight:   600,
              cursor:       'pointer',
              boxShadow:    `0 4px 16px ${C.primary}4D`,
              transition:   'background 0.2s',
              display:      'flex',
              alignItems:   'center',
              gap:          '0.5rem',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#4A74C5'}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}
          >
            <Zap size={16} /> Calculer le nombre auto →
          </button>
        </div>
      </div>
    </div>
  );
}
