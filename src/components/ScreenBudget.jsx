import React from 'react';
import { DollarSign, Zap, TrendingUp, Building2 } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';

const C = {
  bg: '#1C1D24', surface: '#23242B', surface2: '#2B2C35',
  border: 'rgba(255,255,255,0.06)', primary: '#3B82F6',
  accent: '#FFB84D', text: '#FFF', muted: '#64748B', dim: '#94A3B8',
};

function Section({ icon: Icon, title, color = C.primary, children }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem',
    }}>
      <h3 style={{
        margin: '0 0 1rem', color: C.text, fontSize: 14, fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Icon size={18} color={color} /> {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value, editable, children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.6rem 0.75rem',
      background: editable ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${editable ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)'}`,
      borderRadius: 8, marginBottom: '0.5rem',
    }}>
      <span style={{ color: C.muted, fontSize: 13 }}>{label}</span>
      <span style={{ color: C.dim, fontWeight: 600 }}>{children || value}</span>
    </div>
  );
}

function EditableRow({ label, value, unit, onChange, min = 0 }) {
  const [focused, setFocused] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(String(value ?? ''));

  React.useEffect(() => {
    if (!focused) {
      setLocalValue(String(value ?? ''));
    }
  }, [value, focused]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed >= min) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed >= min) {
      onChange(parsed);
      setLocalValue(String(parsed));
    } else {
      setLocalValue(String(value ?? ''));
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.5rem 0.75rem',
      background: 'rgba(59,130,246,0.06)',
      border: '1px solid rgba(59,130,246,0.2)',
      borderRadius: 8, marginBottom: '0.5rem',
    }}>
      <span style={{ color: C.muted, fontSize: 13 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          min={min}
          value={localValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          style={{
            width: 90, background: '#1a1b22', border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: 6, padding: '0.3rem 0.5rem', color: C.text,
            fontSize: 13, textAlign: 'right', outline: 'none',
          }}
        />
        <span style={{ color: C.muted, fontSize: 12 }}>{unit}</span>
      </div>
    </div>
  );
}

function BigTotal({ label, value, color = C.primary }) {
  return (
    <div style={{
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: 10, padding: '0.875rem 1.25rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '0.5rem',
    }}>
      <span style={{ color: C.dim, fontSize: 13, fontWeight: 600 }}>{label}</span>
      <span style={{ color, fontSize: 18, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

export default function ScreenBudget({ formData, updateFormData, onNext, onPrev }) {
  const results = useSimulation(formData);

  if (!results) return null;

  const lightingResult = results.lighting;
  const budget = results.budget;

  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');

  const updateBudget = (key, val) => updateFormData('budget', { [key]: val });

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: C.bg,
    }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 2rem 1rem', borderBottom: `1px solid ${C.border}`,
        background: C.bg,
      }}>
        <h1 style={{ margin: 0, color: C.text, fontSize: 22, fontWeight: 700 }}>
          Coûts <span style={{ color: C.accent }}>&amp;</span> Consommation
        </h1>
        <p style={{ margin: '0.2rem 0 0', color: C.muted, fontSize: 12 }}>
          {lightingResult.N} luminaires — {budget.puissanceTotale} W total
        </p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* ── COLONNE GAUCHE : Budget ────────────────────────────────── */}
          <div>
            <Section icon={Building2} title="Estimation Budgétaire" color="#F0A500">

              <Row label="Nombre de luminaires calculés">
                <span style={{ color: '#F0A500', fontWeight: 700 }}>{lightingResult.N} unités</span>
              </Row>

              <EditableRow
                label="Prix unitaire luminaire"
                value={formData?.luminaire?.prix ?? budget.prixUnitaire}
                unit="FCFA"
                min={0}
                onChange={v => updateFormData('luminaire', { prix: v })}
              />

              <Row label="Coût total luminaires (N × prix)">
                <span style={{ color: '#F0A500', fontWeight: 700 }}>
                  {fmt(budget.coutLuminaires)} FCFA
                </span>
              </Row>

              <EditableRow
                label="Main d'œuvre / Installation"
                value={formData?.budget?.coutInstallation ?? 0}
                unit="FCFA"
                min={0}
                onChange={v => updateBudget('coutInstallation', v)}
              />

              <div style={{ marginTop: '0.75rem' }}>
                <BigTotal
                  label="TOTAL INSTALLATION"
                  value={`${fmt(budget.coutTotal)} FCFA`}
                  color="#F0A500"
                />
              </div>
            </Section>
          </div>

          {/* ── COLONNE DROITE : Consommation ─────────────────────────── */}
          <div>
            <Section icon={Zap} title="Consommation Énergétique" color="#3B82F6">

              <Row label="Puissance totale installée">
                <span style={{ color: '#3B82F6', fontWeight: 700 }}>
                  {budget.puissanceTotale} W
                </span>
              </Row>

              <EditableRow
                label="Coût du kWh"
                value={formData?.budget?.coutKwh ?? budget.coutKwh}
                unit="FCFA"
                min={1}
                onChange={v => updateBudget('coutKwh', v)}
              />

              <EditableRow
                label="Heures d'utilisation / jour"
                value={formData?.budget?.heuresParJour ?? budget.heuresParJour}
                unit="h/j"
                min={1}
                onChange={v => updateBudget('heuresParJour', v)}
              />

              <Row label="Consommation journalière">
                {budget.kwhParJour.toFixed(2)} kWh →{' '}
                <span style={{ color: '#3B82F6', fontWeight: 700 }}>
                  {fmt(budget.coutJour)} FCFA
                </span>
              </Row>

              <div style={{ marginTop: '0.75rem' }}>
                <BigTotal
                  label="Coût mensuel (30j)"
                  value={`${fmt(budget.coutMensuel)} FCFA`}
                  color="#3B82F6"
                />
                <BigTotal
                  label="Coût annuel"
                  value={`${fmt(budget.coutAnnuel)} FCFA`}
                  color="#8B5CF6"
                />
              </div>
            </Section>

            {/* Récapitulatif kWh */}
            <Section icon={TrendingUp} title="Récapitulatif Énergie" color="#22c55e">
              {[
                { l: 'kWh / jour',    v: `${budget.kwhParJour.toFixed(2)} kWh` },
                { l: 'kWh / mois',   v: `${budget.kwhMensuel.toFixed(1)} kWh` },
                { l: 'kWh / an',     v: `${budget.kwhAnnuel.toFixed(0)} kWh` },
                { l: 'Coût kWh appliqué', v: `${budget.coutKwh} FCFA` },
              ].map(({ l, v }) => (
                <Row key={l} label={l}>{v}</Row>
              ))}
            </Section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem 2rem', borderTop: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', background: C.bg,
      }}>
        <button
          onClick={onPrev}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: C.text, borderRadius: 8, padding: '0.75rem 2rem',
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
            background: '#3B82F6', border: 'none', color: C.text,
            borderRadius: 8, padding: '0.75rem 2.5rem',
            cursor: 'pointer', fontSize: 14, fontWeight: 700,
          }}
          onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.15)'}
          onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          Générer le rapport →
        </button>
      </div>
    </div>
  );
}
