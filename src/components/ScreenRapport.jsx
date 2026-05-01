import React, { useState, useMemo } from 'react';
import { FileText, ClipboardList, Coins, Settings, Hourglass, CheckCircle2, XCircle, Mail, Lightbulb, CornerUpLeft } from 'lucide-react';
import { NORMS } from '../data/norms';
import { COUT_KWH_PAR_PAYS } from '../data/luminaires-library';
import { calculateLighting } from '../utils/calculateLighting';
import { calculateUniformity } from '../utils/calculateUniformity';
import { calculateClimateAdjustment } from '../utils/calculateClimateAdjustment';
import { calculateUsageProfile } from '../utils/calculateUsageProfile';
import { exportToPDF, buildReportData } from '../utils/reportGenerator';

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
  green: '#4ade80',
  red: '#ef4444'
};

function FormField({ label, value, onChange, placeholder, type = 'text', readOnly = false }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: readOnly ? C.surface2 : C.input,
          border: `1px solid ${readOnly ? 'transparent' : C.border}`,
          borderRadius: 8,
          color: readOnly ? C.dim : C.text,
          padding: '0.65rem 0.875rem',
          fontSize: 14,
          boxSizing: 'border-box',
          outline: 'none',
          cursor: readOnly ? 'default' : 'text',
          transition: 'border 0.2s'
        }}
        onFocus={e => !readOnly && (e.currentTarget.style.border = `1px solid ${C.primary}`)}
        onBlur={e => !readOnly && (e.currentTarget.style.border = `1px solid ${C.border}`)}
      />
    </div>
  );
}

