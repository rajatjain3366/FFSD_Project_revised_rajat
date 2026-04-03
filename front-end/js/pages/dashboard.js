/**
 * Gameunity — Home Dashboard Logic
 * Handles community interactions, join states, and notification management.
 */

// ==========================================
// 1. STATE & MOCK DATA
// ==========================================
let unreadMessages = 12;

// ==========================================
// 2. SIDEBAR TOGGLE FUNCTIONALITY
// ==========================================

/**
 * Toggles sidebar expansion state
 * Switches between compact (72px) and expanded (240px) modes
 */
window.toggleSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.toggle("expanded");
  }
};

window.toggleJoin = function (btn) {
  const card = btn.closest(".rec-card");
  const isJoined = btn.classList.contains("joined");

  if (!isJoined) {
    // Join State
    btn.classList.add("joined");
    btn.textContent = "✓ Joined";

    // Optional: Trigger global toast if available
    if (window.toast) {
      const name = card.querySelector(".rec-name").textContent;
      window.toast(`Welcome to ${name}! 🚀`);
    }

    // Update local stat display if needed
    updateHeaderStats("Communities", 1);
  } else {
    // Unjoin State
    btn.classList.remove("joined");
    btn.textContent = "Join";

    updateHeaderStats("Communities", -1);
  }
};

/**
 * Updates the numbers in the greeting banner dynamically
 */
function updateHeaderStats(label, delta) {
  const stats = document.querySelectorAll(".g-stat");
  stats.forEach((stat) => {
    const statLabel = stat.querySelector(".g-stat-label");
    // Convert to lowercase to prevent bugs if you change "Communities" to "communities" in HTML
    if (
      statLabel &&
      statLabel.textContent.trim().toLowerCase() === label.toLowerCase()
    ) {
      const valEl = stat.querySelector(".g-stat-val");
      let currentVal = parseInt(valEl.textContent) || 0;
      valEl.textContent = Math.max(0, currentVal + delta); // Prevent negative numbers
    }
  });
}
// ==========================================
// 3. NOTIFICATION MANAGEMENT
// ==========================================

/**
 * Clears all unread indicators from the notification list
 */
window.markAllRead = function () {
  const unreadItems = document.querySelectorAll(".notif-item.unread");

  unreadItems.forEach((item) => {
    item.classList.remove("unread");
    item.classList.add("read"); // This triggers the CSS change to green
  });

  // Also update the header bell badge if it exists
  const headerBadge = document.querySelector(".header-actions .notif-dot");
  if (headerBadge) {
    headerBadge.style.background = "var(--success)";
  }

  if (window.toast) window.toast("Notifications marked as read");
};

// ==========================================
// 4. AUTHENTICATION
// ==========================================

/**
 * Handles user logout functionality
 * Clears session data and redirects to login page
 */
window.logout = function () {
  // 1. Instantly disable the page to prevent clicks during the delay
  document.body.style.pointerEvents = "none";
  document.body.style.transition = "opacity 0.5s ease";
  document.body.style.opacity = "0.5";

  // 2. Clear session data
  localStorage.removeItem("nexus_user");
  localStorage.removeItem("nexus_owned_communities");
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  sessionStorage.clear();
  localStorage.clear();

  // Show confirmation toast if available
  if (window.toast) {
    window.toast("Logging out... 👋");
  }

  // 3. Use location.replace() instead of location.href
  setTimeout(() => {
    // .replace() overwrites the current history state, meaning
    // the user CANNOT use the back button to return to the dashboard
    window.location.replace("landing.html");
  }, 800); // Slightly faster redirect feels more responsive

  localStorage.removeItem("visited_communities");
};

// 4. Add a BFCache (Back-Forward Cache) check
// This ensures that if the browser aggressively caches the page,
// hitting "Back" will force a hard reload and kick them out.
window.addEventListener("pageshow", function (event) {
  if (event.persisted && !localStorage.getItem("userToken")) {
    window.location.replace("landing.html");
  }
});

// ==========================================
// 5. SCROLL UTILITIES
// ==========================================

/**
 * Enables smooth mouse-wheel horizontal scrolling for the community list
 */
function initHorizontalScroll() {
  const scrollContainer = document.querySelector(".communities-scroll");
  if (!scrollContainer) return;

  scrollContainer.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    scrollContainer.scrollLeft += evt.deltaY;
  });
}

