/**
 * Database Service (Pure JavaScript)
 * Handles all offline persistence for the ILLUMINEX desktop app via IndexedDB
 * Requires no React or UI logic.
 */
export class StorageService {
  constructor() {
    this.dbName = 'illuminex_db';
    this.version = 1;
    this.db = null;
    this.autoSaveTimer = null;
    
    // Check IndexedDB availability
    this.useLocalStorage = typeof window === 'undefined' || !window.indexedDB;
  }

  async init() {
    if (this.useLocalStorage) {
      console.warn("IndexedDB non supporté, basculement sur localStorage");
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        
        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        // Templates store
        if (!db.objectStoreNames.contains('templates')) {
          const tStore = db.createObjectStore('templates', { keyPath: 'id', autoIncrement: true });
          tStore.createIndex('name', 'name', { unique: true });
        }
      };
      
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // ==========================================
  // CRUD OPERATIONS: PROJECTS
  // ==========================================

  async saveProject(projectData) {
    const project = {
      ...projectData,
      updatedAt: Date.now(),
      createdAt: projectData.createdAt || Date.now(),
      version: "1.0"
    };
    
    if (this.useLocalStorage) {
      const projects = JSON.parse(localStorage.getItem('illuminex_projects') || '[]');
      if (project.id) {
        const idx = projects.findIndex(p => p.id === project.id);
        if (idx !== -1) projects[idx] = project;
        else projects.push(project);
      } else {
        project.id = Date.now().toString(); // fake id
        projects.push(project);
      }
      localStorage.setItem('illuminex_projects', JSON.stringify(projects));
      return project.id;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      
      const request = project.id 
        ? store.put(project)      // update
        : store.add(project);     // create
        
      request.onsuccess = () => resolve(request.result); // returns the ID
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjects() {
    if (this.useLocalStorage) {
      let projects = JSON.parse(localStorage.getItem('illuminex_projects') || '[]');
      return projects.sort((a,b) => b.updatedAt - a.updatedAt);
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      const index = store.index('updatedAt');
      // To sort manually later, or use cursor traversing backwards
      const request = index.getAll();
      
      request.onsuccess = () => {
        const projects = request.result.reverse();
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getProject(id) {
    if (this.useLocalStorage) {
      const projects = JSON.parse(localStorage.getItem('illuminex_projects') || '[]');
      return projects.find(p => p.id === id);
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id) {
    if (this.useLocalStorage) {
      let projects = JSON.parse(localStorage.getItem('illuminex_projects') || '[]');
      projects = projects.filter(p => p.id !== id);
      localStorage.setItem('illuminex_projects', JSON.stringify(projects));
      return true;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async duplicateProject(id) {
    const original = await this.getProject(id);
    if (!original) throw new Error("Projet introuvable");

    const copy = {
      ...original,
      id: undefined,  // remove id for auto-increment
      name: original.name + ' (copie)',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return this.saveProject(copy);
  }

  autoSave(projectData, delay = 3000) {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.saveProject(projectData).then(() => {
        console.log('✅ Sauvegarde automatique effectuée');
      }).catch(err => console.error("Erreur AutoSave:", err));
    }, delay);
  }

  // ==========================================
  // SETTINGS OPERATIONS
  // ==========================================

  async getSetting(key) {
    if (this.useLocalStorage) {
      const settings = JSON.parse(localStorage.getItem('illuminex_settings') || '{}');
      return settings[key];
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  async setSetting(key, value) {
    if (this.useLocalStorage) {
      const settings = JSON.parse(localStorage.getItem('illuminex_settings') || '{}');
      settings[key] = value;
      localStorage.setItem('illuminex_settings', JSON.stringify(settings));
      return true;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.put({ key, value });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async initDefaultSettings() {
    const defaults = {
      theme: 'light',
      language: 'fr',
      defaultZone: 'Sud (Cotonou, Porto-Novo)',
      autoSave: true,
      autoSaveDelay: 3000,
      lastProjectId: null
    };
    for (const [key, value] of Object.entries(defaults)) {
      const existing = await this.getSetting(key);
      if (existing === undefined || existing === null) {
        await this.setSetting(key, value);
      }
    }
  }

  // ==========================================
  // TEMPLATES OPERATIONS
  // ==========================================

  async getAllTemplates() {
    if (this.useLocalStorage) {
      return JSON.parse(localStorage.getItem('illuminex_templates') || '[]');
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction('templates', 'readonly');
      const store = tx.objectStore('templates');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addTemplate(template) {
    if (this.useLocalStorage) {
      const templates = JSON.parse(localStorage.getItem('illuminex_templates') || '[]');
      if (!templates.find(t => t.name === template.name)) {
        template.id = Date.now().toString() + Math.random();
        templates.push(template);
        localStorage.setItem('illuminex_templates', JSON.stringify(templates));
      }
      return true;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('templates', 'readwrite');
      const store = tx.objectStore('templates');
      
      // Handle 'name' unique constraint errors gracefully
      const request = store.add(template);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false); // don't crash if duplicate
    });
  }

  async initDefaultTemplates() {
    const templates = [
      {
        name: "Salle de classe standard",
        description: "30 élèves, orientation Sud",
        formData: {
          room: { length: 8, width: 6, ceilingHeight: 3.2, workPlaneHeight: 0.75 },
          occupation: { buildingType: "École/Salle de classe", occupationType: "Continue", occupants: 30, hoursPerDay: 8, daysPerWeek: 5 },
          luminaire: { type: "Dalle LED", fluxPerUnit: 4000, powerPerUnit: 36 },
          naturalLight: { hasWindows: true, orientation: "Sud", windowArea: 8 },
          location: { zone: "Sud (Cotonou, Porto-Novo)" }
        }
      },
      {
        name: "Bureau open space",
        description: "20 personnes, grande surface",
        formData: {
          room: { length: 10, width: 8, ceilingHeight: 3.0, workPlaneHeight: 0.85 },
          occupation: { buildingType: "Bureau/Administration", occupationType: "Continue", occupants: 20, hoursPerDay: 9, daysPerWeek: 5 },
          luminaire: { type: "Dalle LED", fluxPerUnit: 4000, powerPerUnit: 36 },
          naturalLight: { hasWindows: true, orientation: "Est", windowArea: 12 },
          location: { zone: "Sud (Cotonou, Porto-Novo)" }
        }
      },
      {
        name: "Logement résidentiel",
        description: "Famille, usage soir",
        formData: {
          room: { length: 4, width: 4, ceilingHeight: 2.8, workPlaneHeight: 0.80 },
          occupation: { buildingType: "Logement résidentiel", occupationType: "Mixte (jour + nuit)", occupants: 4, hoursPerDay: 6, daysPerWeek: 7 },
          luminaire: { type: "Ampoule LED", fluxPerUnit: 800, powerPerUnit: 9 },
          naturalLight: { hasWindows: true, orientation: "Sud", windowArea: 3 },
          location: { zone: "Centre (Bohicon, Abomey)" }
        }
      },
      {
        name: "Salle de réunion",
        description: "12 personnes, usage intermittent",
        formData: {
          room: { length: 6, width: 5, ceilingHeight: 2.8, workPlaneHeight: 0.75 },
          occupation: { buildingType: "Bureau/Administration", occupationType: "Intermittente", occupants: 12, hoursPerDay: 4, daysPerWeek: 5 },
          luminaire: { type: "Dalle LED", fluxPerUnit: 4000, powerPerUnit: 36 },
          naturalLight: { hasWindows: true, orientation: "Ouest", windowArea: 5 },
          location: { zone: "Nord (Parakou, Natitingou)" }
        }
      }
    ];
    
    for (const template of templates) {
      await this.addTemplate(template);
    }
  }

  // ==========================================
  // EXPORT / IMPORT API
  // ==========================================

  exportToJSON(project) {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ILLUMINEX_${(project.name || 'Projet').replace(/\s+/g, '_')}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const project = JSON.parse(e.target.result);
          project.id = undefined;  // Remove ID to get a fresh auto-increment
          project.name = (project.name || 'Projet') + ' (importé)';
          project.createdAt = Date.now();
          project.updatedAt = Date.now();
          
          const id = await this.saveProject(project);
          resolve(id);
        } catch(err) {
          reject(new Error('Fichier JSON invalide'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture'));
      reader.readAsText(file);
    });
  }

  // ==========================================
  // HARDWARE STORAGE METRICS
  // ==========================================

  async getStorageInfo() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        return {
          used: (usage / 1024 / 1024).toFixed(2) + ' MB',
          total: (quota / 1024 / 1024).toFixed(2) + ' MB',
          percent: ((usage / quota) * 100).toFixed(1) + '%'
        };
      } catch (err) {
        console.warn("navigator.storage err", err);
      }
    }
    return { used: 'N/A', total: 'N/A', percent: 'N/A' };
  }
}

export const storageService = new StorageService();
