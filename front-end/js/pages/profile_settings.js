/**
 * Gameunity — Profile & Settings Logic
 * Handles view switching, form validation, theme selection, file uploads,
 * privacy and accessibility controls, and password visibility.
 */

// Explicitly bind the password toggle to the global window right at the start
window.togglePassword = function(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === "password") {
        input.type = "text";
        iconEl.textContent = "🐵"; // Open eyes
        iconEl.setAttribute('data-tooltip', 'Hide Password');
    } else {
        input.type = "password";
        iconEl.textContent = "🙈"; // Closed eyes
        iconEl.setAttribute('data-tooltip', 'Show Password');
    }
};

let hasUnsavedChanges = false;
let toastDebounce;
let tempAvatarDataURL = null; 

window.switchView = function (viewId, navEl) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById('view-' + viewId);
    if (targetView) targetView.classList.add('active');

    document.querySelectorAll('.ln-item').forEach(i => i.classList.remove('active'));
    if (navEl) navEl.classList.add('active');
};

function setupProfileSync() {
    const nameInput = document.getElementById('inpFullName');
    const handleInput = document.getElementById('inpHandle');
    const sidebarName = document.getElementById('navName');
    const sidebarHandle = document.getElementById('navHandle');
    const hintHandle = document.getElementById('hintHandle');

    const fNameInput = document.getElementById('inpFirstName');
    const lNameInput = document.getElementById('inpLastName');

    function updateInitials() {
        if (tempAvatarDataURL && tempAvatarDataURL !== "removed") return; 
        
        let fName = fNameInput ? fNameInput.value.trim() : "";
        let lName = lNameInput ? lNameInput.value.trim() : "";
        let initials = "U"; 
        
        if (fName && lName) {
            initials = fName.charAt(0).toUpperCase() + lName.charAt(0).toUpperCase();
        } else if (fName) {
            initials = fName.charAt(0).toUpperCase();
        }

        ['topBarAvatar', 'navMainAvatar', 'mainAvatarPreview'].forEach(id => {
            const av = document.getElementById(id);
            if (av && (!av.style.backgroundImage || av.style.backgroundImage === 'none')) {
                av.innerText = initials;
            }
        });
    }

    if (fNameInput) fNameInput.addEventListener('input', () => { updateInitials(); markAsDirty(); });
    if (lNameInput) lNameInput.addEventListener('input', () => { updateInitials(); markAsDirty(); });

    if (nameInput && sidebarName) {
        nameInput.addEventListener('input', (e) => {
            sidebarName.textContent = e.target.value || "New User";
            markAsDirty();
        });
    }

    if (handleInput && sidebarHandle) {
        handleInput.addEventListener('input', (e) => {
            const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
            sidebarHandle.textContent = val ? `@${val}` : "@username";
            if (hintHandle) hintHandle.textContent = val;
            markAsDirty();
        });
    }

    document.querySelectorAll('.main input, .main textarea, .main select').forEach(input => {
        input.addEventListener('input', markAsDirty);
        input.addEventListener('change', markAsDirty);
    });
}

function markAsDirty() {
    hasUnsavedChanges = true;
    validateForms(); 
}

window.setStatus = function (el) {
    document.querySelectorAll('.status-badge').forEach(b => b.classList.remove('on'));
    el.classList.add('on');

    const statusText = el.textContent.trim();
    const sidebarStatus = document.querySelector('.profile-status');
    if (sidebarStatus) sidebarStatus.textContent = statusText;

    window.toast(`Status updated to ${statusText}`);
    markAsDirty();
};

window.setTheme = function (el) {
    document.querySelectorAll('.theme-opt').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    const themeName = el.querySelector('.theme-label').textContent;
    window.toast(`Theme preview: ${themeName}`);
    markAsDirty();
};

window.toggleSwitch = function (el) {
    el.classList.toggle('on');
    markAsDirty();
};

window.logout = function () {
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_current_user');
    window.toast("Logging out... 👋");
    setTimeout(() => {
        window.location.href = 'landing.html';
    }, 1000);
};

window.toast = function (msg) {
    const t = document.getElementById('toast');
    const m = document.getElementById('toastMsg');
    if (!t || !m) return;

    m.textContent = msg;
    t.classList.add('show');

    clearTimeout(toastDebounce);
    toastDebounce = setTimeout(() => t.classList.remove('show'), 2500);
};

