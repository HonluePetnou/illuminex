import React, { useState } from 'react';
import { Search, ChevronDown, Filter, LayoutGrid, List } from 'lucide-react';

export default function ScreenLuminaires({ onNext }) {
  const [selectedCards, setSelectedCards] = useState([true, true, true]);

  const cards = [
    { id: 1, title: 'LED_Philips_150x150', lm: '2250 lm', w: '18 W', eff: '125 lm/W', tc: '4000 K', irc: '>80' },
    { id: 2, title: 'LED_Osram_300x300', lm: '3610 lm', w: '30 W', eff: '120 lm/W', tc: '4000 K', irc: '>80' },
    { id: 3, title: 'LED_General_600x600', lm: '4200 lm', w: '36 W', eff: '117 lm/W', tc: '4000 K', irc: '>80' },
  ];

  return (
    <div className="page-container" style={{ padding: '2rem 3rem', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 500, color: '#FFF', margin: 0 }}>
          Sélection des luminaires
        </h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#7E7E86" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Recherche luminaire..." 
              style={{
                background: '#191A1E',
                border: '1px solid #363741',
                borderRadius: '8px',
                padding: '0.625rem 1rem 0.625rem 2.5rem',
                color: '#FFF',
                width: '280px',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <button style={{
            background: '#2B2C35',
            border: '1px solid #363741',
            padding: '0.625rem 1rem',
            borderRadius: '8px',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            ⚙ Mode Expert <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '2rem', minHeight: 0 }}>
        
        {/* Left Filters Area */}
        <div style={{ width: '260px', overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#FFF', fontWeight: 500 }}>Filtrer</h3>
            <ChevronDown size={18} color="#A0A0A5" />
          </div>

          {[
            { label: 'Flux lumineux (lm)', min: '1000 lm', max: '10000 lm', val: 70 },
            { label: 'W', min: '10-40 V', max: '40 W', val: 40 },
            { label: 'Temperature colorée (K)', min: '2700 6300 K', max: '3000-4000 K', val: 60 },
            { label: 'IRC', min: '801 x 150 >', max: '90 >', val: 50 }
          ].map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: '#FFF', fontSize: '1rem' }}>{item.label}</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: '#363741', borderRadius: '2px', position: 'relative', marginBottom: '0.5rem' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${item.val}%`, background: '#5A84D5', borderRadius: '2px' }}></div>
                <div style={{ position: 'absolute', left: `${item.val}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#FFF', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7E7E86', fontSize: '0.75rem' }}>{item.min}</span>
                <span style={{ color: '#7E7E86', fontSize: '0.75rem' }}>{item.max}</span>
              </div>
            </div>
          ))}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#FFF', fontSize: '1rem' }}>Dimension</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ background: '#2B2C35', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#A0A0A5' }}>150/150</span>
                <span style={{ background: '#2B2C35', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#A0A0A5' }}>200 ×</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button style={{ background: '#2B2C35', border: '1px solid #363741', color: '#A0A0A5', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.875rem' }}>150x150</button>
              <button style={{ background: '#2B2C35', border: '1px solid #363741', color: '#A0A0A5', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.875rem' }}>300x300</button>
              <button style={{ background: '#5A84D5', border: 'none', color: '#FFF', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.875rem' }}>600x600</button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: '2rem' }}>
          
          {/* Sub Filters Row */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button style={{
              background: '#2B2C35', border: '1px solid #363741', padding: '0.625rem 1rem', borderRadius: '8px', color: '#FFF',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem'
            }}>
              <Filter size={14} /> Filtrer <ChevronDown size={14} />
            </button>
            <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
              <Search size={16} color="#7E7E86" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Recherche luminaire..." 
                style={{
                  background: '#191A1E', border: '1px solid #363741', borderRadius: '8px', padding: '0.625rem 1rem 0.625rem 2.5rem',
                  color: '#FFF', width: '100%', outline: 'none', fontSize: '0.875rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{ background: '#2B2C35', border: '1px solid #363741', padding: '0.625rem', borderRadius: '8px', color: '#A0A0A5', display: 'flex', alignItems: 'center' }}>
                <LayoutGrid size={16} />
              </button>
              <button style={{ background: '#191A1E', border: '1px solid #363741', padding: '0.625rem', borderRadius: '8px', color: '#5A84D5', display: 'flex', alignItems: 'center' }}>
                <List size={16} />
              </button>
            </div>
          </div>
          
          {/* Flux Slider Context */}
          <div style={{ width: '100%', maxWidth: '500px', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#FFF', fontSize: '0.875rem' }}>Flux lumineux (lm)</span>
              <span style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>10000 lm</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: '#363741', borderRadius: '2px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `100%`, background: '#5A84D5', borderRadius: '2px' }}></div>
              <div style={{ position: 'absolute', left: `100%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#FFF', borderRadius: '50%', cursor: 'pointer' }}></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
             {/* Sub filter drops */}
             <button style={{ background: '#2B2C35', border: '1px solid #363741', padding: '0.5rem 1rem', borderRadius: '6px', color: '#FFF', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                T W <ChevronDown size={14} />
             </button>
             <button style={{ background: '#2B2C35', border: '1px solid #363741', padding: '0.5rem 1rem', borderRadius: '6px', color: '#FFF', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ☰ 10-40 <ChevronDown size={14} />
             </button>
             <button style={{ background: '#2B2C35', border: '1px solid #363741', padding: '0.5rem 1rem', borderRadius: '6px', color: '#FFF', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ↕ 0 W + <ChevronDown size={14} />
             </button>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {cards.map((card, idx) => (
              <div key={card.id} style={{
                background: '#26272D', borderRadius: '12px', overflow: 'hidden', border: '1px solid #363741', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #363741', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: '#FFF', fontSize: '1rem', margin: 0 }}>{card.title}</h4>
                  <div style={{ position: 'relative', width: '20px', height: '20px', borderRadius: '10px', background: selectedCards[idx] ? '#5A84D5' : '#191A1E', border: '1px solid #363741', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => {
                    const next = [...selectedCards]; next[idx] = !next[idx]; setSelectedCards(next);
                  }}>
                    {selectedCards[idx] && <span style={{ color: '#FFF', fontSize: '12px' }}>✓</span>}
                  </div>
                </div>

                {/* Light Image placeholder */}
                <div style={{ height: '140px', background: 'linear-gradient(180deg, #191A1E 0%, #26272D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                   {/* Light glow effect */}
                   <div style={{ width: '120px', height: '20px', background: '#FFF', borderRadius: '4px', boxShadow: '0 20px 40px rgba(255,255,255,0.8)' }}></div>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#5A84D5' }}>✓</span> <span style={{ color: '#FFF', fontSize: '0.875rem' }}>{card.lm}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#FFF', fontSize: '0.875rem' }}>{card.w}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#5A84D5' }}>✓</span> <span style={{ color: '#FFF', fontSize: '0.875rem' }}>{card.eff}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#FFF', fontSize: '0.875rem' }}>117 lm/W</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#5A84D5' }}>✓</span> <span style={{ color: '#FFF', fontSize: '0.875rem' }}>{card.tc}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#FFF', fontSize: '0.875rem' }}>{card.irc}</span></div>
                  </div>

                  {/* Photometric curve mockup */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1E1F24', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '1px dashed #4A4B55', position: 'relative' }}>
                       {/* Center axis */}
                       <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: '#4A4B55' }}></div>
                       <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: '#4A4B55' }}></div>
                       {/* Curve pattern */}
                       <svg width="100%" height="100%" viewBox="0 0 100 100">
                         <path d="M50 50 Q 80 10 50 90 Q 20 10 50 50" fill="none" stroke="#FFB84D" strokeWidth="2" />
                       </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={onNext} style={{ fontSize: '1.125rem', padding: '1rem 3rem' }}>
              Calculer le nombre auto
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
