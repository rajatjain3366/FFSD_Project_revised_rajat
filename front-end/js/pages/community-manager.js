/**
 * Gameunity — Complete CRUD State Manager (v2)
 * Features: Global Sync Simulation, Banner Uploads, Advanced Moderation, Custom Event Fields
 */

const GLOBAL_STATE_KEY = "nexus_global_community_state";

// ==========================================
// 1. STATE (The Source of Truth)
// ==========================================
let state = {
  communityName: "Pro Gamers",
  communityDesc: "A thriving community for developers of all levels.",
  bannerImage: "", // Base64 or URL

  currentUser: {
    id: 101,
    firstName: "Jake",
    lastName: "Kim",
    fullName: "Jake Kim",
    handle: "jakekim",
    initials: "JK",
    roleLevel: 5, // 5: Owner, 4: Manager, 3: Mod, 2: Event, 1: Member
    role: "👑 Community Owner",
  },

  appearance: {
    theme: "Dark",
    accentColor: "#5b6ef5",
  },

  autoMod: {
    wordFilter: "spam, scam, hate",
    linkBlock: false,
  },

  channels: [
    { id: 1, icon: "📣", name: "announcements", type: "📣 Announcement", members: 2450 },
    { id: 2, icon: "#", name: "general", type: "💬 Text", members: 2450 },
    { id: 3, icon: "🔊", name: "study-together", type: "🔊 Voice", members: 120 },
    { id: 4, icon: "📅", name: "upcoming-events", type: "📅 Event", members: 2450 },
  ],

  // 15 Demo Members
  members: [
    { id: 101, av: "JK", name: "Jake Kim", handle: "@jakekim", role: "👑 Community Owner", roleLevel: 5, date: "Mar 1, 2022", status: "Online" },
    { id: 102, av: "SL", name: "Sara Lee", handle: "@saralee", role: "🛡 Community Manager", roleLevel: 4, date: "Jun 12, 2022", status: "Away" },
    { id: 103, av: "AM", name: "Alex Morgan", handle: "@alexm", role: "🔨 Moderator", roleLevel: 3, date: "Jan 5, 2023", status: "Online" },
    { id: 104, av: "TJ", name: "Tom Jones", handle: "@tomj", role: "📅 Event Manager", roleLevel: 2, date: "Feb 10, 2023", status: "Offline" },
    { id: 105, av: "RK", name: "Raj Kumar", handle: "@rajk", role: "✅ Verified Member", roleLevel: 1, date: "Mar 15, 2023", status: "Online" },
    { id: 106, av: "EB", name: "Emily Blunt", handle: "@emilyb", role: "👤 Member", roleLevel: 1, date: "Apr 20, 2023", status: "Offline" },
    { id: 107, av: "CD", name: "Chris Doe", handle: "@chrisd", role: "👤 Member", roleLevel: 1, date: "May 25, 2023", status: "Online" },
    { id: 108, av: "MJ", name: "Mary Jane", handle: "@maryj", role: "👤 Member", roleLevel: 1, date: "Jun 30, 2023", status: "Away" },
    { id: 109, av: "PB", name: "Peter Parker", handle: "@peterp", role: "👤 Member", roleLevel: 1, date: "Jul 5, 2023", status: "Online" },
    { id: 110, av: "BW", name: "Bruce Wayne", handle: "@brucew", role: "✅ Verified Member", roleLevel: 1, date: "Aug 10, 2023", status: "Offline" },
    { id: 111, av: "CK", name: "Clark Kent", handle: "@clarkk", role: "👤 Member", roleLevel: 1, date: "Sep 15, 2023", status: "Online" },
    { id: 112, av: "DP", name: "Diana Prince", handle: "@dianap", role: "🔨 Moderator", roleLevel: 3, date: "Oct 20, 2023", status: "Online" },
    { id: 113, av: "BA", name: "Barry Allen", handle: "@barrya", role: "👤 Member", roleLevel: 1, date: "Nov 25, 2023", status: "Away" },
    { id: 114, av: "HJ", name: "Hal Jordan", handle: "@halj", role: "👤 Member", roleLevel: 1, date: "Dec 30, 2023", status: "Offline" },
    { id: 115, av: "AC", name: "Arthur Curry", handle: "@arthurc", role: "👤 Member", roleLevel: 1, date: "Jan 5, 2024", status: "Online" },
  ],

  events: [
    { id: 1, title: "Weekly Code Review", date: "Friday, 8:00 PM EST", type: "Community Event", customFields: [{ key: "Meeting Link", value: "discord.gg/progamer" }] },
  ],

  reports: [
    { id: 4821, user: "BadActor_X", reason: "🚫 Hate Speech", status: "Pending" },
    { id: 4820, user: "SpamBot99", reason: "📢 Spam", status: "Pending" },
    { id: 4819, user: "ToxicGamer", reason: "Harassment", status: "Resolved", resolvedBy: "Sara Lee" },
  ],

  modHistory: [
    { id: 1, mod: "Sara Lee", target: "ToxicGamer", action: "Warned", date: "Oct 24, 2023" },
    { id: 2, mod: "Alex Morgan", target: "SpamBot99", action: "Deleted Messages", date: "Oct 23, 2023" },
  ],

  roles: [
    { id: 1, name: "👑 Community Owner", level: 5, color: "#F59E0B" },
    { id: 2, name: "🛡 Community Manager", level: 4, color: "#818CF8" },
    { id: 3, name: "🔨 Moderator", level: 3, color: "#34D399" },
    { id: 4, name: "📅 Event Manager", level: 2, color: "#F472B6" },
    { id: 5, name: "✅ Verified Member", level: 1, color: "#06B6D4" },
    { id: 6, name: "👤 Member", level: 1, color: "#9CA3AF" },
  ],
};

