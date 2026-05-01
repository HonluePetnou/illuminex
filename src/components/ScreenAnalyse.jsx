import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, BarChart2, CheckSquare, Wrench, Lightbulb } from 'lucide-react';
import { NORMS, NORMS_U0 } from '../data/norms';
import { calculateLighting } from '../utils/calculateLighting';
import { calculateUniformity } from '../utils/calculateUniformity';

function MetricCard({ label, value, unit, subValue, color = '#3B82F6' }) {
  return (
    <div className="animate-slide-up" style={{
      background: '#23242B',
      border: '1px solid #3A3A44',
      borderRadius: 12,
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    }}>
      <span style={{ color: '#64748B', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
        {value} <span style={{ fontSize: 14, fontWeight: 500 }}>{unit}</span>
      </span>
      {subValue && <span style={{ color: '#64748B', fontSize: 12 }}>{subValue}</span>}
    </div>
  );
}

function ConformityBadge({ isConform }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.25rem 0.75rem',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      background: isConform ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
      color: isConform ? '#22c55e' : '#ef4444',
    }}>
      {isConform ? <><CheckCircle2 size={12} /> Conforme</> : <><XCircle size={12} /> Non conforme</>}
    </span>
  );
}

export default function ScreenAnalyse({ formData, updateFormData, onNext, onPrev }) {
  const room      = formData?.room       || { length: 7, width: 6, ceilingHeight: 3 };
  const luminaire = formData?.luminaire  || {};

  const [showDetails, setShowDetails] = useState(false);
  const [showDelta, setShowDelta]     = useState(false);

  const roomType = room.type || 'Bureau';
  const norm     = NORMS[roomType] || NORMS['Bureau'];
  const normU0   = NORMS_U0[roomType] || 0.60;

  // Run calculation engines — single source of truth
  const { lighting, uniformity } = useMemo(() => {
    const lt = calculateLighting(formData);
    const un = calculateUniformity(formData, lt);
    return { lighting: lt, uniformity: un };
  }, [formData]);

  const surface = lighting.S;
  const N       = lighting.N;
  const eMax    = uniformity.E_max;
  const eMin    = uniformity.E_min;
  const eMoy    = uniformity.E_moy;
  const u0      = uniformity.U0;
  const cols    = uniformity.layout.cols;
  const rows    = uniformity.layout.rows;

  const puissanceTotale = lighting.totalPower;
  const efficacite      = surface > 0 ? Math.round((puissanceTotale / surface) * 100) / 100 : 0;

  // Conformities
  const conform_lux = eMoy >= norm.lux;
  const conform_u0  = u0 >= normU0;
  const conform_irc = (luminaire.irc || 80) >= norm.ircMin;

  // Deterministic heatmap zones based on luminaire positions
  const zones = useMemo(() => {
    const zoneRows = 3, zoneCols = 4;
    const cellW = room.width / zoneCols;
    const cellH = room.length / zoneRows;
    const Hm = (room.ceilingHeight || 3) - (room.workPlaneHeight || 0.85);
    const positions = uniformity.positions;
    const res = [];

    for (let r = 0; r < zoneRows; r++) {
      for (let c = 0; c < zoneCols; c++) {
        const cx = (c + 0.5) * cellW; // zone center X (along width)
        const cy = (r + 0.5) * cellH; // zone center Y (along length)

        // Sum inverse-square contributions from each luminaire
        let totalContrib = 0;
        for (const p of positions) {
          const dx = cx - p.y; // p.x is along length, p.y along width in the engine
          const dy = cy - p.x;
          const distSq = dx * dx + dy * dy + Hm * Hm;
          totalContrib += 1 / distSq;
        }

        res.push({ cx, cy, contrib: totalContrib });
      }
    }

    // Normalize so average matches eMoy
    const avgContrib = res.reduce((s, z) => s + z.contrib, 0) / res.length;
    const scale = avgContrib > 0 ? eMoy / avgContrib : 0;

    return res.map((z, i) => {
      const e = Math.round(z.contrib * scale);
      const zoneU = eMoy > 0 ? Math.round((Math.min(e, eMoy) / Math.max(e, eMoy)) * 100) / 100 : 0;
      return {
        zone: `${((i % 4) * (room.width / 4)).toFixed(1)}–${(((i % 4) + 1) * (room.width / 4)).toFixed(1)} m × ${(Math.floor(i / 4) * (room.length / 3)).toFixed(1)}–${((Math.floor(i / 4) + 1) * (room.length / 3)).toFixed(1)} m`,
        e,
        u: zoneU,
        ok: e >= norm.lux,
      };
    });
  }, [uniformity, eMoy, norm.lux, room]);

  // Heatmap color based on lux level
  const lxColor = (lx) => {
    const ratio = Math.min(1, lx / (norm.lux * 1.5));
    if (ratio > 0.8) return '#22c55e';
    if (ratio > 0.5) return '#f59e0b';
    return '#ef4444';
  };

  // Optimize button handler — suggest adding luminaires if non-conformant
  const handleOptimize = () => {
    if (!conform_lux || !conform_u0) {
      // Estimate needed luminaires for conformity
      const targetE = norm.lux;
      const cu = lighting.CU;
      const mf = lighting.MF;
      const flux = luminaire.fluxPerUnit || 1;
      const nNeeded = Math.ceil((targetE * surface) / (flux * cu * mf));
      if (nNeeded > N) {
        updateFormData('luminaire', { nbLuminaires: nNeeded });
      }
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1C1D24' }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        padding: '1.25rem 2rem 1rem',
        borderBottom: '1px solid #3A3A44',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: '#1C1D24',
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 700 }}>
            Analyse <span style={{ color: '#FFB84D' }}>&amp;</span> Optimisation
          </h1>
          <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: 12 }}>
            {roomType} — {room.length} × {room.width} m — {N} luminaires
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <ConformityBadge isConform={conform_lux && conform_u0} />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <MetricCard
            label="Éclairement Moy."
            value={eMoy}
            unit="Lux"
            subValue={`Norme : ≥ ${norm.lux} Lux`}
            color={conform_lux ? '#22c55e' : '#ef4444'}
          />
          <MetricCard
            label="Uniformité U0"
            value={u0.toFixed(2)}
            unit=""
            subValue={`Norme : ≥ ${normU0}`}
            color={conform_u0 ? '#22c55e' : '#f59e0b'}
          />
          <MetricCard
            label="Nb. luminaires"
            value={N}
            unit="unités"
            subValue={`${cols} col × ${rows} rangées`}
            color="#F0A500"
          />
          <MetricCard
            label="Puissance totale"
            value={puissanceTotale}
            unit="W"
            subValue={`${efficacite} W/m²`}
            color="#3B82F6"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          {/* Left — Carte thermique + Tableau */}
          <div>
            {/* Carte thermique */}
            <div style={{
              background: '#23242B',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 700 }}>
                  Carte thermique — Éclairement (Lux)
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    style={{
                      background: showDetails ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${showDetails ? '#F0A500' : 'rgba(255,255,255,0.1)'}`,
                      color: showDetails ? '#F0A500' : '#94A3B8',
                      borderRadius: 6, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    Afficher détails
                  </button>
                  <button
                    onClick={() => setShowDelta(!showDelta)}
                    style={{
                      background: showDelta ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${showDelta ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
                      color: showDelta ? '#3B82F6' : '#94A3B8',
                      borderRadius: 6, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    Delta sur le plan
                  </button>
                </div>
              </div>

              {/* Grille heatmap */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(4, 1fr)`,
                gap: 3,
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: '0.75rem',
              }}>
                {zones.map((z, i) => (
                  <div key={i} style={{
                    background: `${lxColor(z.e)}30`,
                    border: `1px solid ${lxColor(z.e)}50`,
                    borderRadius: 4,
                    padding: '0.75rem 0.5rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ color: lxColor(z.e), fontWeight: 700, fontSize: 15 }}>{z.e}</div>
                    <div style={{ color: '#64748B', fontSize: 10 }}>Lux</div>
                    {showDelta && (
                      <div style={{ color: '#94A3B8', fontSize: 10, marginTop: 2 }}>
                        U={z.u.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Légende */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: 11, color: '#64748B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
                  ≥ {Math.round(norm.lux * 0.8)} lux (bon)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
                  Moyen
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} />
                  Insuffisant
                </div>
              </div>
            </div>

            {/* Tableau Analyse détaillée */}
            {showDetails && (
              <div style={{
                background: '#23242B',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}>
                <h3 style={{ margin: '0 0 1rem', color: '#fff', fontSize: 14, fontWeight: 700 }}>Analyse détaillée</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Zone', 'Écl. Moy.', 'Uniformité', 'Conformité'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', color: '#64748B', fontSize: 11, fontWeight: 600,
                          padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {zones.slice(0, 4).map((z, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#94A3B8', fontSize: 12 }}>{z.zone}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: lxColor(z.e), fontWeight: 700 }}>{z.e} Lux</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: z.u >= normU0 ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>{z.u.toFixed(2)}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <ConformityBadge isConform={z.ok && z.u >= normU0} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Résultats globaux */}
            <div style={{
              background: '#23242B',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 700 }}>Résultats globaux</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { l: 'Zone',                v: `${room.length} × ${room.width} m` },
                  { l: 'Nb. luminaires',      v: N },
                  { l: 'Puissance totale',    v: `${puissanceTotale} W` },
                  { l: 'Efficacité énergie',  v: `${efficacite} W/m²` },
                  { l: 'Écl. Min.',           v: `${eMin} Lux` },
                  { l: 'Écl. Max.',           v: `${eMax} Lux` },
                ].map(({ l, v }) => (
                  <div key={l} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 6,
                  }}>
                    <span style={{ color: '#64748B', fontSize: 12 }}>{l}</span>
                    <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: 13 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Conformité Normes + Optimisation */}
          <div>
            {/* Conformité */}
            <div style={{
              background: '#23242B',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <h3 style={{ margin: '0 0 1rem', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={18} color="#22c55e" /> Conformité EN 12464-1
              </h3>
              <p style={{ margin: '0 0 0.75rem', color: '#64748B', fontSize: 12 }}>
                Type de pièce : <strong style={{ color: '#F0A500' }}>{roomType}</strong>
              </p>
              {[
                { label: 'Éclairement moyen', measured: `${eMoy} Lux`, norm: `≥ ${norm.lux} Lux`, ok: conform_lux },
                { label: 'Uniformité U0',     measured: u0.toFixed(2),  norm: `≥ ${normU0}`,       ok: conform_u0  },
                { label: 'IRC',               measured: (luminaire.irc || 80), norm: `≥ ${norm.ircMin}`, ok: conform_irc },
                { label: 'UGR',               measured: lighting.UGR,   norm: `≤ ${norm.ugrMax}`,  ok: lighting.UGR <= norm.ugrMax },
              ].map(({ label, measured, norm: n, ok }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0.75rem',
                  background: ok ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                  border: `1px solid ${ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                  borderRadius: 8,
                  marginBottom: '0.5rem',
                }}>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: 12 }}>{label}</div>
                    <div style={{ color: '#64748B', fontSize: 11 }}>Norme : {n}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: ok ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 15 }}>{measured}</div>
                    <div style={{ marginTop: '2px' }}>{ok ? <CheckCircle2 size={14} color="#22c55e" /> : <XCircle size={14} color="#ef4444" />}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton Optimiser */}
            <button
              onClick={handleOptimize}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                border: 'none',
                color: '#fff',
                borderRadius: 10,
                padding: '0.875rem',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                marginBottom: '1.25rem',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <Wrench size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Optimiser le projet
            </button>

            {/* Disposition */}
            <div style={{
              background: 'rgba(240,165,0,0.08)',
              border: '1px solid rgba(240,165,0,0.2)',
              borderRadius: 12,
              padding: '1rem',
            }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#F0A500', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={16} /> Disposition suggérée
              </h4>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: 13 }}>
                <strong style={{ color: '#fff' }}>{N} luminaires</strong> →{' '}
                {rows} rangées × {cols} colonnes
              </p>
              <p style={{ margin: '0.5rem 0 0', color: '#64748B', fontSize: 12 }}>
                Espacement : {uniformity.layout.spacingX} m × {uniformity.layout.spacingY} m
              </p>
              {uniformity.layout.spacingWarning && (
                <p style={{ margin: '0.5rem 0 0', color: '#ef4444', fontSize: 11, fontWeight: 600 }}>
                  {uniformity.layout.warningMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem 2rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        background: '#1C1D24',
      }}>
        <button
          onClick={onPrev}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', borderRadius: 8,
            padding: '0.75rem 2rem',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          ← Précédent
        </button>
        <button
          onClick={onNext}
          style={{
            background: '#3B82F6',
            border: 'none', color: '#fff',
            borderRadius: 8, padding: '0.75rem 2.5rem',
            cursor: 'pointer', fontSize: 14, fontWeight: 700,
          }}
          onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.15)'}
          onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          Continuer vers rapport →
        </button>
      </div>
    </div>
  );
}
