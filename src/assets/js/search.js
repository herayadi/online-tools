/* search.js - Client-side search engine and UI logic */

(function() {
  let searchIndex = [];
  let indexLoaded = false;
  
  // DOM Elements
  const globalInput = document.getElementById('global-search');
  const suggestionsBox = document.getElementById('search-suggestions');
  
  const exploreInput = document.getElementById('explore-search-input');
  const exploreResults = document.getElementById('search-results');
  const exploreMeta = document.getElementById('search-results-meta');
  const emptyState = document.getElementById('empty-state');
  const catFilters = document.querySelectorAll('#category-filters .filter-btn');
  const subContainer = document.getElementById('subcategory-filters-container');
  const subFilters = document.getElementById('subcategory-filters');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const cardTemplate = document.getElementById('tool-card-template');

  let currentCategory = 'all';
  let currentSubcategory = 'all';
  let currentQuery = '';

  // 1. Core Search Logic (Ranking)
  function performSearch(query, category = 'all', subcategory = 'all') {
    let results = searchIndex;

    // Filter by Category
    if (category !== 'all') {
      results = results.filter(t => t.category === category);
    }
    
    // Filter by Subcategory
    if (subcategory !== 'all') {
      results = results.filter(t => t.subcategory === subcategory);
    }

    // Filter and Rank by Query
    if (query) {
      const q = query.toLowerCase().trim();
      
      results = results.map(t => {
        let score = 0;
        const titleMatches = t.title.toLowerCase().indexOf(q);
        
        // Title exact match
        if (t.title.toLowerCase() === q) score += 100;
        // Title starts with
        else if (titleMatches === 0) score += 75;
        // Title contains
        else if (titleMatches > 0) score += 50;

        // Alias match
        if (t.aliases.some(a => a.toLowerCase().includes(q))) score += 60;
        
        // Tag match
        if (t.tags.some(tag => tag.toLowerCase().includes(q))) score += 40;
        
        // Category match
        if (t.category.toLowerCase().includes(q)) score += 10;
        
        // Description match
        if (t.description && t.description.toLowerCase().includes(q)) score += 20;

        // Bonus
        if (t.popular) score += 5;
        if (t.featured) score += 5;

        return { tool: t, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.tool);
    } else {
      // If no query, sort by popular/order
      results.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return a.title.localeCompare(b.title);
      });
    }

    return results;
  }

  // 2. Fetch Index
  async function ensureIndexLoaded() {
    if (indexLoaded) return true;
    try {
      const res = await fetch('data/search-index.json');
      searchIndex = await res.json();
      indexLoaded = true;
      return true;
    } catch (e) {
      console.error("Failed to load search index", e);
      return false;
    }
  }

  // 3. Render Explore Results
  function renderExploreResults() {
    if (!exploreResults || !cardTemplate) return;
    
    const results = performSearch(currentQuery, currentCategory, currentSubcategory);
    
    exploreResults.innerHTML = '';
    
    if (results.length === 0) {
      emptyState.style.display = 'block';
      exploreResults.style.display = 'none';
      if (exploreMeta) exploreMeta.innerHTML = '';
    } else {
      emptyState.style.display = 'none';
      exploreResults.style.display = 'grid';
      if (exploreMeta) {
        exploreMeta.innerHTML = `Showing ${results.length} tool${results.length !== 1 ? 's' : ''}`;
      }
      
      results.forEach(tool => {
        if (window.OTPersonalization) {
          const div = document.createElement('div');
          div.innerHTML = window.OTPersonalization.createToolCardHtml(tool);
          exploreResults.appendChild(div.firstElementChild);
        } else {
          const clone = cardTemplate.content.cloneNode(true);
          const a = clone.querySelector('a');
          const img = clone.querySelector('img');
          const h3 = clone.querySelector('h3');
          const p = clone.querySelector('p');
          const btn = clone.querySelector('.btn-favorite');
          
          a.href = tool.path;
          img.src = `images/icons/${tool.icon || 'wrench'}.svg`;
          h3.textContent = tool.title;
          p.textContent = (tool.description || '').substring(0, 60) + ((tool.description && tool.description.length > 60) ? '...' : '');
          if (btn) btn.dataset.toolId = tool.id;
          
          exploreResults.appendChild(clone);
        }
      });
    }
    
    // Bind new favorite buttons if any
    if (window.OTPersonalization && window.OTPersonalization.updateFavoriteUI) {
      window.OTPersonalization.updateFavoriteUI();
    }
  }

  // 4. URL State Sync
  function updateURLState() {
    const url = new URL(window.location);
    if (currentQuery) url.searchParams.set('q', currentQuery);
    else url.searchParams.delete('q');
    
    if (currentCategory !== 'all') url.searchParams.set('category', currentCategory);
    else url.searchParams.delete('category');
    
    if (currentSubcategory !== 'all') url.searchParams.set('subcategory', currentSubcategory);
    else url.searchParams.delete('subcategory');
    
    window.history.replaceState({}, '', url);
  }

  function readURLState() {
    const url = new URL(window.location);
    currentQuery = url.searchParams.get('q') || '';
    currentCategory = url.searchParams.get('category') || 'all';
    currentSubcategory = url.searchParams.get('subcategory') || 'all';
    
    if (exploreInput) exploreInput.value = currentQuery;
    
    updateActiveCategoryUI();
  }

  function updateActiveCategoryUI() {
    catFilters.forEach(btn => {
      if (btn.dataset.category === currentCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Subcategories handled statically for now or we fetch categories.json if needed
    // Simplified: Just hide subcategory container if 'all'
    if (currentCategory === 'all' && subContainer) {
      subContainer.style.display = 'none';
      currentSubcategory = 'all';
    }
  }

  // 5. Global Search / Suggestions
  let activeSuggestionIndex = -1;

  function renderSuggestions(results) {
    if (!suggestionsBox) return;
    
    suggestionsBox.innerHTML = '';
    activeSuggestionIndex = -1;
    
    if (results.length === 0 || !globalInput.value.trim()) {
      suggestionsBox.style.display = 'none';
      return;
    }

    const maxResults = results.slice(0, 5);
    maxResults.forEach((tool, index) => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.textContent = tool.title;
      div.dataset.path = tool.path;
      div.addEventListener('click', () => {
        window.location.href = tool.path;
      });
      suggestionsBox.appendChild(div);
    });

    suggestionsBox.style.display = 'block';
  }

  function handleKeyboardNav(e) {
    if (!suggestionsBox || suggestionsBox.style.display === 'none') return;
    const items = suggestionsBox.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
      updateSuggestionHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggestionIndex = activeSuggestionIndex - 1 < 0 ? items.length - 1 : activeSuggestionIndex - 1;
      updateSuggestionHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0) {
        window.location.href = items[activeSuggestionIndex].dataset.path;
      } else {
        // Go to explore page with query
        window.location.href = `explore/?q=${encodeURIComponent(globalInput.value)}`;
      }
    } else if (e.key === 'Escape') {
      suggestionsBox.style.display = 'none';
      globalInput.blur();
    }
  }

  function updateSuggestionHighlight(items) {
    items.forEach((item, index) => {
      if (index === activeSuggestionIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Event Listeners
  async function init() {
    await ensureIndexLoaded();

    // Global Search
    if (globalInput) {
      globalInput.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        if (!q) {
          suggestionsBox.style.display = 'none';
          return;
        }
        const results = performSearch(q);
        renderSuggestions(results);
      });
      globalInput.addEventListener('keydown', handleKeyboardNav);
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (suggestionsBox && !e.target.closest('.search-container')) {
          suggestionsBox.style.display = 'none';
        }
      });
      
      // Show again on focus if there's value
      globalInput.addEventListener('focus', () => {
        if (globalInput.value.trim() && suggestionsBox && suggestionsBox.innerHTML) {
          suggestionsBox.style.display = 'block';
        }
      });
    }

    // Explore Page
    if (exploreInput) {
      readURLState();
      renderExploreResults();

      exploreInput.addEventListener('input', (e) => {
        currentQuery = e.target.value;
        updateURLState();
        renderExploreResults();
      });

      catFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentCategory = e.target.dataset.category;
          currentSubcategory = 'all'; // Reset sub on cat change
          updateActiveCategoryUI();
          updateURLState();
          renderExploreResults();
        });
      });

      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
          currentCategory = 'all';
          currentSubcategory = 'all';
          currentQuery = '';
          exploreInput.value = '';
          updateActiveCategoryUI();
          updateURLState();
          renderExploreResults();
        });
      }
    }
  }

  // Analytics Hooks
  window.emitSearchEvent = function(query) {
    console.log("Search event:", query);
  };
  window.emitToolOpenEvent = function(toolId) {
    console.log("Tool open event:", toolId);
  };

  init();
})();
