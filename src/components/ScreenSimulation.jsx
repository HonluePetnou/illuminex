import React from 'react';
import { ArrowLeft, ChevronDown, Download, Grid, Eye, Maximize } from 'lucide-react';

export default function ScreenSimulation({ onPrev }) {
  return (
    <div className="page-container" style={{ padding: '2rem 3rem', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#FFF' }}>
          <button onClick={onPrev} style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: '1.25rem', color: '#A0A0A5' }}>Simulation <span style={{ color: '#FFF', fontWeight: '#500' }}>· 2D/3D Simulation</span></span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button style={{ background: 'transparent', border: 'none', color: '#A0A0A5', fontSize: '0.875rem' }}>Rapports</button>
          <button style={{
            background: '#2B2C35', border: '1px solid #363741', padding: '0.625rem 1rem', borderRadius: '8px', color: '#FFF',
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem'
          }}>
            Ludovic <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Main View Settings Row */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        
        <button style={{ background: '#26272D', border: '1px solid #363741', padding: '0.625rem 1rem', borderRadius: '8px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={16} /> Éclairement <ChevronDown size={14} />
        </button>

        <button style={{ background: '#26272D', border: '1px solid #363741', padding: '0.625rem 1rem', borderRadius: '8px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Uniformité, Intensité <ChevronDown size={14} />
        </button>

        <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>View labels</span>
        
        <button style={{ background: '#26272D', border: '1px solid #363741', padding: '0.625rem 1rem', borderRadius: '8px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Lumens <ChevronDown size={14} />
        </button>

        <div style={{ flex: 1 }}></div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ background: '#26272D', border: '1px solid #363741', padding: '0.5rem', borderRadius: '8px', color: '#A0A0A5' }}><Grid size={16} /></button>
          <button style={{ background: '#26272D', border: '1px solid #363741', padding: '0.5rem', borderRadius: '8px', color: '#A0A0A5' }}><Maximize size={16} /></button>
        </div>

      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'center' }}>
        <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Transparency</span>
        <span style={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 500 }}>35%</span>
        <div style={{ width: '200px', height: '4px', background: '#363741', borderRadius: '2px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `35%`, background: '#FFB84D', borderRadius: '2px' }}></div>
          <div style={{ position: 'absolute', left: `35%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#FFB84D', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 0 10px rgba(255,184,77,0.5)' }}></div>
        </div>
      </div>

      {/* Render Area - split 2D and 3D */}
      <div style={{ display: 'flex', gap: '1.5rem', height: '400px', marginBottom: '2rem' }}>
        
        {/* 2D Top View */}
        <div style={{ 
          flex: 1, background: '#191A1E', border: '1px solid #363741', borderRadius: '12px', position: 'relative', overflow: 'hidden'
        }}>
          {/* Floor grid */}
          <div style={{ position: 'absolute', inset: '10%', border: '1px solid #4A4B55', background: 'radial-gradient(circle at center, rgba(255,255,0,0.2) 0%, transparent 70%)' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.3%', width: '1px', background: '#4A4B55' }}></div>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.6%', width: '1px', background: '#4A4B55' }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: '#4A4B55' }}></div>
            {/* lights */}
            {[
              { top: '25%', left: '16.6%' }, { top: '25%', left: '50%' }, { top: '25%', left: '83.3%' },
              { top: '75%', left: '16.6%' }, { top: '75%', left: '50%' }, { top: '75%', left: '83.3%' }
            ].map((pos, i) => (
              <div key={i} style={{ position: 'absolute', ...pos, width: '8px', height: '8px', background: '#FFF', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 15px 5px rgba(255,255,150,0.6)' }}></div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', color: '#A0A0A5', fontSize: '0.875rem' }}>
            X: 3.0 m <br /> Y: 4.8 m
          </div>
        </div>

        {/* 3D Render View */}
        <div style={{ 
          flex: 1, background: '#191A1E', border: '1px solid #363741', borderRadius: '12px', position: 'relative', overflow: 'hidden', padding: '1rem'
        }}>
           <div style={{ 
             width: '100%', height: '100%', 
             background: 'linear-gradient(180deg, #111 0%, #2A2D35 100%)',
             transform: 'perspective(1000px) rotateX(15deg) scale(0.9)',
             border: '1px solid #363741',
             position: 'relative'
           }}>
             {/* Floor grid with light */}
             <div style={{ position: 'absolute', bottom: '10%', left: '10%', right: '10%', height: '40%', transform: 'perspective(500px) rotateX(60deg)', border: '1px solid #4Ade80', background: 'radial-gradient(circle at center, rgba(74, 222, 128, 0.4) 0%, transparent 80%)' }}>
               <div style={{ position: 'absolute', inset: '20%', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                 <div style={{ width: '20px', height: '20px', background: '#FFF', filter: 'blur(5px)' }}></div>
                 <div style={{ width: '20px', height: '20px', background: '#FFF', filter: 'blur(5px)' }}></div>
                 <div style={{ width: '20px', height: '20px', background: '#FFF', filter: 'blur(5px)' }}></div>
               </div>
             </div>
             {/* Walls */}
             <div style={{ position: 'absolute', top: '10%', left: '10%', width: '30%', height: '30%', background: '#1e1f24', border: '1px solid #363741' }}></div>
           </div>
        </div>

      </div>

      <div style={{ display: 'flex', gap: '3rem', marginBottom: '3rem' }}>
        
        {/* Éclairement Diagram */}
        <div style={{ flex: 2 }}>
          <h3 style={{ color: '#FFF', fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 500 }}>Éclairement</h3>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A0A0A5', fontSize: '0.875rem' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#5A84D5' }} /> Luminaires
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A0A0A5', fontSize: '0.875rem' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#5A84D5' }} /> Éléments
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A0A0A5', fontSize: '0.875rem' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#5A84D5' }} /> Résultats
            </label>
          </div>

          <div style={{ height: '80px', width: '100%', background: 'linear-gradient(90deg, #106f5c 0%, #3bb273 25%, #f2d53c 50%, #3bb273 75%, #106f5c 100%)', borderRadius: '6px', position: 'relative', marginTop: '1rem' }}>
            {/* 3 Bright spots */}
            <div style={{ position: 'absolute', top: '50%', left: '25%', width: '24px', height: '24px', background: '#FFF', transform: 'translate(-50%, -50%)', borderRadius: '4px', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '24px', height: '24px', background: '#FFF', transform: 'translate(-50%, -50%)', borderRadius: '4px', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '75%', width: '24px', height: '24px', background: '#FFF', transform: 'translate(-50%, -50%)', borderRadius: '4px', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}></div>
          </div>
        </div>

        {/* Global Results Info */}
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#FFF', fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 500 }}>Résultats</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Dimensions</span>
              <span style={{ color: '#FFF', fontSize: '0.875rem' }}>3.0 m × 4.0 m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Nombre de luminaires</span>
              <span style={{ color: '#FFF', fontSize: '0.875rem' }}>4</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Puissance totale</span>
              <span style={{ color: '#FFF', fontSize: '0.875rem' }}>90 W</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Efficacité energetique</span>
              <span style={{ color: '#FFF', fontSize: '0.875rem' }}>1.84 W/m²</span>
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#FFF', fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 500 }}>Résultats</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#FFF', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ color: '#A0A0A5', borderBottom: '1px solid #363741' }}>
                <th style={{ padding: '1rem 0', fontWeight: 'normal' }}>Zone (900)</th>
                <th style={{ padding: '1rem 0', fontWeight: 'normal' }}>Nombre de luminaires</th>
                <th style={{ padding: '1rem 0', fontWeight: 'normal' }}>Puissance totale</th>
                <th style={{ padding: '1rem 0', fontWeight: 'normal' }}></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '1rem 0' }}>5.0 m × 4.0 m</td>
                <td style={{ padding: '1rem 0' }}>4</td>
                <td style={{ padding: '1rem 0' }}>90 W</td>
                <td style={{ padding: '1rem 0' }}>1.2 m / 1.0 m</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end', width: '300px' }}>
          <button style={{
            background: '#2B2C35', border: '1px solid #363741', padding: '0.75rem 1.5rem', borderRadius: '8px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center'
          }}>
            <Download size={16} /> Exporter simulation
          </button>
          <button className="btn-primary" style={{ width: '100%' }}>Continuer vers analyse</button>
        </div>
      </div>

    </div>
  );
}
