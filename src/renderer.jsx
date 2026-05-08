import './index.css';
import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { createRoot } from 'react-dom/client';

import Sidebar from './components/Sidebar';
import ProjectManager, { useProjectManager } from './components/ProjectManager';
import { useProjectHistory } from './hooks/useProjectHistory';
import SimulationDashboard from './components/SimulationDashboard';

import ScreenDimensions from './components/ScreenDimensions';
import ScreenMateriaux  from './components/ScreenMateriaux';
import ScreenLuminaires from './components/ScreenLuminaires';
import ScreenNaturel    from './components/ScreenNaturel';
import ScreenAnalyse    from './components/ScreenAnalyse';
import ScreenBudget     from './components/ScreenBudget';
import ScreenRapport    from './components/ScreenRapport';
import ScreenContact    from './components/ScreenContact';

// Ignore ResizeObserver loop errors (harmless visual rendering loop messages in dev overlay)
if (typeof window !== 'undefined') {
  window.addEventListener('error', e => {
    if (
      e.message === 'ResizeObserver loop limit exceeded' ||
      e.message === 'ResizeObserver loop completed with undelivered notifications.'
    ) {
      e.stopImmediatePropagation();
    }
  });
}

const defaultValues = {
  room: {
    length: 7.0,
    width: 6.0,
    ceilingHeight: 3.0,
    workPlaneHeight: 0.85,
    type: 'Bureau',
    glazingType: 'Double standard',
    windowType: 'Battante',
    doorType: 'Porte en bois plein',
  },
  occupation: {
    buildingType: 'Bureau/Administration',
    occupationType: 'Standard',
    occupants: 4,
    hoursPerDay: 8,
    daysPerWeek: 5,
  },
  luminaire: {
    type: 'LED E27 12W',
    fluxPerUnit: 1100,
    powerPerUnit: 12,
    irc: 80,
    prix: 3500,
    nbLuminaires: 4,
    haloType: 'led',
  },
  naturalLight: {
    hasWindows: true,
    orientation: 'S',
    windowArea: 5,
    luminositesSoleil: 100,
    luminositeCiel: 75,
  },
  location: {
    country: 'Bénin',
    city: 'Cotonou',
    latitude: 6.37,
    longitude: 2.43,
    climate: 'Tropical humide',
    zone: 'Afrique subsaharienne',
    buildingOrientation: 'N',
  },
  materiaux: {
    surfaces: {
      plafond: { colorId: 'blanc-mat',   materialId: '' },
      murs:    { colorId: 'blanc-casse', materialId: '' },
      sol:     { colorId: '',            materialId: 'carreau-blanc' },
    },
    rPlafond: 0.85,
    rMurs:    0.80,
    rSol:     0.70,
    rMoyen:   0.65,
  },
  budget: {
    coutInstallation: 0,
    heuresParJour: 8,
  },
  results: {},
};

// Séquence des écrans de simulation
const SIMULATION_FLOW = [
  'dimensions',
  'materiaux',
  'luminaires',
  'naturel',
  'simulation',
  'analyse',
  'budget',
  'rapport',
];