/* --- VALIDATION LOGIC --- */

window.validateInput = function (input) {
    const errorSpan = document.getElementById(`err-${input.id}`);
    let isValid = true;
    let errorMessage = "";

    const isPassword = ['inpCurrentPwd', 'inpNewPwd', 'inpConfirmPwd'].includes(input.id);
    const isRecovery = input.id === 'inpRecovery';
    
    if (!input.value.trim() && !isPassword && !isRecovery) {
        isValid = false;
        errorMessage = "This field is required.";
    } else if (input.value.trim()) {
        if ((input.type === 'email' || isRecovery) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
            isValid = false;
            errorMessage = "Invalid email format.";
        }
        if (input.id === 'inpConfirmPwd') {
            const pwd = document.getElementById('inpNewPwd').value;
            if (input.value !== pwd) {
                isValid = false;
                errorMessage = "Passwords do not match.";
            }
        }
    }

    if (!isValid) {
        input.classList.add('error-border');
        if (errorSpan) {
            errorSpan.textContent = errorMessage;
            errorSpan.classList.add('show');
        }
    } else {
        input.classList.remove('error-border');
        if (errorSpan) {
            errorSpan.classList.remove('show');
            // Reset text back to default if it was changed by the password check
            if (input.id === 'inpCurrentPwd') {
                errorSpan.textContent = "Current password is required to set a new one.";
            }
        }
    }

    markAsDirty();
};

function validateForms() {
    const requiredInputs = [
        'inpFirstName', 'inpLastName', 'inpHandle', 'inpFullName', 
        'inpEmail', 'inpPhone'
    ];
    let allValid = true;

    requiredInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el && (!el.value.trim() || el.classList.contains('error-border'))) {
            allValid = false;
        }
    });

    const recoveryEl = document.getElementById('inpRecovery');
    if (recoveryEl && recoveryEl.classList.contains('error-border')) {
        allValid = false;
    }

    const curPwd = document.getElementById('inpCurrentPwd')?.value;
    const newPwd = document.getElementById('inpNewPwd')?.value;
    const confPwd = document.getElementById('inpConfirmPwd')?.value;

    if (curPwd || newPwd || confPwd) {
        if (!curPwd || !newPwd || !confPwd || (newPwd !== confPwd)) {
            allValid = false; 
        }
    }

    const saveBtn = document.getElementById('btnSaveAll');
    if (saveBtn) {
        saveBtn.disabled = !(allValid && hasUnsavedChanges);
        
        if (!saveBtn.disabled) {
            saveBtn.classList.add('pulse');
        } else {
            saveBtn.classList.remove('pulse');
        }
    }
    return allValid;
}

window.saveAllChanges = function () {
    if (!hasUnsavedChanges) {
        return;
    }
    
    if (!validateForms()) {
        window.toast("Please fill all required fields across all tabs.");
        return;
    }

    // --- PASSWORD VERIFICATION LOGIC ---
    const userStr = localStorage.getItem('nexus_current_user');
    let user = userStr ? JSON.parse(userStr) : {};
    
    // Set a default mock password if they haven't saved one yet
    const actualPassword = user.password || "password123"; 

    const curPwd = document.getElementById('inpCurrentPwd')?.value;
    const newPwd = document.getElementById('inpNewPwd')?.value;
    const confPwd = document.getElementById('inpConfirmPwd')?.value;

    if (curPwd || newPwd || confPwd) {
        if (curPwd !== actualPassword) {
            window.toast("❌ Incorrect current password!");
            const curInput = document.getElementById('inpCurrentPwd');
            const curErr = document.getElementById('err-inpCurrentPwd');
            if (curInput) curInput.classList.add('error-border');
            if (curErr) {
                curErr.textContent = "Incorrect current password.";
                curErr.classList.add('show');
            }
            return; // 🛑 BLOCK THE SAVE COMPLETELY
        }
        // If password is correct, update to the new one
        user.password = newPwd;
    }
    // ------------------------------------

    const saveBtn = document.getElementById('btnSaveAll');
    if (saveBtn) {
        saveBtn.textContent = "Saving...";
        saveBtn.disabled = true;
        saveBtn.classList.remove('pulse');
    }

    setTimeout(() => {
        hasUnsavedChanges = false;

        user.firstName = document.getElementById('inpFirstName').value.trim();
        user.lastName = document.getElementById('inpLastName').value.trim();
        user.fullName = document.getElementById('inpFullName').value.trim();
        user.handle = document.getElementById('inpHandle').value.trim();
        user.email = document.getElementById('inpEmail').value.trim();
        user.phone = document.getElementById('inpPhone').value.trim();
        
        const recoveryInput = document.getElementById('inpRecovery');
        if (recoveryInput) user.recoveryEmail = recoveryInput.value.trim();
        
        if (tempAvatarDataURL) {
            user.avatarUrl = tempAvatarDataURL;
        }

        let newInitials = "U";
        if (user.firstName && user.lastName) {
            newInitials = user.firstName.charAt(0).toUpperCase() + user.lastName.charAt(0).toUpperCase();
        } else if (user.fullName && user.fullName.length >= 2) {
            newInitials = user.fullName.substring(0, 2).toUpperCase();
        }
        user.initials = newInitials;

        localStorage.setItem('nexus_current_user', JSON.stringify(user));
        
        // Clear password fields and reset monkey eyes after save
        ['inpCurrentPwd', 'inpNewPwd', 'inpConfirmPwd'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                el.type = 'password'; 
                const toggle = el.nextElementSibling;
                if (toggle && toggle.classList.contains('pwd-toggle')) {
                    toggle.textContent = '🙈'; 
                }
            }
        });

        loadUserData();

        if (saveBtn) {
            saveBtn.textContent = "Save Changes";
            saveBtn.disabled = true;
        }
        window.toast("✅ All changes saved successfully!");
    }, 1200);
};

