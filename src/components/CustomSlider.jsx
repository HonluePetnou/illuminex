import React from 'react';

export default function CustomSlider({ value, min = 0, max = 100, onChange, color = '#5A84D5' }) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div style={{ position: 'relative', flex: 1, height: '20px', display: 'flex', alignItems: 'center', width: '100%' }}>
      <div style={{ width: '100%', height: '4px', background: '#363741', borderRadius: '2px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${percentage}%`, background: color, borderRadius: '2px', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', left: `${percentage}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '14px', height: '14px', background: '#FFF', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 0 5px rgba(0,0,0,0.5)', pointerEvents: 'none' }}></div>
      </div>
      <input 
         type="range" min={min} max={max} value={value} onChange={onChange}
         style={{ position: 'absolute', width: '100%', margin: 0, opacity: 0, cursor: 'pointer', height: '100%' }}
      />
    </div>
  );
}