export default function ScreenRapport({ formData, updateFormData, onNext, onPrev }) {
  const room     = formData?.room       || { length: 7, width: 6, ceilingHeight: 3 };
  const luminaire = formData?.luminaire || {};
  const results  = formData?.results    || {};
  const location = formData?.location   || {};
  const materiaux = formData?.materiaux || {};

  const roomType  = room.type || 'Bureau';
  const norm      = NORMS[roomType] || NORMS['Bureau'];

  // Run calculation engines for preview — single source of truth
  const lightingCalc   = useMemo(() => calculateLighting(formData), [formData]);
  const uniformityCalc = useMemo(() => calculateUniformity(formData, lightingCalc), [formData, lightingCalc]);

  // Données budget
  const N        = lightingCalc.N || luminaire.nbLuminaires || 4;
  const prix     = luminaire.prix || 12000;
  const puiss    = luminaire.powerPerUnit || 18;
  const coutKwh  = COUT_KWH_PAR_PAYS[location.country] || COUT_KWH_PAR_PAYS['default'];
  const heures   = formData?.budget?.heuresParJour || 8;
  const coutInst = formData?.budget?.coutInstallation || 0;

  const puissanceTotale = lightingCalc.totalPower;
  const coutLuminaires  = N * prix;
  const totalInvest      = coutLuminaires + (Number(coutInst) || 0);
  const coutMensuel     = Math.round((puissanceTotale * heures * 30) / 1000 * coutKwh);
  const coutAnnuel      = coutMensuel * 12;
  const kWhAnnuel       = Math.round((puissanceTotale * heures * 365) / 1000);

  // Métriques — from calculation engines
  const surface  = lightingCalc.S;
  const eMoy     = uniformityCalc.E_moy;
  const eMin     = uniformityCalc.E_min;
  const eMax     = uniformityCalc.E_max;
  const u0       = uniformityCalc.U0;
  const irc      = luminaire.irc    || 80;

  const conform_lux = eMoy >= norm.lux;
  const conform_u0  = u0 >= (norm.u0 || 0.6);
  const conform_irc = irc >= norm.ircMin;

  // Informations rapport
  const [reportInfo, setReportInfo] = useState({
    nomProjet:    formData?.projectName || 'Projet Bureau',
    client:       '',
    adresse:      '',
    auteur:       '',
    entreprise:   'Illuminex SARL',
    inclureBudget: true,
    exclureLogo:  false,
    imageQuality: 80,
    unites:       'metres',
    resumeUne:    true,
    annotations:  true,
    coutInstallation: coutInst,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported]       = useState(false);

  const setField = (key, val) => setReportInfo(prev => ({ ...prev, [key]: val }));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Recalculate results to ensure they are up to date
      const lighting   = calculateLighting(formData);
      const uniformity = calculateUniformity(formData, lighting);
      const solarData  = formData?.results?.solarData || null;
      const climate    = calculateClimateAdjustment(formData, lighting, solarData);
      const usage      = calculateUsageProfile({
          ...formData,
          budget: { ...formData?.budget, coutInstallation: reportInfo.coutInstallation } 
      }, lighting, climate);

      const allResults = {
        lighting, uniformity, climate,
        naturalLight: climate?.naturalLight || { solar: {}, hourlyProfile: {}, summary: {} },
        usage
      };

      const baseReportData = buildReportData(formData, allResults);
      // Mix in the user report settings
      const finalReportData = {
          ...baseReportData,
          meta: {
              ...baseReportData.meta,
              buildingType: reportInfo.nomProjet || baseReportData.meta.buildingType,
              auteur: reportInfo.auteur,
              client: reportInfo.client,
              adresse: reportInfo.adresse
          }
      };

      // Ensure that jspdf blocks UI slightly but works
      await new Promise(r => setTimeout(r, 500));
      exportToPDF(finalReportData);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'exportation du PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const fmt = (n) => n?.toLocaleString('fr-FR') || '0';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.bg }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        padding: '1.25rem 2rem',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: C.bg,
      }}>
        <FileText size={24} color={C.primary} />
        <div>
          <h1 style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 700 }}>
            Rapport <span style={{ color: C.dim, fontSize: 14, fontWeight: 400 }}>›</span>{' '}
            <span style={{ color: C.accent }}>Export</span>
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', maxWidth: 1100 }}>
          {/* Left — Formulaire */}
          <div>
            {/* Type rapport */}
            <div style={{ marginBottom: '1.25rem' }}>
              <select
                style={{
                  width: '100%',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                  padding: '0.75rem 1rem',
                  fontSize: 14,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option>Rapport de conception d'éclairage</option>
                <option>Rapport de conformité normes</option>
                <option>Rapport simplifié client</option>
              </select>
            </div>

            {/* Infos projet */}
            <div className="animate-slide-up" style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <h3 style={{ margin: '0 0 1rem', color: C.text, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={18} color={C.accent} /> Informations du projet
              </h3>
              <FormField label="Nom du projet"  value={reportInfo.nomProjet}  onChange={v => setField('nomProjet', v)} placeholder="Ex: Projet Bureau Cotonou" />
              <FormField label="Client"         value={reportInfo.client}     onChange={v => setField('client', v)}    placeholder="Nom du client / entreprise" />
              <FormField label="Adresse"        value={reportInfo.adresse}    onChange={v => setField('adresse', v)}   placeholder="Adresse du chantier" />
              <FormField label="Nom de l'auteur" value={reportInfo.auteur}    onChange={v => setField('auteur', v)}   placeholder="Votre nom" />
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Entreprise</label>
                <select
                  value={reportInfo.entreprise}
                  onChange={e => setField('entreprise', e.target.value)}
                  style={{
                    width: '100%',
                    background: C.input,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8, color: C.text,
                    padding: '0.65rem 0.875rem', fontSize: 14, cursor: 'pointer', outline: 'none'
                  }}
                >
                  <option>Illuminex SARL</option>
                  <option>Bureau d'études indépendant</option>
                  <option>Autre</option>
                </select>
              </div>

              {/* Case exclure logo */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: C.muted, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={reportInfo.exclureLogo}
                  onChange={e => setField('exclureLogo', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: C.primary }}
                />
                Exclure le logo Illuminex
              </label>
            </div>

            {/* Budget */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <h3 style={{ margin: '0 0 1rem', color: C.text, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={18} color={C.green} /> Estimation budgétaire
              </h3>
              <FormField
                label="Coût d'installation (FCFA)"
                value={reportInfo.coutInstallation}
                onChange={v => setField('coutInstallation', v)}
                type="number"
                placeholder="Ex: 50000"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: C.muted, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={reportInfo.inclureBudget}
                  onChange={e => setField('inclureBudget', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: C.primary }}
                />
                Inclure l'estimation budgétaire dans le rapport
              </label>
            </div>

            {/* Options export */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <h3 style={{ margin: '0 0 1rem', color: C.text, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="#8B5CF6" /> Options d'export
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {/* Options cases */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { key: 'resumeUne',   label: 'Résumé du projet (1 page)' },
                    { key: 'annotations', label: 'Conserver les annotations' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: C.muted, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={reportInfo[key]}
                        onChange={e => setField(key, e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: C.primary }}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Unités */}
                <div>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: '0.5rem' }}>Unité de mesure</div>
                  {['metres', 'pieds'].map(u => (
                    <label key={u} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: C.muted, fontSize: 13, marginBottom: '0.3rem' }}>
                      <input
                        type="radio"
                        name="unites"
                        value={u}
                        checked={reportInfo.unites === u}
                        onChange={() => setField('unites', u)}
                        style={{ accentColor: C.primary }}
                      />
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Qualité images */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 12, marginBottom: 6 }}>
                  <span>Qualité des images</span>
                  <strong style={{ color: C.text }}>{reportInfo.imageQuality}%</strong>
                </div>
                <input
                  type="range" min={40} max={100} step={5}
                  value={reportInfo.imageQuality}
                  onChange={e => setField('imageQuality', Number(e.target.value))}
                  style={{ width: '100%', accentColor: C.primary }}
                />
              </div>
            </div>

            {/* Boutons export */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
              <button
                onClick={handleExport}
                disabled={isExporting}
                style={{
                  width: '100%',
                  background: isExporting ? `${C.primary}88` : C.primary,
                  border: 'none', color: '#fff', borderRadius: 10,
                  padding: '1rem', cursor: isExporting ? 'not-allowed' : 'pointer',
                  fontSize: 15, fontWeight: 700, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: `0 4px 16px ${C.primary}4D`
                }}
                onMouseEnter={e => !isExporting && (e.currentTarget.style.background = '#4A74C5')}
                onMouseLeave={e => !isExporting && (e.currentTarget.style.background = C.primary)}
              >
                {isExporting ? (
                  <><Hourglass size={18} /> Génération en cours...</>
                ) : exported ? (
                  <><CheckCircle2 size={18} /> PDF exporté avec succès !</>
                ) : (
                  <><FileText size={18} /> Exporter au format PDF</>
                )}
              </button>
              <button
                style={{
                  background: 'transparent', border: 'none', color: C.primary,
                  cursor: 'pointer', fontSize: 13, textDecoration: 'underline',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Mail size={14} /> envoyer par email &gt;
              </button>
            </div>
          </div>

          {/* Right — Prévisualisation rapport */}
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div style={{
              background: '#fff',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              color: '#1a1a1a',
              fontSize: 11,
            }}>
              {/* Header rapport */}
              <div style={{ background: C.bg, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lightbulb size={18} color={C.accent} />
                  <span style={{ color: C.accent, fontWeight: 800, fontSize: 13 }}>ILLUMINEX</span>
                </div>
                <span style={{ color: C.dim, fontSize: 10 }}>Éclairage<br/>intérieur</span>
              </div>

              <div style={{ padding: '1rem' }}>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: 14, fontWeight: 800 }}>
                  {reportInfo.nomProjet || 'Projet Bureau'}
                </h2>
                <p style={{ margin: '0 0 0.75rem', color: '#666', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rapport d'éclairage
                </p>

                {/* Infos */}
                <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '0.75rem', marginBottom: '0.75rem' }}>
                  {[
                    ['Auteur', reportInfo.auteur || '—'],
                    ['Client', reportInfo.client || '—'],
                    ['Pays / Ville', location.country ? `${location.country} — ${location.city || ''}` : '—'],
                    ['Dimensions pièce', `${room.length} × ${room.width} × ${room.ceilingHeight} m`],
                    ['Type de pièce', roomType],
                    ['Éclairement Moy.', `${eMoy} Lux`],
                    ['Éclairement Min.', `${eMin} Lux`],
                    ['Nb. luminaires', N],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: 10 }}>
                      <span style={{ color: '#666' }}>{l}</span>
                      <strong style={{ color: '#1a1a1a' }}>{v}</strong>
                    </div>
                  ))}
                </div>

                {/* Conformité mini */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ margin: '0 0 0.3rem', fontSize: 10, fontWeight: 700, color: '#333' }}>Conformité EN 12464-1</p>
                  {[
                    { l: 'Éclairement', ok: conform_lux },
                    { l: 'Uniformité U0', ok: conform_u0 },
                    { l: 'IRC', ok: conform_irc },
                  ].map(({ l, ok }) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                      <span style={{ color: '#666' }}>{l}</span>
                      <span style={{ color: ok ? C.green : C.red, fontWeight: 700 }}>
                        {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Budget mini */}
                {reportInfo.inclureBudget && (
                  <div style={{ background: `${C.primary}1A`, borderRadius: 6, padding: '0.6rem' }}>
                    <p style={{ margin: '0 0 0.3rem', fontSize: 10, fontWeight: 700, color: '#1e3a5f' }}>Budget estimé</p>
                    {[
                      ['Luminaires', `${fmt(coutLuminaires)} FCFA`],
                      ['Installation', `${fmt(Number(reportInfo.coutInstallation) || 0)} FCFA`],
                      ['Coût mensuel', `${fmt(coutMensuel)} FCFA/mois`],
                      ['Coût annuel', `${fmt(coutAnnuel)} FCFA/an`],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                        <span style={{ color: '#555' }}>{l}</span>
                        <strong style={{ color: '#1e3a5f' }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div style={{ borderTop: '1px solid #eee', marginTop: '0.75rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#999' }}>
                  <span>Par {reportInfo.auteur || 'Auteur'}</span>
                  <span>Illuminex — Afrique subsaharienne</span>
                </div>
              </div>
            </div>

            {/* Bouton retour */}
            <button
              onClick={onPrev}
              style={{
                marginTop: '1rem',
                width: '100%',
                background: C.surface2,
                border: `1px solid ${C.border}`,
                color: C.muted, borderRadius: 8,
                padding: '0.7rem', cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.border}
              onMouseLeave={e => e.currentTarget.style.background = C.surface2}
            >
              <CornerUpLeft size={16} /> Retour à l'accueil
            </button>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div style={{
        padding: '1rem 2rem',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        background: C.bg,
      }}>
        <button
          onClick={onPrev}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            color: C.text, borderRadius: 8,
            padding: '0.75rem 2rem',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.surface2}
          onMouseLeave={e => e.currentTarget.style.background = C.surface}
        >
          ← Précédent
        </button>
        <button
          onClick={() => onNext && onNext()}
          style={{
            background: C.surface2,
            border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 8,
            padding: '0.75rem 2rem',
            cursor: 'pointer', fontSize: 14,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
