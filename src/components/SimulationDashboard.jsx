import React, { useState } from 'react';
import RoomSimulation2D from './RoomSimulation2D';
import RoomSimulation3D from './RoomSimulation3D';
import { exportToPDF, buildReportData } from '../utils/reportGenerator';
import { calculateLighting } from '../utils/calculateLighting';
import { calculateUniformity } from '../utils/calculateUniformity';
import { calculateClimateAdjustment } from '../utils/calculateClimateAdjustment';
import { calculateUsageProfile } from '../utils/calculateUsageProfile';
import { Download, Layers, Box, Tag, Zap, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, Activity } from 'lucide-react';

const C = {
  bg: '#1A1D2E',
  surface: 'rgba(30,34,55,0.85)',
  surface2: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  primary: '#3B82F6',
  accent: '#F0A500',
  text: '#fff',
  muted: '#94A3B8',
  dim: '#64748B',
};

const S = {
  page: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1.5rem 2rem', gap: '1.5rem', background: C.bg },
  headerCard: { background: 'rgba(26,29,46,0.95)', border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 },
  subtitle: { color: C.muted, fontSize: '0.875rem', marginTop: '0.375rem' },
  grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flex: 1 },
  tabs: { display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.375rem', borderRadius: '12px', border: `1px solid ${C.border}`, alignSelf: 'flex-start', marginBottom: '1rem' },
  tabActive2d: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: C.text, border: 'none', transition: 'all 0.2s' },
  tabActive3d: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: C.primary, color: C.text, border: 'none', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' },
  tabInactive: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', background: 'transparent', color: C.muted, border: 'none', transition: 'all 0.2s' },
  kpiGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' },
  kpiCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem' },
  kpiLabel: { fontSize: '0.75rem', color: C.muted, marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  kpiValue: { fontSize: '1.75rem', fontWeight: 800, color: C.text },
  recCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' },
  recHeader: { background: 'rgba(59,130,246,0.1)', borderBottom: `1px solid rgba(59,130,246,0.2)`, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  recBody: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '300px' },
};

