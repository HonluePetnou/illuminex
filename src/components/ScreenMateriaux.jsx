import React, { useState, useMemo } from 'react';
import { Square, CheckCircle2, AlertTriangle, XCircle, Wrench, Lightbulb, BarChart2 } from 'lucide-react';
import { CATALOGUE_COULEURS } from '../data/colors-library';
import { CATALOGUE_MATERIAUX } from '../data/materials-library';

const SURFACES_CONFIG = [
  {
    key: 'plafond',
    label: 'Plafond',
    icon: <Square size={22} color="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />,
    defaultColor: 'blanc-mat',
    defaultMaterial: null,
    area: (room) => room.length * room.width,
    areaLabel: 'Surface plafond',
  },
  {
    key: 'murs',
    label: 'Murs',
    icon: <Square size={22} color="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />,
    defaultColor: 'blanc-casse',
    defaultMaterial: null,
    area: (room) => 2 * (room.length + room.width) * room.ceilingHeight,
    areaLabel: 'Surface murs',
  },
  {
    key: 'sol',
    label: 'Sol',
    icon: <Square size={22} color="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />,
    defaultColor: 'beige-clair',
    defaultMaterial: 'carreau-blanc',
    area: (room) => room.length * room.width,
    areaLabel: 'Surface sol',
  },
];