// ==========================================
// 2. GLOBAL SYNC & STORAGE LOGIC
// ==========================================
function loadGlobalState() {
  const stored = localStorage.getItem(GLOBAL_STATE_KEY);
  if (stored) state = JSON.parse(stored);
  else saveGlobalState(); // Initialize first time
}

function saveGlobalState() {
  localStorage.setItem(GLOBAL_STATE_KEY, JSON.stringify(state));
}

// ==========================================
// 3. UI TAB NAVIGATION & MODALS
// ==========================================
window.switchSettingsTab = function (tabId, navEl) {
  document.querySelectorAll(".settings-tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".settings-nav-item").forEach((item) => item.classList.remove("active"));
  document.getElementById("settings-" + tabId).classList.add("active");
  if (navEl) navEl.classList.add("active");
};

window.showModal = function (id) { document.getElementById(id).classList.add("show"); };
window.closeModal = function (id) { document.getElementById(id).classList.remove("show"); };
window.toast = function (msg) {
  const t = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
};

// ==========================================
// 4. RENDER FUNCTIONS
// ==========================================
function renderAll() {
  renderMembers();
  renderChannels();
  renderEvents();
  renderReports();
  renderModHistory();
  renderRoles();
  applyAppearance();

  // Populate basic inputs from State
  document.getElementById("communityNameInput").value = state.communityName;
  document.getElementById("communityDescInput").value = state.communityDesc;
  document.getElementById("topBarCommunityName").innerText = state.communityName;
  document.getElementById("modWordFilter").value = state.autoMod.wordFilter;
  document.getElementById("modLinkBlock").checked = state.autoMod.linkBlock;

  if(state.bannerImage) {
      document.getElementById("bannerPreview").style.backgroundImage = `url(${state.bannerImage})`;
      document.getElementById("bannerPreview").innerText = "";
  }
}

function applyAppearance() {
  document.documentElement.style.setProperty('--accent', state.appearance.accentColor);
  document.getElementById("accentColorInput").value = state.appearance.accentColor;
  document.getElementById("themeSelect").value = state.appearance.theme;
  document.body.className = state.appearance.theme === "Light" ? "theme-light" : "theme-dark";
}

function renderMembers() {
  const list = document.getElementById("settingsMemberList");
  if (!list) return;

  const roleOptions = state.roles.map(r => `<option value="${r.name}">${r.name}</option>`).join("");

  list.innerHTML = state.members.map(m => {
    // Determine if logged in user can edit this member based on hierarchy level
    const canEdit = state.currentUser.roleLevel > m.roleLevel || state.currentUser.id === m.id;
    
    // Removed the "Profile" button from this block entirely
    return `
        <div class="member-item">
            <div class="member-avatar">${m.av}</div>
            <div class="member-info">
                <div class="member-name">${m.name} <span style="color:var(--text-3);font-size:11px;">${m.handle}</span></div>
                <div class="member-role">
                  ${canEdit ? `<select class="role-select" onchange="toast('Role updated for ${m.name}')">
                    <option value="${m.role}" selected hidden>${m.role}</option>
                    ${roleOptions}
                  </select>` : `<span style="font-size:12px; color:var(--text-2);">${m.role}</span>`}
                </div>
                <div class="member-date">Joined ${m.date} • <span style="color:${m.status==='Online'?'var(--success)':'var(--text-3)'}">${m.status}</span></div>
            </div>
            <div class="member-actions">
                ${canEdit && state.currentUser.id !== m.id ? `<button class="btn-sm danger" onclick="toast('${m.name} was kicked.')">🚫 Kick</button>` : ""}
            </div>
        </div>
    `}).join("");
}

function renderChannels() {
  const list = document.getElementById("settingsChannelList");
  if (!list) return;
  list.innerHTML = state.channels.map(ch => `
        <div class="channel-item">
            <div class="channel-icon">${ch.icon}</div>
            <div class="channel-info">
                <div class="channel-name">${ch.name}</div>
                <div class="channel-type">${ch.type}</div>
                <div class="channel-perms">${ch.members.toLocaleString()} members</div>
            </div>
            <div class="channel-actions">
                <button class="btn-sm accent" onclick="openChannelChat('${ch.name}')">💬 Go to Chat</button>
                <button class="btn-sm danger" onclick="toast('Channel deleted')">🗑️</button>
            </div>
        </div>
    `).join("");
}

function renderReports() {
  const pendingList = document.getElementById("pendingReportsList");
  const resolvedList = document.getElementById("resolvedReportsList");

  const pending = state.reports.filter(r => r.status === "Pending");
  const resolved = state.reports.filter(r => r.status === "Resolved");

  pendingList.innerHTML = pending.map(r => `
        <tr>
            <td>#${r.id}</td>
            <td>${r.user}</td>
            <td>${r.reason}</td>
            <td><span style="color:var(--gold)">Pending</span></td>
            <td><button class="btn-sm" onclick="resolveReport(${r.id})">✅ Resolve</button></td>
        </tr>`).join("") || `<tr><td colspan="5" style="text-align:center; padding: 20px;">No pending reports.</td></tr>`;

  resolvedList.innerHTML = resolved.map(r => `
        <tr>
            <td>#${r.id}</td>
            <td>${r.user}</td>
            <td>${r.reason}</td>
            <td>Resolved by ${r.resolvedBy}</td>
            <td><button class="btn-sm danger" onclick="reopenReport(${r.id})">🔄 Reopen</button></td>
        </tr>`).join("") || `<tr><td colspan="5" style="text-align:center; padding: 20px;">No resolved reports.</td></tr>`;
}

function renderModHistory() {
  const list = document.getElementById("modHistoryList");
  list.innerHTML = state.modHistory.map(h => `
    <tr><td>${h.date}</td><td>${h.mod}</td><td>${h.action}</td><td>${h.target}</td></tr>
  `).join("");
}

function renderRoles() {
  const list = document.getElementById("settingsRolesList");
  list.innerHTML = state.roles.map(r => `
      <div class="role-item-settings">
          <div class="role-info">
              <div class="role-name">${r.name} (Level ${r.level})</div>
          </div>
          <div class="role-color" style="background:${r.color};"></div>
          <div class="role-actions">
              ${r.level < state.currentUser.roleLevel ? `<button class="btn-sm danger" onclick="toast('Role deleted')">🗑️</button>` : ''}
          </div>
      </div>
  `).join("");
}

function renderEvents() {
  const list = document.getElementById("settingsEventsList");
  list.innerHTML = state.events.map(e => `
        <div class="role-item-settings">
            <div class="role-info">
                <div class="role-name">${e.title}</div>
                <div class="role-desc" style="color: var(--accent); margin-top: 4px;">📅 ${e.date}</div>
                ${e.customFields ? e.customFields.map(cf => `<div style="font-size:11px; margin-top:2px;"><b>${cf.key}:</b> ${cf.value}</div>`).join('') : ''}
            </div>
            <div class="role-actions">
                <button class="btn-sm danger" onclick="toast('Event Cancelled')">🗑️ Cancel</button>
            </div>
        </div>
    `).join("");
}

// ==========================================
// 5. ACTIONS, VALIDATION & SAVING
// ==========================================
// --- Create Channel Logic ---
window.submitCreateChannel = function () {
  console.log("1. Starting channel creation..."); // Helps us debug if needed

  const nameInputEl = document.getElementById("chNameInput");
  const typeInputEl = document.getElementById("chTypeInput");

  // Safety check: ensure the modal elements exist
  if (!nameInputEl || !typeInputEl) {
    console.error("Could not find the channel input fields in the HTML!");
    return;
  }

  const nameInput = nameInputEl.value.trim();
  const typeInput = typeInputEl.value;

  if (!nameInput) {
    return toast("⚠️ Channel name cannot be empty");
  }

  // Determine the correct icon
  let icon = "#";
  if (typeInput.includes("Voice")) icon = "🔊";
  if (typeInput.includes("Announcement")) icon = "📣";

  // Safeguard: Fallback to 0 if state.members is ever corrupted
  const memberCount = (state.members && state.members.length) ? state.members.length : 0;

  // Build the new channel object
  const newChannel = {
    id: Date.now(),
    icon: icon,
    name: nameInput.toLowerCase().replace(/\s+/g, "-"),
    type: typeInput,
    members: memberCount
  };

  console.log("2. New channel built:", newChannel);

  // Add to state
  if (!state.channels) state.channels = []; // Safety check
  state.channels.push(newChannel);
  
  // Save to our simulated backend
  saveGlobalState();
  console.log("3. Saved to global state.");

  // Force the UI to re-render the list
  renderChannels();
  console.log("4. UI Re-rendered.");

  // Close modal, show toast, and reset input
  closeModal('modalBg');
  toast(`✅ Channel #${newChannel.name} created!`);
  nameInputEl.value = "";
};
// Banner Upload Reader
window.handleBannerUpload = function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById("bannerPreview").style.backgroundImage = `url(${e.target.result})`;
      document.getElementById("bannerPreview").innerText = "";
      state.bannerImage = e.target.result; // Save base64
      document.getElementById("settingsActions").classList.add("show");
    };
    reader.readAsDataURL(file);
  }
};

