import React from 'react';
import {
  Lightbulb, Folder, Layout, SunMedium, BarChart2,
  Mail, Power, ChevronRight, Save, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

const SIDEBAR_WIDTH = '240px';

const menuItems = [
  { id: 'projets',    label: 'Projets',              icon: Folder,      group: 'main' },
  { id: 'dimensions', label: 'Dimensions',            icon: Layout,      group: 'flow' },
  { id: 'luminaires', label: 'Luminaires',            icon: Lightbulb,   group: 'flow' },
  { id: 'naturel',    label: 'Éclairage Naturel',     icon: SunMedium,   group: 'flow' },
  { id: 'simulation', label: 'Résultats',             icon: BarChart2,   group: 'flow' },
  { id: 'contact',    label: 'Nous contacter',        icon: Mail,        group: 'bottom' },
  { id: 'quitter',    label: 'Quitter',               icon: Power,       group: 'bottom' },
];

/* Flow steps badges — pour montrer la progression */
const FLOW_ORDER = ['dimensions', 'luminaires', 'naturel', 'simulation'];

export default function Sidebar({ activeScreen, setActiveScreen, currentProject, saveCurrentProject, saveStatus }) {
  const flowIndex = FLOW_ORDER.indexOf(activeScreen);

  const renderGroup = (group, label) => {
    const items = menuItems.filter(m => m.group === group);
    return (
      <div style={{ marginBottom: '0.25rem' }}>
        {label && (
          <p style={{ fontSize: '0.6875rem', color: '#7E7E86', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.75rem 1.25rem 0.375rem', fontWeight: 600 }}>
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
                  ? 'linear-gradient(90deg, rgba(90,132,213,0.18) 0%, rgba(90,132,213,0.04) 100%)'
                  : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${isActive ? '#5A84D5' : 'transparent'}`,
                color: isActive ? '#FFF' : isDone ? '#A0A0A5' : '#7E7E86',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
                borderRadius: '0 8px 8px 0',
                marginRight: '0.5rem',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.75} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isDone && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
              )}
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
      background: '#191A1E',
      borderRight: '1px solid #2B2C35',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid #2B2C35' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'linear-gradient(135deg, #FFB84D 0%, #FF8A00 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(255,184,77,0.3)',
          }}>
            <Lightbulb size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFF', letterSpacing: '1px', lineHeight: 1 }}>
              ILLUMINEX
            </div>
            <div style={{ fontSize: '0.625rem', color: '#7E7E86', letterSpacing: '0.05em', marginTop: '2px' }}>
              BJ — Bénin
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
               width: '100%', padding: '0.625rem', borderRadius: '8px', 
               background: '#5A84D5', color: '#fff', border: 'none', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
               cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
               boxShadow: '0 4px 12px rgba(90,132,213,0.3)', transition: 'background 0.2s'
             }}
             onMouseEnter={e => e.currentTarget.style.background = '#4A71C0'}
             onMouseLeave={e => e.currentTarget.style.background = '#5A84D5'}
           >
             <Save size={16} /> Sauvegarder
           </button>
           <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.6875rem', color: saveStatus === 'saving' ? '#FFB84D' : saveStatus === 'saved' ? '#4ade80' : '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              {saveStatus === 'saving' && <><Clock size={12} /> Sauvegarde...</>}
              {saveStatus === 'saved' && <><CheckCircle2 size={12} /> À jour dans la BDD</>}
              {saveStatus === 'unsaved' && <><AlertCircle size={12} /> Non sauvegardé</>}
           </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0', display: 'flex', flexDirection: 'column' }}>
        {renderGroup('main')}

        <div style={{ margin: '0.5rem 1.25rem', height: '1px', background: '#2B2C35' }} />
        <p style={{ fontSize: '0.6875rem', color: '#7E7E86', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 1.25rem 0.375rem', fontWeight: 600 }}>
          Workflow
        </p>
        {/* Workflow steps with progress dots */}
        {FLOW_ORDER.map((id, idx) => {
          const item = menuItems.find(m => m.id === id);
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
                  ? 'linear-gradient(90deg, rgba(90,132,213,0.18) 0%, rgba(90,132,213,0.04) 100%)'
                  : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${isActive ? '#5A84D5' : isDone ? '#4ade8040' : 'transparent'}`,
                color: isActive ? '#FFF' : isDone ? '#A0A0A5' : '#7E7E86',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
                borderRadius: '0 8px 8px 0',
                marginRight: '0.5rem',
              }}
            >
              {/* Step number badge */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: isActive ? '#5A84D5' : isDone ? '#4ade8030' : '#2B2C35',
                border: `1.5px solid ${isActive ? '#5A84D5' : isDone ? '#4ade80' : '#363741'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.625rem', fontWeight: 700,
                color: isActive ? '#fff' : isDone ? '#4ade80' : '#7E7E86',
              }}>
                {isDone ? '✓' : idx + 1}
              </div>
              <Icon size={14} strokeWidth={1.75} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{ margin: '0.5rem 1.25rem', height: '1px', background: '#2B2C35' }} />
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
                borderLeft: `3px solid ${isActive ? (isDanger ? '#ef4444' : '#5A84D5') : 'transparent'}`,
                color: isActive ? '#FFF' : isDanger ? '#ef4444aa' : '#7E7E86',
                cursor: 'pointer', textAlign: 'left',
                fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = isDanger ? '#ef4444' : '#FFF'; }}
              onMouseLeave={e => { e.currentTarget.style.color = isActive ? '#FFF' : isDanger ? '#ef4444aa' : '#7E7E86'; }}
            >
              <Icon size={16} strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Version footer ── */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid #2B2C35' }}>
        <p style={{ fontSize: '0.625rem', color: '#7E7E86', textAlign: 'center' }}>
          ILLUMINEX-BJ v1.0 · © 2026
        </p>
      </div>
    </div>
  );
}
