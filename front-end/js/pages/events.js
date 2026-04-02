/**
 * Gameunity — Events Module Logic
 * Handles event discovery filtering, registration states, and the creation wizard.
 */

// ==========================================
// 1. STATE & CONFIG
// ==========================================
let currentActiveTab = "upcoming";
let activeFilter = "all";

const COMMUNITY_EVENTS_STORAGE_KEY = "nexus_community_events";

// ==========================================
// 1.5 RBAC - HIDE CREATE EVENT FOR AUDIENCE
// ==========================================

/**
 * Hides the "Create Event" option for audience users
 * Only gamers (and higher roles) can create events
 */
function enforceCreateEventPermissions() {
  const user = getCurrentUser();

  // If user is not logged in or is an audience member, hide create event UI
  if (!user || user.role === "audience") {
    // Hide the "Create Event" tab button (3rd tab)
    const createTabBtn = document.querySelector(".tab-btn:nth-child(3)");
    if (createTabBtn) {
      createTabBtn.style.display = "none";
    }

    // Hide the "+ Create Event" button
    const createBtn = document.querySelector(".btn-create");
    if (createBtn) {
      createBtn.style.display = "none";
    }

    console.log(
      "[EVENTS] Create Event permissions restricted for audience user",
    );
  }
}

// ==========================================
// 2. TAB & VIEW NAVIGATION
// ==========================================

/**
 * Switches between Upcoming, Registered, and Create views
 */
window.switchTab = function (name, btn) {
  // UI: Tab Buttons
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  // UI: Content Areas
  document
    .querySelectorAll(".content")
    .forEach((c) => c.classList.remove("active"));
  const targetContent = document.getElementById("tab-" + name);
  if (targetContent) {
    targetContent.classList.add("active");
  }

  currentActiveTab = name;
  console.log(`Switched to Events tab: ${name}`);
};

// ==========================================
// 3. FILTERING & DISCOVERY
// ==========================================

/**
 * Toggles category chips and filters the events grid
 */
window.toggleChip = function (el) {
  document
    .querySelectorAll(".filter-chip")
    .forEach((c) => c.classList.remove("on"));
  el.classList.add("on");

  const category = el.textContent.toLowerCase().replace("✦ ", "");
  activeFilter = category;

  filterEventGrid(category);
};

/**
 * Logic to show/hide event cards based on selected filter
 */
function filterEventGrid(filter) {
  const cards = document.querySelectorAll(".ev-card");
  let visibleCount = 0;
  let shownCount = 0;

  cards.forEach((card) => {
    const title = card
      .querySelector(".ev-card-title")
      .textContent.toLowerCase();
    const meta = card.querySelector(".ev-card-meta").textContent.toLowerCase();

    // Simple keyword matching for the prototype
    const isMatch =
      filter === "all events" ||
      title.includes(filter) ||
      meta.includes(filter);

    const shouldShow =
      isMatch && (upcomingExpanded || shownCount < UPCOMING_INITIAL_VISIBLE);
    card.style.display = shouldShow ? "flex" : "none";
    if (shouldShow) {
      visibleCount++;
      shownCount++;
    }
  });

  // Update sub-header text
  const subHeader = document.querySelector("#tab-upcoming .section-sub");
  const total = document.querySelectorAll(".events-grid .ev-card").length;
  if (subHeader) {
    subHeader.textContent = `${visibleCount} of ${total} events found for "${filter}"`;
  }

  // update load-more button label
  const moreBtn = document.getElementById("load-more-events-btn");
  if (moreBtn) {
    const hiddenCount = Math.max(0, total - visibleCount);
    moreBtn.textContent =
      hiddenCount > 0 ? `Load more (${hiddenCount})` : "Show less";
  }
}

const UPCOMING_INITIAL_VISIBLE = 4;
let upcomingExpanded = false;

