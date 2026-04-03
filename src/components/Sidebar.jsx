import React from 'react';
import {
  Hexagon, Folder, Layout, SunMedium, BarChart2,
  Mail, Power, ChevronRight, Save, CheckCircle2, AlertCircle, Clock,
  Layers, CheckSquare, FileText, Lightbulb
} from 'lucide-react';

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
  green: '#4ade80',
  red: '#ef4444'
};

const SIDEBAR_WIDTH = '260px'; // Slightly wider to breathe

const menuItems = [
  { id: 'projets',    label: 'Projets',              icon: Folder,      group: 'main' },
  { id: 'dimensions', label: 'Dimensions',           icon: Layout,      group: 'flow' },
  { id: 'materiaux',  label: 'Matériaux',            icon: Layers,      group: 'flow' },
  { id: 'luminaires', label: 'Luminaires',           icon: Lightbulb,   group: 'flow' },
  { id: 'naturel',    label: 'Éclairage Naturel',    icon: SunMedium,   group: 'flow' },
  { id: 'simulation', label: 'Simulation 2D/3D',     icon: BarChart2,   group: 'flow' },
  { id: 'analyse',    label: 'Analyse',              icon: CheckSquare, group: 'flow' },
  { id: 'rapport',    label: 'Rapport & Export',     icon: FileText,    group: 'flow' },
  { id: 'contact',    label: 'Nous contacter',       icon: Mail,        group: 'bottom' },
  { id: 'quitter',    label: 'Quitter',              icon: Power,       group: 'bottom' },
];

/* Flow steps order */
const FLOW_ORDER = [
  'dimensions',
  'materiaux',
  'luminaires',
  'naturel',
  'simulation',
  'analyse',
  'rapport'
];