function MainApp() {
  // Ref to track whether formData was just saved (to avoid useEffect overwrite loop)
  const isSavingRef = React.useRef(false);
  const [activeScreen, setActiveScreen] = useState('projets');

  const {
    projects,
    currentProject,
    setCurrentProject,
    saveCurrentProject,
    saveStatus,
  } = useProjectManager();

  const handleOpenProject = (project) => {
    const baseRoom        = project.formData?.room        || {};
    const baseOccupation  = project.formData?.occupation  || {};
    const baseLuminaire   = project.formData?.luminaire   || {};
    const baseNaturalLight = project.formData?.naturalLight || {};
    const baseLocation    = project.formData?.location    || {};
    const baseMateriaux   = project.formData?.materiaux   || {};
    const baseBudget      = project.formData?.budget      || {};
    const baseResults     = project.formData?.results     || {};

    const fullProject = {
      ...project,
      formData: {
        room:         { ...defaultValues.room, ...baseRoom },
        occupation:   { ...defaultValues.occupation, ...baseOccupation },
        luminaire:    { ...defaultValues.luminaire, ...baseLuminaire },
        naturalLight: { ...defaultValues.naturalLight, ...baseNaturalLight },
        location:     { ...defaultValues.location, ...baseLocation },
        materiaux:    { ...defaultValues.materiaux, ...baseMateriaux },
        budget:       { ...defaultValues.budget, ...baseBudget },
        results:      { ...defaultValues.results, ...baseResults },
      },
    };

    setCurrentProject(fullProject);
    setActiveScreen('dimensions');
  };

  const handleTemplateSelect = (template) => {
    const mergedFormData = {
      ...JSON.parse(JSON.stringify(defaultValues)),
      ...template.formData,
    };
    setCurrentProject({ name: template.name, formData: mergedFormData });
    setActiveScreen('dimensions');
  };

  // State global formulaires
  const [formData, setFormData] = React.useState(defaultValues);
  
  const { pushState, undo, redo, canUndo, canRedo, resetHistory } = useProjectHistory(defaultValues);

  // Sync formData when project changes (e.g. opening a project), but NOT when we
  // triggered the currentProject update ourselves via updateFormData (avoid overwrite loop).
  React.useEffect(() => {
    if (isSavingRef.current) return; // skip if we caused this update
    if (currentProject && currentProject.formData) {
      // Ensure results are also in sync if they exist at top level but not in formData
      const syncedFormData = {
        ...currentProject.formData,
        results: currentProject.results || currentProject.formData.results || {}
      };
      setFormData(syncedFormData);
      resetHistory(syncedFormData);
    } else {
      setFormData(defaultValues);
      resetHistory(defaultValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]); // only re-run when a DIFFERENT project is loaded

  const updateFormData = (section, values) => {
    setFormData(prev => {
      const next = {
        ...prev,
        [section]: {
          ...prev[section],
          ...values,
        },
      };
      
      pushState(next);

      // Keep currentProject in sync so navigation never loses data
      if (currentProject) {
        isSavingRef.current = true;
        // Results might be in formData.results or currentProject.results
        const latestResults = section === 'results' ? { ...prev.results, ...values } : (currentProject.results || next.results || {});
        
        setCurrentProject(cp => {
          if (!cp) return cp;
          return { 
            ...cp, 
            formData: next,
            results: latestResults
          };
        });
        // Reset flag after React flush
        setTimeout(() => { isSavingRef.current = false; }, 50);
      }
      return next;
    });
  };

  const handleUndo = () => {
    const previousState = undo();
    if (previousState) {
      setFormData(previousState);
      if (currentProject) {
        isSavingRef.current = true;
        setCurrentProject(cp => ({ ...cp, formData: previousState, results: previousState.results || {} }));
        setTimeout(() => { isSavingRef.current = false; }, 50);
      }
    }
  };

  const handleRedo = () => {
    const nextState = redo();
    if (nextState) {
      setFormData(nextState);
      if (currentProject) {
        isSavingRef.current = true;
        setCurrentProject(cp => ({ ...cp, formData: nextState, results: nextState.results || {} }));
        setTimeout(() => { isSavingRef.current = false; }, 50);
      }
    }
  };

  // ── Validateurs par étape ──────────────────────────────────────────
  const [validationError, setValidationError] = React.useState(null);

  const validateStep = (screen) => {
    const fd = formData;
    switch (screen) {
      case 'dimensions': {
        const r = fd.room || {};
        const L = parseFloat(r.length);
        const W = parseFloat(r.width);
        const H = parseFloat(r.ceilingHeight);
        if (isNaN(L) || L <= 0) return 'La longueur doit etre superieure a 0 m.';
        if (isNaN(W) || W <= 0) return 'La largeur doit etre superieure a 0 m.';
        if (isNaN(H) || H <= 0) return 'La hauteur sous plafond doit etre superieure a 0 m.';
        return null;
      }
      case 'materiaux':
        return null; // optionnel, valeurs par défaut toujours présentes
      case 'luminaires': {
        const l = fd.luminaire || {};
        const flux  = parseFloat(l.fluxPerUnit);
        const power = parseFloat(l.powerPerUnit);
        if (isNaN(flux)  || flux  <= 0) return 'Le flux lumineux (lm) doit etre superieur a 0.';
        if (isNaN(power) || power <= 0) return 'La puissance (W) doit etre superieure a 0.';
        return null;
      }
      case 'naturel': {
        const n = fd.naturalLight || {};
        if (n.hasWindows === true) {
          const area = parseFloat(n.windowArea);
          if (isNaN(area) || area <= 0)
            return 'Indiquez la surface vitree (m2) pour activer l apport naturel.';
        }
        return null;
      }
      default:
        return null;
    }
  };

  // Sauvegarde centralisée — signature correcte : (formData, results)
  const persistFormData = (fd) => {
    if (!currentProject) return;
    const dataToSave = fd ?? formData;
    // Ensure results are passed correctly to saveCurrentProject
    saveCurrentProject(dataToSave, dataToSave.results || currentProject?.results || {});
  };

  // Navigation dans le flow de simulation
  const goNext = (screen) => {
    const err = validateStep(screen);
    if (err) { setValidationError(err); return; }
    setValidationError(null);
    persistFormData(formData);
    const idx = SIMULATION_FLOW.indexOf(screen);
    if (idx >= 0 && idx < SIMULATION_FLOW.length - 1) {
      setActiveScreen(SIMULATION_FLOW[idx + 1]);
    }
  };

  const goPrev = (screen) => {
    setValidationError(null);
    persistFormData(formData);
    const idx = SIMULATION_FLOW.indexOf(screen);
    if (idx > 0) {
      setActiveScreen(SIMULATION_FLOW[idx - 1]);
    } else {
      setActiveScreen('projets');
    }
  };

  // Intercepteur de navigation Sidebar : sauvegarde avant tout changement d'écran
  const handleSidebarNavigate = (targetScreen) => {
    // Save current formData before leaving any screen (guards direct sidebar clicks)
    if (currentProject && activeScreen !== 'projets' && activeScreen !== 'accueil') {
      persistFormData(formData);
    }
    setValidationError(null);
    setActiveScreen(targetScreen);
  };

  // Sauvegarde automatique à chaque changement de formData (filet de sécurité)
  React.useEffect(() => {
    if (!currentProject) return;
    const timer = setTimeout(() => {
      persistFormData(formData);
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'projets':
      case 'accueil':
        return (
          <ProjectManager
            onOpenProject={handleOpenProject}
            onTemplateSelect={handleTemplateSelect}
          />
        );

      case 'form':
      case 'dimensions':
        return (
          <ScreenDimensions
            formData={formData}
            updateFormData={updateFormData}
            validationError={validationError}
            onNext={() => goNext('dimensions')}
            onPrev={() => goPrev('dimensions')}
          />
        );

      case 'materiaux':
        return (
          <ScreenMateriaux
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => goNext('materiaux')}
            onPrev={() => goPrev('materiaux')}
          />
        );

      case 'luminaires':
        return (
          <ScreenLuminaires
            formData={formData}
            updateFormData={updateFormData}
            validationError={validationError}
            onNext={() => goNext('luminaires')}
            onPrev={() => goPrev('luminaires')}
          />
        );

      case 'naturel':
        return (
          <ScreenNaturel
            formData={formData}
            updateFormData={updateFormData}
            validationError={validationError}
            onNext={() => goNext('naturel')}
            onPrev={() => goPrev('naturel')}
          />
        );

      case 'simulation':
        return (
          <SimulationDashboard
            project={{ ...(currentProject || {}), formData }}
            onNext={() => goNext('simulation')}
            onPrev={() => goPrev('simulation')}
          />
        );

      case 'analyse':
        return (
          <ScreenAnalyse
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => goNext('analyse')}
            onPrev={() => goPrev('analyse')}
          />
        );

      case 'budget':
        return (
          <ScreenBudget
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => goNext('budget')}
            onPrev={() => goPrev('budget')}
          />
        );

      case 'rapport':
        return (
          <ScreenRapport
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => setActiveScreen('projets')}
            onPrev={() => goPrev('rapport')}
          />
        );

      case 'contact':
        return <ScreenContact />;

      case 'quitter':
        return (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column', color: '#FFF',
            background: '#1A1D2E',
          }}>
            <div style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '50%' }}>
              <LogOut size={48} color="#ef4444" />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Êtes-vous sûr de vouloir quitter ?</h2>
            <p style={{ color: '#64748B', marginBottom: '2rem' }}>Vos données sont sauvegardées automatiquement.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setActiveScreen('projets')}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.875rem 2rem', color: '#fff',
                  borderRadius: 8, cursor: 'pointer', fontSize: 14,
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => window.close()}
                style={{
                  background: '#ef4444', border: 'none',
                  padding: '0.875rem 2rem', color: '#fff',
                  borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                }}
              >
                Confirmer et quitter
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0A0A5' }}>
            Page en construction… ({activeScreen})
          </div>
        );
    }
  };

  return (
    <div
      className="app-layout"
      style={{ display: 'flex', height: '100vh', width: '100vw', background: '#1A1D2E' }}
    >
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        onNavigate={handleSidebarNavigate}
        currentProject={currentProject}
        saveCurrentProject={() => saveCurrentProject(formData, currentProject?.results || {})}
        saveStatus={saveStatus}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div
        className="app-main"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {renderScreen()}
      </div>
    </div>
  );
}

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<MainApp />);
}
