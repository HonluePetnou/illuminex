import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { 
  FolderPlus, FileJson, HardDrive, Search, Filter, 
  MoreVertical, Copy, Edit2, Download, FileText, Trash2, 
  FolderOpen, Calendar, MapPin, Zap, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';

/**
 * Custom hook for project management and persistence
 */
export function useProjectManager() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  
  // Load all projects on mount
  useEffect(() => {
    storageService.init().then(() => {
      loadProjects();
      storageService.initDefaultTemplates();
      storageService.initDefaultSettings();
    }).catch(err => console.error("Initialize Storage Error:", err));
  }, []);
  
  const loadProjects = async () => {
    const all = await storageService.getAllProjects();
    setProjects(all || []);
  };
  
  const saveCurrentProject = async (formData, results) => {
    setSaveStatus('saving');
    const projectToSave = {
      ...currentProject,
      name: currentProject?.name || 'Projet Sans Nom',
      formData,
      results,
      updatedAt: Date.now()
    };
    
    try {
      const id = await storageService.saveProject(projectToSave);
      setCurrentProject({ ...projectToSave, id });
      setSaveStatus('saved');
      loadProjects();
    } catch (err) {
      console.error(err);
      setSaveStatus('unsaved');
    }
  };
  
  // Trigger auto-save when formData changes
  const onFormDataChange = useCallback((formData, results) => {
    if (!currentProject) return;
    
    setSaveStatus('unsaved');
    storageService.autoSave({ 
      ...currentProject, 
      formData, 
      results 
    }, 3000);
    // Simulating auto-save UI reaction
    setTimeout(() => setSaveStatus('saved'), 3500);
  }, [currentProject]);
  
  const loadProject = async (id) => {
    const p = await storageService.getProject(id);
    if (p) setCurrentProject(p);
    return p;
  };

  const deleteProject = async (id) => {
    await storageService.deleteProject(id);
    if (currentProject?.id === id) setCurrentProject(null);
    loadProjects();
  };

  const duplicateProject = async (id) => {
    await storageService.duplicateProject(id);
    loadProjects();
  };

  const exportProject = (project) => {
    storageService.exportToJSON(project);
  };

  const importProject = async (file) => {
    const id = await storageService.importFromJSON(file);
    loadProjects();
    return id;
  };

  return {
    projects,
    currentProject,
    setCurrentProject,
    saveStatus,
    saveCurrentProject,
    onFormDataChange,
    loadProject,
    deleteProject,
    duplicateProject,
    exportProject,
    importProject
  };
}

/**
 * Full UI Component for Project Manager
 */