export default function Sidebar({ activeScreen, setActiveScreen, currentProject, saveCurrentProject, saveStatus }) {
  const flowIndex = FLOW_ORDER.indexOf(activeScreen);

  const renderGroup = (group, label) => {
    const items = menuItems.filter(m => m.group === group);
    return (
      <div style={{ marginBottom: '0.25rem' }}>
        {label && (
          <p style={{ fontSize: '0.6875rem', color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.75rem 1.25rem 0.375rem', fontWeight: 600 }}>
            {label}
          </p>
        )}
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id || (activeScreen === 'form' && item.id === 'dimensions');
          const flowPos = FLOW_ORDER.indexOf(item.id);
          const isDone = flowPos !== -1 && flowPos < flowIndex;

          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0.625rem 1.25rem',
                width: '100%',
                background: isActive
                  ? `linear-gradient(90deg, ${C.primary}33 0%, transparent 100%)`
                  : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${isActive ? C.primary : 'transparent'}`,
                color: isActive ? C.text : isDone ? C.muted : C.dim,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = C.surface2;
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.75} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && <ChevronRight size={14} style={{ opacity: 0.5, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      width: SIDEBAR_WIDTH,
      minWidth: SIDEBAR_WIDTH,
      background: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: `linear-gradient(135deg, ${C.primary} 0%, #1D4ED8 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 16px ${C.primary}4D`,
          }}>
            <Hexagon size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: C.text, letterSpacing: '1px', lineHeight: 1 }}>
              ILLUMINEX
            </div>
            <div style={{ fontSize: '0.625rem', color: C.muted, letterSpacing: '0.05em', marginTop: '4px' }}>
              Afrique subsaharienne
            </div>
          </div>
        </div>
      </div>

      {/* ── Action: Sauvegarde dynamique ── */}
      {activeScreen !== 'projets' && activeScreen !== 'accueil' && currentProject && (
        <div style={{ padding: '1rem 1.25rem 0' }}>
           <button 
             onClick={saveCurrentProject}
             style={{
               width: '100%', padding: '0.625rem', borderRadius: '6px', 
               background: C.primary, color: '#fff', border: 'none', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
               cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
               boxShadow: `0 4px 12px ${C.primary}4D`, transition: 'background 0.2s'
             }}
             onMouseEnter={e => e.currentTarget.style.background = '#4a74c5'}
             onMouseLeave={e => e.currentTarget.style.background = C.primary}
           >
             <Save size={16} /> Sauvegarder
           </button>
           <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.6875rem', color: saveStatus === 'saving' ? C.accent : saveStatus === 'saved' ? C.green : C.red, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              {saveStatus === 'saving' && <><Clock size={12} /> Sauvegarde...</>}
              {saveStatus === 'saved' && <><CheckCircle2 size={12} /> À jour</>}
              {saveStatus === 'unsaved' && <><AlertCircle size={12} /> Non sauvegardé</>}
           </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0', display: 'flex', flexDirection: 'column', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
        {renderGroup('main')}

        <div style={{ margin: '0.5rem 1.25rem', height: '1px', background: C.border }} />
        <p style={{ fontSize: '0.6875rem', color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 1.25rem 0.375rem', fontWeight: 600 }}>
          Workflow de conception
        </p>
        
        {/* Workflow steps with progress dots */}
        {FLOW_ORDER.map((id, idx) => {
          const item = menuItems.find(m => m.id === id);
          if(!item) return null;
          
          const Icon = item.icon;
          const isActive = activeScreen === id || (activeScreen === 'form' && id === 'dimensions');
          const isDone = idx < flowIndex;
          
          return (
            <button
              key={id}
              onClick={() => setActiveScreen(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0.625rem 1.25rem',
                width: '100%',
                background: isActive
                  ? `linear-gradient(90deg, ${C.primary}33 0%, transparent 100%)`
                  : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${isActive ? C.primary : 'transparent'}`,
                color: isActive ? C.text : isDone ? C.muted : C.dim,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = C.surface2;
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Step number badge */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: isActive ? C.primary : isDone ? `${C.green}1A` : C.surface,
                border: `1.5px solid ${isActive ? C.primary : isDone ? C.green : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.625rem', fontWeight: 700,
                color: isActive ? '#fff' : isDone ? C.green : C.dim,
              }}>
                {isDone ? '✓' : idx + 1}
              </div>
              <Icon size={14} strokeWidth={1.75} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{ margin: '0.5rem 1.25rem', height: '1px', background: C.border }} />
        {menuItems.filter(m => m.group === 'bottom').map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          const isDanger = item.id === 'quitter';
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '0.625rem 1.25rem',
                width: '100%', background: 'transparent', border: 'none',
                borderLeft: `3px solid ${isActive ? (isDanger ? C.red : C.primary) : 'transparent'}`,
                color: isActive ? C.text : isDanger ? `${C.red}B3` : C.dim,
                cursor: 'pointer', textAlign: 'left',
                fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = isDanger ? C.red : C.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = isActive ? C.text : isDanger ? `${C.red}B3` : C.dim; }}
            >
              <Icon size={16} strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Tutoriel vidéo info ── */}
      <div style={{ padding: '0 1.25rem 0.5rem' }}>
        <div style={{ 
          background: C.surface, border: `1px solid ${C.border}`, 
          borderRadius: 8, padding: '0.75rem', textAlign: 'center' 
        }}>
          <div style={{ color: C.text, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Tutoriel vidéo</div>
          <div style={{ fontSize: '0.65rem', color: C.muted, marginBottom: '0.5rem' }}>Apprenez à utiliser Illuminex</div>
          <button style={{
            background: `${C.primary}1A`, border: `1px solid ${C.primary}4D`,
            color: C.primary, borderRadius: 4, padding: '0.35rem 0.5rem', fontSize: '0.7rem',
            cursor: 'pointer', width: '100%', fontWeight: 500, transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${C.primary}33`}
          onMouseLeave={e => e.currentTarget.style.background = `${C.primary}1A`}
          >
            Démarrer
          </button>
        </div>
      </div>

      {/* ── Version footer ── */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: '0.625rem', color: C.dim, textAlign: 'center' }}>
          ILLUMINEX v0.2.0 · © 2026<br/>
          Pour l'Afrique subsaharienne
        </p>
      </div>
    </div>
  );
}