// ==========================================
// 5. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initHorizontalScroll();

  // 1. Hide pills for communities already visited in the past
  hideVisitedPills();

  // 2. Listen for clicks on community cards to mark them as visited
  const communityCards = document.querySelectorAll(".comm-card");
  communityCards.forEach((card) => {
    card.addEventListener("click", function () {
      markCommunityAsVisited(this.getAttribute("href"));
    });
  });

  // --- BULLETPROOF: Sidebar Click-Outside Logic ---
  const mainContentArea = document.querySelector(".main");

  if (mainContentArea) {
    mainContentArea.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar");

      // If the sidebar exists and is open, close it!
      if (sidebar && sidebar.classList.contains("expanded")) {
        sidebar.classList.remove("expanded");
      }
    });
  }

  updateNotificationPersistence();

  document.querySelectorAll(".notif-item").forEach((item) => {
    item.addEventListener("click", function () {
      const id = getNotificationId(this);
      let readIds =
        JSON.parse(sessionStorage.getItem("read_notifications")) || [];

      if (!readIds.includes(id)) {
        readIds.push(id);
        sessionStorage.setItem("read_notifications", JSON.stringify(readIds));
      }

      // Navigate to chat
      window.location.href = "chat.html";
    });
  });
    
  console.log("Home Dashboard Module Initialized.");
});

// ==========================================
// 6. VISITED COMMUNITIES TRACKING
// ==========================================

/**
 * Saves a community name to localStorage so its notification pill stays hidden
 */
function markCommunityAsVisited(url) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const communityName = urlParams.get('name');
    
    if (communityName) {
        let visited = JSON.parse(localStorage.getItem('visited_communities')) || [];
        if (!visited.includes(communityName)) {
            visited.push(communityName);
            localStorage.setItem('visited_communities', JSON.stringify(visited));
        }
    }
}

/**
 * Checks localStorage and removes unread pills for already visited communities
 */
function hideVisitedPills() {
    const visited = JSON.parse(localStorage.getItem('visited_communities')) || [];
    const communityCards = document.querySelectorAll('.comm-card');

    communityCards.forEach(card => {
        const url = card.getAttribute('href');
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const communityName = urlParams.get('name');

        if (visited.includes(communityName)) {
            const pill = card.querySelector('.unread-pill');
            if (pill) pill.remove();
        }
    });
}

// ==========================================
// 7. EVENT CARD NAVIGATION
// ==========================================

/**
 * Makes the entire event card clickable to redirect to events.html
 */
const eventCards = document.querySelectorAll('.event-card');
eventCards.forEach(card => {
    card.addEventListener('click', () => {
        window.location.href = 'events.html';
    });
    
    // Optional: Add a pointer cursor so users know it's clickable
    card.style.cursor = 'pointer';
});

// ==========================================
// 8. SESSION-BASED NOTIFICATIONS
// ==========================================

function getNotificationId(item) {
    return item.querySelector('strong').textContent.trim();
}

function updateNotificationPersistence() {
    // Switch to sessionStorage: This clears on reload/close
    const readIds = JSON.parse(sessionStorage.getItem('read_notifications')) || [];
    const list = document.querySelector('.notif-list');
    const items = Array.from(document.querySelectorAll('.notif-item'));

    items.forEach(item => {
        const id = getNotificationId(item);
        
        if (readIds.includes(id)) {
            item.classList.remove('unread');
            item.classList.add('read');
        } else {
            // Ensure they default back to unread if not in session storage
            // This fixes the "reload doesn't bring them back" issue
            if (items.indexOf(item) < 3) { 
                item.classList.add('unread');
                item.classList.remove('read');
            }
        }
    });

    // Re-sort: Unread (Red) first, then newly Read (Green)
    items.sort((a, b) => {
        if (a.classList.contains('unread') && !b.classList.contains('unread')) return -1;
        if (!a.classList.contains('unread') && b.classList.contains('unread')) return 1;
        return 0; 
    });

    if (list) items.forEach(item => list.appendChild(item));
}

window.markAllRead = function() {
    const unreadItems = document.querySelectorAll('.notif-item.unread');
    let readIds = JSON.parse(sessionStorage.getItem('read_notifications')) || [];

    unreadItems.forEach(item => {
        const id = getNotificationId(item);
        if (!readIds.includes(id)) readIds.push(id);
        item.classList.remove('unread');
        item.classList.add('read');
    });

    sessionStorage.setItem('read_notifications', JSON.stringify(readIds));
    updateNotificationPersistence();
};

// ==========================================
// 9. RECOMMENDED CARD NAVIGATION
// ==========================================

/**
 * Redirects to community-page.html when a recommended card is clicked,
 * unless the 'Join' button itself is the target.
 */
const recommendedCards = document.querySelectorAll('.rec-card');

recommendedCards.forEach(card => {
    card.addEventListener('click', (event) => {
        // Check if the clicked element is the Join button or inside it
        const isJoinButton = event.target.closest('.btn-join');
        
        if (!isJoinButton) {
            // Get the community name to pass as a URL parameter
            const nameEl = card.querySelector('.rec-name');
            const name = nameEl ? nameEl.textContent.trim().toLowerCase().replace(/\s+/g, '-') : 'unknown';
            
            // Redirect to the community page
            window.location.href = `community-page.html?name=${name}`;
        }
    });
});
