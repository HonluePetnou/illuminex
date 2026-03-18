import React, { useState } from 'react';
import RoomSimulation2D from './RoomSimulation2D';
import RoomSimulation3D from './RoomSimulation3D';
import { exportToPDF } from '../utils/reportGenerator';
import { Download, Layers, Box, Tag, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SimulationDashboard({ project }) {
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  
  if (!project || !project.results) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
        <Zap size={64} className="mb-4 text-amber-500/50" />
        <h2 className="text-xl font-bold text-white mb-2">Aucune Simulation Disponible</h2>
        <p>Veuillez repasser par l'étape de configuration et calculer les données pour ce projet.</p>
      </div>
    );
  }

  const { formData, results, reportData } = project;
  const recs = reportData?.recommendations || [];

  return (
    <div className="flex-1 flex flex-col pt-4 px-8 pb-8 overflow-y-auto space-y-6">
      
      {/* Header Panel */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
             <Zap size={24} className="text-amber-400 fill-amber-400" />
             Tableau de Bord : {project.name || 'Projet Actuel'}
          </h1>
          <p className="text-slate-400 mt-1">
             Type : {formData.occupation?.buildingType || 'Non Défini'} |
             Zone : {formData.location?.zone || 'Non Définie'}
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
             onClick={() => exportToPDF(reportData)}
             className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/20 transition-all"
          >
             <Download size={18} /> Télécharger Rapport PDF
          </button>
        </div>
      </div>

      {/* Main Grid : Simulations + Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT / CENTER : The Simulators */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
           {/* View Tabs */}
           <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700 self-start">
             <button 
                onClick={() => setViewMode('2d')} 
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === '2d' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <Layers size={16} /> Mode Plan 2D
             </button>
             <button 
                onClick={() => setViewMode('3d')} 
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === '3d' ? 'bg-indigo-600 text-white shadow shadow-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <Box size={16} /> Visite 3D Interactive
             </button>
           </div>
           
           {/* Render appropriate simulation */}
           {viewMode === '2d' ? (
             <RoomSimulation2D 
                formData={formData}
                lightingResult={results.lighting}
                uniformityResult={results.uniformity}
                climateResult={results.climate}
                naturalLightResult={results.naturalLight}
                usageResult={results.usage}
             />
           ) : (
             <RoomSimulation3D 
                formData={formData}
                lightingResult={results.lighting}
                uniformityResult={results.uniformity}
                climateResult={results.climate}
                naturalLightResult={results.naturalLight}
                usageResult={results.usage}
             />
           )}
        </div>

        {/* RIGHT PANEL : Key Metrics & Recommendations */}
        <div className="flex flex-col space-y-6">
           
           {/* KPI Cards */}
           <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
                   <div className="text-xs text-slate-400 mb-1">Nombre de Luminaires</div>
                   <div className="text-2xl font-bold text-white">{Math.round(results.lighting?.N || 0)}</div>
               </div>
               <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
                   <div className="text-xs text-slate-400 mb-1">Éclairement Cible</div>
                   <div className="text-2xl font-bold text-blue-400">{Math.round(results.lighting?.E_required || 0)} lx</div>
               </div>
               <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
                   <div className="text-xs text-slate-400 mb-1">Uniformité (U0)</div>
                   <div className="text-2xl font-bold" style={{ color: results.lighting?.U0 >= 0.7 ? '#4ade80' : '#fbbf24' }}>
                      {(results.uniformity?.U0 || 0).toFixed(2)}
                   </div>
               </div>
               <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md border-b-2 border-b-green-500">
                   <div className="text-xs text-slate-400 mb-1">Économies (Climat)</div>
                   <div className="text-2xl font-bold text-green-400">
                       {(results.climate?.savings?.savingsPercent || 0).toFixed(1)} %
                   </div>
               </div>
           </div>

           {/* AI Recommendations */}
           <div className="bg-slate-800 flex-1 rounded-xl border border-slate-700 shadow-md flex flex-col overflow-hidden">
               <div className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center gap-2">
                  <Tag size={18} className="text-indigo-400" />
                  <h3 className="font-semibold text-white">Expertise Automatique</h3>
               </div>
               
               <div className="p-6 overflow-y-auto space-y-4">
                  {recs.length === 0 ? (
                     <div className="flex items-start gap-3 bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-green-400 text-sm">
                        <CheckCircle size={18} className="shrink-0 mt-0.5" />
                        <div>L'installation semble parfaitement dimensionnée, aucune recommandation d'alerte spécifique pour ce projet.</div>
                     </div>
                  ) : (
                     recs.map((rec, i) => {
                       const isAlert = rec.includes('⚠️') || rec.includes('Insuffisant');
                       return (
                         <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-sm leading-relaxed
                           ${isAlert 
                             ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
                             : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'}`
                         }>
                             {isAlert ? <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-500" />
                                      : <CheckCircle size={18} className="shrink-0 mt-0.5 text-indigo-500" />}
                             <div>{rec.replace(/^(⚠️|✅|☀️|🌧️|📚|💡)\s*/, '')}</div>
                         </div>
                       )
                     })
                  )}
               </div>
           </div>

        </div>

      </div>

    </div>
  );
}
