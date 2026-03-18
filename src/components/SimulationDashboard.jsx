import React, { useState } from 'react';
import RoomSimulation2D from './RoomSimulation2D';
import RoomSimulation3D from './RoomSimulation3D';
import { exportToPDF, buildReportData } from '../utils/reportGenerator';
import { calculateLighting } from '../utils/calculateLighting';
import { calculateUniformity } from '../utils/calculateUniformity';
import { calculateClimateAdjustment } from '../utils/calculateClimateAdjustment';
import { calculateUsageProfile } from '../utils/calculateUsageProfile';
import { Download, Layers, Box, Tag, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

// ============================================================
// Tokens de style alignés sur le design system ILLUMINEX-BJ
// ============================================================
const S = {
  page: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1.5rem 2rem', gap: '1.5rem', background: '#191A1E' },
  card: { background: '#26272D', border: '1px solid #363741', borderRadius: '12px', padding: '1.5rem' },
  headerCard: { background: '#26272D', border: '1px solid #363741', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 },
  subtitle: { color: '#A0A0A5', fontSize: '0.875rem', marginTop: '0.25rem' },
  grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flex: 1 },
  tabs: { display: 'flex', gap: '0.5rem', background: 'rgba(43,44,53,0.5)', padding: '0.375rem', borderRadius: '12px', border: '1px solid #363741', alignSelf: 'flex-start', marginBottom: '1rem' },
  tabActive2d: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: '#363741', color: '#FFF', border: 'none' },
  tabActive3d: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: '#4F46E5', color: '#FFF', border: 'none' },
  tabInactive: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#A0A0A5', border: 'none' },
  kpiGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' },
  kpiCard: { background: '#26272D', border: '1px solid #363741', borderRadius: '12px', padding: '1rem' },
  kpiLabel: { fontSize: '0.75rem', color: '#A0A0A5', marginBottom: '0.25rem' },
  kpiValue: { fontSize: '1.75rem', fontWeight: 700, color: '#FFF' },
  recCard: { background: '#26272D', border: '1px solid #363741', borderRadius: '12px', overflow: 'hidden', flex: 1 },
  recHeader: { background: '#1E1F24', borderBottom: '1px solid #363741', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  recBody: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '300px' },
};

