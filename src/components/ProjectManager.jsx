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

  // ── Tokens ──
  const bg = '#191A1E';
  const cardBg = '#26272D';
  const border = '#363741';
  const inputBg = '#1E1F24';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: bg, overflowY: 'auto' }}>

      {/* ══ MODAL NOUVEAU PROJET ══ */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(25, 26, 30, 0.8)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#26272D', border: `1px solid ${border}`, borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', color: '#FFF' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Nouveau projet</h2>
            <p style={{ color: '#A0A0A5', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Donnez un nom à votre projet pour l'identifier facilement.</p>
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
              style={{ width: '100%', boxSizing: 'border-box', background: '#1E1F24', border: `1px solid ${border}`, color: '#FFF', padding: '0.875rem 1rem', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', marginBottom: '2rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
               <button 
                 onClick={() => { setShowNewModal(false); setNewProjectName(''); }}
                 style={{ background: 'transparent', border: 'none', color: '#A0A0A5', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: '0.625rem 1rem' }}
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
                 style={{ background: '#5A84D5', border: 'none', color: '#FFF', fontWeight: 600, fontSize: '0.875rem', cursor: newProjectName.trim() ? 'pointer' : 'not-allowed', padding: '0.625rem 1.5rem', borderRadius: '8px', opacity: newProjectName.trim() ? 1 : 0.5 }}
               >
                 Créer
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EN-TÊTE ══ */}
      <div style={{
        padding: '2rem 2.5rem 1.5rem',
        borderBottom: `1px solid ${border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#FFF', marginBottom: '0.375rem' }}>
            Mes Projets
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7E7E86', fontSize: '0.8125rem' }}>
            <HardDrive size={14} />
            <span>Stockage local : {storageInfo.used} / {storageInfo.total}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: cardBg, border: `1px solid ${border}`,
            padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
            color: '#A0A0A5', fontSize: '0.8125rem', fontWeight: 500,
            transition: 'border-color 0.2s',
          }}>
            <FileJson size={16} /> Importer JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>

          <button
            onClick={() => setShowNewModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#5A84D5', border: 'none', color: '#FFF',
              padding: '0.625rem 1.25rem', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem',
              boxShadow: '0 4px 16px rgba(90,132,213,0.3)',
            }}
          >
            <FolderPlus size={17} /> Nouveau projet
          </button>
        </div>
      </div>

      {/* ══ BARRE DE FILTRE ══ */}
      <div style={{
        padding: '1rem 2.5rem',
        background: 'rgba(43,44,53,0.4)',
        borderBottom: `1px solid ${border}`,
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center'
      }}>
        {/* Recherche */}
        <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '340px' }}>
          <Search size={15} color="#7E7E86" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: inputBg, border: `1px solid ${border}`,
              borderRadius: '8px', padding: '0.5rem 1rem 0.5rem 2.25rem',
              color: '#FFF', fontSize: '0.8125rem', outline: 'none',
            }}
          />
        </div>

        {/* Filtre type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: inputBg, border: `1px solid ${border}`, borderRadius: '8px', padding: '0.5rem 0.875rem' }}>
          <Filter size={14} color="#7E7E86" />
          <select
            value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#A0A0A5', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer' }}
          >
            {buildingTypes.map(t => <option key={t} value={t} style={{ background: '#26272D' }}>{t}</option>)}
          </select>
        </div>

        {/* Tri */}
        <select
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ background: inputBg, border: `1px solid ${border}`, borderRadius: '8px', padding: '0.5rem 0.875rem', color: '#A0A0A5', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer' }}
        >
          <option style={{ background: '#26272D' }}>Date modification</option>
          <option style={{ background: '#26272D' }}>Nom</option>
          <option style={{ background: '#26272D' }}>Type bâtiment</option>
        </select>

        <AutoSaveIndicator status={saveStatus} />
      </div>

      {/* ══ CONTENU PRINCIPAL ══ */}
      <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* ─ PROJETS ─ */}
        {filteredProjects.length === 0 ? (
          <div style={{
            padding: '4rem 2rem',
            border: `2px dashed ${border}`, borderRadius: '16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(43,44,53,0.15)', textAlign: 'center',
          }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#26272D', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <FolderOpen size={36} color="#363741" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFF', marginBottom: '0.5rem' }}>Aucun projet sauvegardé</h3>
            <p style={{ color: '#7E7E86', fontSize: '0.875rem', maxWidth: '340px' }}>
              Créez votre premier projet ou sélectionnez un modèle prédéfini ci-dessous.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', background: '#5A84D5', border: 'none', color: '#FFF', padding: '0.675rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
            >
              <FolderPlus size={17} /> Créer un projet
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
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
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.125rem', fontWeight: 700, color: '#FFF', marginBottom: '1.25rem' }}>
            <Zap size={18} style={{ color: '#FFB84D' }} /> Démarrer depuis un modèle
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {templates.length > 0 ? templates.map(tpl => (
              <TemplateCard key={tpl.id} template={tpl} onClick={() => onTemplateSelect(tpl)} />
            )) : (
              /* Modèles par défaut si pas encore chargés */
              [
                { id: 'b', name: 'Bureau Standard', description: '7×6 m, 500 lux, LED', icon: <Building size={20} color="#FFB84D" /> },
                { id: 's', name: 'Salle de classe', description: '8×7 m, 300 lux, tubes LED', icon: <BookOpen size={20} color="#FFB84D" /> },
                { id: 'c', name: 'Commerce', description: '10×8 m, 750 lux, dalles LED', icon: <Store size={20} color="#FFB84D" /> },
                { id: 'h', name: 'Hôpital', description: '6×5 m, 500 lux, IRC>90', icon: <Activity size={20} color="#FFB84D" /> },
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

  const bType = project.formData?.occupation?.buildingType || 'Type inconnu';
  const lumCount = project.results?.lighting?.N != null ? Math.round(project.results.lighting.N) : '—';
  const zone = project.formData?.location?.zone || 'Bénin';
  const dateStr = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const border = '#363741';
  const cardBg = '#26272D';

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${hovered ? '#5A84D5' : border}`,
        borderRadius: '12px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? '0 4px 20px rgba(90,132,213,0.12)' : 'none',
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
          background: 'linear-gradient(135deg, #1E1F24 0%, #2B2C35 100%)',
          borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative',
        }}
      >
        <div style={{ opacity: 0.15 }}>
          <Lightbulb size={48} color="#FFB84D" />
        </div>
        {/* Mini room render hint */}
        {project.formData?.room?.length && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '12px',
            fontSize: '0.6875rem', color: '#7E7E86', fontFamily: 'monospace',
          }}>
            {project.formData.room.length}×{project.formData.room.width} m
          </div>
        )}
        <div style={{ position: 'absolute', top: '8px', left: '10px', background: 'rgba(26,27,32,0.8)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 700, color: '#5A84D5', letterSpacing: '0.05em' }}>
          ILLUMINEX
        </div>
      </div>

      {/* Corps */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3
            onClick={onOpen}
            style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#FFF', cursor: 'pointer', flex: 1, paddingRight: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {project.name || 'Projet sans nom'}
          </h3>
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
            style={{ background: 'none', border: 'none', color: '#7E7E86', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
          >
            <MoreVertical size={16} />
          </button>
        </div>

        <span style={{ fontSize: '0.75rem', color: '#7E7E86', background: '#1E1F24', padding: '2px 8px', borderRadius: '4px', alignSelf: 'flex-start' }}>
          {bType}
        </span>

        <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#7E7E86' }}>
            <MapPin size={12} /> <span>{zone}</span>
            <span style={{ color: '#363741' }}>·</span>
            <Lightbulb size={12} /> <span>{lumCount} lum.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#7E7E86' }}>
            <Calendar size={12} /> <span>Modifié le {dateStr}</span>
          </div>
        </div>
      </div>

      {/* Bouton ouvrir */}
      <button
        onClick={onOpen}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          background: hovered ? '#5A84D5' : 'rgba(90,132,213,0.08)',
          color: hovered ? '#FFF' : '#5A84D5',
          border: 'none', padding: '0.625rem',
          fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        Ouvrir le projet <ArrowRight size={14} />
      </button>

      {/* Menu contextuel */}
      {showMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setShowMenu(false)} />
          <div style={{
            position: 'absolute', top: '2.5rem', right: '0.75rem', zIndex: 10,
            background: '#2B2C35', border: '1px solid #363741', borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden', minWidth: '180px',
          }}>
            {[
              { label: 'Dupliquer', icon: <Copy size={14} />, action: () => { onDuplicate(); setShowMenu(false); } },
              { label: 'Exporter JSON', icon: <FileJson size={14} />, action: () => { onExportJSON(); setShowMenu(false); } },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={menuItemStyle}>
                {item.icon} {item.label}
              </button>
            ))}
            <div style={{ height: '1px', background: '#363741', margin: '4px 0' }} />
            <button
              onClick={() => { if (window.confirm('Supprimer ce projet ?')) onDelete(); setShowMenu(false); }}
              style={{ ...menuItemStyle, color: '#ef4444' }}
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
  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
  background: 'transparent', border: 'none', padding: '0.625rem 1rem',
  color: '#A0A0A5', fontSize: '0.8125rem', cursor: 'pointer', textAlign: 'left',
};

/* ── Carte Modèle ── */
function TemplateCard({ template, onClick }) {
  const [hovered, setHovered] = useState(false);

  const getDynamicIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('classe') || n.includes('école')) return <BookOpen size={20} color="#FFB84D" />;
    if (n.includes('bureau') || n.includes('open space')) return <Building size={20} color="#FFB84D" />;
    if (n.includes('commerce') || n.includes('magasin')) return <Store size={20} color="#FFB84D" />;
    if (n.includes('logement') || n.includes('résidentiel')) return <Home size={20} color="#FFB84D" />;
    if (n.includes('réunion')) return <Users size={20} color="#FFB84D" />;
    if (n.includes('hôpital') || n.includes('santé')) return <Activity size={20} color="#FFB84D" />;
    return <Zap size={20} color="#FFB84D" />;
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#2B2C35' : '#26272D',
        border: `1px solid ${hovered ? '#FFB84D50' : '#363741'}`,
        borderRadius: '12px', padding: '1.25rem', cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '10px',
        background: 'rgba(255,184,77,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', marginBottom: '0.875rem',
        transition: 'transform 0.2s',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
      }}>
        {template.icon || getDynamicIcon(template.name || '')}
      </div>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFF', marginBottom: '0.25rem' }}>
        {template.name}
      </h3>
      <p style={{ fontSize: '0.75rem', color: '#7E7E86', lineHeight: 1.4 }}>
        {template.description || 'Modèle prédéfini ILLUMINEX-BJ'}
      </p>
    </div>
  );
}

/* ── Indicateur de sauvegarde ── */
function AutoSaveIndicator({ status }) {
  const configs = {
    saving: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#F59E0B', icon: <Clock size={12} />, label: 'Sauvegarde...' },
    unsaved: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', icon: <AlertCircle size={12} />, label: 'Non sauvegardé' },
    saved: { bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.3)', color: '#4ade80', icon: <CheckCircle2 size={12} />, label: 'Sauvegardé' },
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