export default function ProjectManager({ onOpenProject, onTemplateSelect }) {
  const { 
    projects, 
    deleteProject, 
    duplicateProject, 
    exportProject,
    importProject,
    saveStatus
  } = useProjectManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [sortBy, setSortBy] = useState('Date modification');
  
  const [templates, setTemplates] = useState([]);
  const [storageInfo, setStorageInfo] = useState({ used: '0', total: '0', percent: '0%' });

  useEffect(() => {
    storageService.getAllTemplates().then(t => setTemplates(t));
    storageService.getStorageInfo().then(info => setStorageInfo(info));
  }, []);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) importProject(file);
    e.target.value = null;
  };

  // Filter and sort Logic
  let filteredProjects = projects.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (filterType !== 'Tous') {
    filteredProjects = filteredProjects.filter(p => p.formData?.occupation?.buildingType === filterType);
  }

  filteredProjects.sort((a, b) => {
    if (sortBy === 'Date modification') return b.updatedAt - a.updatedAt;
    if (sortBy === 'Nom') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'Type bâtiment') {
      const typeA = a.formData?.occupation?.buildingType || '';
      const typeB = b.formData?.occupation?.buildingType || '';
      return typeA.localeCompare(typeB);
    }
    return 0;
  });

  // Building type unique list
  const buildingTypes = ['Tous', ...new Set(projects.map(p => p.formData?.occupation?.buildingType).filter(Boolean))];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      
      {/* HEADER */}
      <div className="px-8 py-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mes Projets</h1>
          <div className="flex items-center text-sm text-slate-400 gap-2">
            <HardDrive size={16} />
            <span>Utilisé: {storageInfo.used} / {storageInfo.total}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          
          <label className="cursor-pointer border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
            <FileJson size={18} />
            Importer JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          
          <button 
            onClick={() => onOpenProject({ name: 'Nouveau Projet', formData: {} })}
            className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-6 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
          >
            <FolderPlus size={18} />
            Nouveau projet
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="px-8 py-4 bg-slate-800/30 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Rechercher un projet..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1">
            <Filter size={16} className="text-slate-500" />
            <select 
              value={filterType} onChange={e => setFilterType(e.target.value)}
              className="bg-transparent text-sm border-none outline-none text-slate-300"
            >
              {buildingTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <select 
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 outline-none"
          >
            <option>Date modification</option>
            <option>Nom</option>
            <option>Type bâtiment</option>
          </select>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10">
        
        {/* PROJECTS GRID */}
        {filteredProjects.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-800/10">
            <FolderOpen size={64} className="text-slate-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Aucun projet sauvegardé</h3>
            <p className="text-slate-500 max-w-sm">
              Créez votre premier projet ou utilisez un modèle prédéfini d'ILLUMINEX ci-dessous.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map(proj => (
              <ProjectCard 
                key={proj.id} 
                project={proj} 
                onOpen={() => onOpenProject(proj)}
                onDelete={() => deleteProject(proj.id)}
                onDuplicate={() => duplicateProject(proj.id)}
                onExportJSON={() => exportProject(proj)}
              />
            ))}
          </div>
        )}

        <hr className="border-slate-800" />

        {/* TEMPLATES */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap size={20} className="text-amber-400" /> 
            Modèles prédéfinis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map(tpl => (
              <div 
                key={tpl.id}
                onClick={() => onTemplateSelect(tpl)}
                className="bg-slate-800 border border-slate-700 hover:border-amber-500/50 p-5 rounded-xl cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap size={20} className="text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">{tpl.name}</h3>
                <p className="text-xs text-slate-400 leading-snug">{tpl.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
      
      {/* FLOATING AUTO-SAVE INDICATOR (Demonstration only, actual app renders this high up) */}
      <div className="fixed top-6 right-8">
         <AutoSaveIndicator status={saveStatus} />
      </div>

    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete, onDuplicate, onExportJSON }) {
  const [showMenu, setShowMenu] = useState(false);
  
  const bType = project.formData?.occupation?.buildingType || 'Type inconnu';
  const lumCount = project.results?.lighting?.N || project.formData?.luminaire?.N || '?';
  const zone = project.formData?.location?.zone || 'Zone Bénin';
  
  const dateStr = new Date(project.updatedAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-md flex flex-col hover:border-blue-500/50 transition-colors group relative">
      
      {/* Thumbnail placeholder */}
      <div 
        className="h-32 bg-slate-900 border-b border-slate-700 flex items-center justify-center relative cursor-pointer"
        onClick={onOpen}
      >
         <FolderOpen size={40} className="text-slate-700 group-hover:text-blue-500/50 transition-colors" />
         <div className="absolute top-3 left-3 bg-slate-800/80 px-2 py-1 rounded text-[10px] font-bold text-slate-300 tracking-wider">
           ILLUMINEX
         </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col content-between">
        <div className="flex justify-between items-start mb-2 relative">
          <h3 className="text-lg font-bold text-white leading-tight pr-6 truncate cursor-pointer" onClick={onOpen}>
            {project.name || 'Projet Sans Nom'}
          </h3>
          
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-slate-500 hover:text-white transition-colors absolute right-0 top-0"
          >
            <MoreVertical size={18} />
          </button>
          
          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 top-6 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-20 py-1 text-sm overflow-hidden">
              <button className="w-full text-left px-4 py-2 hover:bg-slate-600 flex items-center gap-2"><Edit2 size={14}/> Renommer</button>
              <button onClick={() => { onDuplicate(); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-600 flex items-center gap-2"><Copy size={14}/> Dupliquer</button>
              <button onClick={() => { onExportJSON(); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-600 flex items-center gap-2"><FileJson size={14}/> Exporter JSON</button>
              <button className="w-full text-left px-4 py-2 hover:bg-slate-600 flex items-center gap-2"><FileText size={14}/> Exporter PDF</button>
              <div className="h-px bg-slate-600 my-1"></div>
              <button 
                onClick={() => { 
                  if(window.confirm('Supprimer définitivement ce projet ?')) onDelete(); 
                  setShowMenu(false); 
                }} 
                className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-2"
              >
                <Trash2 size={14}/> Supprimer
              </button>
            </div>
          )}
        </div>
        
        <div className="text-sm text-slate-400 mb-4">{bType}</div>
        
        <div className="mt-auto space-y-2">
          <div className="flex items-center text-xs text-slate-500 gap-1.5 line-clamp-1">
            <MapPin size={12} /> {zone} • {lumCount} luminaires
          </div>
          <div className="flex items-center text-xs text-slate-500 gap-1.5">
            <Calendar size={12} /> Modifié: {dateStr}
          </div>
        </div>
      </div>
      
      {/* Bottom open action */}
      <button 
        onClick={onOpen}
        className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white w-full py-3 text-sm font-semibold transition-colors flex justify-center items-center gap-2"
      >
        Ouvrir le projet
      </button>

      {/* Click outside menu closer hack */}
      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
      )}
    </div>
  );
}

function AutoSaveIndicator({ status }) {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
        <Clock size={12} className="animate-spin" /> Sauvegarde...
      </div>
    );
  }
  
  if (status === 'unsaved') {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
        <AlertCircle size={12} /> Non sauvegardé
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-500 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg opacity-80 hover:opacity-100 transition-opacity">
      <CheckCircle2 size={12} /> Sauvegardé
    </div>
  );
}
