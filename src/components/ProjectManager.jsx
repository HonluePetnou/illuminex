import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import {
  FolderPlus, FileJson, HardDrive, Search, Filter,
  MoreVertical, Copy, Edit2, Download, FileText, Trash2,
  FolderOpen, Calendar, MapPin, Zap, CheckCircle2, Clock,
  AlertCircle, Lightbulb, ArrowRight, Building, BookOpen, Store, Activity, Home, Users
} from 'lucide-react';

/* =====================================================
   HOOK — gestion des projets (inchangé fonctionnellement)
   ===================================================== */
export function useProjectManager() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');

  useEffect(() => {
    storageService.init().then(() => {
      loadProjects();
      storageService.initDefaultTemplates();
      storageService.initDefaultSettings();
    }).catch(err => console.error('Init Storage Error:', err));
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
      formData, results,
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

  const onFormDataChange = useCallback((formData, results) => {
    if (!currentProject) return;
    setSaveStatus('unsaved');
    storageService.autoSave({ ...currentProject, formData, results }, 3000);
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

  const exportProject = (project) => storageService.exportToJSON(project);

  const importProject = async (file) => {
    const id = await storageService.importFromJSON(file);
    loadProjects();
    return id;
  };

  return {
    projects, currentProject, setCurrentProject, saveStatus,
    saveCurrentProject, onFormDataChange, loadProject,
    deleteProject, duplicateProject, exportProject, importProject
  };
}

/* =====================================================
   COMPOSANT PRINCIPAL — ProjectManager
   ===================================================== */
export default function ProjectManager({ onOpenProject, onTemplateSelect }) {
  const { projects, deleteProject, duplicateProject, exportProject, importProject, saveStatus } = useProjectManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [sortBy, setSortBy] = useState('Date modification');
  const [templates, setTemplates] = useState([]);
  const [storageInfo, setStorageInfo] = useState({ used: '0 Ko', total: '50 Mo', percent: '0%' });
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    storageService.getAllTemplates().then(t => setTemplates(t || []));
    storageService.getStorageInfo().then(info => setStorageInfo(info || storageInfo));
  }, []);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) importProject(file);
    e.target.value = null;
  };

  let filteredProjects = projects.filter(p =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (filterType !== 'Tous') {
    filteredProjects = filteredProjects.filter(p => p.formData?.occupation?.buildingType === filterType);
  }
  filteredProjects.sort((a, b) => {
    if (sortBy === 'Date modification') return (b.updatedAt || 0) - (a.updatedAt || 0);
    if (sortBy === 'Nom') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  const buildingTypes = ['Tous', ...new Set(projects.map(p => p.formData?.occupation?.buildingType).filter(Boolean))];

  // ── Tokens Design System ──
  const bg = '#1C1D24';
  const cardBg = '#23242B';
  const border = 'rgba(255,255,255,0.06)';
  const inputBg = 'rgba(255,255,255,0.04)';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: bg, overflowY: 'auto' }}>

      {/* ══ MODAL NOUVEAU PROJET ══ */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1C1D24', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#1E2237', border: `1px solid ${border}`, borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', color: '#fff' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>Nouveau projet</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Donnez un nom à votre projet pour l'identifier facilement.</p>
            <input 
              autoFocus
              type="text" 
              placeholder="Ex: Pharmacie Cotonou" 
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newProjectName.trim()) {
                  onOpenProject({ name: newProjectName, formData: {} });
                  setShowNewModal(false);
                  setNewProjectName('');
                }
                if (e.key === 'Escape') {
                  setShowNewModal(false);
                  setNewProjectName('');
                }
              }}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: `1px solid rgba(255,255,255,0.1)`, color: '#fff', padding: '0.875rem 1rem', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', marginBottom: '2rem', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = '#3B82F6'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
               <button 
                 onClick={() => { setShowNewModal(false); setNewProjectName(''); }}
                 style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: '0.625rem 1rem', borderRadius: '8px' }}
                 onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
               >
                 Annuler
               </button>
               <button 
                 disabled={!newProjectName.trim()}
                 onClick={() => {
                   onOpenProject({ name: newProjectName, formData: {} });
                   setShowNewModal(false);
                   setNewProjectName('');
                 }}
                 style={{ background: '#3B82F6', border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: newProjectName.trim() ? 'pointer' : 'not-allowed', padding: '0.625rem 1.5rem', borderRadius: '8px', opacity: newProjectName.trim() ? 1 : 0.5, transition: 'background 0.2s' }}
                 onMouseEnter={e => { if(newProjectName.trim()) e.currentTarget.style.background = '#2563EB'; }}
                 onMouseLeave={e => { if(newProjectName.trim()) e.currentTarget.style.background = '#3B82F6'; }}
               >
                 Créer  →
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EN-TÊTE ══ */}
      <div style={{
        padding: '2rem 2.5rem 1.5rem',
        borderBottom: `1px solid ${border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem',
        background: '#1C1D24'
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', marginBottom: '0.375rem' }}>
            Mes Projets
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '0.8125rem' }}>
            <HardDrive size={14} />
            <span>Stockage local : {storageInfo.used} / {storageInfo.total}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${border}`,
            padding: '0.625rem 1rem', borderRadius: '10px', cursor: 'pointer',
            color: '#94A3B8', fontSize: '0.875rem', fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <FileJson size={16} /> Importer PGF
            <input type="file" accept=".json,.pgf" style={{ display: 'none' }} onChange={handleImport} />
          </label>

          <button
            onClick={() => setShowNewModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff',
              padding: '0.625rem 1.25rem', borderRadius: '10px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            <FolderPlus size={17} /> Nouveau projet
          </button>
        </div>
      </div>

      {/* ══ BARRE DE FILTRE ══ */}
      <div style={{
        padding: '1rem 2.5rem',
        borderBottom: `1px solid ${border}`,
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center'
      }}>
        {/* Recherche */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '360px' }}>
          <Search size={15} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: inputBg, border: `1px solid ${border}`,
              borderRadius: '8px', padding: '0.5rem 1rem 0.5rem 2.25rem',
              color: '#fff', fontSize: '0.875rem', outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            onBlur={e => e.currentTarget.style.borderColor = border}
          />
        </div>

        {/* Filtre type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: inputBg, border: `1px solid ${border}`, borderRadius: '8px', padding: '0.5rem 0.875rem' }}>
          <Filter size={14} color="#64748B" />
          <select
            value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
          >
            {buildingTypes.map(t => <option key={t} value={t} style={{ background: '#1E2237' }}>{t}</option>)}
          </select>
        </div>

        {/* Tri */}
        <select
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ background: inputBg, border: `1px solid ${border}`, borderRadius: '8px', padding: '0.5rem 0.875rem', color: '#94A3B8', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
        >
          <option style={{ background: '#1E2237' }}>Date modification</option>
          <option style={{ background: '#1E2237' }}>Nom</option>
          <option style={{ background: '#1E2237' }}>Type bâtiment</option>
        </select>
      </div>

      {/* ══ CONTENU PRINCIPAL ══ */}
      <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* ─ PROJETS ─ */}
        {filteredProjects.length === 0 ? (
          <div style={{
            padding: '4rem 2rem',
            border: `2px dashed rgba(255,255,255,0.1)`, borderRadius: '16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(255,255,255,0.02)', textAlign: 'center',
          }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <FolderOpen size={36} color="#64748B" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Aucun projet trouvé</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', maxWidth: '340px' }}>
              Créez votre premier projet ou sélectionnez un modèle prédéfini pour concevoir votre éclairage.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', background: '#3B82F6', border: 'none', color: '#fff', padding: '0.675rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
              onMouseLeave={e => e.currentTarget.style.background = '#3B82F6'}
            >
              <FolderPlus size={17} /> Créer un projet
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
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

        {/* ─ SÉPARATEUR ─ */}
        <div style={{ height: '1px', background: border }} />

        {/* ─ MODÈLES PRÉDÉFINIS ─ */}
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
            <Zap size={18} style={{ color: '#F0A500' }} /> Démarrer depuis un modèle
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {templates.length > 0 ? templates.map(tpl => (
              <TemplateCard key={tpl.id} template={tpl} onClick={() => onTemplateSelect(tpl)} />
            )) : (
              /* Modèles par défaut si pas encore chargés */
              [
                { id: 'b', name: 'Bureau PME', description: '7×6 m, 500 lux, LED', icon: <Building size={20} color="#F0A500" /> },
                { id: 'h', name: 'Clinique', description: '6×5 m, 500 lux, IRC>90', icon: <Activity size={20} color="#F0A500" /> },
                { id: 's', name: 'Salle de classe', description: '8×7 m, 300 lux, tubes LED', icon: <BookOpen size={20} color="#F0A500" /> },
                { id: 'c', name: 'Commerce détail', description: '10×8 m, 750 lux, dalles LED', icon: <Store size={20} color="#F0A500" /> },
              ].map(tpl => (
                <TemplateCard key={tpl.id} template={tpl} onClick={() => onOpenProject({ name: tpl.name, formData: {} })} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Carte Projet ── */
function ProjectCard({ project, onOpen, onDelete, onDuplicate, onExportJSON }) {
  const [showMenu, setShowMenu] = useState(false);
  const [hovered, setHovered] = useState(false);

  const bType = project.formData?.occupation?.buildingType || 'Non spécifié';
  const lumCount = project.results?.lighting?.N != null ? Math.round(project.results.lighting.N) : '—';
  const location = project.formData?.location?.country && project.formData?.location?.city 
      ? `${project.formData.location.country} - ${project.formData.location.city}` 
      : 'Bénin - Cotonou';
  
  const dateStr = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const border = 'rgba(255,255,255,0.08)';
  const cardBg = '#23242B';

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${hovered ? 'rgba(59,130,246,0.5)' : border}`,
        borderRadius: '12px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? '0 8px 30px rgba(0,0,0,0.4)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Miniature */}
      <div
        onClick={onOpen}
        style={{
          height: '110px',
          background: 'linear-gradient(135deg, #23242B 0%, rgba(20,24,35,1) 100%)',
          borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative',
        }}
      >
        <div style={{ opacity: 0.1 }}>
          <Lightbulb size={48} color="#3B82F6" />
        </div>
        {/* Mini room render hint */}
        {project.formData?.room?.length && (
          <div style={{
            position: 'absolute', bottom: '10px', left: '12px',
            fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4
          }}>
            {project.formData.room.length}×{project.formData.room.width} m
          </div>
        )}
        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(59,130,246,0.15)', padding: '3px 8px', borderRadius: '12px', fontSize: '0.625rem', fontWeight: 700, color: '#3B82F6', letterSpacing: '0.05em' }}>
          ACTIF
        </div>
      </div>

      {/* Corps */}
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3
            onClick={onOpen}
            style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', cursor: 'pointer', flex: 1, paddingRight: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}
          >
            {project.name || 'Projet sans nom'}
          </h3>
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        <span style={{ fontSize: '0.75rem', color: '#94A3B8', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>
          {bType}
        </span>

        <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748B' }}>
            <MapPin size={12} /> <span>{location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
               <Lightbulb size={12} /> <span>{lumCount} lum.</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> <span>{dateStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton ouvrir */}
      <button
        onClick={onOpen}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          background: hovered ? '#3B82F6' : 'rgba(59,130,246,0.1)',
          color: hovered ? '#fff' : '#3B82F6',
          border: 'none', padding: '0.75rem',
          fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        Continuer <ArrowRight size={16} />
      </button>

      {/* Menu contextuel */}
      {showMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setShowMenu(false)} />
          <div style={{
            position: 'absolute', top: '3rem', right: '1rem', zIndex: 10,
            background: '#1E2237', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden', minWidth: '180px',
          }}>
            {[
              { label: 'Dupliquer', icon: <Copy size={14} />, action: () => { onDuplicate(); setShowMenu(false); } },
              { label: 'Exporter PGF', icon: <FileJson size={14} />, action: () => { onExportJSON(); setShowMenu(false); } },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={menuItemStyle}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {item.icon} {item.label}
              </button>
            ))}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
            <button
              onClick={() => { if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce projet ?')) onDelete(); setShowMenu(false); }}
              style={{ ...menuItemStyle, color: '#ef4444' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
  background: 'transparent', border: 'none', padding: '0.75rem 1rem',
  color: '#94A3B8', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left',
  transition: 'background 0.2s',
};

/* ── Carte Modèle ── */
function TemplateCard({ template, onClick }) {
  const [hovered, setHovered] = useState(false);

  const getDynamicIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('classe') || n.includes('école')) return <BookOpen size={20} color="#F0A500" />;
    if (n.includes('bureau') || n.includes('open space')) return <Building size={20} color="#F0A500" />;
    if (n.includes('commerce') || n.includes('magasin')) return <Store size={20} color="#F0A500" />;
    if (n.includes('logement') || n.includes('résidentiel')) return <Home size={20} color="#F0A500" />;
    if (n.includes('réunion')) return <Users size={20} color="#F0A500" />;
    if (n.includes('hôpital') || n.includes('santé')) return <Activity size={20} color="#F0A500" />;
    return <Zap size={20} color="#F0A500" />;
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(240,165,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '12px', padding: '1.25rem', cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '12px',
        background: 'rgba(240,165,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', marginBottom: '1rem',
        transition: 'transform 0.2s',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
      }}>
        {template.icon || getDynamicIcon(template.name || '')}
      </div>
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', marginBottom: '0.375rem', margin: 0 }}>
        {template.name}
      </h3>
      <p style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4, margin: 0 }}>
        {template.description || 'Modèle ILLUMINEX Afrique'}
      </p>
    </div>
  );
}

/* ── Indicateur de sauvegarde ── */
function AutoSaveIndicator({ status }) {
  const configs = {
    saving: { bg: 'rgba(240,165,0,0.1)', border: 'rgba(240,165,0,0.3)', color: '#F0A500', icon: <Clock size={12} />, label: 'Sauvegarde...' },
    unsaved: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', icon: <AlertCircle size={12} />, label: 'Non sauvegardé' },
    saved: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#22c55e', icon: <CheckCircle2 size={12} />, label: 'Sauvegardé' },
  };
  const c = configs[status] || configs.saved;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, padding: '0.375rem 0.75rem',
      borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
    }}>
      {c.icon} {c.label}
    </div>
  );
}