/* --- PHOTO UPLOAD LOGIC --- */
window.openPhotoModal = function (e) {
    if (e) e.stopPropagation();
    document.getElementById('photoModal').classList.add('show');
};

window.closePhotoModal = function () {
    document.getElementById('photoModal').classList.remove('show');
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('dropZone').style.display = 'block';
    document.getElementById('btnApplyPhoto').disabled = true;
    document.getElementById('fileInput').value = '';
};

window.handleFileSelect = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB. Please choose a smaller image.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        tempAvatarDataURL = event.target.result;
        document.getElementById('dropZone').style.display = 'none';
        document.getElementById('filePreview').style.display = 'block';
        document.getElementById('imgPreview').src = tempAvatarDataURL;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('btnApplyPhoto').disabled = false;
    };
    reader.readAsDataURL(file);
};

window.applyUploadedPhoto = function () {
    if (!tempAvatarDataURL) return;
    
    const previews = ['mainAvatarPreview', 'navMainAvatar', 'topBarAvatar'];
    previews.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.backgroundImage = `url(${tempAvatarDataURL})`;
            el.textContent = '';
        }
    });
    
    closePhotoModal();
    markAsDirty();
    window.toast('Photo updated temporarily. Save changes to keep.');
};

window.removePhoto = function () {
    tempAvatarDataURL = "removed";
    const previews = ['mainAvatarPreview', 'navMainAvatar', 'topBarAvatar'];
    previews.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.backgroundImage = 'none';
            const userStr = localStorage.getItem('nexus_current_user');
            const initials = userStr ? JSON.parse(userStr).initials : "U";
            el.textContent = initials;
        }
    });
    markAsDirty();
    window.toast('Photo removed. Save changes to apply.');
};

/* --- PRIVACY & ACCESSIBILITY LOGIC --- */
window.updatePrivacySettings = function () {
    const privacy = {
        profileVis: document.getElementById('selProfileVis').value,
        messages: document.getElementById('selMessages').value,
        showEmail: document.getElementById('togEmail').classList.contains('on'),
        showPhone: document.getElementById('togPhone').classList.contains('on'),
        showActivity: document.getElementById('togActivity').classList.contains('on'),
        searchVis: document.getElementById('togSearch').classList.contains('on')
    };
    localStorage.setItem('nexus_privacy', JSON.stringify(privacy));
    markAsDirty();
};

window.updateAccessibility = function () {
    const access = {
        fontSize: document.getElementById('selFontSize').value,
        contrast: document.getElementById('togContrast').classList.contains('on'),
        motion: document.getElementById('togMotion').classList.contains('on'),
        screenReader: document.getElementById('togScreenReader').classList.contains('on'),
        keyboardNav: document.getElementById('togKeyboard').classList.contains('on')
    };
    
    localStorage.setItem('nexus_access', JSON.stringify(access));
    applyAccessibilitySettings(access);
    markAsDirty();
};

