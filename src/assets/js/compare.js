/* compare.js - Handles Compare Mode Selection and Rendering */

(function() {
  const STORAGE_KEY_COMPARE = 'OT_COMPARE';
  const MAX_COMPARE = 4;

  let compareSet = [];
  let indexData = [];

  // 1. Storage Helpers
  function loadData() {
    try {
      const c = localStorage.getItem(STORAGE_KEY_COMPARE);
      if (c) compareSet = JSON.parse(c);
      if (!Array.isArray(compareSet)) compareSet = [];
    } catch (e) {
      compareSet = [];
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY_COMPARE, JSON.stringify(compareSet));
    } catch (e) {}
  }

  // 2. Selection Logic
  function toggleCompare(toolId) {
    const idx = compareSet.indexOf(toolId);
    if (idx > -1) {
      compareSet.splice(idx, 1);
    } else {
      if (compareSet.length >= MAX_COMPARE) {
        alert(`You can only compare up to ${MAX_COMPARE} tools at once.`);
        return;
      }
      compareSet.push(toolId);
    }
    saveData();
    updateCompareUI();
    renderCompareFAB();
    
    // If we are on the compare page, re-render the table
    if (document.body.dataset.toolId === 'compare') {
      renderComparePage();
    }
  }

  function isCompared(toolId) {
    return compareSet.includes(toolId);
  }

  function clearCompare() {
    compareSet = [];
    saveData();
    updateCompareUI();
    renderCompareFAB();
    if (document.body.dataset.toolId === 'compare') {
      renderComparePage();
    }
  }

  // 3. UI Bindings for Buttons
  function updateCompareUI() {
    document.querySelectorAll('.btn-compare').forEach(btn => {
      const toolId = btn.dataset.toolId;
      if (isCompared(toolId)) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        btn.title = "Remove from Compare";
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
        btn.title = "Add to Compare";
      }
    });
  }

  function bindCompareButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-compare');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(btn.dataset.toolId);
      }
    });
  }

  // 4. Floating Action Bar (FAB)
  function renderCompareFAB() {
    let fab = document.getElementById('compare-fab');
    if (!fab) {
      fab = document.createElement('div');
      fab.id = 'compare-fab';
      fab.className = 'compare-fab';
      document.body.appendChild(fab);
      
      fab.innerHTML = `
        <div class="fab-content">
          <span id="compare-fab-count">0 tools selected</span>
          <div class="fab-actions">
            <button class="btn btn-secondary btn-sm" id="fab-clear">Clear</button>
            <a href="${window.OT_ASSET_BASE || ''}compare/" class="btn btn-primary btn-sm">Compare</a>
          </div>
        </div>
      `;
      
      document.getElementById('fab-clear').addEventListener('click', clearCompare);
    }

    if (compareSet.length > 0) {
      fab.classList.add('visible');
      document.getElementById('compare-fab-count').textContent = `${compareSet.length} tool${compareSet.length > 1 ? 's' : ''} selected for comparison`;
    } else {
      fab.classList.remove('visible');
    }
  }

  // 5. Compare Page Rendering
  async function fetchIndexIfNeeded() {
    if (indexData.length > 0) return true;
    try {
      const res = await fetch('data/search-index.json');
      indexData = await res.json();
      return true;
    } catch (e) {
      console.error("Failed to load search index for compare", e);
      return false;
    }
  }

  async function renderComparePage() {
    const tableHead = document.getElementById('compare-table-head');
    const tableBody = document.getElementById('compare-table-body');
    const grid = document.getElementById('compare-grid');
    const emptyState = document.getElementById('compare-empty-state');
    const actions = document.getElementById('compare-actions');
    
    if (!tableHead || !tableBody) return; // Not on compare page

    if (compareSet.length === 0) {
      grid.style.display = 'none';
      actions.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    await fetchIndexIfNeeded();
    const tools = compareSet.map(id => indexData.find(t => t.id === id)).filter(Boolean);

    grid.style.display = 'block';
    actions.style.display = 'flex';
    emptyState.style.display = 'none';

    // Build Headers
    tableHead.innerHTML = `<th>Feature</th>` + tools.map(t => `
      <th>
        <div class="compare-th-content">
          <img src="${window.OT_ASSET_BASE || ''}images/icons/${t.icon || 'wrench'}.svg" width="24" height="24" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${window.OT_ASSET_BASE || ''}images/logo.svg';}else{this.style.display='none';}" />
          <a href="${window.OT_ASSET_BASE || ''}${t.path}">${t.title}</a>
          <button class="icon btn-compare active" data-tool-id="${t.id}" title="Remove">&times;</button>
        </div>
      </th>
    `).join('');

    // Build Rows
    const rows = [
      { label: 'Category', render: t => `${t.category} > ${t.subcategory}` },
      { label: 'Description', render: t => t.description || '-' },
      { label: 'Tags', render: t => (t.tags || []).join(', ') || '-' },
      { label: 'Aliases', render: t => (t.aliases || []).join(', ') || '-' },
      { label: 'Popular', render: t => t.popular ? 'Yes' : 'No' }
    ];

    tableBody.innerHTML = rows.map(r => `
      <tr>
        <td class="feature-label">${r.label}</td>
        ${tools.map(t => `<td>${r.render(t)}</td>`).join('')}
      </tr>
    `).join('');
  }

  // 6. Init
  function init() {
    loadData();
    bindCompareButtons();
    updateCompareUI();
    renderCompareFAB();
    
    if (document.body.dataset.toolId === 'compare') {
      const clearBtn = document.getElementById('clear-compare-btn');
      if (clearBtn) clearBtn.addEventListener('click', clearCompare);
      renderComparePage();
    }
  }

  // Hook into OTPersonalization to inject compare buttons into dynamic cards
  if (window.OTPersonalization) {
    const originalCreateToolCardHtml = window.OTPersonalization.createToolCardHtml;
    window.OTPersonalization.createToolCardHtml = function(tool) {
      const html = originalCreateToolCardHtml.call(this, tool);
      const isComp = isCompared(tool.id);
      
      const compBtn = `
        <button class="btn-compare card-compare ${isComp ? 'active' : ''}" data-tool-id="${tool.id}" aria-label="Toggle Compare" aria-pressed="${isComp}" title="Compare">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      `;
      // Inject before the favorite button
      return html.replace('</button>', '</button>' + compBtn);
    };

    const originalUpdateFavoriteUI = window.OTPersonalization.updateFavoriteUI;
    window.OTPersonalization.updateFavoriteUI = function() {
      originalUpdateFavoriteUI.call(this);
      updateCompareUI();
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
