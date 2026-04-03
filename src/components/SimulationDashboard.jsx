import React, { useState } from 'react';
import RoomSimulation2D from './RoomSimulation2D';
import RoomSimulation3D from './RoomSimulation3D';
import { exportToPDF, buildReportData } from '../utils/reportGenerator';
import { calculateLighting } from '../utils/calculateLighting';
import { calculateUniformity } from '../utils/calculateUniformity';
import { calculateClimateAdjustment } from '../utils/calculateClimateAdjustment';
import { calculateUsageProfile } from '../utils/calculateUsageProfile';
import { ArrowLeft, ArrowRight, LayoutGrid, AlertTriangle, Eye, Sun, Download, Search, Check, FileText } from 'lucide-react';

const C = {
  bg: '#1C1D24',
  surface: '#23242B',
  surface2: '#2B2C35',
  border: '#3A3A44',
  primary: '#5A84D5',
  accent: '#FFB84D',
  text: '#FFFFFF',
  muted: '#A0A0A5',
  dim: '#6D6D78',
  input: '#15151B',
};

// False Color Lux Scale Component
function FalseColorScale({ minVal, maxVal, onChange }) {
  const scale = [
    { v: 0.1,  c: '#000000', t: '#fff' },
    { v: 0.2,  c: '#1a0519', t: '#aaa' },
    { v: 0.3,  c: '#340a33', t: '#aaa' },
    { v: 0.5,  c: '#4b0082', t: '#aaa' },
    { v: 0.75, c: '#8a2be2', t: '#fff' },
    { v: 1.0,  c: '#0000ff', t: '#fff' },
    { v: 3.0,  c: '#1e90ff', t: '#fff' },
    { v: 5.0,  c: '#00bfff', t: '#000' },
    { v: 7.5,  c: '#00ffff', t: '#000' },
    { v: 10,   c: '#40e0d0', t: '#000' },
    { v: 20,   c: '#00fa9a', t: '#000' },
    { v: 30,   c: '#00ff00', t: '#000' },
    { v: 50,   c: '#adff2f', t: '#000' },
    { v: 75,   c: '#ffff00', t: '#000' },
    { v: 100,  c: '#ffd700', t: '#000' },
    { v: 200,  c: '#ffa500', t: '#000' },
    { v: 300,  c: '#ff4500', t: '#fff' },
    { v: 500,  c: '#ff0000', t: '#fff' },
    { v: 750,  c: '#b22222', t: '#fff' },
    { v: 1000, c: '#8b0000', t: '#fff' },
    { v: 2000, c: '#a52a2a', t: '#fff' },
    { v: 3000, c: '#d2691e', t: '#fff' },
    { v: 5000, c: '#ff8c00', t: '#fff' },
    { v: 10000, c: '#ffb6c1', t: '#000' },
    { v: 15000, c: '#ffffff', t: '#000' }
  ];

  const handleIndex = scale.findIndex(s => s.v >= maxVal);
  const safeIndex = handleIndex === -1 ? scale.length - 1 : handleIndex;

  return (
    <div style={{ position: 'relative', width: '100%', padding: '20px 0 10px', userSelect: 'none' }}>
      {/* Slider Inputs Wrapper */}
      <div style={{ position: 'relative', height: '24px', display: 'flex' }}>
         {scale.map((item, idx) => (
            <div 
              key={item.v} 
              style={{ 
                flex: 1, 
                background: item.c, 
                color: item.t,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.625rem',
                fontWeight: 600,
                borderRight: '1px solid rgba(255,255,255,0.1)',
                opacity: idx > safeIndex ? 0.3 : 1, // Visual indication of filtered range
                transition: 'opacity 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => onChange(item.v)}
            >
              {item.v >= 1000 ? (item.v/1000 + 'k') : item.v}
            </div>
         ))}
      </div>

      {/* Floating Value Markers */}
      <div style={{ 
        position: 'absolute', top: 0, 
        left: 'calc(' + ((safeIndex / scale.length) * 100) + '% + ' + (50 / scale.length) + '%)',
        transform: 'translateX(-50%)',
        background: '#333', border: '1px solid #666', color: '#fff',
        padding: '2px 6px', fontSize: '0.6875rem', borderRadius: '4px',
        pointerEvents: 'none', transition: 'left 0.2s'
      }}>
         {scale[safeIndex].v}
         <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #666' }} />
      </div>
    </div>
  );
}

export default function SimulationDashboard({ project, onNext, onPrev }) {
  const [viewMode, setViewMode] = useState('2d');
  
  const [computedResults, setComputedResults] = React.useState(null);
  const [reportData, setReportData] = React.useState(null);
  const [calcError, setCalcError] = React.useState(null);
  const [luxLimit, setLuxLimit] = useState(3000);

  React.useEffect(() => {
    if (project && project.formData) {
      try {
        const formData = project.formData;
        const lighting   = calculateLighting(formData);
        const climate    = calculateClimateAdjustment(formData, lighting);
        const uniformity = calculateUniformity(formData, lighting);
        const usage      = calculateUsageProfile(formData, lighting, climate);
        
        const results = {
          lighting, uniformity, climate,
          naturalLight: climate?.naturalLight || { solar: {}, hourlyProfile: {}, summary: {} },
          usage
        };
        
        setComputedResults(results);
        setReportData(buildReportData(formData, results));
        setCalcError(null);
      } catch (err) {
        console.error('Erreur de calcul SimulationDashboard :', err);
        setCalcError(err.message);
      }
    }
  }, [project]);

  if (!project || !project.formData) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, background: C.bg }}>
        <h2 style={{ color: C.text }}>Aucune Simulation Disponible</h2>
      </div>
    );
  }

  if (calcError) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', background: C.bg }}>
        <AlertTriangle size={64} style={{ marginBottom: '1rem', opacity: 0.8 }} />
        <h2>Erreur de Calcul</h2>
        <p>{calcError}</p>
      </div>
    );
  }

  if (!computedResults) {
    return <div style={{ flex: 1, background: C.bg }} />;
  }

  const { formData } = project;
  const results = computedResults;

  // Generate dynamic data for graph based on lighting result and natural light savings
  const avgLux = results.lighting?.E_average || 500;
  const savings = results.climate?.savings?.savingsPercent || 0;
  
  const mockGraphData = Array(12).fill(0).map((_, i) => {
    // A simple sine wave simulation over the day (6am to 6pm)
    // with some random noise based on the computed average and savings
    const baseLight = avgLux * 0.5; // Always on base light
    const natLightCurve = Math.sin((i / 11) * Math.PI); // 0 to 1 curve
    const noise = (Math.random() - 0.5) * 50;
    return baseLight + (natLightCurve * avgLux * (savings / 100)) + noise;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden', color: C.text, fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Context Header (matches Screenshot 3 header) */}
      <div style={{ padding: '1.5rem 3rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: C.muted, fontSize: '0.875rem' }}>
          <button onClick={onPrev} style={{ background: 'transparent', border: 'none', color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </button>
          <span>Simulation d'éclairage de salle</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
           <button style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '0.5rem 1rem', borderRadius: '6px', color: C.text, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={14} /> Filtres
           </button>
           <button style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '0.5rem 1rem', borderRadius: '6px', color: C.text, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={14} /> Plans
           </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 3rem' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Top Area: Room View (Full Width) */}
            <div className="animate-scale-in" style={{ animationDelay: '0.1s', opacity: 0, width: '100%', minHeight: '650px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
               
               {/* Internal top toolbar */}
               <div style={{ padding: '1rem', display: 'flex', gap: '1rem', borderBottom: `1px solid ${C.border}`, background: C.surface2, alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                  <div style={{ display: 'flex', background: C.input, borderRadius: '4px', padding: '2px' }}>
                    <button onClick={() => setViewMode('2d')} style={{ background: viewMode === '2d' ? C.primary : 'transparent', color: viewMode === '2d' ? '#FFF' : C.dim, border: 'none', padding: '4px 12px', borderRadius: '2px', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 600 }}>2D</button>
                    <button onClick={() => setViewMode('3d')} style={{ background: viewMode === '3d' ? C.primary : 'transparent', color: viewMode === '3d' ? '#FFF' : C.dim, border: 'none', padding: '4px 12px', borderRadius: '2px', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 600 }}>3D</button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: C.muted, marginLeft: 'auto' }}>Aperçu avec grille des lux</span>
               </div>

               <div style={{ flex: 1, position: 'relative', marginTop: '55px', display: 'flex' }}>
                  {viewMode === '2d' ? (
                     <RoomSimulation2D formData={formData} lightingResult={results.lighting} uniformityResult={results.uniformity} climateResult={results.climate} luxLimit={luxLimit} />
                  ) : (
                     <RoomSimulation3D formData={formData} lightingResult={results.lighting} uniformityResult={results.uniformity} climateResult={results.climate} />
                  )}
               </div>
            </div>

            {/* Middle Configuration/KPI Panel (Horizontal) */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, margin: '0 0 1rem' }}>Détails (KPIs)</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                     <div style={{ flex: 1, minWidth: '180px', background: C.surface2, border: `1px solid ${C.border}`, padding: '1.25rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.6875rem', color: C.dim, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Indice d'Éblouissement UGR</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text }}>13 <span style={{fontSize:'0.8125rem', color:C.muted}}>UGR</span></div>
                     </div>
                     <div style={{ flex: 1, minWidth: '180px', background: C.surface2, border: `1px solid ${C.border}`, padding: '1.25rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.6875rem', color: C.dim, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Efficacité Énergétique LPD</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text }}>{((results.lighting?.totalPower || 0)/((formData?.room?.length || 1) * (formData?.room?.width || 1))).toFixed(1)} <span style={{fontSize:'0.8125rem', color:C.muted}}>W/m²</span></div>
                     </div>
                     <div style={{ flex: 1, minWidth: '180px', background: C.surface2, border: `1px solid ${C.border}`, padding: '1.25rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.6875rem', color: C.dim, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Uniformité U0</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text }}>{(results.uniformity?.U0 || 0).toFixed(2)}</div>
                     </div>
                  </div>
               </div>

               {/* Summary small block */}
               <div style={{ width: '320px', background: C.input, padding: '1.5rem', borderRadius: '6px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ fontSize: '0.8125rem', margin: '0 0 1rem', color: C.muted }}>Résumé de l'Éclairage</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                     <span style={{ color: C.dim }}>Moyenne:</span>
                     <span style={{ color: C.text, fontWeight: 500 }}>{Math.round(results.lighting?.E_average || 0)} Lux</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                     <span style={{ color: C.dim }}>Min:</span>
                     <span style={{ color: C.text, fontWeight: 500 }}>{Math.round((results.lighting?.E_average || 0) * (results.uniformity?.U0 || 0))} Lux</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                     <span style={{ color: C.dim }}>Total (Flux):</span>
                     <span style={{ color: C.text, fontWeight: 500 }}>{Math.round((results.lighting?.N || 0) * (formData?.luminaire?.fluxPerUnit || 0))} lm</span>
                  </div>
               </div>
            </div>

            {/* Bottom Area: False Color Settings */}
            <div className="animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
               <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, margin: '0 0 0.5rem' }}>Échelle de Couleurs (Lux)</h3>
               <div style={{ fontSize: '0.6875rem', color: C.dim, marginBottom: '0.5rem' }}>Cliquez sur une valeur pour filtrer le rendu des couleurs simulées en temps réel.</div>
               <FalseColorScale minVal={0.1} maxVal={luxLimit} onChange={setLuxLimit} />
            </div>

         </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '1rem 3rem', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1C1D24' }}>
        <div style={{ fontSize: '0.8125rem', color: C.dim }}>
          Dernière analyse effectuée à 14:02
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: C.muted, marginRight: '1rem' }}>
            Avrg. Lux: <span style={{ color: C.text }}>{Math.round(results.lighting?.E_average || 0)}</span> <span style={{margin:'0 8px', color:C.border}}>|</span> Max: <span style={{ color: C.text }}>{Math.round((results.lighting?.E_average || 0)*1.3)}</span>
          </div>

          <button onClick={onNext} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.primary, border: 'none', color: '#FFF', padding: '0.625rem 1.5rem', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 16px rgba(90,132,213,0.2)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#4A74C5'}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}
          >
            Continuer l'analyse
          </button>
        </div>
      </div>
    </div>
  );
}
