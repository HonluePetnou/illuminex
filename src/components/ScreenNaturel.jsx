import React from 'react';
import { ArrowLeft, Calendar, MapPin, CloudSun, ChevronDown } from 'lucide-react';

export default function ScreenNaturel({ onNext, onPrev }) {
  return (
    <div className="page-container" style={{ padding: '2rem 3rem', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#FFF' }}>
          <button onClick={onPrev} style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: '1.25rem', color: '#A0A0A5' }}>Simulation <span style={{ color: '#FFF', fontWeight: '#500' }}>· Éclairage Naturel</span></span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button style={{
            background: '#2B2C35', border: '1px solid #363741', padding: '0.625rem 1rem', borderRadius: '8px', color: '#FFF',
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem'
          }}>
            📋 Balayons <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Top Config Row */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', background: '#26272D', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #363741', gap: '1rem' }}>
          <Calendar size={18} color="#7E7E86" />
          <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Date & Heure</span>
          <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500, borderLeft: '1px solid #363741', paddingLeft: '1rem' }}>24 avril, 12:00</span>
          <ChevronDown size={14} color="#7E7E86" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: '#26272D', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #363741', gap: '1rem' }}>
          <MapPin size={18} color="#7E7E86" />
          <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>Paris, France</span>
          <ChevronDown size={14} color="#7E7E86" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: '#26272D', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #363741', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudSun size={18} color="#FFB84D" />
            <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>15°C</span>
          </div>
          <div style={{ width: '1px', height: '20px', background: '#363741' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#7E7E86', fontSize: '0.875rem' }}>Humidité</span>
            <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>34%</span>
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'center' }}>
        <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Transparency</span>
        <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>40%</span>
        <div style={{ width: '200px', height: '4px', background: '#363741', borderRadius: '2px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `40%`, background: '#FFB84D', borderRadius: '2px' }}></div>
          <div style={{ position: 'absolute', left: `40%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#FFB84D', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 0 10px rgba(255,184,77,0.5)' }}></div>
        </div>
      </div>

      {/* Main content grid */}
      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        
        {/* Render Area */}
        <div style={{ 
          flex: 1, 
          background: '#191A1E', 
          border: '1px solid #363741', 
          borderRadius: '12px', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Top-down room mockup rendering with dynamic glow */}
          <div style={{
            width: '80%', height: '70%', 
            border: '4px solid #2B2C35',
            background: '#212228',
            position: 'relative'
          }}>
            {/* Window */}
            <div style={{ position: 'absolute', top: -4, left: '30%', width: '40%', height: '8px', background: '#FFF', boxShadow: '0 0 20px #FFF' }}></div>
            {/* Sun rays graphic */}
            <div style={{ 
              position: 'absolute', top: 0, left: '10%', right: '10%', height: '100%',
              background: 'linear-gradient(180deg, rgba(255,255,200,0.8) 0%, rgba(255,255,0,0) 100%)',
              clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0% 100%)'
            }}></div>
            {/* Spotlights */}
            {[
              { top: '20%', left: '20%' }, { top: '20%', left: '50%' }, { top: '20%', left: '80%' },
              { top: '80%', left: '20%' }, { top: '80%', left: '50%' }, { top: '80%', left: '80%' }
            ].map((pos, i) => (
              <div key={i} style={{ position: 'absolute', ...pos, width: '10px', height: '10px', background: '#FFF', borderRadius: '50%', boxShadow: '0 0 10px rgba(255,255,255,0.8)' }}></div>
            ))}
          </div>
        </div>

        {/* Options Sidebar */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: '#26272D', border: '1px solid #363741', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', color: '#FFF', fontWeight: 500, margin: 0 }}>Options</h3>
              <ChevronDown size={18} color="#A0A0A5" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Luminosité du soleil</span>
                <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>100 %</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: '#363741', borderRadius: '2px', position: 'relative' }}>
               <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `100%`, background: '#FFB84D', borderRadius: '2px' }}></div>
               <div style={{ position: 'absolute', left: `100%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#FFF', borderRadius: '50%', cursor: 'pointer' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Luminosité du ciel</span>
                <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>75 %</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: '#363741', borderRadius: '2px', position: 'relative' }}>
               <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `75%`, background: '#A0A0A5', borderRadius: '2px' }}></div>
               <div style={{ position: 'absolute', left: `75%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#FFF', borderRadius: '50%', cursor: 'pointer' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#5A84D5' }} />
              <span style={{ color: '#FFF', fontSize: '0.875rem' }}>Rayons du soleil</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Niveau de lumière ambiante</span>
                <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>100 Lux</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: '#363741', borderRadius: '2px', position: 'relative' }}>
               <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `50%`, background: '#FFB84D', borderRadius: '2px' }}></div>
               <div style={{ position: 'absolute', left: `50%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#FFB84D', borderRadius: '50%', cursor: 'pointer' }}></div>
              </div>
            </div>

            <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>⚙ Reinitialiser</button>
          </div>
        </div>

      </div>

      {/* Bottom Area */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', background: '#26272D', padding: '1.5rem', borderRadius: '12px', border: '1px solid #363741', alignItems: 'center' }}>
        
        {/* Heatmap Bar mock */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Avrg. norte: <span style={{ color: '#FFF', fontWeight: 500 }}>82 Lux</span></span>
          </div>
          <div style={{ height: '60px', width: '100%', background: 'linear-gradient(90deg, #106f5c 0%, #3bb273 25%, #f2d53c 50%, #3bb273 75%, #106f5c 100%)', borderRadius: '6px', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#7E7E86' }}>
              <span>20</span><span>40</span><span>60</span><span>80</span><span>100</span><span>120</span>
            </div>
            {/* Center dots */}
            <div style={{ position: 'absolute', top: '50%', left: '25%', width: '16px', height: '16px', background: 'rgba(255,255,255,0.8)', transform: 'translate(-50%, -50%)', borderRadius: '2px' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '16px', height: '16px', background: 'rgba(255,255,255,0.8)', transform: 'translate(-50%, -50%)', borderRadius: '2px' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '75%', width: '16px', height: '16px', background: 'rgba(255,255,255,0.8)', transform: 'translate(-50%, -50%)', borderRadius: '2px' }}></div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Averenne</span>
            <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>82 Lux</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Max</span>
            <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>214 Lux</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary">Exporter les</button>
          <button className="btn-primary" onClick={onNext}>Continuer vers l'analyse</button>
        </div>

      </div>

    </div>
  );
}
