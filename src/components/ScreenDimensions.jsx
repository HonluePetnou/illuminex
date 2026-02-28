import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function ScreenDimensions({ onNext, onPrev }) {
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
          ⚙ Mode Expert <ChevronDown size={14} />
        </button>
      </div>

      <h2 style={{ fontSize: '2rem', fontWeight: 500, marginBottom: '2rem', color: '#FFF' }}>
        Définition de la pièce
      </h2>
      <div style={{ height: '1px', background: '#363741', width: '100%', marginBottom: '3rem' }}></div>

      <div style={{ display: 'flex', gap: '4rem', marginBottom: '3rem' }}>
        {/* 3D Box Representation (Mock) */}
        <div style={{ 
          flex: 1, 
          height: '350px', 
          border: '1px solid #4A4B55', 
          borderRadius: '12px',
          position: 'relative',
          background: 'linear-gradient(180deg, #26272D 0%, #191A1E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Box outline graphic */}
          <div style={{
            width: '80%', height: '70%', 
            border: '2px solid rgba(255,255,255,0.1)',
            transform: 'perspective(600px) rotateX(10deg) rotateY(-15deg)',
            position: 'relative',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '30px', height: '8px', background: '#FFB84D', borderRadius: '50%', boxShadow: '0 0 20px 5px rgba(255, 184, 77, 0.4)' }}></div>
            <div style={{ position: 'absolute', top: '20%', right: '30%', width: '30px', height: '8px', background: '#FFB84D', borderRadius: '50%', boxShadow: '0 0 20px 5px rgba(255, 184, 77, 0.4)' }}></div>
            {/* Some walls */}
            <div style={{ position: 'absolute', right: '10%', bottom: '0', width: '30%', height: '60%', border: '1px solid rgba(255,255,255,0.2)' }}></div>
          </div>
          
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: '#A0A0A5', fontSize: '1rem' }}>
            Surface calculée : <span style={{ fontWeight: 600, color: '#FFF' }}>42.0 m²</span>
          </div>
        </div>

        {/* Form Inputs */}
        <div style={{ flex: 1, maxWidth: '400px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
            {['Longueur', 'Largeur', 'Hauteur plafond'].map((label, idx) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#FFF', fontSize: '1rem' }}>{label}</span>
                <div style={{ position: 'relative', width: '200px' }}>
                  <input
                    type="text"
                    defaultValue={idx === 0 ? '7.00' : idx === 1 ? '6.00' : '3.00'}
                    style={{
                      width: '100%',
                      background: '#191A1E',
                      border: '1px solid #363741',
                      borderRadius: '8px',
                      padding: '0.875rem 1rem',
                      color: '#FFF',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#7E7E86' }}>m</span>
                </div>
              </div>
            ))}
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#FFF', fontSize: '1rem' }}>Type de pièce</span>
                <div style={{ position: 'relative', width: '200px' }}>
                  <select
                    style={{
                      width: '100%',
                      background: '#2B2C35',
                      border: '1px solid #363741',
                      borderRadius: '8px',
                      padding: '0.875rem 1rem',
                      color: '#FFF',
                      fontSize: '1rem',
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option>Bureau</option>
                  </select>
                  <ChevronDown size={14} color="#FFF" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#FFF', fontWeight: 500 }}>Réflectance surfaces</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {[
              { label: 'Plafond', value: '70%', bounds: ['50%', '90%'], progress: 60 },
              { label: 'Murs', value: '50%', bounds: ['20-80%', '20-60'], progress: 30 },
              { label: 'Sol', value: '20%', bounds: ['10-40%', '10-40'], progress: 20 }
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: '#FFF', fontSize: '1rem' }}>{item.label}</span>
                  <div style={{ position: 'relative', width: '100px' }}>
                    <select
                      style={{
                        width: '100%',
                        background: '#2B2C35',
                        border: '1px solid #363741',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        color: '#FFF',
                        fontSize: '0.875rem',
                        outline: 'none',
                        appearance: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <option>{item.value}</option>
                    </select>
                    <ChevronDown size={12} color="#FFF" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </div>
                {/* Custom slider with bounds labels */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: '#7E7E86', fontSize: '0.75rem', minWidth: '40px' }}>{item.bounds[0]}</span>
                  <div style={{ flex: 1, height: '4px', background: '#363741', borderRadius: '2px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${item.progress}%`, background: '#5A84D5', borderRadius: '2px' }}></div>
                    <div style={{ position: 'absolute', left: `${item.progress}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#FFF', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}></div>
                  </div>
                  <span style={{ color: '#7E7E86', fontSize: '0.75rem', minWidth: '40px' }}>{item.bounds[1]}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div style={{ height: '1px', background: '#363741', width: '100%', marginBottom: '2rem' }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.25rem', color: '#A0A0A5' }}>
          Surface calculée : <span style={{ fontSize: '2rem', fontWeight: 600, color: '#FFF', marginLeft: '1rem' }}>42.0 m²</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={onPrev}
            style={{ 
              background: '#2B2C35', border: '1px solid #363741', color: '#FFF', 
              padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1.125rem', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#363741'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2B2C35'}
          >
            Précédent
          </button>
          <button 
            onClick={onNext}
            style={{ 
              background: '#5A84D5', border: 'none', color: '#FFF', 
              padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1.125rem', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4A74C5'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#5A84D5'}
          >
            Suivant
          </button>
        </div>
      </div>

    </div>
  );
}
