import React from 'react';
import { ChevronDown, Search, Lightbulb } from 'lucide-react';

export default function ScreenAccueil({ onNewSimulation }) {
  const projects = [
    { title: 'Projet Bureau Cotonou', subtitle: '7.0 x 6.0 x 3.0 m 500 Lux', lights: '6 luminaires', location: 'Cotonou', date: 'Hier' },
    { title: 'Projet Bureau Cotonou', subtitle: '7.0 x 6.0 x 3.0 m 500 Lux', lights: '6 luminaires', location: 'Cotonou', date: 'Hier' },
    { title: 'Projet Bureau Cotonou', subtitle: '7.0 x 6.0 x 3.0 m 500 Lux', lights: '6 luminaires', location: 'Cotonou', date: 'Hier' },
    { title: 'Projet Bureau Cotonou', subtitle: '7.0 x 6.0 x 3.0 m 500 Lux', lights: '6 luminaires', location: 'Cotonou', date: 'Hier' },
    { title: 'Projet Bureau Cotonou', subtitle: '7.0 x 6.0 x 3.0 m 500 Lux', lights: '6 luminaires', location: 'Cotonou', date: 'Hier' }
  ];

  return (
    <div className="page-container" style={{ padding: '3rem', flex: 1, overflowY: 'auto' }}>
      
      {/* Top right select */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <button style={{
          background: '#2B2C35',
          border: '1px solid #363741',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
          <Lightbulb size={16} /> Mode Simple <ChevronDown size={14} />
        </button>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem', color: '#FFF' }}>
          Bienvenue sur <span style={{ fontWeight: 700 }}>ILLUMINEX</span>
        </h2>
        <p style={{ color: '#A0A0A5', maxWidth: '600px', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1rem' }}>
          Optimisez vos calculs d'éclairage intérieur automatisés selon les
          normes NF C 15-100 & EN 12464-1.
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <p style={{ color: '#7E7E86', fontSize: '0.875rem' }}>Trouvez votre ou présentez son affaire sur ce bâtiment.</p>
          <button className="btn-primary" onClick={onNewSimulation} style={{ padding: '0.875rem 2rem', fontSize: '1rem', borderRadius: '8px' }}>
            Nouvelle simulation
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#FFF' }}>Projets récents</h3>
        <div style={{ background: '#26272D', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #363741', background: '#212228' }}>
            <span style={{ fontWeight: 500, color: '#FFF' }}>Projet Bureau Cotonou</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#7E7E86" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search" 
                style={{
                  background: '#191A1E',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem 0.5rem 2.5rem',
                  color: '#FFF',
                  width: '240px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1.5rem', 
                borderBottom: idx < projects.length - 1 ? '1px solid #363741' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2A2D35'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '100px', height: '60px', borderRadius: '8px', 
                    background: 'linear-gradient(135deg, #4A4B55 0%, #363741 100%)',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                    position: 'relative'
                  }}>
                    {/* Mock Image Placeholder */}
                    <div style={{ position: 'absolute', top: '10px', left: '20px', width: '6px', height: '6px', background: '#FFF', borderRadius: '50%', boxShadow: '0 0 10px #FFF' }}></div>
                    <div style={{ position: 'absolute', top: '10px', right: '20px', width: '6px', height: '6px', background: '#FFF', borderRadius: '50%', boxShadow: '0 0 10px #FFF' }}></div>
                  </div>
                  <div>
                    <h4 style={{ color: '#FFF', fontSize: '1rem', marginBottom: '0.25rem' }}>{proj.title}</h4>
                    <div style={{ display: 'flex', gap: '1rem', color: '#A0A0A5', fontSize: '0.875rem' }}>
                      <span>{proj.subtitle}</span>
                      <span>{proj.lights}</span>
                      <span>{proj.location}</span>
                    </div>
                  </div>
                </div>
                <div style={{ color: '#7E7E86', fontSize: '0.875rem' }}>{proj.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