function updateUpcomingVisibility() {
  const cards = document.querySelectorAll(".events-grid .ev-card");
  const total = cards.length;
  let visibleCount = 0;

  cards.forEach((card, idx) => {
    const isVisible = upcomingExpanded || idx < UPCOMING_INITIAL_VISIBLE;
    card.style.display = isVisible ? "flex" : "none";
    if (isVisible) visibleCount++;
  });

  const subHeader = document.querySelector("#tab-upcoming .section-sub");
  if (subHeader) {
    subHeader.textContent = `${visibleCount} of ${total} events across your communities`;
  }

  const moreBtn = document.getElementById("load-more-events-btn");
  if (moreBtn) {
    if (total <= UPCOMING_INITIAL_VISIBLE) {
      moreBtn.style.display = "none";
    } else {
      moreBtn.style.display = "block";
      moreBtn.textContent = upcomingExpanded
        ? "Show less"
        : `Load more (${total - visibleCount})`;
    }
  }
}

window.toggleLoadMoreEvents = function () {
  upcomingExpanded = !upcomingExpanded;
  updateUpcomingVisibility();
};

// ==========================================
// 3.5 DYNAMIC EVENTS LOADING
// ==========================================

function loadEventsFromStorage() {
  return JSON.parse(localStorage.getItem(COMMUNITY_EVENTS_STORAGE_KEY) || "[]");
}

function renderDynamicEvents() {
  const events = loadEventsFromStorage();
  const communities = JSON.parse(
    localStorage.getItem("nexus_communities") || "[]",
  );
  const eventsGrid = document.querySelector(".events-grid");
  if (!eventsGrid) return;

  // Add dynamic events to the grid
  events.forEach((event, index) => {
    const community = communities.find((c) => c.id === event.communityId) || {};
    const eventCard = document.createElement("div");
    eventCard.className = "ev-card delay-dynamic";
    eventCard.setAttribute("data-event-id", event.id);
    eventCard.innerHTML = `
            <div class="ev-card-banner" style="background: linear-gradient(135deg, var(--accent), var(--bg-card));">
                <div class="ev-card-banner-inner">${community.emoji || "📅"}</div>
                <div class="ev-card-badges">
                    <span class="ev-badge badge-online">${event.location || "Online"}</span>
                </div>
            </div>
            <div class="ev-card-body">
                <div class="ev-card-top">
                    <div class="ev-date-box">
                        <div class="ev-date-mon">${event.month || "TBD"}</div>
                        <div class="ev-date-day">${event.day || ""}</div>
                    </div>
                    <div>
                        <div class="ev-card-title">${event.title}</div>
                        <div class="ev-card-comm">
                            <div class="ev-comm-av">${community.emoji || "⚡"}</div>
                            <div class="ev-comm-name">${community.name || "Community"}</div>
                        </div>
                    </div>
                </div>
                <div class="ev-card-meta">
                    <div class="ev-meta-tag">⏰ ${event.time || "TBD"}</div>
                    <div class="ev-meta-tag">${event.location || "🌐 Online"}</div>
                    <div class="ev-meta-tag">${event.description || "🎉 Event"}</div>
                </div>
                <div class="ev-card-footer">
                    <div class="ev-attendees">👥 0 going</div>
                    <button class="btn-ev" onclick="toggleReg(this)">Register</button>
                </div>
            </div>
        `;
    eventsGrid.appendChild(eventCard);
  });

  // Update visibility and counts
  updateUpcomingVisibility();
}

// ==========================================
// 4. REGISTRATION LOGIC
// ==========================================

function getEventDataFromCard(card) {
  const title =
    card.querySelector(".ev-card-title")?.textContent || "Untitled Event";
  const month = card.querySelector(".ev-date-mon")?.textContent || "";
  const day = card.querySelector(".ev-date-day")?.textContent || "";
  const date = month && day ? `${month} ${day}` : "";
  const timeTag = Array.from(card.querySelectorAll(".ev-meta-tag")).find((t) =>
    t.textContent.includes("⏰"),
  );
  const time = timeTag ? timeTag.textContent.replace("⏰ ", "") : "";
  const community = card.querySelector(".ev-comm-name")?.textContent || "";
  const typeTag = Array.from(card.querySelectorAll(".ev-meta-tag")).find(
    (t) =>
      t.textContent.includes("🌐") ||
      t.textContent.includes("📍") ||
      t.textContent.includes("🔀"),
  );
  const type = typeTag ? typeTag.textContent : "";
  const categoryTag = Array.from(card.querySelectorAll(".ev-meta-tag")).find(
    (t) =>
      !t.textContent.includes("⏰") &&
      !t.textContent.includes("📍") &&
      !t.textContent.includes("🌐") &&
      !t.textContent.includes("🔀"),
  );
  const category = categoryTag ? categoryTag.textContent : "";
  return { title, date, time, community, type, category };
}

