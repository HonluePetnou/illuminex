import React from 'react';
import {
  Lightbulb, Folder, Layout, SunMedium, BarChart2,
  Mail, Power, ChevronRight, Save, CheckCircle2, AlertCircle, Clock,
  Layers, CheckSquare, FileText
} from 'lucide-react';

const SIDEBAR_WIDTH = '240px';

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
                  ? 'linear-gradient(90deg, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.04) 100%)'
                  : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${isActive ? '#3B82F6' : 'transparent'}`,
                color: isActive ? '#FFF' : isDone ? '#94A3B8' : '#64748B',
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
      background: '#1A1D2E',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'linear-gradient(135deg, #F0A500 0%, #E65C00 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(240,165,0,0.3)',
          }}>
            <Lightbulb size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFF', letterSpacing: '1px', lineHeight: 1 }}>
              ILLUMINEX
            </div>
            <div style={{ fontSize: '0.625rem', color: '#94A3B8', letterSpacing: '0.05em', marginTop: '2px' }}>
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
               width: '100%', padding: '0.625rem', borderRadius: '8px', 
               background: '#3B82F6', color: '#fff', border: 'none', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
               cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
               boxShadow: '0 4px 12px rgba(59,130,246,0.3)', transition: 'background 0.2s'
             }}
             onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
             onMouseLeave={e => e.currentTarget.style.background = '#3B82F6'}
           >
             <Save size={16} /> Sauvegarder
           </button>
           <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.6875rem', color: saveStatus === 'saving' ? '#F0A500' : saveStatus === 'saved' ? '#22c55e' : '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              {saveStatus === 'saving' && <><Clock size={12} /> Sauvegarde...</>}
              {saveStatus === 'saved' && <><CheckCircle2 size={12} /> À jour</>}
              {saveStatus === 'unsaved' && <><AlertCircle size={12} /> Non sauvegardé</>}
           </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0', display: 'flex', flexDirection: 'column' }}>
        {renderGroup('main')}

        <div style={{ margin: '0.5rem 1.25rem', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        <p style={{ fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 1.25rem 0.375rem', fontWeight: 600 }}>
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
                  ? 'linear-gradient(90deg, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.04) 100%)'
                  : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${isActive ? '#3B82F6' : isDone ? 'rgba(34,197,94,0.3)' : 'transparent'}`,
                color: isActive ? '#FFF' : isDone ? '#94A3B8' : '#64748B',
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
                background: isActive ? '#3B82F6' : isDone ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isActive ? '#3B82F6' : isDone ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.625rem', fontWeight: 700,
                color: isActive ? '#fff' : isDone ? '#22c55e' : '#64748B',
              }}>
                {isDone ? '✓' : idx + 1}
              </div>
              <Icon size={14} strokeWidth={1.75} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{ margin: '0.5rem 1.25rem', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
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
                borderLeft: `3px solid ${isActive ? (isDanger ? '#ef4444' : '#3B82F6') : 'transparent'}`,
                color: isActive ? '#FFF' : isDanger ? 'rgba(239,68,68,0.7)' : '#64748B',
                cursor: 'pointer', textAlign: 'left',
                fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = isDanger ? '#ef4444' : '#FFF'; }}
              onMouseLeave={e => { e.currentTarget.style.color = isActive ? '#FFF' : isDanger ? 'rgba(239,68,68,0.7)' : '#64748B'; }}
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
          background: 'rgba(30,34,55,0.85)', border: '1px solid rgba(255,255,255,0.06)', 
          borderRadius: 8, padding: '0.75rem', textAlign: 'center' 
        }}>
          <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Tutoriel vidéo</div>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: '0.5rem' }}>Apprenez à utiliser Illuminex</div>
          <button style={{
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#3B82F6', borderRadius: 4, padding: '0.25rem 0.5rem', fontSize: '0.7rem',
            cursor: 'pointer', width: '100%'
          }}>Démarrer</button>
        </div>
      </div>

      {/* ── Version footer ── */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: '0.625rem', color: '#64748B', textAlign: 'center' }}>
          ILLUMINEX v0.2.0 · © 2026<br/>
          Pour l'Afrique subsaharienne
        </p>
      </div>
    </div>
  );
}