function applyAccessibilitySettings(access) {
    if (!access) return;
    document.body.classList.remove('font-small', 'font-large', 'high-contrast', 'reduce-motion');
    
    if (access.fontSize === 'small') document.body.classList.add('font-small');
    if (access.fontSize === 'large') document.body.classList.add('font-large');
    if (access.contrast) document.body.classList.add('high-contrast');
    if (access.motion) document.body.classList.add('reduce-motion');
}

function loadSettingsState() {
    const pStr = localStorage.getItem('nexus_privacy');
    if (pStr) {
        const p = JSON.parse(pStr);
        if(document.getElementById('selProfileVis')) document.getElementById('selProfileVis').value = p.profileVis;
        if(document.getElementById('selMessages')) document.getElementById('selMessages').value = p.messages;
        if(document.getElementById('togEmail')) p.showEmail ? document.getElementById('togEmail').classList.add('on') : document.getElementById('togEmail').classList.remove('on');
        if(document.getElementById('togPhone')) p.showPhone ? document.getElementById('togPhone').classList.add('on') : document.getElementById('togPhone').classList.remove('on');
        if(document.getElementById('togActivity')) p.showActivity ? document.getElementById('togActivity').classList.add('on') : document.getElementById('togActivity').classList.remove('on');
        if(document.getElementById('togSearch')) p.searchVis ? document.getElementById('togSearch').classList.add('on') : document.getElementById('togSearch').classList.remove('on');
    }

    const aStr = localStorage.getItem('nexus_access');
    if (aStr) {
        const a = JSON.parse(aStr);
        if(document.getElementById('selFontSize')) document.getElementById('selFontSize').value = a.fontSize;
        if(document.getElementById('togContrast')) a.contrast ? document.getElementById('togContrast').classList.add('on') : document.getElementById('togContrast').classList.remove('on');
        if(document.getElementById('togMotion')) a.motion ? document.getElementById('togMotion').classList.add('on') : document.getElementById('togMotion').classList.remove('on');
        if(document.getElementById('togScreenReader')) a.screenReader ? document.getElementById('togScreenReader').classList.add('on') : document.getElementById('togScreenReader').classList.remove('on');
        if(document.getElementById('togKeyboard')) a.keyboardNav ? document.getElementById('togKeyboard').classList.add('on') : document.getElementById('togKeyboard').classList.remove('on');
        applyAccessibilitySettings(a);
    }
}

function loadUserData() {
    const storedUser = localStorage.getItem('nexus_current_user');
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    const avatars = ['topBarAvatar', 'navMainAvatar', 'mainAvatarPreview'];

    let calcInitials = "U";
    if (user.firstName && user.lastName) {
        calcInitials = user.firstName.charAt(0).toUpperCase() + user.lastName.charAt(0).toUpperCase();
    } else if (user.initials) {
        calcInitials = user.initials;
    }

    avatars.forEach(id => {
        const av = document.getElementById(id);
        if (av) {
            if (user.avatarUrl && user.avatarUrl !== "removed") {
                av.style.backgroundImage = `url(${user.avatarUrl})`;
                av.textContent = '';
            } else {
                av.style.backgroundImage = 'none';
                av.innerText = calcInitials;
            }
        }
    });

    const sidebarName = document.getElementById('navName');
    const sidebarHandle = document.getElementById('navHandle');
    if (sidebarName) sidebarName.innerText = user.fullName || "User";
    if (sidebarHandle) sidebarHandle.innerText = user.handle ? `@${user.handle}` : "";

    const inputs = {
        'inpFirstName': user.firstName,
        'inpLastName': user.lastName,
        'inpFullName': user.fullName,
        'inpHandle': user.handle,
        'inpEmail': user.email,
        'inpPhone': user.phone,
        'inpRecovery': user.recoveryEmail
    };

    for (const [id, val] of Object.entries(inputs)) {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
    }
    
    const hintHandle = document.getElementById('hintHandle');
    if (hintHandle && user.handle) hintHandle.innerText = user.handle;
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadSettingsState();
    setupProfileSync();
    
    validateForms(); 
    
    const dropZone = document.getElementById('dropZone');
    if(dropZone) {
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                document.getElementById('fileInput').files = e.dataTransfer.files;
                handleFileSelect({target: {files: e.dataTransfer.files}});
            }
        });
    }
});