export default function SimulationDashboard({ project }) {
  const [viewMode, setViewMode] = useState('2d');
  
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#A0A0A5', padding: '2rem' }}>
        <Zap size={64} style={{ marginBottom: '1rem', color: '#FFB84D', opacity: 0.5 }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', marginBottom: '0.5rem' }}>Aucune Simulation Disponible</h2>
        <p>Complétez les étapes de configuration puis revenez ici.</p>
      </div>
    );
  }

  if (calcError) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#A0A0A5', padding: '2rem' }}>
        <AlertTriangle size={64} style={{ marginBottom: '1rem', color: '#ef4444', opacity: 0.8 }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.5rem' }}>Erreur de Calcul</h2>
        <p style={{ maxWidth: '500px', textAlign: 'center', fontSize: '0.875rem' }}>{calcError}</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#7E7E86' }}>Vérifiez les valeurs saisies (ex : dimensions non nulles, luminaire sélectionné).</p>
      </div>
    );
  }

  if (!computedResults) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0A0A5' }}>
        Calcul en cours...
      </div>
    );
  }

  const { formData } = project;
  const results = computedResults;
  const recs = reportData?.recommendations || [];

  return (
    <div style={S.page}>
      
      {/* ---- EN-TÊTE ---- */}
      <div style={S.headerCard}>
        <div>
          <h1 style={S.title}>
            <Zap size={24} style={{ color: '#FFB84D' }} />
            Tableau de Bord — {project.name || 'Projet Actuel'}
          </h1>
          <p style={S.subtitle}>
            Type : <strong style={{ color: '#FFF' }}>{formData.occupation?.buildingType || 'Non défini'}</strong>
            &nbsp;|&nbsp;
            Zone : <strong style={{ color: '#FFF' }}>{formData.location?.zone || 'Non définie'}</strong>
            &nbsp;|&nbsp;
            Pièce : <strong style={{ color: '#FFF' }}>{formData.room?.length} × {formData.room?.width} m</strong>
          </p>
        </div>
        <button
          onClick={() => exportToPDF(reportData)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3B82F6', border: 'none', color: '#FFF', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
        >
          <Download size={18} /> Télécharger Rapport PDF
        </button>
      </div>

      {/* ---- GRILLE PRINCIPALE ---- */}
      <div style={S.grid}>

        {/* — COLONNE GAUCHE/CENTRE : Simulateurs — */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Onglets 2D / 3D */}
          <div style={S.tabs}>
            <button
              onClick={() => setViewMode('2d')}
              style={viewMode === '2d' ? S.tabActive2d : S.tabInactive}
            >
              <Layers size={16} /> Mode Plan 2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              style={viewMode === '3d' ? S.tabActive3d : S.tabInactive}
            >
              <Box size={16} /> Visite 3D Interactive
            </button>
          </div>

          {/* Composant de simulation */}
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

        {/* — COLONNE DROITE : KPI + Recommandations — */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* KPI Cards */}
          <div style={S.kpiGrid}>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>Nombre de Luminaires</div>
              <div style={S.kpiValue}>{Math.round(results.lighting?.N || 0)}</div>
            </div>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>Éclairement Cible</div>
              <div style={{ ...S.kpiValue, color: '#60A5FA' }}>{Math.round(results.lighting?.E_required || 0)} lx</div>
            </div>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>Uniformité (U0)</div>
              <div style={{ ...S.kpiValue, color: (results.uniformity?.U0 || 0) >= 0.7 ? '#4ade80' : '#fbbf24' }}>
                {(results.uniformity?.U0 || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ ...S.kpiCard, borderBottom: '2px solid #4ade80' }}>
              <div style={S.kpiLabel}>Économies Lumière Nat.</div>
              <div style={{ ...S.kpiValue, color: '#4ade80' }}>
                {(results.climate?.savings?.savingsPercent || 0).toFixed(1)} %
              </div>
            </div>
            <div style={{ ...S.kpiCard, gridColumn: 'span 2', background: '#1E1F24' }}>
              <div style={S.kpiLabel}>Puissance Totale Installée</div>
              <div style={{ ...S.kpiValue, fontSize: '1.25rem', color: '#A0A0A5' }}>
                {Math.round(results.lighting?.totalPower || 0)} W
              </div>
            </div>
          </div>

          {/* Recommandations automatiques */}
          <div style={S.recCard}>
            <div style={S.recHeader}>
              <Tag size={18} style={{ color: '#818CF8' }} />
              <h3 style={{ fontWeight: 600, color: '#FFF', margin: 0, fontSize: '0.9375rem' }}>Expertise Automatique</h3>
            </div>
            <div style={S.recBody}>
              {recs.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(74,222,128,0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: '0.875rem' }}>
                  <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>L'installation semble parfaitement dimensionnée. Aucune recommandation d'alerte spécifique.</div>
                </div>
              ) : (
                recs.map((rec, i) => {
                  const isAlert = rec.includes('⚠️') || rec.toLowerCase().includes('insuffisant');
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        background: isAlert ? 'rgba(251,191,36,0.08)' : 'rgba(99,102,241,0.08)',
                        border: `1px solid ${isAlert ? 'rgba(251,191,36,0.2)' : 'rgba(99,102,241,0.2)'}`,
                        borderRadius: '8px', padding: '0.75rem',
                        color: isAlert ? '#FCD34D' : '#A5B4FC',
                        fontSize: '0.875rem', lineHeight: '1.5'
                      }}
                    >
                      {isAlert
                        ? <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#F59E0B' }} />
                        : <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#818CF8' }} />
                      }
                      <div>{rec.replace(/^(⚠️|✅|☀️|🌧️|📚|💡)\s*/, '')}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