// Global Save Button
window.saveSettings = function () {
  const nameInput = document.getElementById("communityNameInput").value.trim();
  const descInput = document.getElementById("communityDescInput").value.trim();
  const errorMsg = document.getElementById("basicSettingsError");

  if (!nameInput || !descInput) {
    errorMsg.innerText = "⚠️ Community Name and Description are required.";
    errorMsg.style.display = "block";
    return;
  }
  errorMsg.style.display = "none";

  // Update State Values
  state.communityName = nameInput;
  state.communityDesc = descInput;
  state.appearance.theme = document.getElementById("themeSelect").value;
  state.appearance.accentColor = document.getElementById("accentColorInput").value;
  state.autoMod.wordFilter = document.getElementById("modWordFilter").value;
  state.autoMod.linkBlock = document.getElementById("modLinkBlock").checked;
  
  saveGlobalState(); // Persist changes
  applyAppearance(); // Instantly apply styling updates
  
  document.getElementById("topBarCommunityName").innerText = state.communityName;
  document.getElementById("settingsActions").classList.remove("show");
  toast("✅ All community settings saved globally!");
};

// Event Custom Fields Logic
window.addCustomEventFieldUI = function() {
  const container = document.getElementById("customFieldsContainer");
  const id = Date.now();
  container.insertAdjacentHTML('beforeend', `
    <div class="modal-field-row" id="cf-${id}" style="display:flex; gap:10px; margin-bottom:8px;">
      <input type="text" placeholder="Field (e.g. Prize Pool)" class="cf-key" style="flex:1;">
      <input type="text" placeholder="Value (e.g. $500)" class="cf-val" style="flex:2;">
      <button class="btn-sm danger" onclick="document.getElementById('cf-${id}').remove()">X</button>
    </div>
  `);
};

