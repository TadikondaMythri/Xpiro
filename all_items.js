let editingItemId = null;

// ---------- Helpers ----------
function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token,
    ...extra
  };
}

function openForm() {
  document.getElementById("itemForm").style.display = "flex";
}
function closeForm() {
  document.getElementById("itemForm").style.display = "none";
  clearFormFields();
  editingItemId = null;
  document.getElementById("form-title").textContent = "Add New Item";
}
function clearFormFields() {
  document.getElementById("itemname").value = "";
  document.getElementById("category").value = "";
  document.getElementById("expiry").value = "";
  document.getElementById("quantity").value = "";
}

// ---------- Save (Add or Edit) ----------
async function saveItem() {
  const item = {
    name: document.getElementById("itemname").value,
    category: document.getElementById("category").value,
    expiryDate: document.getElementById("expiry").value,
    quantity: document.getElementById("quantity").value,
  };

  try {
    let response;
    if (editingItemId) {
      response = await fetch(`https://xpiro.onrender.com/api/items/${editingItemId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
    } else {
      response = await fetch("https://xpiro.onrender.com/api/items", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
    }

    if (!response.ok) throw new Error("Failed to save item");

    closeForm();
    loadItems(); // refresh
  } catch (err) {
    console.error("Save failed:", err);
    alert("❌ Could not save item");
  }
}

// ---------- Load Items ----------
async function loadItems() {
  const list = document.getElementById("items-list");
  try {
    const res = await fetch("https://xpiro.onrender.com/api/items", {
      headers: getAuthHeaders()
    });
    const items = await res.json();

    list.innerHTML = "";

    if (!items.length) {
      list.innerHTML = "<p>No items found.</p>";
      return;
    }

    items.forEach(item => {
      const expiry = new Date(item.expiryDate).toISOString().split("T")[0];
      const html = `
        <div class="item-card" data-id="${item._id}"
             data-name="${item.name}" data-category="${item.category}" 
             data-expiry="${expiry}" data-quantity="${item.quantity}">
          <div class="item-details">
            <div class="item-name">${item.name}</div>
            <div class="item-expiry">Expiry: ${new Date(item.expiryDate).toLocaleDateString()}</div>
            <div class="item-category">Category: ${item.category}</div>
            <div class="item-quantity">Quantity: ${item.quantity}</div>
          </div>
          <div class="item-actions">
            <i class="fas fa-edit edit" title="Edit"></i>
            <i class="fas fa-trash delete" title="Delete"></i>
          </div>
        </div>
      `;
      list.insertAdjacentHTML("beforeend", html);
    });

  } catch (err) {
    console.error("Error loading items:", err);
    list.innerHTML = "<p>⚠️ Could not load items</p>";
  }
}

// ---------- Delegation for edit/delete ----------
document.addEventListener("click", async (e) => {
  const card = e.target.closest(".item-card");
  if (!card) return;
  const id = card.getAttribute("data-id");

  if (e.target.classList.contains("delete")) {
    if (confirm("Delete this item?")) {
      try {
        await fetch(`https://xpiro.onrender.com/api/items/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        card.remove();
      } catch (err) {
        console.error("Delete failed:", err);
        alert("❌ Could not delete item");
      }
    }
  }

  if (e.target.classList.contains("edit")) {
    document.getElementById("form-title").textContent = "Edit Item";
    document.getElementById("itemname").value = card.getAttribute("data-name");
    document.getElementById("category").value = card.getAttribute("data-category");
    document.getElementById("expiry").value = card.getAttribute("data-expiry");
    document.getElementById("quantity").value = card.getAttribute("data-quantity");

    editingItemId = id;
    openForm();
  }
});

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    window.location.href = "signin.html"; // force login
  }
  loadItems();
});

// ---------- Logout ----------
function logout() {
  localStorage.removeItem("token");
  window.location.href = "signin.html";
}
