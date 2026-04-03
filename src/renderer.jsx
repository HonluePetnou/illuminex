import './index.css';
import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { createRoot } from 'react-dom/client';

import Sidebar from './components/Sidebar';
import ProjectManager, { useProjectManager } from './components/ProjectManager';
import SimulationDashboard from './components/SimulationDashboard';

import ScreenDimensions from './components/ScreenDimensions';
import ScreenMateriaux  from './components/ScreenMateriaux';
import ScreenLuminaires from './components/ScreenLuminaires';
import ScreenNaturel    from './components/ScreenNaturel';
import ScreenAnalyse    from './components/ScreenAnalyse';
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
    rMoyen:   0.78,
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
  'rapport',
];

function MainApp() {
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

    if (fullProject.formData.results && Object.keys(fullProject.formData.results).length > 0) {
      setActiveScreen('simulation');
    } else {
      setActiveScreen('dimensions');
    }
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

  React.useEffect(() => {
    if (currentProject && currentProject.formData) {
      setFormData(currentProject.formData);
    } else {
      setFormData(defaultValues);
    }
  }, [currentProject]);

  const updateFormData = (section, values) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...values,
      },
    }));
  };

  // Navigation dans le flow de simulation
  const goNext = (screen) => {
    saveCurrentProject({ formData });
    const idx = SIMULATION_FLOW.indexOf(screen);
    if (idx >= 0 && idx < SIMULATION_FLOW.length - 1) {
      setActiveScreen(SIMULATION_FLOW[idx + 1]);
    }
  };

  const goPrev = (screen) => {
    saveCurrentProject({ formData });
    const idx = SIMULATION_FLOW.indexOf(screen);
    if (idx > 0) {
      setActiveScreen(SIMULATION_FLOW[idx - 1]);
    } else {
      setActiveScreen('projets');
    }
  };

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
            onNext={() => goNext('luminaires')}
            onPrev={() => goPrev('luminaires')}
          />
        );

      case 'naturel':
        return (
          <ScreenNaturel
            formData={formData}
            updateFormData={updateFormData}
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
        currentProject={currentProject}
        saveCurrentProject={() => saveCurrentProject({ formData })}
        saveStatus={saveStatus}
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