window.submitCreateEvent = function () {
  const title = document.getElementById("evTitleInput").value.trim();
  if (!title) return toast("⚠️ Event title cannot be empty");

  let customFields = [];
  document.querySelectorAll(".modal-field-row").forEach(row => {
    const k = row.querySelector(".cf-key").value.trim();
    const v = row.querySelector(".cf-val").value.trim();
    if (k && v) customFields.push({ key: k, value: v });
  });

  state.events.push({
    id: Date.now(),
    title: title,
    date: document.getElementById("evDateInput").value || "TBD",
    type: document.getElementById("evTypeInput").value,
    customFields: customFields
  });

  saveGlobalState();
  renderEvents();
  closeModal('eventModalBg');
  toast(`🎉 Event "${title}" published globally!`);
};

// Channel Navigation (Now successfully redirects)
window.openChannelChat = function(channelName) {
  toast(`Redirecting to Chat: #${channelName}...`);
  setTimeout(() => {
    window.location.href = `chat.html?channel=${channelName}`;
  }, 800);
};

// Report Status Management
window.resolveReport = function(id) {
  const r = state.reports.find(x => x.id === id);
  if(r) {
    r.status = "Resolved";
    r.resolvedBy = state.currentUser.fullName;
    saveGlobalState(); renderReports(); toast("✅ Report resolved.");
  }
};
window.reopenReport = function(id) {
  const r = state.reports.find(x => x.id === id);
  if(r) {
    r.status = "Pending";
    delete r.resolvedBy;
    saveGlobalState(); renderReports(); toast("🔄 Report reopened.");
  }
};

// ==========================================
// 6. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  loadGlobalState();
  renderAll();

  // Watch inputs to show the "Save Changes" bar
  document.querySelectorAll("#view-settings input, #view-settings textarea, #view-settings select").forEach((el) => {
    el.addEventListener("input", () => document.getElementById("settingsActions").classList.add("show"));
    el.addEventListener("change", () => document.getElementById("settingsActions").classList.add("show"));
  });
});