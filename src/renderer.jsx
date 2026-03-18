import './index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import Sidebar from './components/Sidebar';
import ProjectManager, { useProjectManager } from './components/ProjectManager';
import UserInputForm from './components/UserInputForm';
import SimulationDashboard from './components/SimulationDashboard';

// Engines
import { calculateLighting } from './utils/calculateLighting';
import { calculateUniformity } from './utils/calculateUniformity';
import { calculateClimateAdjustment } from './utils/calculateClimateAdjustment';
import { calculateUsageProfile } from './utils/calculateUsageProfile';
import { buildReportData } from './utils/reportGenerator';

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
         setActiveScreen('form');
      }
  };

  const handleTemplateSelect = (template) => {
      setCurrentProject({ name: template.name, formData: template.formData });
      setActiveScreen('form');
  };

  const handleCalculateForms = async (formData) => {
      try {
        // Run all 5 calculations safely
        const lightingResult = calculateLighting(formData);
        const uniformityResult = calculateUniformity(formData, lightingResult);
        const climateResult = calculateClimateAdjustment(formData, lightingResult);
        const usageResult = calculateUsageProfile(formData, lightingResult, climateResult);
        
        // Ensure naturalLightResult object exists (simplification for our Simulation components)
        const naturalLightResult = {
           solar: { sunriseHour: 7, sunsetHour: 18, daylightHours: 11 },
           hourlyProfile: {}, // The Simulation Hook handles fallbacks if this is empty
           summary: {}
        };
        
        const results = {
           lighting: lightingResult,
           uniformity: uniformityResult,
           climate: climateResult,
           naturalLight: naturalLightResult,
           usage: usageResult
        };

        const reportData = buildReportData(formData, results);
        results.reportData = reportData;

        // Save everything
        await saveCurrentProject(formData, results);
        
        // Transition securely to dashboard
        setActiveScreen('simulation');
      } catch (err) {
        console.error("Calculation Error : ", err);
        alert("Erreur lors des calculs. Veuillez vérifier vos données d'entrée ou effacer le projet et recommencer.");
      }
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
      case 'dimensions':
      case 'luminaires':
      case 'form':
         return (
           <div style={{ flex: 1, overflowY: 'auto' }}>
              <UserInputForm 
                initialData={currentProject?.formData}
                onSubmit={handleCalculateForms} 
              />
           </div>
         );
      case 'simulation':
         return (
           <SimulationDashboard project={currentProject} />
         );
      case 'quitter':
         return (
           <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#FFF' }}>
             <h2>Êtes-vous sûr de vouloir quitter ?</h2>
             <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
               <button className="btn-secondary" onClick={() => setActiveScreen('projets')}>Annuler</button>
               <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => window.close()}>Confirmer</button>
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