export default function SimulationDashboard({ project, onNext, onPrev }) {
  const [viewMode, setViewMode] = useState('3d');
  
  // === Calcul à la volée dès que formData change ===
  const [computedResults, setComputedResults] = React.useState(null);
  const [reportData, setReportData] = React.useState(null);
  const [calcError, setCalcError] = React.useState(null);

  React.useEffect(() => {
    if (project && project.formData) {
      try {
        const formData = project.formData;
        
        const lighting   = calculateLighting(formData);
        const climate    = calculateClimateAdjustment(formData, lighting);
        const uniformity = calculateUniformity(formData, lighting);
        const usage      = calculateUsageProfile(formData, lighting, climate);
        
        const results = {
          lighting,
          uniformity,
          climate,
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

  // === État de chargement / erreur ===
  if (!project || !project.formData) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, padding: '2rem', background: C.bg }}>
        <Zap size={64} style={{ marginBottom: '1rem', color: C.accent, opacity: 0.5 }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text, marginBottom: '0.5rem' }}>Aucune Simulation Disponible</h2>
        <p>Complétez les étapes de configuration puis revenez ici.</p>
      </div>
    );
  }

  if (calcError) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, padding: '2rem', background: C.bg }}>
        <AlertTriangle size={64} style={{ marginBottom: '1rem', color: '#ef4444', opacity: 0.8 }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.5rem' }}>Erreur de Calcul</h2>
        <p style={{ maxWidth: '500px', textAlign: 'center', fontSize: '0.875rem' }}>{calcError}</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: C.dim }}>Vérifiez les valeurs saisies (ex : dimensions non nulles, luminaire sélectionné).</p>
      </div>
    );
  }

  if (!computedResults) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: C.bg }}>
        Calcul de la trame 3D en cours...
      </div>
    );
  }

  const { formData } = project;
  const results = computedResults;
  const recs = reportData?.recommendations || [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      
      {/* ---- EN-TÊTE ---- */}
      <div style={{
        padding: '1.25rem 2rem 1rem', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(26,29,46,0.95)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Activity size={24} color={C.accent} />
            Visualisation 3D — {project.name || 'Projet Actuel'}
          </h1>
          <p style={S.subtitle}>
            Bâtiment : <strong style={{ color: '#FFF' }}>{formData.occupation?.buildingType || 'Non défini'}</strong>
            &nbsp;|&nbsp;
            Zone : <strong style={{ color: '#FFF' }}>{formData.location?.city} ({formData.location?.country})</strong>
            &nbsp;|&nbsp;
            Dimensions : <strong style={{ color: '#FFF' }}>{formData.room?.length} × {formData.room?.width} m</strong>
          </p>
        </div>
      </div>

      {/* ---- GRILLE PRINCIPALE ---- */}
      <div style={{ flex: 1, display: 'flex', padding: '1.5rem 2rem', gap: '1.5rem', overflowY: 'auto' }}>

        {/* — COLONNE GAUCHE/CENTRE : Simulateurs — */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
          
          {/* Onglets 2D / 3D */}
          <div style={S.tabs}>
            <button
              onClick={() => setViewMode('2d')}
              style={viewMode === '2d' ? S.tabActive2d : S.tabInactive}
              onMouseEnter={e => { if(viewMode!=='2d') e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { if(viewMode!=='2d') e.currentTarget.style.color = C.muted }}
            >
              <Layers size={16} /> Mode Plan 2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              style={viewMode === '3d' ? S.tabActive3d : S.tabInactive}
              onMouseEnter={e => { if(viewMode!=='3d') e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { if(viewMode!=='3d') e.currentTarget.style.color = C.muted }}
            >
              <Box size={16} /> Visite 3D Interactive
            </button>
          </div>

          {/* Composant de simulation */}
          <div style={{ flex: 1, background: '#000', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
            {viewMode === '2d' ? (
              <RoomSimulation2D
                formData={formData}
                lightingResult={results.lighting}
                uniformityResult={results.uniformity}
                climateResult={results.climate}
                naturalLightResult={results.naturalLight}
                usageResult={results.usage}
              />
            ) : (
              <RoomSimulation3D
                formData={formData}
                lightingResult={results.lighting}
                uniformityResult={results.uniformity}
                climateResult={results.climate}
                naturalLightResult={results.naturalLight}
                usageResult={results.usage}
              />
            )}
          </div>
        </div>

        {/* — COLONNE DROITE : KPI + Recommandations — */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

          {/* KPI Cards */}
          <div style={S.kpiGrid}>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>Nombre de Luminaires</div>
              <div style={S.kpiValue}>{Math.round(results.lighting?.N || 0)}</div>
            </div>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>Éclairement Cible</div>
              <div style={{ ...S.kpiValue, color: C.primary }}>{Math.round(results.lighting?.E_required || 0)} <span style={{fontSize:'1rem'}}>lx</span></div>
            </div>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>Uniformité (U0)</div>
              <div style={{ ...S.kpiValue, color: (results.uniformity?.U0 || 0) >= 0.7 ? '#22c55e' : '#f59e0b' }}>
                {(results.uniformity?.U0 || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ ...S.kpiCard, borderBottom: '2px solid #22c55e' }}>
              <div style={S.kpiLabel}>Apport Lumière Nat.</div>
              <div style={{ ...S.kpiValue, color: '#22c55e' }}>
                {(results.climate?.savings?.savingsPercent || 0).toFixed(1)} <span style={{fontSize:'1rem'}}>%</span>
              </div>
            </div>
            <div style={{ ...S.kpiCard, gridColumn: 'span 2', background: 'rgba(0,0,0,0.2)' }}>
              <div style={S.kpiLabel}>Puissance Totale Installée</div>
              <div style={{ ...S.kpiValue, fontSize: '1.5rem', color: C.accent }}>
                {Math.round(results.lighting?.totalPower || 0)} <span style={{fontSize:'1rem'}}>W</span>
              </div>
            </div>
          </div>

          {/* Recommandations automatiques */}
          <div style={S.recCard}>
            <div style={S.recHeader}>
              <Tag size={18} style={{ color: C.primary }} />
              <h3 style={{ fontWeight: 700, color: C.text, margin: 0, fontSize: '0.9375rem' }}>Aperçu & Recommandations</h3>
            </div>
            <div style={S.recBody}>
              {recs.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(34,197,94,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', fontSize: '0.875rem' }}>
                  <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>L'installation semble parfaitement dimensionnée. Aucune recommandation d'alerte spécifique.</div>
                </div>
              ) : (
                recs.map((rec, i) => {
                  const isAlert = rec.toLowerCase().includes('insuffisant') || rec.toLowerCase().includes('trop grand') || rec.toLowerCase().includes('faible') || rec.toLowerCase().includes('incertain');
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        background: isAlert ? 'rgba(240,165,0,0.1)' : 'rgba(59,130,246,0.1)',
                        border: `1px solid ${isAlert ? 'rgba(240,165,0,0.3)' : 'rgba(59,130,246,0.3)'}`,
                        borderRadius: '10px', padding: '1rem',
                        color: isAlert ? '#FDE68A' : '#BFDBFE',
                        fontSize: '0.875rem', lineHeight: '1.5'
                      }}
                    >
                      {isAlert
                        ? <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: C.accent }} />
                        : <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#93C5FD' }} />
                      }
                      <div style={{ color: '#fff' }}>{rec}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pied de page ── */}
      <div style={{ padding: '1rem 2rem', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,29,46,0.98)' }}>
        <div style={{ fontSize: '0.875rem', color: C.muted }}>
          Étape 5/7 — 3D Viewer Interactive
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onPrev} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text, padding: '0.75rem 1.75rem', borderRadius: '10px', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ← Éclairage Naturel
          </button>
          <button onClick={onNext} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#FFF', padding: '0.75rem 2.25rem', borderRadius: '10px', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 16px rgba(59,130,246,0.4)', transition: 'filter 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            Analyse Conformité →
          </button>
        </div>
      </div>
    </div>
  );
}