function SurfaceSection({ config, value, onChange, room }) {
  const selectedColor = CATALOGUE_COULEURS.find(c => c.id === value.colorId);
  const selectedMaterial = CATALOGUE_MATERIAUX.find(m => m.id === value.materialId);
  const reflectance = selectedMaterial
    ? selectedMaterial.reflectance
    : (selectedColor ? selectedColor.reflectance : 0.5);
  const area = Math.round(config.area(room) * 100) / 100;

  const pct = Math.round(reflectance * 100);
  const badgeColor = reflectance > 0.5 ? '#22c55e' : reflectance >= 0.3 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: 'rgba(30,34,55,0.85)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: '1.25rem 1.5rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: 22 }}>{config.icon}</span>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700 }}>{config.label}</h3>
        <span style={{ marginLeft: 'auto', color: '#64748B', fontSize: 12 }}>
          {config.areaLabel} : <strong style={{ color: '#94A3B8' }}>{area} m²</strong>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
        {/* Dropdown Couleur */}
        <div>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: 12, marginBottom: 6 }}>
            Couleur / Peinture
          </label>
          <div style={{ position: 'relative' }}>
            {selectedColor && (
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                width: 16, height: 16, borderRadius: 4,
                background: selectedColor.hex,
                border: '1px solid rgba(255,255,255,0.2)',
                zIndex: 1,
              }} />
            )}
            <select
              value={value.colorId || ''}
              onChange={e => onChange({ ...value, colorId: e.target.value, materialId: '' })}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                padding: selectedColor ? '0.6rem 0.75rem 0.6rem 2rem' : '0.6rem 0.75rem',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <option value="">— Choisir une couleur —</option>
              {CATALOGUE_COULEURS.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({Math.round(c.reflectance * 100)}%)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropdown Matériau */}
        <div>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: 12, marginBottom: 6 }}>
            Matériau
            {value.colorId && <span style={{ color: '#64748B', fontSize: 11, marginLeft: 4 }}>(optionnel)</span>}
          </label>
          <select
            value={value.materialId || ''}
            onChange={e => onChange({ ...value, materialId: e.target.value, colorId: '' })}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#fff',
              padding: '0.6rem 0.75rem',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <option value="">— Choisir un matériau —</option>
            {CATALOGUE_MATERIAUX.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({Math.round(m.reflectance * 100)}%)</option>
            ))}
          </select>
        </div>

        {/* Badge Réflectance */}
        <div style={{ textAlign: 'center' }}>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: 12, marginBottom: 6 }}>Réflectance</label>
          <div style={{
            background: `${badgeColor}20`,
            border: `1px solid ${badgeColor}`,
            borderRadius: 8,
            padding: '0.5rem 1rem',
            color: badgeColor,
            fontWeight: 700,
            fontSize: 16,
            whiteSpace: 'nowrap',
          }}>
            {pct}%
          </div>
        </div>
      </div>

      {/* Swatch couleur sélectionnée */}
      {selectedColor && (
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: selectedColor.hex,
            border: '1px solid rgba(255,255,255,0.15)',
          }} />
          <span style={{ color: '#64748B', fontSize: 12 }}>
            {selectedColor.name} — {selectedColor.type}
          </span>
        </div>
      )}
      {selectedMaterial && !selectedColor && (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wrench size={14} color="#64748B" />
          <span style={{ color: '#64748B', fontSize: 12 }}>
            {selectedMaterial.type} — {selectedMaterial.description}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ScreenMateriaux({ formData, updateFormData, onNext, onPrev }) {
  const room = formData?.room || { length: 7, width: 6, ceilingHeight: 3 };

  const [surfaces, setSurfaces] = useState({
    plafond:  { colorId: 'blanc-mat',   materialId: '' },
    murs:     { colorId: 'blanc-casse', materialId: '' },
    sol:      { colorId: '',            materialId: 'carreau-blanc' },
  });

  // Calculs de réflectance
  const getReflectance = (surfKey) => {
    const val = surfaces[surfKey];
    const mat = CATALOGUE_MATERIAUX.find(m => m.id === val.materialId);
    const col = CATALOGUE_COULEURS.find(c => c.id === val.colorId);
    return mat ? mat.reflectance : col ? col.reflectance : 0.5;
  };

  const rPlafond = getReflectance('plafond');
  const rMurs    = getReflectance('murs');
  const rSol     = getReflectance('sol');

  const aPlafond = room.length * room.width;
  const aMurs    = 2 * (room.length + room.width) * room.ceilingHeight;
  const aSol     = room.length * room.width;
  const aTotal   = aPlafond + aMurs + aSol;

  const rMoyen = useMemo(() => {
    if (!aTotal) return 0;
    return (rPlafond * aPlafond + rMurs * aMurs + rSol * aSol) / aTotal;
  }, [rPlafond, rMurs, rSol, aPlafond, aMurs, aSol, aTotal]);

  // IRC indicatif (surface des fenêtres estimée ≈ 15% du sol)
  const surfaceFenetres = formData?.naturalLight?.windowArea || aPlafond * 0.15;
  const surfaceTotale = aTotal;
  const irc = surfaceTotale > 0 && rMoyen < 1
    ? Math.min(100, Math.round((0.85 * surfaceFenetres) / (surfaceTotale * (1 - rMoyen)) * 100) / 100)
    : 0;

  const rPct = Math.round(rMoyen * 100);
  const rBadgeColor = rMoyen > 0.5 ? '#22c55e' : rMoyen >= 0.3 ? '#f59e0b' : '#ef4444';

  const handleSurfaceChange = (key, val) => {
    const updated = { ...surfaces, [key]: val };
    setSurfaces(updated);

    // Sauvegarder dans formData
    updateFormData('materiaux', {
      surfaces: updated,
      rPlafond: getReflectanceFromVal(updated.plafond),
      rMurs: getReflectanceFromVal(updated.murs),
      rSol: getReflectanceFromVal(updated.sol),
      rMoyen: rMoyen,
    });
  };

  const getReflectanceFromVal = (val) => {
    const mat = CATALOGUE_MATERIAUX.find(m => m.id === val.materialId);
    const col = CATALOGUE_COULEURS.find(c => c.id === val.colorId);
    return mat ? mat.reflectance : col ? col.reflectance : 0.5;
  };

  const handleNext = () => {
    updateFormData('materiaux', {
      surfaces,
      rPlafond,
      rMurs,
      rSol,
      rMoyen,
    });
    onNext && onNext();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1A1D2E' }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(26,29,46,0.95)',
      }}>
        <h1 style={{ margin: 0, color: '#fff', fontSize: 26, fontWeight: 700 }}>
          Matériaux <span style={{ color: '#F0A500' }}>&amp;</span> Surfaces
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: '#94A3B8', fontSize: 13 }}>
          Définissez les matériaux de chaque surface pour calculer les réflectances.
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', maxWidth: 1100 }}>
          {/* Left - Surfaces */}
          <div>
            <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: '1rem', marginTop: 0 }}>
              Sélectionnez une couleur <strong>ou</strong> un matériau pour chaque surface. La réflectance sera calculée automatiquement.
            </p>
            {SURFACES_CONFIG.map(cfg => (
              <SurfaceSection
                key={cfg.key}
                config={cfg}
                value={surfaces[cfg.key]}
                onChange={(val) => handleSurfaceChange(cfg.key, val)}
                room={room}
              />
            ))}
          </div>

          {/* Right - Récapitulatif */}
          <div>
            <div style={{
              background: 'rgba(30,34,55,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '1.5rem',
              position: 'sticky',
              top: 0,
            }}>
              <h3 style={{ margin: '0 0 1.25rem', color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} color="#3B82F6" /> Récapitulatif
              </h3>

              {/* Réflectances individuelles */}
              {[
                { label: 'Plafond', r: rPlafond, area: aPlafond },
                { label: 'Murs',    r: rMurs,    area: aMurs },
                { label: 'Sol',     r: rSol,     area: aSol },
              ].map(({ label, r, area }) => {
                const pct = Math.round(r * 100);
                const col = r > 0.5 ? '#22c55e' : r >= 0.3 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '0.75rem', padding: '0.5rem 0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                  }}>
                    <div>
                      <span style={{ color: '#94A3B8', fontSize: 13 }}>{label}</span>
                      <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>{Math.round(area * 10) / 10} m²</span>
                    </div>
                    <span style={{ color: col, fontWeight: 700, fontSize: 16 }}>{pct}%</span>
                  </div>
                );
              })}

              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '1rem',
                marginTop: '0.5rem',
              }}>
                {/* R_moyen */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#94A3B8', fontSize: 13 }}>R_moyen</span>
                    <span style={{ color: rBadgeColor, fontWeight: 700, fontSize: 20 }}>{rPct}%</span>
                  </div>
                  {/* Barre de progression */}
                  <div style={{
                    height: 8, borderRadius: 4,
                    background: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${rPct}%`,
                      background: `linear-gradient(90deg, ${rBadgeColor}99, ${rBadgeColor})`,
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 10 }}>
                    <Lightbulb size={14} color="#F0A500" />
                    <p style={{ color: '#64748B', fontSize: 11, margin: 0 }}>
                      Un R_moyen élevé = lumière mieux réfléchie = moins de luminaires nécessaires
                    </p>
                  </div>
                </div>

                {/* Badge qualitatif */}
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  background: `${rBadgeColor}15`,
                  border: `1px solid ${rBadgeColor}40`,
                  textAlign: 'center',
                }}>
                  <span style={{ color: rBadgeColor, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {rMoyen > 0.5 ? <><CheckCircle2 size={16} /> Bonne réflectance</> : rMoyen >= 0.3 ? <><AlertTriangle size={16} /> Réflectance moyenne</> : <><XCircle size={16} /> Faible réflectance</>}
                  </span>
                </div>

                {/* IRC Estimé */}
                <div style={{
                  marginTop: '1rem', padding: '0.75rem',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#93C5FD', fontSize: 13 }}>IRC estimé</span>
                    <span style={{ color: '#3B82F6', fontWeight: 700, fontSize: 16 }}>
                      {Math.max(0, Math.min(100, Math.round(irc * 100)))}
                    </span>
                  </div>
                  <p style={{ color: '#64748B', fontSize: 11, margin: '4px 0 0' }}>
                    Indice de Rendu des Couleurs approximatif
                  </p>
                </div>

                {/* Surfaces total */}
                <div style={{ marginTop: '1rem', color: '#64748B', fontSize: 12 }}>
                  <div>Plafond : {Math.round(aPlafond * 10) / 10} m²</div>
                  <div>Murs : {Math.round(aMurs * 10) / 10} m²</div>
                  <div>Sol : {Math.round(aSol * 10) / 10} m²</div>
                  <div style={{ color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
                    Total : {Math.round(aTotal * 10) / 10} m²
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{
        padding: '1rem 2rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        background: 'rgba(26,29,46,0.98)',
      }}>
        <button
          onClick={onPrev}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            borderRadius: 8,
            padding: '0.75rem 2rem',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          ← Précédent
        </button>
        <button
          onClick={handleNext}
          style={{
            background: '#3B82F6',
            border: 'none',
            color: '#fff',
            borderRadius: 8,
            padding: '0.75rem 2.5rem',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.15)'}
          onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
