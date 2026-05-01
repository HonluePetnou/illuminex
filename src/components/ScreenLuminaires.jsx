import React, { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronUp, AlignLeft, Check, Copy, LayoutGrid, X
} from 'lucide-react';
import { LUMINAIRES_LIBRARY } from '../data/luminaires-library';

/* ── Tokens Design System (Expert UI) ── */
const C = {
  bg: '#1C1D24',        // Deepest bg (main area)
  surface: '#23242B',   // Cards & panels
  surface2: '#2B2C35',  // Hover / lighter panels
  border: '#3A3A44',
  borderFocus: '#5A84D5',
  primary: '#5A84D5',   // Blue accent
  accent: '#FFB84D',    // Orange/Yellow accent
  text: '#FFFFFF',
  muted: '#A0A0A5',
  dim: '#6D6D78',
  input: '#15151B',     // Inputs background
};

function PhotometricCurve({ color = '#FFB84D', category, flux, index = 0 }) {
  // Generate a dynamic lobe shape based on category and random seed (index)
  // Fluorescent models might have wider lobes, LEDs might have focused beams
  const isFocused = category === 'halogene' || category === 'incandescent';
  const width = isFocused ? 20 + (index % 10) : 40 + (index % 20);
  const bottom = 90 + ((flux % 1000) / 100);
  
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '180px', marginTop: '1rem' }} className="animate-fade-in">
      {/* Concentric circles */}
      {[10, 20, 30, 40, 48].map((r, i) => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={C.border} strokeWidth="0.5" className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
      {/* Axes */}
      <line x1="2" y1="50" x2="98" y2="50" stroke={C.border} strokeWidth="0.5" />
      <line x1="50" y1="2" x2="50" y2="98" stroke={C.border} strokeWidth="0.5" />
      <line x1="16" y1="16" x2="84" y2="84" stroke={C.border} strokeWidth="0.5" />
      <line x1="16" y1="84" x2="84" y2="16" stroke={C.border} strokeWidth="0.5" />
      
      {/* Radial Numbers */}
      <text x="50" y="8" fill={C.dim} fontSize="4" textAnchor="middle">00</text>
      <text x="94" y="51" fill={C.dim} fontSize="4" textAnchor="middle">90</text>
      <text x="50" y="96" fill={C.dim} fontSize="4" textAnchor="middle">180</text>
      <text x="6" y="51" fill={C.dim} fontSize="4" textAnchor="middle">270</text>

      {/* Dynamic Lobe Shape */}
      <path 
        d={`M 50 50 C ${50 + width} 50, ${50 + width * 1.5} 70, 50 ${bottom} C ${50 - width * 1.5} 70, ${50 - width} 50, 50 50 Z`}
        fill={`${color}1A`} 
        stroke={color} 
        strokeWidth="1" 
        className="animate-draw"
        style={{ transition: 'all 0.5s ease', strokeDasharray: 300, strokeDashoffset: 300 }}
      />
      
      {/* Central light beam */}
      <line x1="50" y1="50" x2="50" y2={bottom - 2} stroke="#FFD700" strokeWidth="1.5" className="animate-slide-up" style={{ filter: 'drop-shadow(0 0 4px #FFD700)', transformOrigin: 'top' }} />
    </svg>
  );
}

function NumberInput({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', color: C.text, fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.5rem' }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: C.input,
          border: `1px solid ${C.border}`,
          borderRadius: '6px',
          color: C.text,
          padding: '0.65rem 0.875rem',
          fontSize: '0.8125rem',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        onFocus={e => (e.currentTarget.style.border = `1px solid ${C.primary}`)}
        onBlur={e => (e.currentTarget.style.border = `1px solid ${C.border}`)}
      />
    </div>
  );
}

