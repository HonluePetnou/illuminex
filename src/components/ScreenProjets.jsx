import React from 'react';
import { Search, Folder, MoreVertical, Plus } from 'lucide-react';

export default function ScreenProjets() {
  const projects = [
    { title: 'Projet Bureau Cotonou', subtitle: '7.0 x 6.0 x 3.0 m 500 Lux', lights: '6 luminaires', location: 'Cotonou', date: 'Hier', status: 'Terminé' },
    { title: 'Projet Villa Abomey-Calavi', subtitle: '12.0 x 8.0 x 3.0 m 300 Lux', lights: '12 luminaires', location: 'Abomey-Calavi', date: 'Il y a 2 jours', status: 'En cours' },
    { title: 'Projet Hôpital Porto-Novo', subtitle: '15.0 x 10.0 x 3.0 m 500 Lux', lights: '24 luminaires', location: 'Porto-Novo', date: 'La semaine dernière', status: 'Terminé' },
    { title: 'Projet École Parakou', subtitle: '8.0 x 6.0 x 3.0 m 300 Lux', lights: '8 luminaires', location: 'Parakou', date: 'Il y a 2 semaines', status: 'Archivé' },
  ];

  return (
    <div className="page-container" style={{ padding: '3rem', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#FFF', margin: 0 }}>
          Mes Projets
        </h2>
        <button className="btn-primary" style={{ padding: '0.875rem 1.5rem', fontSize: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Nouveau projet
        </button>
      </div>

      <div style={{ background: '#26272D', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #363741', background: '#212228', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <button style={{ background: 'transparent', border: 'none', color: '#FFF', fontWeight: 500, paddingBottom: '0.5rem', borderBottom: '2px solid #5A84D5', cursor: 'pointer' }}>Tous les projets ({projects.length})</button>
            <button style={{ background: 'transparent', border: 'none', color: '#7E7E86', fontWeight: 500, paddingBottom: '0.5rem', cursor: 'pointer' }}>En cours ({projects.filter(p => p.status === 'En cours').length})</button>
            <button style={{ background: 'transparent', border: 'none', color: '#7E7E86', fontWeight: 500, paddingBottom: '0.5rem', cursor: 'pointer' }}>Terminés ({projects.filter(p => p.status === 'Terminé').length})</button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#7E7E86" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Rechercher un projet..." 
              style={{
                background: '#191A1E',
                border: '1px solid #363741',
                borderRadius: '6px',
                padding: '0.6rem 1rem 0.6rem 2.5rem',
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
                  width: '60px', height: '60px', borderRadius: '8px', 
                  background: '#191A1E', border: '1px solid #363741',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Folder size={24} color="#5A84D5" />
                </div>
                <div>
                  <h4 style={{ color: '#FFF', fontSize: '1.125rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {proj.title}
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      background: proj.status === 'Terminé' ? 'rgba(74, 222, 128, 0.1)' : proj.status === 'En cours' ? 'rgba(255, 184, 77, 0.1)' : 'rgba(160, 160, 165, 0.1)',
                      color: proj.status === 'Terminé' ? '#4ade80' : proj.status === 'En cours' ? '#FFB84D' : '#A0A0A5'
                    }}>
                      {proj.status}
                    </span>
                  </h4>
                  <div style={{ display: 'flex', gap: '1.25rem', color: '#A0A0A5', fontSize: '0.875rem' }}>
                    <span>{proj.subtitle}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#7E7E86' }}></div> {proj.lights}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#7E7E86' }}></div> {proj.location}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ color: '#7E7E86', fontSize: '0.875rem' }}>Mis à jour : {proj.date}</div>
                <button style={{ background: 'transparent', border: 'none', color: '#7E7E86', cursor: 'pointer', padding: '0.5rem' }}>
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
