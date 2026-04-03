/**
 * NexusHub — Appeal Submission Logic
 * Handles form validation, file attachments, and submission states.
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
let attachmentCount = 0;
const MAX_ATTACHMENTS = 3;

// ==========================================
// 2. UTILITIES
// ==========================================

/**
 * Validates the form fields before submission
 */
const validateForm = (data) => {
    const errors = [];
    if (data.text.length < 20) errors.push("Please provide a more detailed explanation (min 20 chars).");
    if (!data.acknowledgement) errors.push("Please select an acknowledgement position.");
    if (!data.resolution) errors.push("Please select a requested resolution.");
    return errors;
};

/**
 * Mock function to simulate file uploading
 */
const mockFileUpload = (fileName) => {
    console.log(`Uploading ${fileName}...`);
    return new Promise(resolve => setTimeout(resolve, 800));
};

// ==========================================
// 3. CORE FUNCTIONS (Window Scoped for HTML)
// ==========================================

/**
 * Adds a "fake" file chip to the UI to simulate file selection
 */
window.openEvidencePicker = function() {
    const input = document.getElementById('evidenceInput');
    if (!input) return;
    input.click();
};

window.handleFileUpload = async function(event) {
    const files = Array.from(event.target.files || []);
    const container = document.getElementById('fileChips');

    if (!container) return;

    for (const file of files) {
        if (attachmentCount >= MAX_ATTACHMENTS) {
            alert('Maximum of 3 files allowed.');
            break;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert(`File ${file.name} is too large. Max 5MB.`);
            continue;
        }

        // Show filename chip while uploading
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.textContent = `📄 ${file.name} (uploading...)`;
        container.appendChild(chip);

        try {
            await mockFileUpload(file.name);
            chip.innerHTML = `📄 ${file.name} <span class="file-chip-remove" onclick="removeFile(this)">✕</span>`;
            attachmentCount++;
        } catch (err) {
            chip.remove();
            alert(`Failed to upload ${file.name}.`);
        }
    }

    // Reset input so same file(s) can be added again if removed
    event.target.value = '';
};

/**
 * Removes a specific file chip
 */
window.removeFile = function(el) {
    el.closest('.file-chip').remove();
    attachmentCount = Math.max(0, attachmentCount - 1);
};

/**
 * Sets the requested resolution option
 */
window.setRes = function(el) {
    document.querySelectorAll('.res-opt').forEach(opt => opt.classList.remove('on'));
    el.classList.add('on');
};

/**
 * Handles the submission process
 */
window.submitAppeal = async function() {
    const appealTextEl = document.getElementById('appealText');
    const ackSelectEl = document.getElementById('ackSelect');
    const submitBtn = document.querySelector('.btn-submit');
    const activeRes = document.querySelector('.res-opt.on .res-label');

    const formData = {
        text: appealTextEl.value.trim(),
        acknowledgement: ackSelectEl.value,
        resolution: activeRes ? activeRes.textContent : null,
        actionId: 'ACT-DNX-2025-003847'
    };

    // Simple visual validation
    const errors = validateForm(formData);
    if (errors.length > 0) {
        alert(errors[0]);
        appealTextEl.style.borderColor = !formData.text ? 'var(--error)' : '';
        ackSelectEl.style.borderColor = !formData.acknowledgement ? 'var(--error)' : '';
        return;
    }

    // UI Feedback: Loading State
    submitBtn.textContent = 'Processing Appeal...';
    submitBtn.style.opacity = '0.6';
    submitBtn.disabled = true;

    try {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Transition to Success State
        document.getElementById('formWrap').style.display = 'none';
        document.getElementById('successWrap').classList.add('show');
        
        // Scroll to top of the wrap
        const pageWrap = document.querySelector('.page-wrap');
        if (pageWrap) pageWrap.scrollTop = 0;

        console.log("Appeal Submitted Successfully:", formData);
    } catch (err) {
        alert("Failed to submit appeal. Please try again later.");
        submitBtn.textContent = '⚖️ Submit Appeal';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
};

/**
 * Resets the form and returns to the initial view
 */
window.resetAppeal = function() {
    // Reset Form Display
    document.getElementById('formWrap').style.display = 'block';
    document.getElementById('successWrap').classList.remove('show');
    
    // Reset Inputs
    document.getElementById('appealText').value = '';
    document.getElementById('appealChars').textContent = '0/1000';
    document.getElementById('ackSelect').value = '';
    document.getElementById('fileChips').innerHTML = '';
    attachmentCount = 0;

    // Reset Submit Button
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.textContent = '⚖️ Submit Appeal';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';

    // Reset visual errors
    document.getElementById('appealText').style.borderColor = '';
    document.getElementById('ackSelect').style.borderColor = '';
};

// ==========================================
// 4. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const appealTextArea = document.getElementById('appealText');
    const charCounter = document.getElementById('appealChars');

    // Real-time character counter
    if (appealTextArea && charCounter) {
        appealTextArea.addEventListener('input', (e) => {
            const len = e.target.value.length;
            charCounter.textContent = `${len}/1000`;
            
            // Subtle color change as they approach limit
            if (len > 900) {
                charCounter.style.color = 'var(--error)';
            } else {
                charCounter.style.color = 'var(--text-3)';
            }
        });
    }

    console.log("Appeal submission module initialized.");
});