function addToMyRegistrations(eventData) {
  const regList = document.querySelector(".reg-list");
  if (!regList) return;

  const exists = Array.from(regList.querySelectorAll(".reg-card")).find(
    (card) => card.querySelector(".reg-title")?.textContent === eventData.title,
  );
  if (exists) return;

  const [month, day] = eventData.date.split(" ");
  const regCard = document.createElement("div");
  regCard.className = "reg-card";
  regCard.innerHTML = `
        <div class="reg-date-box"><div class="reg-mon">${month || ""}</div><div class="reg-day">${day || ""}</div></div>
        <div class="reg-info">
            <div class="reg-title">${eventData.title}</div>
            <div class="reg-meta">
                <div class="reg-meta-item">⏰ ${eventData.time}</div>
                <div class="reg-meta-item">${eventData.type || "🌐 Online"}</div>
                <div class="reg-meta-item">${eventData.community || "⚡ Pro Gamers"}</div>
                <div class="reg-meta-item">${eventData.category || "🏆"}</div>
            </div>
            <div class="reg-status-row">
                <span class="reg-status status-confirmed">✓ Confirmed</span>
                <span class="ticket-id">TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-6)}</span>
            </div>
        </div>
        <div class="reg-actions">
            <button class="btn-add-cal">📅 Add to Calendar</button>
            <button class="btn-cancel">Cancel</button>
        </div>
    `;
  regList.insertBefore(regCard, regList.firstChild);
  updateRegistrationCount();
}

function removeFromMyRegistrations(title) {
  const regList = document.querySelector(".reg-list");
  if (!regList) return;
  const exists = Array.from(regList.querySelectorAll(".reg-card")).find(
    (card) => card.querySelector(".reg-title")?.textContent === title,
  );
  if (exists) {
    exists.remove();
    updateRegistrationCount();
  }
}

function updateRegistrationCount() {
  const count = document.querySelectorAll(".reg-list .reg-card").length;
  const tabButton = Array.from(document.querySelectorAll(".tab-btn")).find(
    (btn) => btn.textContent.includes("My Registrations"),
  );
  if (tabButton) {
    const span = tabButton.querySelector(".tab-count");
    if (span) {
      span.textContent = count;
    }
  }
}

/**
 * Toggles the registration state of an event card
 */
window.toggleReg = function (btn) {
  const isRegistered = btn.classList.contains("registered");
  const card = btn.closest(".ev-card");
  const cardTitle = card.querySelector(".ev-card-title")?.textContent || "";

  if (isRegistered) {
    btn.classList.remove("registered");
    btn.textContent = "Register";
    if (window.toast)
      window.toast(`Unregistered from ${cardTitle.substring(0, 20)}...`);
    removeFromMyRegistrations(cardTitle);
  } else {
    btn.classList.add("registered");
    btn.textContent = "✓ Registered";
    if (window.toast)
      window.toast(
        `Successfully registered for ${cardTitle.substring(0, 20)}! 🎟`,
      );
    const eventData = getEventDataFromCard(card);
    addToMyRegistrations(eventData);
  }
};

