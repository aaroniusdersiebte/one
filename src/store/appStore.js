// src/store/appStore.js
import { create } from 'zustand';
import { nanoid } from 'nanoid';

// Safe wrapper for electron methods to handle cases when electron is not available
const safeElectron = {
  getData: async (key) => {
    if (window.electron?.getData) {
      return window.electron.getData(key);
    }
    console.warn('Electron getData not available, using localStorage fallback');
    try {
      const data = localStorage.getItem(`miniplaner_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return null;
    }
  },
  
  saveData: async (key, data) => {
    if (window.electron?.saveData) {
      return window.electron.saveData(key, data);
    }
    console.warn('Electron saveData not available, using localStorage fallback');
    try {
      localStorage.setItem(`miniplaner_${key}`, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  },
  
  hapticFeedback: () => {
    if (window.electron?.hapticFeedback) {
      return window.electron.hapticFeedback();
    }
    // Silently fail for haptic feedback
  },
  
  getOBSSettings: async () => {
    if (window.electron?.getOBSSettings) {
      return window.electron.getOBSSettings();
    }
    return { enabled: false };
  },
  
  updateWebServerTasks: async (tasks) => {
    if (window.electron?.updateWebServerTasks) {
      return window.electron.updateWebServerTasks(tasks);
    }
    return { success: false };
  },
  
  handleTaskCompleted: async (taskId, groupId) => {
    if (window.electron?.handleTaskCompleted) {
      return window.electron.handleTaskCompleted(taskId, groupId);
    }
    return { success: false };
  },
  
  handleSubtaskCompleted: async (taskId, subtaskId, groupId) => {
    if (window.electron?.handleSubtaskCompleted) {
      return window.electron.handleSubtaskCompleted(taskId, subtaskId, groupId);
    }
    return { success: false };
  }
};

export const useAppStore = create((set, get) => ({
  // App-Daten
  groups: [],
  tasks: [],
  tags: [],
  notes: [],
  archivedTasks: [],
  
  // UI-Status
  view: 'all', // 'all', 'group-[id]', 'notes'
  selectedTaskId: null,
  searchQuery: '',
  focusModeActive: false,
  focusModeMinimized: false, // Neuer State für minimierten Fokus-Modus
  focusTask: null,
  focusTimer: {
    duration: 20 * 60, // 20 Minuten in Sekunden
    timeLeft: 20 * 60,
    isRunning: false
  },
  
  // Tab Navigation
  activeTab: 'planner', // 'planner' oder 'music'
  
  // Music Feature Data
  music: {
    moods: [],       // Array of mood objects
    songs: [],       // Array of song objects
    currentSong: null, // Currently playing song
    isPlaying: false,  // Playback state
    volume: 0.7,       // Volume level (0.0 to 1.0)
    shuffle: false,    // Shuffle mode
    repeat: 'none',    // 'none', 'all', or 'one'
    queue: [],         // Playback queue
    currentMood: null, // Currently selected mood ID
    progress: 0,       // Current playback progress (0.0 to 1.0)
    duration: 0,       // Current song duration in seconds
  },

  // Daten initialisieren
  initializeData: async () => {
    try {
      const groups = await safeElectron.getData('groups') || [];
      const tasks = await safeElectron.getData('tasks') || [];
      const tags = await safeElectron.getData('tags') || [];
      const notes = await safeElectron.getData('notes') || [];
      const archivedTasks = await safeElectron.getData('archivedTasks') || [];

      // Migriere alte Tasks zu neuem Format mit Beschreibungseinträgen
      const migratedTasks = tasks.map(task => {
        // Wenn die Aufgabe bereits das neue Format hat, keine Änderung
        if (task.descriptionEntries) return task;
        
        // Alte Beschreibung in einen Eintrag umwandeln, falls vorhanden
        const descriptionEntries = task.description
          ? [
              {
                id: nanoid(),
                text: task.description,
                createdAt: task.createdAt,
                editedAt: null
              }
            ]
          : [];
        
        // Neues Format zurückgeben
        return {
          ...task,
          descriptionEntries,
          // Alte Beschreibung wird zur Kompatibilität beibehalten
          description: task.description || ''
        };
      });

      set({ groups, tasks: migratedTasks, tags, notes, archivedTasks });
      
      // Aktualisiere den Webserver mit den Aufgaben der konfigurierten Gruppe
      const obsSettings = await safeElectron.getOBSSettings();
      if (obsSettings && obsSettings.enabled && obsSettings.streamGroup) {
        const groupTasks = migratedTasks.filter(task => task.groupId === obsSettings.streamGroup);
        safeElectron.updateWebServerTasks(groupTasks);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      // Fallback auf leere Arrays, um App-Abstürze zu vermeiden
      set({ groups: [], tasks: [], tags: [], notes: [], archivedTasks: [] });
    }
  },
  
  // Initialize music data
  initializeMusicData: async () => {
    try {
      const moods = await safeElectron.getData('music_moods') || [];
      const songs = await safeElectron.getData('music_songs') || [];
      
      set(state => ({
        music: {
          ...state.music,
          moods,
          songs
        }
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Musikdaten:', error);
      set(state => ({
        music: {
          ...state.music,
          moods: [],
          songs: []
        }
      }));
    }
  },

  // Daten speichern
  saveData: async () => {
    const { groups, tasks, tags, notes, archivedTasks } = get();
    
    try {
      await safeElectron.saveData('groups', groups);
      await safeElectron.saveData('tasks', tasks);
      await safeElectron.saveData('tags', tags);
      await safeElectron.saveData('notes', notes);
      await safeElectron.saveData('archivedTasks', archivedTasks);
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error);
    }
  },

  // Tab Navigation
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  // Gruppen-Funktionen
  addGroup: (name) => {
    const newGroup = {
      id: nanoid(),
      name,
      createdAt: new Date().toISOString()
    };

    set((state) => {
      const newGroups = [...state.groups, newGroup];
      safeElectron.saveData('groups', newGroups);
      return { groups: newGroups };
    });
  },

  updateGroup: (id, updates) => {
    set((state) => {
      const updatedGroups = state.groups.map((group) => 
        group.id === id ? { ...group, ...updates } : group
      );
      safeElectron.saveData('groups', updatedGroups);
      return { groups: updatedGroups };
    });
  },

  deleteGroup: (id) => {
    set((state) => {
      // Lösche Gruppe
      const newGroups = state.groups.filter((group) => group.id !== id);
      
      // Entferne Gruppenzuordnung von Tasks
      const newTasks = state.tasks.map((task) => 
        task.groupId === id ? { ...task, groupId: null } : task
      );
      
      safeElectron.saveData('groups', newGroups);
      safeElectron.saveData('tasks', newTasks);
      
      return { 
        groups: newGroups,
        tasks: newTasks,
        view: 'all' // Zurück zur Gesamtansicht
      };
    });
  },

  moveGroup: (sourceIndex, destIndex) => {
    set((state) => {
      const newGroups = [...state.groups];
      const [removed] = newGroups.splice(sourceIndex, 1);
      newGroups.splice(destIndex, 0, removed);
      
      safeElectron.saveData('groups', newGroups);
      return { groups: newGroups };
    });
  },

  // Aufgaben-Funktionen
  addTask: (groupId, title) => {
    const newTask = {
      id: nanoid(),
      title,
      description: '', // Bleibt für Kompatibilität
      descriptionEntries: [], // Neues Array für Beschreibungseinträge
      groupId,
      completed: false,
      subtasks: [],
      tags: [],
      createdAt: new Date().toISOString(),
      order: get().tasks.filter(t => t.groupId === groupId && !t.completed).length
    };

    set((state) => {
      const newTasks = [...state.tasks, newTask];
      safeElectron.saveData('tasks', newTasks);
      
      // OBS-Integration: Aktualisiere den Webserver, wenn die Gruppe für OBS ausgewählt ist
      safeElectron.getOBSSettings().then(obsSettings => {
        if (obsSettings.enabled && obsSettings.streamGroup === groupId) {
          const groupTasks = newTasks.filter(task => task.groupId === groupId);
          safeElectron.updateWebServerTasks(groupTasks);
        }
      });
      
      return { tasks: newTasks };
    });
  },

  // Neuer Eintrag für Beschreibungen
  addDescriptionEntry: (taskId, text) => {
    const newEntry = {
      id: nanoid(),
      text,
      createdAt: new Date().toISOString(),
      editedAt: null
    };

    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          // Sorge dafür, dass descriptionEntries auf jeden Fall ein Array ist
          const descriptionEntries = task.descriptionEntries || [];
          // Füge den neuen Eintrag am Anfang hinzu (neueste zuerst)
          return { 
            ...task, 
            descriptionEntries: [newEntry, ...descriptionEntries]
          };
        }
        return task;
      });
      
      safeElectron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  updateTask: (id, updates) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => 
        task.id === id ? { ...task, ...updates } : task
      );
      
      // Wenn der Completed-Status geändert wurde, sortieren wir die Tasks neu
      const reorderedTasks = updatedTasks.map((task, _, arr) => {
        if (task.id === id && 'completed' in updates) {
          // Neu sortieren innerhalb der Gruppe
          return reorderTaskAfterCompletion(task, arr);
        }
        return task;
      });
      
      safeElectron.saveData('tasks', reorderedTasks);
      
      // OBS-Integration: Aktualisiere den Webserver, wenn die Gruppe für OBS ausgewählt ist
      const updatedTask = reorderedTasks.find(task => task.id === id);
      if (updatedTask) {
        safeElectron.getOBSSettings().then(obsSettings => {
          if (obsSettings.enabled && obsSettings.streamGroup === updatedTask.groupId) {
            const groupTasks = reorderedTasks.filter(task => task.groupId === updatedTask.groupId);
            safeElectron.updateWebServerTasks(groupTasks);
          }
        });
      }
      
      return { tasks: reorderedTasks };
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const taskToDelete = state.tasks.find(task => task.id === id);
      const groupId = taskToDelete?.groupId;
      
      const newTasks = state.tasks.filter((task) => task.id !== id);
      safeElectron.saveData('tasks', newTasks);
      
      // OBS-Integration: Aktualisiere den Webserver, wenn die Gruppe für OBS ausgewählt ist
      if (groupId) {
        safeElectron.getOBSSettings().then(obsSettings => {
          if (obsSettings.enabled && obsSettings.streamGroup === groupId) {
            const groupTasks = newTasks.filter(task => task.groupId === groupId);
            safeElectron.updateWebServerTasks(groupTasks);
          }
        });
      }
      
      return { tasks: newTasks };
    });
  },

  completeTask: (taskId) => {
    set((state) => {
      // Finde die Aufgabe anhand der ID
      const taskToUpdate = state.tasks.find(t => t.id === taskId);
      
      if (!taskToUpdate) {
        console.error(`Aufgabe mit ID ${taskId} nicht gefunden`);
        return state; // Keine Änderung, wenn Aufgabe nicht gefunden
      }
      
      // Neue Kopie der Aufgaben erstellen mit aktualisiertem Status
      const updatedTasks = state.tasks.map((task) => 
        task.id === taskId 
          ? { ...task, completed: true, completedAt: new Date().toISOString() } 
          : task
      );
      
      // Speichern
      safeElectron.saveData('tasks', updatedTasks);
      
      // OBS benachrichtigen, wenn die entsprechende Gruppe ausgewählt ist
      safeElectron.getOBSSettings().then(obsSettings => {
        if (obsSettings.enabled && obsSettings.streamGroup === taskToUpdate.groupId) {
          // Gruppennamen finden
          const group = state.groups.find(g => g.id === taskToUpdate.groupId);
          const groupName = group ? group.name : 'Aufgabenliste';
          
          // Aufgaben der Gruppe mit Gruppennamen anreichern
          const groupTasks = updatedTasks
            .filter(t => t.groupId === taskToUpdate.groupId)
            .map(t => ({
              ...t,
              groupName // Gruppennamen zu jeder Aufgabe hinzufügen
            }));
          
          // An den Webserver senden
          safeElectron.updateWebServerTasks(groupTasks);
          
          // OBS-Service benachrichtigen
          safeElectron.handleTaskCompleted(taskToUpdate.id, taskToUpdate.groupId);
        }
      });
      
      return { tasks: updatedTasks };
    });
  },
  uncompleteTask: (id) => {
    // Neue Funktion zum Zurücksetzen des Completed-Status
    set((state) => {
      // Task als nicht erledigt markieren
      let updatedTasks = state.tasks.map((task) => 
        task.id === id ? { ...task, completed: false, completedAt: null } : task
      );
      
      // Finde den Task, der gerade aktualisiert wurde
      const updatedTask = updatedTasks.find(task => task.id === id);
      
      if (updatedTask) {
        // Entferne den aktualisierten Task aus der Liste
        updatedTasks = updatedTasks.filter(task => task.id !== id);
        
        // Füge den Task wieder bei den aktiven Tasks ein (oben)
        updatedTasks = sortTasksWithCompletedAtBottom(updatedTasks, updatedTask);
        
        // OBS-Integration: Aktualisiere den Webserver
        safeElectron.getOBSSettings().then(obsSettings => {
          if (obsSettings.enabled && obsSettings.streamGroup === updatedTask.groupId) {
            const groupTasks = updatedTasks.filter(task => task.groupId === updatedTask.groupId);
            safeElectron.updateWebServerTasks(groupTasks);
          }
        });
      }
      
      safeElectron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  archiveCompletedTasks: () => {
    set((state) => {
      const completedTasks = state.tasks.filter(task => task.completed);
      const remainingTasks = state.tasks.filter(task => !task.completed);
      const newArchivedTasks = [...state.archivedTasks, ...completedTasks];

      safeElectron.saveData('tasks', remainingTasks);
      safeElectron.saveData('archivedTasks', newArchivedTasks);
      
      // OBS-Integration: Aktualisiere den Webserver für alle Gruppen mit archivierten Aufgaben
      const affectedGroupIds = [...new Set(completedTasks.map(task => task.groupId))];
      if (affectedGroupIds.length > 0) {
        safeElectron.getOBSSettings().then(obsSettings => {
          if (obsSettings.enabled && affectedGroupIds.includes(obsSettings.streamGroup)) {
            const groupTasks = remainingTasks.filter(task => task.groupId === obsSettings.streamGroup);
            safeElectron.updateWebServerTasks(groupTasks);
          }
        });
      }

      return {
        tasks: remainingTasks,
        archivedTasks: newArchivedTasks
      };
    });
  },

  // Subtask-Funktionen
  addSubtask: (taskId, title) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const newSubtask = {
            id: nanoid(),
            title,
            completed: false
          };
          return { ...task, subtasks: [...task.subtasks, newSubtask] };
        }
        return task;
      });
      
      safeElectron.saveData('tasks', updatedTasks);
      
      // OBS-Integration: Aktualisiere den Webserver wenn nötig
      const updatedTask = updatedTasks.find(task => task.id === taskId);
      if (updatedTask) {
        safeElectron.getOBSSettings().then(obsSettings => {
          if (obsSettings.enabled && obsSettings.streamGroup === updatedTask.groupId) {
            const groupTasks = updatedTasks.filter(task => task.groupId === updatedTask.groupId);
            safeElectron.updateWebServerTasks(groupTasks);
          }
        });
      }
      
      return { tasks: updatedTasks };
    });
  },

  updateSubtask: (taskId, subtaskId, updates) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
          );
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      });
      
      safeElectron.saveData('tasks', updatedTasks);
      
      // OBS-Integration: Aktualisiere den Webserver und benachrichtige über erledigte Unteraufgaben
      const updatedTask = updatedTasks.find(task => task.id === taskId);
      if (updatedTask) {
        const updatedSubtask = updatedTask.subtasks.find(subtask => subtask.id === subtaskId);
        
        safeElectron.getOBSSettings().then(obsSettings => {
          if (obsSettings.enabled && obsSettings.streamGroup === updatedTask.groupId) {
            // Webserver aktualisieren
            const groupTasks = updatedTasks.filter(task => task.groupId === updatedTask.groupId);
            safeElectron.updateWebServerTasks(groupTasks);
            
            // Wenn Unteraufgabe als erledigt markiert wurde, benachrichtige OBS
            if (updatedSubtask && updates.completed === true) {
              safeElectron.handleSubtaskCompleted(updatedTask.id, subtaskId, updatedTask.groupId);
            }
          }
        });
      }
      
      return { tasks: updatedTasks };
    });
  },

  deleteSubtask: (taskId, subtaskId) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.filter(
            (subtask) => subtask.id !== subtaskId
          );
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      });
      
      safeElectron.saveData('tasks', updatedTasks);
      
      // OBS-Integration: Aktualisiere den Webserver wenn nötig
      const updatedTask = updatedTasks.find(task => task.id === taskId);
      if (updatedTask) {
        safeElectron.getOBSSettings().then(obsSettings => {
          if (obsSettings.enabled && obsSettings.streamGroup === updatedTask.groupId) {
            const groupTasks = updatedTasks.filter(task => task.groupId === updatedTask.groupId);
            safeElectron.updateWebServerTasks(groupTasks);
          }
        });
      }
      
      return { tasks: updatedTasks };
    });
  },

  // Unteraufgaben per Drag & Drop sortieren
  moveSubtask: (taskId, subtaskId, sourceIndex, destIndex) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const subtasks = [...task.subtasks];
          const [removed] = subtasks.splice(sourceIndex, 1);
          subtasks.splice(destIndex, 0, removed);
          return { ...task, subtasks };
        }
        return task;
      });
      
      safeElectron.saveData('tasks', updatedTasks);
      
      // OBS-Integration: Aktualisiere den Webserver wenn nötig
      const updatedTask = updatedTasks.find(task => task.id === taskId);
      if (updatedTask) {
        safeElectron.getOBSSettings().then(obsSettings => {
          if (obsSettings.enabled && obsSettings.streamGroup === updatedTask.groupId) {
            const groupTasks = updatedTasks.filter(task => task.groupId === updatedTask.groupId);
            safeElectron.updateWebServerTasks(groupTasks);
          }
        });
      }
      
      return { tasks: updatedTasks };
    });
  },

  // Drag & Drop für Tasks - Verbesserte Version
  moveTask: (taskId, sourceGroupId, destGroupId, sourceIndex, destIndex) => {
    set((state) => {
      // Alle Tasks nach Status (completed oder nicht) und Gruppen trennen
      const tasksInSourceGroup = state.tasks.filter(t => 
        (t.groupId === sourceGroupId || 
         (sourceGroupId === 'ungrouped' && !t.groupId))
      );
      
      const activeTasks = tasksInSourceGroup.filter(t => !t.completed);
      const completedTasks = tasksInSourceGroup.filter(t => t.completed);
      
      const tasksInDestGroup = state.tasks.filter(t => 
        (t.groupId === destGroupId || 
         (destGroupId === 'ungrouped' && !t.groupId))
      );
      
      const destActiveTasks = tasksInDestGroup.filter(t => !t.completed);
      const destCompletedTasks = tasksInDestGroup.filter(t => t.completed);
      
      // Task finden
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return state;

      // Task mit aktualisierter Gruppe
      const updatedTask = {
        ...task,
        groupId: destGroupId === 'ungrouped' ? null : destGroupId
      };
      
      // Bestimme, ob der Task in die aktiven oder erledigten Tasks eingeordnet werden soll
      const isTargetingCompletedSection = 
        (updatedTask.completed && destIndex >= destActiveTasks.length) || 
        (!updatedTask.completed && destIndex < destActiveTasks.length);
        
      // Entferne Task aus der Ursprungsliste
      const otherTasks = state.tasks.filter(t => t.id !== taskId);
      
      // Füge Task an neuer Position ein, unter Berücksichtigung des Completed-Status
      let finalTasks = [...otherTasks];
      
      // Zähle, wie viele aktive Tasks in der Zielgruppe vorhanden sind
      const activeTasksInDestGroup = finalTasks.filter(
        t => (t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId)) && !t.completed
      );
      
      // Bestimme tatsächliche Position basierend auf Status
      let insertIndex;
      if (updatedTask.completed) {
        // Für erledigte Tasks: nach den aktiven Tasks einfügen
        const activeTasksCount = activeTasksInDestGroup.length;
        insertIndex = finalTasks.findIndex(
          t => t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId) && t.completed
        );
        
        if (insertIndex === -1) {
          // Falls keine erledigten Tasks in der Gruppe, nach den aktiven einfügen
          insertIndex = finalTasks.findIndex(
            t => t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId)
          );
          if (insertIndex === -1) {
            finalTasks.push(updatedTask);
            insertIndex = finalTasks.length - 1;
          } else {
            // Nach allen aktiven Tasks einfügen
            while (insertIndex < finalTasks.length && 
                   finalTasks[insertIndex].groupId === (destGroupId === 'ungrouped' ? null : destGroupId) && 
                   !finalTasks[insertIndex].completed) {
              insertIndex++;
            }
            finalTasks.splice(insertIndex, 0, updatedTask);
          }
        } else {
          // Bei den erledigten Tasks an der berechneten Position einfügen
          finalTasks.splice(insertIndex + (destIndex - activeTasksCount), 0, updatedTask);
        }
      } else {
        // Für aktive Tasks
        if (destIndex === 0) {
          // Am Anfang der Gruppe einfügen
          insertIndex = finalTasks.findIndex(
            t => t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId)
          );
          if (insertIndex === -1) {
            finalTasks.push(updatedTask);
          } else {
            finalTasks.splice(insertIndex, 0, updatedTask);
          }
        } else {
          // An der korrekten Position einfügen
          let count = 0;
          insertIndex = -1;
          
          for (let i = 0; i < finalTasks.length; i++) {
            const t = finalTasks[i];
            if (t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId) && !t.completed) {
              count++;
              if (count === destIndex) {
                insertIndex = i + 1;
                break;
              }
            }
          }
          
          if (insertIndex === -1) {
            // Einfügen am Ende der aktiven Tasks
            insertIndex = finalTasks.findIndex(
              t => t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId) && t.completed
            );
            if (insertIndex === -1) {
              finalTasks.push(updatedTask);
            } else {
              finalTasks.splice(insertIndex, 0, updatedTask);
            }
          } else {
            finalTasks.splice(insertIndex, 0, updatedTask);
          }
        }
      }
      
      // Orders aktualisieren
      finalTasks = updateTaskOrders(finalTasks);
      
      safeElectron.saveData('tasks', finalTasks);
      
      // OBS-Integration: Aktualisiere den Webserver für beide betroffenen Gruppen
      safeElectron.getOBSSettings().then(obsSettings => {
        if (obsSettings.enabled) {
          // Wenn Quell- oder Zielgruppe die OBS-Gruppe ist, aktualisiere den Webserver
          if (obsSettings.streamGroup === sourceGroupId || obsSettings.streamGroup === destGroupId) {
            const groupTasks = finalTasks.filter(task => task.groupId === obsSettings.streamGroup);
            safeElectron.updateWebServerTasks(groupTasks);
          }
        }
      });
      
      return { tasks: finalTasks };
    });
  },

  // Tags-Funktionen
  addTag: (name, color) => {
    const newTag = {
      id: nanoid(),
      name,
      color
    };

    set((state) => {
      const newTags = [...state.tags, newTag];
      safeElectron.saveData('tags', newTags);
      return { tags: newTags };
    });
  },

  updateTag: (id, updates) => {
    set((state) => {
      const updatedTags = state.tags.map((tag) => 
        tag.id === id ? { ...tag, ...updates } : tag
      );
      safeElectron.saveData('tags', updatedTags);
      return { tags: updatedTags };
    });
  },

  deleteTag: (id) => {
    set((state) => {
      // Tag entfernen
      const newTags = state.tags.filter((tag) => tag.id !== id);
      
      // Tag aus allen Tasks entfernen
      const updatedTasks = state.tasks.map((task) => ({
        ...task,
        tags: task.tags.filter((tagId) => tagId !== id)
      }));
      
      safeElectron.saveData('tags', newTags);
      safeElectron.saveData('tasks', updatedTasks);
      
      // OBS-Integration: Aktualisiere den Webserver für alle betroffenen Gruppen
      safeElectron.getOBSSettings().then(obsSettings => {
        if (obsSettings.enabled) {
          const groupTasks = updatedTasks.filter(task => task.groupId === obsSettings.streamGroup);
          safeElectron.updateWebServerTasks(groupTasks);
        }
      });
      
      return { 
        tags: newTags,
        tasks: updatedTasks
      };
    });
  },

  // Notizen-Funktionen
  addNote: (title, content) => {
    const newNote = {
      id: nanoid(),
      title: title || 'Neue Notiz',
      content: content || '',
      createdAt: new Date().toISOString()
    };

    set((state) => {
      const newNotes = [...state.notes, newNote];
      safeElectron.saveData('notes', newNotes);
      return { notes: newNotes };
    });
    
    return newNote.id; // Return ID for further processing
  },

  updateNote: (id, title, content) => {
    set((state) => {
      const updatedNotes = state.notes.map((note) => 
        note.id === id ? { 
          ...note, 
          title: title || note.title, 
          content: content !== undefined ? content : note.content
        } : note
      );
      safeElectron.saveData('notes', updatedNotes);
      return { notes: updatedNotes };
    });
  },

  deleteNote: (id) => {
    set((state) => {
      const newNotes = state.notes.filter((note) => note.id !== id);
      safeElectron.saveData('notes', newNotes);
      return { notes: newNotes };
    });
  },

  convertNoteToTask: (noteId, groupId) => {
    set((state) => {
      // Note finden
      const note = state.notes.find(n => n.id === noteId);
      if (!note) return state;

      // Beschreibungseintrag erstellen
      const descriptionEntry = {
        id: nanoid(),
        text: note.content || '',
        createdAt: new Date().toISOString(),
        editedAt: null
      };

      // Neue Task erstellen
      const newTask = {
        id: nanoid(),
        title: note.title || 'Neue Aufgabe',
        description: note.content || '', // Für Kompatibilität
        descriptionEntries: note.content ? [descriptionEntry] : [], // Neues Format
        groupId,
        completed: false,
        subtasks: [],
        tags: [],
        createdAt: new Date().toISOString(),
        order: get().tasks.filter(t => t.groupId === groupId && !t.completed).length
      };

      // Note entfernen und Task hinzufügen
      const newNotes = state.notes.filter(n => n.id !== noteId);
      const newTasks = [...state.tasks, newTask];

      safeElectron.saveData('notes', newNotes);
      safeElectron.saveData('tasks', newTasks);
      
      // OBS-Integration: Aktualisiere den Webserver, wenn die Zielgruppe für OBS ausgewählt ist
      safeElectron.getOBSSettings().then(obsSettings => {
        if (obsSettings.enabled && obsSettings.streamGroup === groupId) {
          const groupTasks = newTasks.filter(task => task.groupId === groupId);
          safeElectron.updateWebServerTasks(groupTasks);
        }
      });

      return {
        notes: newNotes,
        tasks: newTasks
      };
    });
  },

  // Fokus-Modus Funktionen
  startFocusMode: (taskId) => {
    // Wenn kein taskId übergeben wurde, öffne den Fokus-Modus für Notizenerstellung
    if (!taskId) {
      set({
        focusModeActive: true,
        focusModeMinimized: false,
        focusTask: null,
        focusTimer: {
          duration: 20 * 60, // 20 Minuten in Sekunden
          timeLeft: 20 * 60,
          isRunning: false
        }
      });
      return;
    }
    
    // Wenn es eine Notiz ist (Format: "note-[id]")
    if (taskId.startsWith('note-')) {
      const noteId = taskId.replace('note-', '');
      const note = get().notes.find(n => n.id === noteId);
      
      if (note) {
        set({
          focusModeActive: true,
          focusModeMinimized: false,
          focusTask: { id: taskId },
          focusTimer: {
            duration: 20 * 60, // 20 Minuten in Sekunden
            timeLeft: 20 * 60,
            isRunning: true
          }
        });
        return;
      }
    }

    // Normale Aufgabe
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    set({
      focusModeActive: true,
      focusModeMinimized: false,
      focusTask: task,
      focusTimer: {
        duration: 20 * 60, // 20 Minuten in Sekunden
        timeLeft: 20 * 60,
        isRunning: true
      }
    });
  },

  stopFocusMode: () => {
    set({
      focusModeActive: false,
      focusModeMinimized: false,
      focusTask: null,
      focusTimer: {
        ...get().focusTimer,
        isRunning: false
      }
    });
  },

  // Neuer minimierter Modus
  minimizeFocusMode: () => {
    set({
      focusModeMinimized: true,
      focusTimer: {
        ...get().focusTimer,
        isRunning: false // Timer pausieren
      }
    });
  },

  // Fokus-Modus wiederherstellen
  restoreFocusMode: () => {
    set({
      focusModeMinimized: false,
      // Timer automatisch fortsetzen, wenn Fokus-Modus wiederhergestellt wird
      focusTimer: {
        ...get().focusTimer,
        isRunning: true
      }
    });
  },

  updateFocusTimer: (updates) => {
    set((state) => ({
      focusTimer: {
        ...state.focusTimer,
        ...updates
      }
    }));
  },

  extendFocusTimer: () => {
    set((state) => ({
      focusTimer: {
        ...state.focusTimer,
        timeLeft: state.focusTimer.timeLeft + 5 * 60, // +5 Minuten
        duration: state.focusTimer.duration + 5 * 60
      }
    }));
  },

  // Navigation
  setView: (view) => {
    set({ view });
  },

  // Suche
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // Mood Management
  addMood: (name, color = '#f97316') => {
    const newMood = {
      id: nanoid(),
      name,
      color,
      createdAt: new Date().toISOString()
    };

    set(state => {
      const newMoods = [...state.music.moods, newMood];
      safeElectron.saveData('music_moods', newMoods);
      return { 
        music: {
          ...state.music,
          moods: newMoods
        }
      };
    });
  },

  updateMood: (id, updates) => {
    set(state => {
      const updatedMoods = state.music.moods.map(mood => 
        mood.id === id ? { ...mood, ...updates } : mood
      );
      safeElectron.saveData('music_moods', updatedMoods);
      return { 
        music: {
          ...state.music,
          moods: updatedMoods
        }
      };
    });
  },

  deleteMood: (id) => {
    set(state => {
      // Remove mood
      const newMoods = state.music.moods.filter(mood => mood.id !== id);
      
      // Update songs that were in this mood (set to no mood)
      const updatedSongs = state.music.songs.map(song => 
        song.moodId === id ? { ...song, moodId: null } : song
      );
      
      safeElectron.saveData('music_moods', newMoods);
      safeElectron.saveData('music_songs', updatedSongs);
      
      return {
        music: {
          ...state.music,
          moods: newMoods,
          songs: updatedSongs,
          // Reset current mood if the deleted mood was selected
          currentMood: state.music.currentMood === id ? null : state.music.currentMood
        }
      };
    });
  },

  setCurrentMood: (moodId) => {
    set(state => ({
      music: {
        ...state.music,
        currentMood: moodId
      }
    }));
  },

  // Song Management
  addSong: (filePath, metadata, moodId = null) => {
    const newSong = {
      id: nanoid(),
      filePath,
      title: metadata.title || 'Unknown Title',
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Unknown Album',
      duration: metadata.duration || 0,
      moodId,
      addedAt: new Date().toISOString()
    };

    set(state => {
      const newSongs = [...state.music.songs, newSong];
      safeElectron.saveData('music_songs', newSongs);
      return {
        music: {
          ...state.music,
          songs: newSongs
        }
      };
    });
    
    return newSong.id;
  },

  updateSong: (id, updates) => {
    set(state => {
      const updatedSongs = state.music.songs.map(song => 
        song.id === id ? { ...song, ...updates } : song
      );
      safeElectron.saveData('music_songs', updatedSongs);
      return {
        music: {
          ...state.music,
          songs: updatedSongs
        }
      };
    });
  },

  deleteSong: (id) => {
    set(state => {
      const newSongs = state.music.songs.filter(song => song.id !== id);
      safeElectron.saveData('music_songs', newSongs);
      
      // Update the queue if the deleted song was in it
      const newQueue = state.music.queue.filter(songId => songId !== id);
      
      // If current song is deleted, play the next song
      let currentSong = state.music.currentSong;
      let isPlaying = state.music.isPlaying;
      
      if (currentSong === id) {
        currentSong = newQueue.length > 0 ? newQueue[0] : null;
        isPlaying = currentSong !== null && isPlaying;
      }
      
      return {
        music: {
          ...state.music,
          songs: newSongs,
          queue: newQueue,
          currentSong,
          isPlaying
        }
      };
    });
  },

  moveSongToMood: (songId, moodId) => {
    set(state => {
      const updatedSongs = state.music.songs.map(song => 
        song.id === songId ? { ...song, moodId } : song
      );
      safeElectron.saveData('music_songs', updatedSongs);
      return {
        music: {
          ...state.music,
          songs: updatedSongs
        }
      };
    });
  },

  // Playback Control
  playSong: (songId) => {
    set(state => {
      // If the song is already playing, just toggle play/pause
      if (state.music.currentSong === songId) {
        return {
          music: {
            ...state.music,
            isPlaying: !state.music.isPlaying
          }
        };
      }
      
      // Otherwise, set the new current song and start playing
      return {
        music: {
          ...state.music,
          currentSong: songId,
          isPlaying: true,
          progress: 0
        }
      };
    });
  },

  playMood: (moodId) => {
    set(state => {
      // Get all songs in this mood
      const moodSongs = state.music.songs.filter(song => song.moodId === moodId);
      
      if (moodSongs.length === 0) {
        return state; // No songs in this mood
      }
      
      // If shuffle is enabled, randomize the queue
      let queue;
      if (state.music.shuffle) {
        // Create a shuffled copy of the mood songs
        queue = [...moodSongs].sort(() => Math.random() - 0.5).map(song => song.id);
      } else {
        // Create an ordered queue
        queue = moodSongs.map(song => song.id);
      }
      
      // Set the first song as current and start playing
      return {
        music: {
          ...state.music,
          currentSong: queue[0],
          queue: queue,
          isPlaying: true,
          progress: 0,
          currentMood: moodId
        }
      };
    });
  },

  togglePlay: () => {
    set(state => ({
      music: {
        ...state.music,
        isPlaying: !state.music.isPlaying
      }
    }));
  },

  stopPlayback: () => {
    set(state => ({
      music: {
        ...state.music,
        isPlaying: false,
        progress: 0
      }
    }));
  },

  nextSong: () => {
    set(state => {
      const { currentSong, queue, repeat } = state.music;
      
      if (!currentSong || queue.length === 0) {
        return state; // No current song or empty queue
      }
      
      const currentIndex = queue.indexOf(currentSong);
      
      // If at the end of the queue
      if (currentIndex === queue.length - 1) {
        // Repeat all: go back to the first song
        if (repeat === 'all') {
          return {
            music: {
              ...state.music,
              currentSong: queue[0],
              progress: 0
            }
          };
        }
        // No repeat: stop playing
        else {
          return {
            music: {
              ...state.music,
              isPlaying: false
            }
          };
        }
      }
      
      // Otherwise, play the next song
      return {
        music: {
          ...state.music,
          currentSong: queue[currentIndex + 1],
          progress: 0
        }
      };
    });
  },

  previousSong: () => {
    set(state => {
      const { currentSong, queue } = state.music;
      
      if (!currentSong || queue.length === 0) {
        return state; // No current song or empty queue
      }
      
      const currentIndex = queue.indexOf(currentSong);
      
      // If at start or progress > 3 seconds, restart the current song
      if (currentIndex === 0 || state.music.progress > 3) {
        return {
          music: {
            ...state.music,
            progress: 0
          }
        };
      }
      
      // Otherwise, play the previous song
      return {
        music: {
          ...state.music,
          currentSong: queue[currentIndex - 1],
          progress: 0
        }
      };
    });
  },

  toggleShuffle: () => {
    set(state => {
      const newShuffle = !state.music.shuffle;
      
      // If shuffle was turned on, randomize the current queue
      let newQueue = [...state.music.queue];
      if (newShuffle && state.music.currentSong) {
        // Remove current song from queue
        const currentSong = state.music.currentSong;
        newQueue = newQueue.filter(id => id !== currentSong);
        
        // Shuffle remaining songs
        newQueue = newQueue.sort(() => Math.random() - 0.5);
        
        // Put current song back at the beginning
        newQueue.unshift(currentSong);
      }
      
      return {
        music: {
          ...state.music,
          shuffle: newShuffle,
          queue: newQueue
        }
      };
    });
  },

  toggleRepeat: () => {
    set(state => {
      // Cycle through: none -> all -> one -> none
      const repeatStates = ['none', 'all', 'one'];
      const currentIndex = repeatStates.indexOf(state.music.repeat);
      const nextIndex = (currentIndex + 1) % repeatStates.length;
      
      return {
        music: {
          ...state.music,
          repeat: repeatStates[nextIndex]
        }
      };
    });
  },

  setVolume: (volume) => {
    // Ensure volume is between 0 and 1
    const newVolume = Math.max(0, Math.min(1, volume));
    set(state => ({
      music: {
        ...state.music,
        volume: newVolume
      }
    }));
  },

  updateProgress: (progress) => {
    set(state => ({
      music: {
        ...state.music,
        progress
      }
    }));
  },

  seekTo: (progress) => {
    set(state => ({
      music: {
        ...state.music,
        progress
      }
    }));
  },

  setDuration: (duration) => {
    set(state => ({
      music: {
        ...state.music,
        duration
      }
    }));
  },

  // Queue Management
  addToQueue: (songId) => {
    set(state => ({
      music: {
        ...state.music,
        queue: [...state.music.queue, songId]
      }
    }));
  },

  removeFromQueue: (songId) => {
    set(state => {
      // If it's the current song, play the next one
      let newCurrentSong = state.music.currentSong;
      let newIsPlaying = state.music.isPlaying;
      let newProgress = state.music.progress;
      
      if (newCurrentSong === songId) {
        const currentIndex = state.music.queue.indexOf(songId);
        if (currentIndex < state.music.queue.length - 1) {
          // Play next song
          newCurrentSong = state.music.queue[currentIndex + 1];
          newProgress = 0;
        } else {
          // No more songs in queue
          newCurrentSong = null;
          newIsPlaying = false;
        }
      }
      
      return {
        music: {
          ...state.music,
          queue: state.music.queue.filter(id => id !== songId),
          currentSong: newCurrentSong,
          isPlaying: newIsPlaying,
          progress: newProgress
        }
      };
    });
  },

  clearQueue: () => {
    set(state => ({
      music: {
        ...state.music,
        queue: [],
        currentSong: null,
        isPlaying: false
      }
    }));
  }
}));

// Helper-Funktionen

// Sortiert die Tasks so, dass erledigte Tasks innerhalb einer Gruppe nach unten verschoben werden
function sortTasksWithCompletedAtBottom(tasks, taskToInsert) {
  // Erstelle eine neue Array mit allen Tasks außer dem einzufügenden Task
  let result = [...tasks];
  
  // Bestimme den korrekten Einfügepunkt basierend auf dem Completed-Status
  if (taskToInsert.completed) {
    // Für erledigte Tasks: Finde den ersten erledigten Task in derselben Gruppe
    // oder füge am Ende der Gruppe ein
    let insertIndex = result.findIndex(t => 
      t.groupId === taskToInsert.groupId && t.completed
    );
    
    if (insertIndex === -1) {
      // Kein erledigter Task in dieser Gruppe gefunden, füge am Ende der Gruppe ein
      let lastGroupTaskIndex = -1;
      
      for (let i = 0; i < result.length; i++) {
        if (result[i].groupId === taskToInsert.groupId) {
          lastGroupTaskIndex = i;
        } else if (lastGroupTaskIndex !== -1) {
          // Wir haben die Gruppe verlassen, hier einfügen
          break;
        }
      }
      
      if (lastGroupTaskIndex === -1) {
        // Keine andere Aufgabe in dieser Gruppe, am Ende einfügen
        result.push(taskToInsert);
      } else {
        // Nach der letzten Aufgabe in der Gruppe einfügen
        result.splice(lastGroupTaskIndex + 1, 0, taskToInsert);
      }
    } else {
      // Bei den anderen erledigten Tasks einfügen
      result.splice(insertIndex, 0, taskToInsert);
    }
  } else {
    // Für aktive Tasks: Vor dem ersten erledigten Task in derselben Gruppe einfügen
    // oder vor dem ersten Task der nächsten Gruppe
    let insertIndex = result.findIndex(t => 
      t.groupId === taskToInsert.groupId && t.completed
    );
    
    if (insertIndex === -1) {
      // Kein erledigter Task in dieser Gruppe gefunden, füge vor der nächsten Gruppe ein
      let nextGroupStartIndex = result.findIndex(t => 
        t.groupId !== taskToInsert.groupId && 
        (result.findIndex(prev => prev.groupId === taskToInsert.groupId) < result.indexOf(t))
      );
      
      if (nextGroupStartIndex === -1) {
        // Keine nächste Gruppe, am Ende einfügen
        result.push(taskToInsert);
      } else {
        // Vor der nächsten Gruppe einfügen
        result.splice(nextGroupStartIndex, 0, taskToInsert);
      }
    } else {
      // Vor dem ersten erledigten Task einfügen
      result.splice(insertIndex, 0, taskToInsert);
    }
  }
  
  return updateTaskOrders(result);
}

// Ordnet einen Task nach einem Statuswechsel neu ein
function reorderTaskAfterCompletion(task, allTasks) {
  const tasksInSameGroup = allTasks.filter(t => t.groupId === task.groupId && t.id !== task.id);
  
  if (task.completed) {
    // Task wurde als erledigt markiert - ans Ende der Gruppe verschieben
    const completedTasksInGroup = tasksInSameGroup.filter(t => t.completed);
    // Neue Order: Nach allen anderen erledigten Tasks dieser Gruppe
    return {
      ...task,
      order: completedTasksInGroup.length > 0 
        ? Math.max(...completedTasksInGroup.map(t => t.order)) + 1
        : tasksInSameGroup.length // Nach allen nicht-erledigten Tasks
    };
  } else {
    // Task wurde als nicht erledigt markiert - an den Anfang der Gruppe verschieben
    const activeTasksInGroup = tasksInSameGroup.filter(t => !t.completed);
    // Neue Order: Vor allen anderen aktiven Tasks dieser Gruppe
    return {
      ...task,
      order: activeTasksInGroup.length > 0 
        ? Math.min(...activeTasksInGroup.map(t => t.order)) - 1
        : 0 // Ganz am Anfang, wenn keine anderen aktiven Tasks
    };
  }
}

// Aktualisiert die Order-Werte aller Tasks, sortiert nach Gruppen und Completed-Status
function updateTaskOrders(tasks) {
  // Gruppiere Tasks nach groupId
  const groupedTasks = {};
  
  tasks.forEach(task => {
    const groupId = task.groupId || 'ungrouped';
    if (!groupedTasks[groupId]) {
      groupedTasks[groupId] = [];
    }
    groupedTasks[groupId].push(task);
  });
  
  // Innerhalb jeder Gruppe: Aktive zuerst, dann erledigte, mit fortlaufenden Order-Werten
  const result = [];
  
  Object.keys(groupedTasks).forEach(groupId => {
    const groupTasks = groupedTasks[groupId];
    
    // Aktive Tasks
    const activeTasks = groupTasks.filter(t => !t.completed)
      .sort((a, b) => a.order - b.order)
      .map((task, index) => ({
        ...task,
        order: index
      }));
    
    // Erledigte Tasks
    const completedTasks = groupTasks.filter(t => t.completed)
      .sort((a, b) => a.order - b.order)
      .map((task, index) => ({
        ...task,
        order: activeTasks.length + index
      }));
    
    result.push(...activeTasks, ...completedTasks);
  });
  
  return result;
}