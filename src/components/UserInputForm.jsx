import React, { useState } from 'react';
import * as yup from 'yup';

export default function UserInputForm({ onSubmit, initialData }) {
  // 1 & 2. STATE MANAGEMENT ET VALEURS PAR DÉFAUT (Contexte Bénin)
  const defaultValues = {
    room: { length: '', width: '', ceilingHeight: 3.0, workPlaneHeight: 0.85 },
    occupation: { buildingType: 'Bureau/Administration', occupationType: '', occupants: '', hoursPerDay: 8, daysPerWeek: 5 },
    luminaire: { type: '', fluxPerUnit: '', powerPerUnit: '' },
    naturalLight: { hasWindows: false, orientation: '', windowArea: '' }
  };

  const [formData, setFormData] = useState(
    initialData && Object.keys(initialData).length > 0 ? initialData : defaultValues
  );
  
  // Update state if parent changes initialData (ex: switching projects)
  React.useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // 6. PROGRESS BAR
  const progressPercentage = currentStep * 25; // 25%, 50%, 75%, 100%

  // 4. SCHÉMAS DE VALIDATION (yup)
  const schemas = {
    1: yup.object().shape({
      length: yup.number().typeError('Doit être un nombre').positive('Doit être supérieur à 0').required('Requis'),
      width: yup.number().typeError('Doit être un nombre').positive('Doit être supérieur à 0').required('Requis'),
      ceilingHeight: yup.number().typeError('Doit être un nombre').positive('Doit être supérieur à 0').required('Requis'),
      workPlaneHeight: yup.number().typeError('Doit être un nombre').positive('Doit être supérieur à 0').required('Requis'),
    }),
    2: yup.object().shape({
      buildingType: yup.string().required('Type de bâtiment requis'),
      occupationType: yup.string(),
      occupants: yup.number().typeError('Doit être un nombre entier').min(1, 'Minimum 1 occupant').required('Requis'),
      hoursPerDay: yup.number().typeError('Doit être un nombre').min(1, 'Minimum 1h').max(24, 'Maximum 24h').required('Requis'),
      daysPerWeek: yup.number().typeError('Doit être un nombre').min(1, 'Minimum 1 jour').max(7, 'Maximum 7 jours').required('Requis'),
    }),
    3: yup.object().shape({
      type: yup.string().required('Type de luminaire requis'),
      fluxPerUnit: yup.number().typeError('Doit être un nombre').positive('Doit être supérieur à 0').required('Requis'),
      powerPerUnit: yup.number().typeError('Doit être un nombre').positive('Doit être supérieur à 0').required('Requis'),
    }),
    4: yup.object().shape({
      hasWindows: yup.boolean(),
      orientation: yup.string().when('hasWindows', {
        is: true,
        then: (schema) => schema.required('Orientation requise avec des fenêtres'),
        otherwise: (schema) => schema.optional()
      }),
      windowArea: yup.number().when('hasWindows', {
        is: true,
        then: (schema) => schema.typeError('Doit être un nombre').positive('Doit être supérieur à 0').required('Requis'),
        otherwise: (schema) => schema.optional()
      })
    })
  };

  const validateStep = async (step) => {
    const currentData = {
      1: formData.room,
      2: formData.occupation,
      3: formData.luminaire,
      4: formData.naturalLight
    }[step];

    try {
      await schemas[step].validate(currentData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      const newErrors = {};
      if (err.inner) {
        err.inner.forEach((error) => {
          newErrors[error.path] = error.message;
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  // 3. NAVIGATION (Next, Prev, Reset)
  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  const resetForm = () => {
    setFormData(defaultValues);
    setCurrentStep(1);
    setErrors({});
  };

  // 7. FINAL SUBMIT
  const handleCalculate = async () => {
    const isValid = await validateStep(4);
    if (isValid && onSubmit) {
      onSubmit(formData);
    }
  };

  // GESTIONNAIRE DE CHAMPS GÉNÉRIQUE
  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 5. AUTO-FILL LOGIC POUR LUMINAIRES
  const handleLuminaireTypeChange = (value) => {
    let autoFillSettings = { fluxPerUnit: formData.luminaire.fluxPerUnit, powerPerUnit: formData.luminaire.powerPerUnit };
    
    if (value === "Tube LED") autoFillSettings = { fluxPerUnit: 3000, powerPerUnit: 18 };
    else if (value === "Dalle LED") autoFillSettings = { fluxPerUnit: 4000, powerPerUnit: 36 };
    else if (value === "Ampoule LED") autoFillSettings = { fluxPerUnit: 800, powerPerUnit: 9 };

    setFormData(prev => ({
      ...prev,
      luminaire: {
        ...prev.luminaire,
        type: value,
        ...autoFillSettings
      }
    }));
    
    if (errors.type) setErrors(prev => ({ ...prev, type: undefined }));
  };

  // Sous-composant pour un champ générique
  const Field = ({ label, section, field, type = "number", Component = "input", children }) => (
    <div style={{ marginBottom: '1rem', flex: 1 }}>
      <label style={{ display: 'block', color: '#A0A0A5', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{label}</label>
      {Component === "input" ? (
        <input
          type={type}
          value={formData[section][field]}
          onChange={(e) => handleChange(section, field, type === "checkbox" ? e.target.checked : e.target.value)}
          style={{
            width: '100%',
            background: '#191A1E',
            border: `1px solid ${errors[field] ? '#ef4444' : '#363741'}`,
            borderRadius: '8px',
            padding: '0.875rem 1rem',
            color: '#FFF',
            outline: 'none',
            fontSize: '1rem'
          }}
          checked={type === "checkbox" ? formData[section][field] : undefined}
        />
      ) : (
        <select
          value={formData[section][field]}
          onChange={(e) => {
            if (field === 'type' && section === 'luminaire') {
              handleLuminaireTypeChange(e.target.value);
            } else {
              handleChange(section, field, e.target.value);
            }
          }}
          style={{
            width: '100%',
            background: '#191A1E',
            border: `1px solid ${errors[field] ? '#ef4444' : '#363741'}`,
            borderRadius: '8px',
            padding: '0.875rem 1rem',
            color: '#FFF',
            outline: 'none',
            fontSize: '1rem',
            appearance: 'none'
          }}
        >
          {children}
        </select>
      )}
      {errors[field] && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors[field]}</p>}
    </div>
  );

  return (
    <div style={{ padding: '2rem 3rem', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      
      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', background: '#26272D', borderRadius: '12px', border: '1px solid #363741', padding: '2rem' }}>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#FFF', marginBottom: '1.5rem' }}>
          Formulaire de configuration
        </h2>
        
        {/* Progress Bar */}
        <div style={{ width: '100%', background: '#363741', height: '8px', borderRadius: '4px', marginBottom: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progressPercentage}%`, background: '#5A84D5', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
        </div>

        {/* CONTENU DE L'ÉTAPE 1 */}
        {currentStep === 1 && (
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#FFF', marginBottom: '1.5rem', borderBottom: '1px solid #363741', paddingBottom: '0.5rem' }}>
              Étape 1 : Dimensions de la pièce
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Field label="Longueur (m)" section="room" field="length" />
              <Field label="Largeur (m)" section="room" field="width" />
              <Field label="Hauteur Plafond (m)" section="room" field="ceilingHeight" />
              <Field label="Hauteur Plan de Travail (m)" section="room" field="workPlaneHeight" />
            </div>
          </div>
        )}

        {/* CONTENU DE L'ÉTAPE 2 */}
        {currentStep === 2 && (
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#FFF', marginBottom: '1.5rem', borderBottom: '1px solid #363741', paddingBottom: '0.5rem' }}>
              Étape 2 : Occupation
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Field label="Type de Bâtiment" section="occupation" field="buildingType" Component="select">
                <option value="">Sélectionner...</option>
                <option value="Bureau/Administration">Bureau/Administration</option>
                <option value="Scolaire">Scolaire</option>
                <option value="Santé">Santé</option>
                <option value="Industrie">Industrie</option>
                <option value="Commercial">Commercial</option>
              </Field>
              <Field label="Type d'Occupation" section="occupation" field="occupationType" type="text" />
              <Field label="Nombre d'Occupants" section="occupation" field="occupants" />
              <div style={{ display: 'flex', gap: '1.5rem', gridColumn: 'span 2' }}>
                <Field label="Heures par Jour" section="occupation" field="hoursPerDay" />
                <Field label="Jours par Semaine" section="occupation" field="daysPerWeek" />
              </div>
            </div>
          </div>
        )}

        {/* CONTENU DE L'ÉTAPE 3 */}
        {currentStep === 3 && (
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#FFF', marginBottom: '1.5rem', borderBottom: '1px solid #363741', paddingBottom: '0.5rem' }}>
              Étape 3 : Spécifications du Luminaire
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Field label="Type de Luminaire" section="luminaire" field="type" Component="select">
                <option value="">Sélectionner...</option>
                <option value="Tube LED">Tube LED</option>
                <option value="Dalle LED">Dalle LED</option>
                <option value="Ampoule LED">Ampoule LED</option>
                <option value="Autre">Autre</option>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <Field label="Flux Lumineux par Unité (lm)" section="luminaire" field="fluxPerUnit" />
                <Field label="Puissance par Unité (W)" section="luminaire" field="powerPerUnit" />
              </div>
            </div>
          </div>
        )}

        {/* CONTENU DE L'ÉTAPE 4 */}
        {currentStep === 4 && (
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#FFF', marginBottom: '1.5rem', borderBottom: '1px solid #363741', paddingBottom: '0.5rem' }}>
              Étape 4 : Lumière Naturelle
            </h3>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="hasWindows"
                checked={formData.naturalLight.hasWindows}
                onChange={(e) => handleChange('naturalLight', 'hasWindows', e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#5A84D5', cursor: 'pointer' }}
              />
              <label htmlFor="hasWindows" style={{ color: '#FFF', cursor: 'pointer' }}>Présence de fenêtres</label>
            </div>
            
            {formData.naturalLight.hasWindows && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <Field label="Orientation" section="naturalLight" field="orientation" Component="select">
                  <option value="">Sélectionner...</option>
                  <option value="Nord">Nord</option>
                  <option value="Sud">Sud</option>
                  <option value="Est">Est</option>
                  <option value="Ouest">Ouest</option>
                </Field>
                <Field label="Surface Vitrée (m²)" section="naturalLight" field="windowArea" />
              </div>
            )}
          </div>
        )}

        {/* FOOTER & BUTTONS */}
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #363741', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={resetForm}
            style={{ background: 'transparent', border: 'none', color: '#A0A0A5', cursor: 'pointer', fontSize: '1rem' }}
          >
            Réinitialiser
          </button>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                style={{ background: '#2B2C35', border: '1px solid #363741', color: '#FFF', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                Précédent
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                style={{ background: '#5A84D5', border: 'none', color: '#FFF', padding: '0.75rem 2.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleCalculate}
                style={{ background: '#10b981', border: 'none', color: '#FFF', padding: '0.75rem 2.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                Calculer
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
