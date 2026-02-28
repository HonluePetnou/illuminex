import React from 'react';
import { Layers, Folder, Mail, Power, Lightbulb, Play } from 'lucide-react';

export default function Sidebar({ activeScreen, setActiveScreen }) {
  const menuItems = [
    { id: 'accueil', label: 'Dashboard', icon: Layers },
    { id: 'dimensions', label: 'Simulation lumière', icon: Layers }, // Actively selected in mockup 1
    { id: 'luminaires', label: 'Sélection luminaires', icon: Lightbulb },
    { id: 'projets', label: 'Projets', icon: Folder },
    { id: 'contact', label: 'Nous contacter', icon: Mail },
    { id: 'quitter', label: 'Quitter', icon: Power },
  ];

  return (
    <div className="app-sidebar" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between',
      padding: '2rem 1rem'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3rem', paddingLeft: '1rem' }}>
          <Lightbulb color="#FFB84D" size={28} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, letterSpacing: '2px' }}>ILLUMINEX</h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id || 
                             (activeScreen === 'accueil' && item.id === 'dimensions'); // Fallback active logic
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.875rem 1rem',
                  background: isActive ? 'linear-gradient(90deg, #2A2D35 0%, transparent 100%)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #5A84D5' : '3px solid transparent',
                  color: isActive ? '#FFF' : '#A0A0A5',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  borderRadius: '0 8px 8px 0'
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div style={{ padding: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#A0A0A5', marginBottom: '0.5rem', fontWeight: 500 }}>Tutoriel vidéo</p>
        <div style={{
          background: '#26272D',
          border: '1px solid #363741',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          position: 'relative'
        }}>
          {/* Fake video thumb here */}
          <div style={{
            width: '100%',
            height: '80px',
            background: '#1E1F24',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8
            }}>
              <Play size={16} color="#000" fill="#000" style={{ marginLeft: '2px' }}/>
            </div>
          </div>
          <button className="btn-primary" style={{ width: '100%' }}>Démarrer</button>
        </div>
        <p style={{ fontSize: '0.65rem', color: '#7E7E86', marginTop: '1rem', textAlign: 'center' }}>
          © 2026 Illuminaire Nuilere. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
