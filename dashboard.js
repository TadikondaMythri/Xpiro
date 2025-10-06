function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token,
    ...extra
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "signin.html"; // redirect if not logged in
  }
});

(() => {
  const API_URL = "https://xpiro.onrender.com/api/items";

  // ------------------ Helpers ------------------
  function log(...args) { console.log("[ExpiryBuddy]", ...args); }
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function formatDateISOToReadable(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function daysUntil(iso) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dt = new Date(iso); dt.setHours(0, 0, 0, 0);
    return Math.round((dt - today) / (1000 * 60 * 60 * 24));
  }

  // ------------------ DOM getters ------------------
  function getRowsContainers() {
    const rowsNodes = $all('.rows');
    return {
      todayContainer: (rowsNodes[0] && rowsNodes[0].querySelector('.row')) || null,
      weekContainer: (rowsNodes[1] && rowsNodes[1].querySelector('.row')) || null,
      safeContainer: (rowsNodes[2] && rowsNodes[2].querySelector('.row')) || null,
    };
  }

  function getStatsSpans() {
    const cards = $all('.stats .card');
    return {
      groceriesSpan: (cards[0] && cards[0].querySelector('span')) || null,
      medicinesSpan: (cards[1] && cards[1].querySelector('span')) || null,
      todaySpan: (cards[2] && cards[2].querySelector('span')) || null,
      weekSpan: (cards[3] && cards[3].querySelector('span')) || null
    };
  }

  // ------------------ Render functions ------------------
  function makeItemRowHTML(item) {
    const name = escapeHtml(item.name);
    const expiry = formatDateISOToReadable(item.expiryDate);
    return `
      <div class="item-box" data-id="${item._id}">
        <div class="item-name">${name}</div>
        <div class="item-expiry">Expiry: ${expiry}</div>
        <div class="item-actions">
          <button class="used-btn" data-id="${item._id}">Used</button>
          <button class="discard-btn" data-id="${item._id}">Discard</button>
        </div>
      </div>
    `;
  }

  function render(items) {
    const { todayContainer, weekContainer, safeContainer } = getRowsContainers();
    const { groceriesSpan, medicinesSpan, todaySpan, weekSpan } = getStatsSpans();

    if (!todayContainer || !weekContainer || !safeContainer) {
      log("ERROR: could not find row containers in the DOM.");
      return;
    }

    todayContainer.innerHTML = "";
    weekContainer.innerHTML = "";
    safeContainer.innerHTML = "";

    let groceriesCount = 0;
    let medsCount = 0;
    let todayCount = 0;
    let weekCount = 0;

    items.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    items.forEach(item => {
      const diff = daysUntil(item.expiryDate);
      if (String(item.category).toLowerCase().includes('medicine')) {
        medsCount++;
      } else {
        groceriesCount++;
      }

      if (diff === 0) {
        todayCount++;
        todayContainer.insertAdjacentHTML('beforeend', makeItemRowHTML(item));
      } else if (diff > 0 && diff <= 7) {
        weekCount++;
        weekContainer.insertAdjacentHTML('beforeend', makeItemRowHTML(item));
      } else if (diff > 7) {
        safeContainer.insertAdjacentHTML('beforeend', makeItemRowHTML(item));
      } else if (diff < 0) {
        todayContainer.insertAdjacentHTML('beforeend', makeItemRowHTML(item));
      }
    });

    if (!todayContainer.children.length) todayContainer.innerHTML = "<p>No items expiring today</p>";
    if (!weekContainer.children.length) weekContainer.innerHTML = "<p>No items expiring this week</p>";
    if (!safeContainer.children.length) safeContainer.innerHTML = "<p>No safe items</p>";

    if (groceriesSpan) groceriesSpan.textContent = groceriesCount;
    if (medicinesSpan) medicinesSpan.textContent = medsCount;
    if (todaySpan) todaySpan.textContent = todayCount;
    if (weekSpan) weekSpan.textContent = weekCount;
  }

  // ------------------ API functions ------------------
  function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  async function apiFetchItems() {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('GET /api/items failed: ' + res.status);
    return res.json();
  }

  async function apiCreateItem(payload) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('POST failed: ' + res.status + ' - ' + txt);
    }
    return res.json();
  }

  async function apiDeleteItem(id) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('DELETE failed: ' + res.status + ' - ' + txt);
    }
    return res.json();
  }

  // ------------------ Public actions ------------------
  async function loadAndRender() {
    try {
      const items = await apiFetchItems();
      render(items);
    } catch (err) {
      console.error("[loadAndRender] error:", err);
    }
  }

  async function saveItem() {
    try {
      const name = (document.getElementById('itemname') || {}).value || '';
      const category = (document.getElementById('category') || {}).value || '';
      const expiryDate = (document.getElementById('expiry') || {}).value || '';
      const quantity = (document.getElementById('quantity') || {}).value || 1;

      if (!name || !category || !expiryDate) {
        alert('Please fill required fields: Name, Category, Expiry Date');
        return;
      }

      const payload = { name, category, expiryDate, quantity};

      await apiCreateItem(payload);

      const formEl = document.getElementById('itemForm');
      if (formEl) formEl.style.display = 'none';

      (document.getElementById('itemname') || {}).value = '';
      (document.getElementById('category') || {}).value = '';
      (document.getElementById('expiry') || {}).value = '';
      (document.getElementById('quantity') || {}).value = '';

      await loadAndRender();
      alert('Item added successfully ✅');
    } catch (err) {
      console.error("[saveItem] error:", err);
      alert('❌ Failed to add item: ' + (err.message || err));
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure? This will remove the item.')) return;
    try {
      await apiDeleteItem(id);
      await loadAndRender();
    } catch (err) {
      console.error('[delete] error:', err);
      alert('Failed to delete item');
    }
  }

  // ------------------ Event delegation ------------------
  function setupDelegation() {
    document.addEventListener('click', (ev) => {
      const used = ev.target.closest('.used-btn');
      if (used) {
        const id = used.getAttribute('data-id');
        handleDelete(id);
        return;
      }
      const discard = ev.target.closest('.discard-btn');
      if (discard) {
        const id = discard.getAttribute('data-id');
        handleDelete(id);
        return;
      }
    });
  }

  // ------------------ Init ------------------
  document.addEventListener('DOMContentLoaded', () => {
    window.saveItem = saveItem;
    setupDelegation();
    loadAndRender();
  });

})();



// Logout
function logout() {
  localStorage.removeItem("token");
  sessionStorage.clear();
  window.location.href = "signin.html";
}