window.registerFeaturedEvent = function (btn) {
  const featured = document.querySelector(".featured-event .feat-content");
  if (!featured) return;

  const title =
    featured.querySelector(".feat-title")?.textContent ||
    "March Hack Sprint 2025";
  const dateText =
    featured.querySelector(".feat-meta-item")?.textContent ||
    "March 7 – 8, 2025";
  const timeText =
    featured.querySelector(".feat-meta-item:nth-child(2)")?.textContent ||
    "Starts 2:00 PM IST";
  const typeText =
    featured.querySelector(".feat-badge-row .ev-badge")?.textContent ||
    "🌐 Online";

  const eventData = {
    title,
    date: dateText.replace("🗓 ", ""),
    time: timeText.replace("⏰ ", ""),
    community:
      featured
        .querySelector(".feat-community .feat-comm-name")
        ?.textContent.replace("Hosted by ", "") || "Pro Gamers",
    type: typeText,
    category: "🏆 Hackathon",
  };

  if (!btn.classList.contains("registered")) {
    btn.classList.add("registered");
    btn.textContent = "✓ Registered";
    addToMyRegistrations(eventData);
    if (window.toast) window.toast(`Successfully registered for ${title}! 🎟`);
  } else {
    btn.classList.remove("registered");
    btn.textContent = "Register Now";
    removeFromMyRegistrations(title);
    if (window.toast) window.toast(`Registration canceled for ${title}.`);
  }
};

function cancelRegistration(el) {
  const regCard = el.closest(".reg-card");
  if (!regCard) return;

  const title = regCard.querySelector(".reg-title")?.textContent || "";
  if (window.toast) window.toast(`Registration canceled for ${title}.`);
  regCard.remove();
  updateRegistrationCount();

  // Reflect state in event list if matching card exists
  const eventCard = Array.from(document.querySelectorAll(".ev-card")).find(
    (c) => c.querySelector(".ev-card-title")?.textContent === title,
  );
  if (eventCard) {
    const btn = eventCard.querySelector(".btn-ev");
    if (btn) {
      btn.classList.remove("registered");
      btn.textContent = "Register";
    }
  }
}

function addToCalendar(el) {
  const regCard = el.closest(".reg-card");
  if (!regCard) return;

  const title =
    regCard.querySelector(".reg-title")?.textContent || "Gameunity Event";
  const timeLine =
    regCard.querySelector(".reg-meta .reg-meta-item")?.textContent || "";
  const dateText =
    regCard.querySelector(".reg-date-box .reg-mon")?.textContent +
    " " +
    regCard.querySelector(".reg-date-box .reg-day")?.textContent;

  // Attempt simple date-time parse
  const timeMatch = timeLine.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
  const timeStr = timeMatch ? timeMatch[1] : "17:00";
  const monthMap = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };
  const [mon, day] = (dateText || "").split(" ");
  const year = new Date().getFullYear();

  let startDate, endDate;
  if (monthMap[mon] && day) {
    const dateString = `${year}-${String(monthMap[mon]).padStart(2, "0")}-${String(day).padStart(2, "0")} ${timeStr}`;
    startDate = new Date(dateString);
    if (isNaN(startDate)) {
      startDate = new Date();
    }
  } else {
    startDate = new Date();
  }
  endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const toYmd = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toYmd(startDate)}/${toYmd(endDate)}&details=${encodeURIComponent("Added via Gameunity event manager")}`;

  window.open(googleUrl, "_blank");
}

// Attach click handling for dynamic and static row buttons
document.addEventListener("click", function (e) {
  if (e.target.closest(".btn-add-cal")) {
    e.preventDefault();
    addToCalendar(e.target.closest(".btn-add-cal"));
    return;
  }

  if (e.target.closest(".btn-cancel")) {
    e.preventDefault();
    cancelRegistration(e.target.closest(".btn-cancel"));
    return;
  }
});

// ==========================================
// 5. EVENT CREATION WIZARD
// ==========================================

window.setType = function (el, type) {
  document
    .querySelectorAll(".type-opt")
    .forEach((o) => o.classList.remove("on"));
  el.classList.add("on");
  updatePreview();
};

let selectedCoverImageFile = null;

function showUploadPreview(file) {
  const preview = document.getElementById("uploadPreview");
  const uploadText = document.getElementById("uploadText");
  const previewBanner = document.querySelector(".preview-banner");

  if (!file) {
    if (preview) preview.style.display = "none";
    if (uploadText) uploadText.textContent = "Drag & drop or click to upload";
    if (previewBanner) {
      previewBanner.style.backgroundImage = "";
      previewBanner.style.backgroundSize = "";
      previewBanner.textContent = "📅";
    }
    return;
  }

  const url = URL.createObjectURL(file);
  if (preview) {
    preview.style.display = "block";
    preview.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><img src="${url}" alt="Cover preview" style="max-width:72px;max-height:72px;border-radius:8px;object-fit:cover;"/><span>${file.name}</span></div>`;
  }

  if (uploadText) uploadText.textContent = file.name;
  if (previewBanner) {
    previewBanner.style.backgroundImage = `url('${url}')`;
    previewBanner.style.backgroundSize = "cover";
    previewBanner.style.backgroundPosition = "center";
    previewBanner.textContent = "";
  }
}

