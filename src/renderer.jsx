import './index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import Sidebar from './components/Sidebar';
import ScreenAccueil from './components/ScreenAccueil';
import ScreenDimensions from './components/ScreenDimensions';
import ScreenLuminaires from './components/ScreenLuminaires';
import ScreenNaturel from './components/ScreenNaturel';
import ScreenSimulation from './components/ScreenSimulation';
import ScreenProjets from './components/ScreenProjets';
import ScreenContact from './components/ScreenContact';

function App() {
  const [activeScreen, setActiveScreen] = useState('accueil');

  const renderScreen = () => {
    switch(activeScreen) {
      case 'accueil':
        return <ScreenAccueil onNewSimulation={() => setActiveScreen('dimensions')} />;
      case 'dimensions':
        return <ScreenDimensions onPrev={() => setActiveScreen('accueil')} onNext={() => setActiveScreen('luminaires')} />;
      case 'luminaires':
        return <ScreenLuminaires onNext={() => setActiveScreen('naturel')} />;
      case 'naturel':
        return <ScreenNaturel onPrev={() => setActiveScreen('luminaires')} onNext={() => setActiveScreen('simulation')} />;
      case 'simulation':
        return <ScreenSimulation onPrev={() => setActiveScreen('naturel')} />;
      case 'projets':
        return <ScreenProjets />;
      case 'contact':
        return <ScreenContact />;
      case 'quitter':
        return (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#FFF' }}>
            <h2>Êtes-vous sûr de vouloir quitter ?</h2>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setActiveScreen('accueil')}>Annuler</button>
              <button className="btn-primary" style={{ background: '#ef4444' }}>Confirmer</button>
            </div>
          </div>
        );
      default:
        return <ScreenAccueil onNewSimulation={() => setActiveScreen('dimensions')} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <div className="app-main">
        {renderScreen()}
      </div>
    </div>
  );
}

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
