/* personalization.js - Handles Favorites, History, and LocalStorage */

(function() {
  const STORAGE_KEY_FAVS = 'OT_FAVORITES';
  const STORAGE_KEY_HIST = 'OT_HISTORY';
  const MAX_HISTORY = 20;

  let favorites = [];
  let history = [];
  let indexData = [];

  // 1. Storage Helpers
  function loadData() {
    try {
      const f = localStorage.getItem(STORAGE_KEY_FAVS);
      if (f) favorites = JSON.parse(f);
      
      const h = localStorage.getItem(STORAGE_KEY_HIST);
      if (h) history = JSON.parse(h);
    } catch (e) {
      console.warn("Could not load personalization data from localStorage", e);
      favorites = [];
      history = [];
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favorites));
      localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(history));
    } catch (e) {
      console.warn("Could not save personalization data to localStorage", e);
    }
  }

  // 2. Favorites Logic
  function toggleFavorite(toolId) {
    const idx = favorites.indexOf(toolId);
    if (idx > -1) {
      favorites.splice(idx, 1);
    } else {
      favorites.push(toolId);
    }
    saveData();
    updateFavoriteUI();
    renderHomePersonalization();
  }

  function isFavorite(toolId) {
    return favorites.includes(toolId);
  }

  // 3. History Logic
  function recordHistory(toolId) {
    if (!toolId) return;
    
    // Remove if already exists to push to top
    const idx = history.findIndex(h => h.id === toolId);
    if (idx > -1) history.splice(idx, 1);
    
    // Add to top
    history.unshift({
      id: toolId,
      timestamp: Date.now()
    });
    
    // Truncate
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }
    
    saveData();
  }

  // 4. UI Bindings
  function updateFavoriteUI() {
    document.querySelectorAll('.btn-favorite').forEach(btn => {
      const toolId = btn.dataset.toolId;
      if (isFavorite(toolId)) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
      }
    });
  }

  function bindFavoriteButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-favorite');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(btn.dataset.toolId);
      }
    });
  }

  // 5. Dynamic Rendering (Home Page & Cards)
  async function fetchIndexIfNeeded() {
    if (indexData.length > 0) return true;
    try {
      const res = await fetch('data/search-index.json');
      indexData = await res.json();
      return true;
    } catch (e) {
      console.error("Failed to load search index for personalization", e);
      return false;
    }
  }

  function createToolCardHtml(tool) {
    const isFav = isFavorite(tool.id);
    const favIcon = isFav 
      ? `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
      : `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

    return `
      <div class="tool-card-wrapper">
        <a href="${tool.path}" class="tool-card">
          <div class="tool-icon">
            <img src="images/icons/${tool.icon || 'wrench'}.svg" alt="${tool.title}" onerror="this.src='images/logo.svg'" />
          </div>
          <div class="tool-info">
            <h3>${tool.title}</h3>
            <p>${(tool.description || '').substring(0, 60)}...</p>
          </div>
        </a>
        <div class="card-actions">
          <button class="btn-compare card-compare" data-tool-id="${tool.id}" aria-label="Toggle Compare" title="Compare">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button class="btn-favorite card-favorite ${isFav ? 'active' : ''}" data-tool-id="${tool.id}" aria-label="Toggle Favorite" aria-pressed="${isFav}">
            ${favIcon}
          </button>
        </div>
      </div>
    `;
  }

  async function renderHomePersonalization() {
    const favContainer = document.getElementById('home-favorites-grid');
    const histContainer = document.getElementById('home-history-grid');
    
    if (!favContainer && !histContainer) return;
    
    await fetchIndexIfNeeded();

    if (favContainer) {
      if (favorites.length === 0) {
        document.getElementById('home-favorites-section').style.display = 'none';
      } else {
        document.getElementById('home-favorites-section').style.display = 'block';
        const favTools = favorites.map(id => indexData.find(t => t.id === id)).filter(Boolean);
        favContainer.innerHTML = favTools.map(t => createToolCardHtml(t)).join('');
      }
    }

    if (histContainer) {
      if (history.length === 0) {
        document.getElementById('home-history-section').style.display = 'none';
      } else {
        document.getElementById('home-history-section').style.display = 'block';
        const histTools = history.slice(0, 6).map(h => indexData.find(t => t.id === h.id)).filter(Boolean);
        histContainer.innerHTML = histTools.map(t => createToolCardHtml(t)).join('');
      }
    }
  }

  // 6. Init
  function init() {
    loadData();
    bindFavoriteButtons();
    updateFavoriteUI();
    
    // Check if we are on a tool page by looking for a meta tag or ID
    const currentToolId = document.body.dataset.toolId;
    if (currentToolId) {
      recordHistory(currentToolId);
    }

    renderHomePersonalization();
  }

  // Expose for search.js to use when rendering dynamic results
  window.OTPersonalization = {
    isFavorite,
    createToolCardHtml,
    updateFavoriteUI
  };

  document.addEventListener('DOMContentLoaded', init);
})();
