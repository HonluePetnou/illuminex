import './index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import Sidebar from './components/Sidebar';
import ProjectManager, { useProjectManager } from './components/ProjectManager';
import SimulationDashboard from './components/SimulationDashboard';

import ScreenDimensions from './components/ScreenDimensions';
import ScreenLuminaires from './components/ScreenLuminaires';
import ScreenNaturel from './components/ScreenNaturel';
import ScreenContact from './components/ScreenContact';

// Note : les moteurs de calcul sont utilisés directement dans SimulationDashboard


function MainApp() {
  // Navigation State
  const [activeScreen, setActiveScreen] = useState('projets'); 
  // 'projets', 'form', 'simulation', 'contact', 'quitter'

  // DB Hook
  const {
      projects,
      currentProject,
      setCurrentProject,
      saveCurrentProject
  } = useProjectManager();

  const handleOpenProject = (project) => {
      setCurrentProject(project);
      
      // If project has results already, go to simulation
      if (project.results) {
         setActiveScreen('simulation');
      } else {
         setActiveScreen('dimensions');
      }
  };

  const handleTemplateSelect = (template) => {
      setCurrentProject({ name: template.name, formData: template.formData });
      setActiveScreen('dimensions');
  };




  // State global pour les formulaires
  const defaultValues = {
    room: { length: 7.0, width: 6.0, ceilingHeight: 3.0, workPlaneHeight: 0.85 },
    occupation: { buildingType: 'Bureau/Administration', occupationType: 'Standard', occupants: 4, hoursPerDay: 8, daysPerWeek: 5 },
    luminaire: { type: 'LED_Philips_150x150', fluxPerUnit: 2250, powerPerUnit: 18 },
    naturalLight: { hasWindows: true, orientation: 'Sud', windowArea: 5 },
    location: { zone: 'Sud (Cotonou, Porto-Novo)' }
  };

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
        ...values
      }
    }));
  };

  // Render logic mapper
  const renderScreen = () => {
    switch (activeScreen) {
      case 'projets':
      case 'accueil': // Merge accueil and projets
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
             onNext={() => setActiveScreen('luminaires')} 
             onPrev={() => setActiveScreen('projets')} 
           />
         );
      case 'luminaires':
         return (
           <ScreenLuminaires 
             formData={formData} 
             updateFormData={updateFormData} 
             onNext={() => setActiveScreen('naturel')} 
             onPrev={() => setActiveScreen('dimensions')} 
           />
         );
      case 'naturel':
         return (
           <ScreenNaturel 
             formData={formData} 
             updateFormData={updateFormData} 
             onNext={() => {
                // Sauvegarder et aller à la simulation
                // On passe formData au projet courant pour persist
                const projectToSave = {
                   ...(currentProject || {}),
                   formData: formData
                };
                setCurrentProject(projectToSave);
                setActiveScreen('simulation');
             }} 
             onPrev={() => setActiveScreen('luminaires')} 
           />
         );
      case 'simulation':
         return (
           <SimulationDashboard 
             project={{ ...(currentProject || {}), formData: formData }} 
           />
         );
      case 'contact':
         return <ScreenContact />;
      case 'quitter':
         return (
           <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#FFF' }}>
             <h2>Êtes-vous sûr de vouloir quitter ?</h2>
             <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
               <button className="btn-secondary" onClick={() => setActiveScreen('projets')}>Annuler</button>
               <button className="btn-primary" style={{ background: '#ef4444', border: 'none', padding: '0.875rem 2rem', color: '#fff', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.close()}>Confirmer</button>
             </div>
           </div>
         );
      default:
         return (
           <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0A0A5' }}>
             Page en construction... (Cliqué sur: {activeScreen})
           </div>
         );
    }
  };

  return (
    <div className="app-layout" style={{ display: 'flex', height: '100vh', width: '100vw', background: '#191A1E' }}>
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      
      <div className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