/**
 * Synchronizes form inputs with the live preview card
 */
window.updatePreview = function () {
  const titleInput = document.getElementById("evTitle");
  const dateInput = document.getElementById("evDate");
  const timeInput = document.getElementById("evTime");

  const prevTitle = document.getElementById("prevTitle");
  const prevDate = document.getElementById("prevDate");

  if (prevTitle) {
    prevTitle.textContent = titleInput.value || "Your event title";
  }

  if (dateInput && prevDate) {
    const dateVal = dateInput.value;
    const timeVal = timeInput.value;

    if (dateVal) {
      try {
        const d = new Date(`${dateVal}T${timeVal || "00:00"}`);
        const dateStr = d.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const timeStr = timeVal
          ? ` · ⏰ ${d.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "";

        prevDate.textContent = `🗓 ${dateStr}${timeStr}`;
      } catch (e) {
        prevDate.textContent = "🗓 Invalid date selected";
      }
    } else {
      prevDate.textContent = "🗓 Select a date and time";
    }
  }
};

function buildEventCard(data) {
  const { title, date, time, type, community, category, coverUrl } = data;
  const eventDate = new Date(`${date}T${time}`);
  const month = eventDate.toLocaleString("en-US", { month: "short" });
  const day = eventDate.getDate();
  const timeDisplay = eventDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const communityName = community.replace(/^\S+\s*/, "").trim();
  const communityEmoji = community.split(" ")[0] || "⚡";

  const typeBadge =
    {
      Online: "🌐 Online",
      "In-Person": "📍 In-Person",
      Hybrid: "🔀 Hybrid",
    }[type] || "🌐 Online";

  const card = document.createElement("div");
  card.className = "ev-card";
  card.innerHTML = `
        <div class="ev-card-banner" style="background-image:url('${coverUrl}');background-size:cover;background-position:center;">
            <div class="ev-card-badges"><span class="ev-badge badge-${type.toLowerCase().replace(/[^a-z]/g, "")}">${typeBadge}</span></div>
        </div>
        <div class="ev-card-body">
            <div class="ev-card-top">
                <div class="ev-date-box"><div class="ev-date-mon">${month}</div><div class="ev-date-day">${day}</div></div>
                <div><div class="ev-card-title">${title}</div><div class="ev-card-comm"><div class="ev-comm-av">${communityEmoji}</div><div class="ev-comm-name">${communityName}</div></div></div>
            </div>
            <div class="ev-card-meta">
                <div class="ev-meta-tag">⏰ ${timeDisplay} IST</div>
                <div class="ev-meta-tag">${typeBadge}</div>
                <div class="ev-meta-tag">${category}</div>
            </div>
            <div class="ev-card-footer">
                <div class="ev-attendees">👥 0 going</div>
                <button class="btn-ev" onclick="toggleReg(this)">Register</button>
            </div>
        </div>
    `;

  return card;
}

function appendEventToUpcoming(data) {
  const grid = document.querySelector(".events-grid");
  if (!grid) return;
  const newCard = buildEventCard(data);
  grid.insertBefore(newCard, grid.firstChild);
}

function resetCreateForm() {
  document.getElementById("evTitle").value = "";
  document.querySelector("#tab-create textarea").value = "";
  document.getElementById("evDate").value = "";
  document.getElementById("evTime").value = "";
  document.getElementById("evCommunity").selectedIndex = 0;
  document.getElementById("evCategory").selectedIndex = 0;
  document.getElementById("evMax").value = "";
  selectedCoverImageFile = null;
  showUploadPreview(null);
  document.querySelector(".type-opt.on")?.classList.remove("on");
  document.querySelector(".type-opt")?.classList.add("on");
  updatePreview();
}

// ==========================================
// 6. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Enforce role-based create event permissions
  enforceCreateEventPermissions();

  // Load and render dynamic events from localStorage
  renderDynamicEvents();

  // Check for event query parameter and scroll to it
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event");
  if (eventId) {
    // Wait a bit for DOM to be fully rendered
    setTimeout(() => {
      const eventElement = document.querySelector(
        `[data-event-id="${eventId}"]`,
      );
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add a highlight effect
        eventElement.style.boxShadow = "0 0 20px var(--accent)";
        setTimeout(() => {
          eventElement.style.boxShadow = "";
        }, 3000);
      }
    }, 500);
  }

  // Set initial date in the form to today for convenience
  const dateField = document.getElementById("evDate");
  if (dateField) {
    const today = new Date().toISOString().split("T")[0];
    dateField.setAttribute("min", today);
  }

  updateUpcomingVisibility();

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("evCover");
  const publishBtn = document.getElementById("publishEventBtn");

  function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (uploadArea && fileInput) {
    uploadArea.addEventListener("click", () => fileInput.click());

    uploadArea.addEventListener("dragover", (event) => {
      preventDefault(event);
      uploadArea.classList.add("drag-over");
    });

    uploadArea.addEventListener("dragleave", (event) => {
      preventDefault(event);
      uploadArea.classList.remove("drag-over");
    });

    uploadArea.addEventListener("drop", (event) => {
      preventDefault(event);
      uploadArea.classList.remove("drag-over");
      const file = event.dataTransfer.files[0];
      if (file) {
        selectedCoverImageFile = file;
        showUploadPreview(file);
      }
    });

    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        selectedCoverImageFile = file;
        showUploadPreview(file);
      }
    });
  }

  if (publishBtn) {
    publishBtn.addEventListener("click", (event) => {
      event.preventDefault();

      const title = document.getElementById("evTitle").value.trim();
      const date = document.getElementById("evDate").value;
      const time = document.getElementById("evTime").value;

      const missingFields = [];
      if (!title) missingFields.push("Event title");
      if (!date) missingFields.push("Date");
      if (!time) missingFields.push("Time");
      if (!selectedCoverImageFile) missingFields.push("Cover image");

      if (missingFields.length > 0) {
        const msg = `Please add: ${missingFields.join(", ")} before publishing.`;
        if (window.toast) window.toast(msg, { type: "error" });
        else alert(msg);
        return;
      }

      publishBtn.textContent = "✓ Published!";
      publishBtn.style.background = "linear-gradient(135deg,#34D399,#059669)";

      const type =
        document.querySelector(".type-opt.on")?.textContent.trim() || "Online";
      const community =
        document.getElementById("evCommunity")?.value || "⚡ Pro Gamers";
      const category =
        document.getElementById("evCategory")?.value || "🏆 Hackathon";
      const coverUrl = selectedCoverImageFile
        ? URL.createObjectURL(selectedCoverImageFile)
        : "";

      appendEventToUpcoming({
        title,
        date,
        time,
        type,
        community,
        category,
        coverUrl,
      });

      if (window.toast) window.toast("Event published successfully! 🎉");

      setTimeout(() => {
        publishBtn.textContent = "Publish Event";
        publishBtn.style.background = "";
      }, 2500);

      resetCreateForm();
    });
  }

  // Keep live preview in sync as the user types / selects
  ["evTitle", "evDate", "evTime"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.addEventListener("input", updatePreview);
  });

  console.log("Events module initialized. Happy hosting! 📅");
});