export default function ScreenLuminaires({ formData, updateFormData, onNext, onPrev }) {
  const luminaire = formData?.luminaire || {};
  
  const [search, setSearch] = useState('');
  const [fluxFilter, setFluxFilter] = useState(10000);
  const [wattFilter, setWattFilter] = useState(40);
  const [tempFilter, setTempFilter] = useState(4000);
  const [ircFilter, setIrcFilter]   = useState(80);

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

  const filtered = allLuminaires.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchFlux = l.flux <= fluxFilter;
    const matchWatt = l.puissance <= wattFilter;
    const matchIrc  = (l.irc || 80) >= ircFilter;
    return matchSearch && matchFlux && matchWatt && matchIrc;
  });

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

  return (
    <div style={{ flex: 1, display: 'flex', background: C.bg, overflow: 'hidden', color: C.text, fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── Left Sidebar (Filters) ── */}
      <div style={{ width: '280px', background: '#18191E', borderRight: `1px solid ${C.border}`, padding: '1.5rem', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        
        {/* Top Dropdown filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', color: C.muted, fontSize: '0.875rem' }}>
          <span>Filtrer</span>
          <ChevronDown size={14} />
        </div>

        <NumberInput 
          label="Flux lumineux max (lm)" 
          value={fluxFilter} onChange={setFluxFilter} 
          placeholder="Ex: 5000"
        />
        
        <NumberInput 
          label="Puissance max (W)" 
          value={wattFilter} onChange={setWattFilter} 
          placeholder="Ex: 40"
        />
        
        <NumberInput 
          label="Temperature colorée (K)" 
          value={tempFilter} onChange={setTempFilter} 
          placeholder="Ex: 4000"
        />
        
        <NumberInput 
          label="IRC minimal" 
          value={ircFilter} onChange={setIrcFilter} 
          placeholder="Ex: 80"
        />

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: C.text, fontSize: '0.8125rem' }}>
            <span>Dimension</span>
            <span style={{ display: 'flex', gap: '8px' }}>
               <span style={{ background: C.input, padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', color: C.dim }}>15B x 190</span>
               <span style={{ background: C.input, padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', color: C.dim }}>200 x</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['150x150', '300x80', '600x600'].map(dim => (
               <button key={dim} style={{ flex: 1, background: dim === '600x600' ? C.primary : C.surface, color: dim === '600x600' ? '#fff' : C.muted, border: `1px solid ${dim === '600x600' ? C.primary : C.border}`, padding: '0.5rem', borderRadius: '6px', fontSize: '0.6875rem', cursor: 'pointer' }}>
                 {dim}
               </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Top Header */}
        <div style={{ padding: '2rem 3rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Main Search */}
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={14} color={C.dim} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" placeholder="Recherche luminaire..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: C.input, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.5rem 1rem 0.5rem 2.25rem', color: C.text, fontSize: '0.8125rem', outline: 'none' }}
              />
            </div>
            
            {/* Mode Expert Toggle */}
            <button style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', color: C.muted, fontSize: '0.8125rem', cursor: 'pointer' }}>
               <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.dim }} /> Mode Expert <ChevronDown size={14} />
            </button>
          </div>

          <div>
             <h1 style={{ fontSize: '1.75rem', fontWeight: 400, margin: '0 0 1.5rem' }}>Sélection des luminaires</h1>
             
             {/* Sub Filter Bar */}
             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: C.surface, padding: '0.75rem 1rem', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.muted, fontSize: '0.8125rem', borderRight: `1px solid ${C.border}`, paddingRight: '1rem' }}>
                   <AlignLeft size={14} /> Filtrer <ChevronDown size={14} style={{ marginLeft: '1rem' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.muted, fontSize: '0.8125rem', borderRight: `1px solid ${C.border}`, paddingRight: '1rem', flex: 1 }}>
                   <AlignLeft size={14} /> <input type="text" placeholder="Recherche cindine..." style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.8125rem', outline: 'none', width: '100%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.muted, fontSize: '0.8125rem' }}>
                   <AlignLeft size={14} /> <Copy size={14} /> <LayoutGrid size={14} /> <ChevronDown size={14} />
                </div>
             </div>

             {/* Tag Row */}
             <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                {['T W', '= 10 40', '10 0 W +'].map(tag => (
                   <div key={tag} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: C.muted }}>
                      <AlignLeft size={14} /> {tag} <ChevronDown size={14} />
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* ── Cards Grid ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 3rem 6rem' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {filtered.slice(0, 3).map((l, i) => {
                 const isSelected = luminaire.type === l.id;
                 const mockDim = i === 0 ? '150x150' : i === 1 ? '300x300' : '600x600';
                 // Map to names from screenshot for demo fidelity if possible, or use data
                 const name = `LED_${l.name.split(' ')[0]}_${mockDim}`;
                 
                 return (
                   <div 
                     key={l.id} 
                     onClick={() => selectLuminaire(l)}
                     className="animate-slide-up"
                     style={{ 
                       background: C.surface, 
                       border: `1px solid ${isSelected ? C.primary : C.border}`, 
                       borderRadius: '8px', 
                       padding: '1.5rem', 
                       cursor: 'pointer',
                       position: 'relative',
                       display: 'flex', flexDirection: 'column',
                       animationDelay: `${i * 0.1}s`,
                       transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                       transform: isSelected ? 'translateY(-4px)' : 'none',
                       boxShadow: isSelected ? '0 10px 40px -10px rgba(90,132,213,0.3)' : 'none'
                     }}
                   >
                      {/* Close icon top right */}
                      <X size={14} color={C.dim} style={{ position: 'absolute', top: '1rem', right: '1rem' }} />
                      
                      <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '2rem', textAlign: 'center' }}>{name}</h3>
                      
                      {/* Faux 3D Room / Light Source view */}
                      <div style={{ height: '140px', background: 'radial-gradient(ellipse at top, #3A3D46 0%, #15161A 100%)', borderRadius: '4px', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                         {/* Glowing plane top */}
                         <div style={{ 
                            width: i === 2 ? '140px' : i === 1 ? '100px' : '60px', 
                            height: '20px', 
                            background: '#FFF', 
                            position: 'absolute', top: '10px',
                            transform: 'perspective(100px) rotateX(45deg)',
                            boxShadow: '0 10px 40px 10px rgba(255,255,255,0.8)'
                         }} />
                      </div>

                      {/* Info Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '1.5rem 0', background: C.input, padding: '0.5rem 1rem', borderRadius: '4px', alignSelf: 'flex-start' }}>
                         <LayoutGrid size={14} color={C.muted} />
                         <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>2320</span>
                         <span style={{ fontSize: '0.6875rem', color: C.dim }}>metro mesure</span>
                      </div>

                      {/* Specs Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem', color: C.muted }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} /> {l.flux} lm</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{l.puissance} W</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} /> {Math.round(l.flux / l.puissance)} lm/W</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{Math.round(l.flux / l.puissance)} lm/W</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} /> 4000 K</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>&gt;{l.irc || 80}</div>
                      </div>

                      {/* Photometric Curve */}
                      <PhotometricCurve color={isSelected ? C.primary : '#FFB84D'} category={l.category} flux={l.flux} index={i} />

                      {/* Store Link */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open('https://b2b.illuminex.com/catalogue', '_blank');
                        }}
                        style={{
                          width: '100%',
                          marginTop: '1.5rem',
                          padding: '0.625rem',
                          background: 'transparent',
                          border: `1px solid ${C.primary}`,
                          borderRadius: '6px',
                          color: C.primary,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = C.primary;
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = C.primary;
                        }}
                      >
                         Rechercher en boutique ↗
                      </button>
                   </div>
                 );
              })}
           </div>
        </div>

        {/* Floating Auto Calc Button */}
        <div style={{ position: 'absolute', bottom: '2rem', right: '3rem' }}>
           <button 
             onClick={onNext}
             style={{
               background: C.primary, color: '#FFF', border: 'none', borderRadius: '6px',
               padding: '1rem 2rem', fontSize: '1rem', fontWeight: 500, cursor: 'pointer',
               boxShadow: '0 4px 20px rgba(90,132,213,0.3)', transition: 'background 0.2s'
             }}
             onMouseEnter={e => e.currentTarget.style.background = '#4A74C5'}
             onMouseLeave={e => e.currentTarget.style.background = C.primary}
           >
             Calculer le nombre auto
           </button>
        </div>

      </div>
    </div>
  );
}
