// Base conversion formula constants
const SPICE_SAND_PER_CRAFT = 10000; // 10,000 spice sand per craft
const MELANGE_PER_CRAFT = 200;      // 200 melange per craft
const RESIDUE_PER_CRAFT = 1000;     // 1,000 residue per craft
const VOLUME_PER_SPICE_SAND = 0.15; // 1 spice sand = 0.15 volume

let discountActive = false;
const discountToggle = document.getElementById('discount-toggle');
const discountLabel = document.getElementById('discount-label');
const modeToggle = document.getElementById('mode-toggle');
const modeLabel = document.getElementById('mode-label');
const mainInput = document.getElementById('main-input');
const mainInputLabel = document.getElementById('main-input-label');
const groupModeToggle = document.getElementById('group-mode-toggle');
const groupModeLabel = document.getElementById('group-mode-label');
const participantsSection = document.getElementById('participants-section');
const groupsSection = document.getElementById('groups-section');
const participantsInput = document.getElementById('participants');
const numGroupsInput = document.getElementById('num-groups');
const groupSizeList = document.getElementById('group-size-list');
const singleResults = document.getElementById('single-results');
const groupResults = document.getElementById('group-results');

let isVolumeMode = false;
let isGroupMode = false;
let groupSizeInputs = [];
let groupNameInputs = [];
let cursorBlinkTimer = null;

function startCursorBlink() {
    if (cursorBlinkTimer) return;
    cursorBlinkTimer = setInterval(() => {
        document.body.classList.toggle('cursor-off');
    }, 500);
}

function renderGroupInputs() {
    let n = Math.max(1, parseInt(numGroupsInput.value) || 0);
    if (n > 10) n = 10;
    if (String(n) !== numGroupsInput.value) numGroupsInput.value = String(n);
    // Rebuild the inputs list each time
    groupSizeList.innerHTML = '';
    groupSizeInputs = [];
    groupNameInputs = [];
    for (let i = 1; i <= n; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'group-input-row';

        const label = document.createElement('label');
        label.textContent = `Group ${i}`;

        // Name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Group name (optional)';
        nameInput.id = `group-name-${i}`;
        nameInput.addEventListener('input', debounceCalculate);

        // Size input
        const sizeContainer = document.createElement('div');
        sizeContainer.style.position = 'relative';
        sizeContainer.style.display = 'inline-block';
        sizeContainer.style.width = 'fit-content';
        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.min = '1';
        sizeInput.max = '99';
        sizeInput.placeholder = 'Size';
        sizeInput.id = `group-size-${i}`;
        sizeInput.classList.add('group-size');
        sizeInput.style.paddingRight = '1.5ch';
        sizeInput.value = '';
        sizeContainer.appendChild(sizeInput);

        wrapper.appendChild(label);
        // Place size input to the left of name
        wrapper.appendChild(sizeContainer);
        wrapper.appendChild(nameInput);
        groupSizeList.appendChild(wrapper);
        groupSizeInputs.push(sizeInput);
        groupNameInputs.push(nameInput);
        sizeInput.addEventListener('input', debounceCalculate);
    }
    // Animate rows building in, staggered by index
    Array.from(groupSizeList.children).forEach((row, idx) => {
        row.classList.add('build-in');
        row.style.animationDelay = `${idx * 60}ms`;
        const drop = Math.min(36, 8 + idx * 4); // slightly larger drop for later rows
        row.style.setProperty('--row-drop', `${drop}px`);
    });
}

function updateModeUI() {
    isVolumeMode = modeToggle.checked;
    if (isVolumeMode) {
        modeLabel.textContent = 'Volume Mode';
        mainInputLabel.textContent = 'Total Volume:';
        mainInput.placeholder = 'Enter volume...';
    } else {
        modeLabel.textContent = 'Spice Sand Mode';
        mainInputLabel.textContent = 'Total Spice Sand:';
        mainInput.placeholder = 'Enter spice sand...';
    }
    mainInput.value = '';
    debounceCalculate();
}

modeToggle.addEventListener('change', updateModeUI);

discountToggle.addEventListener('change', function() {
    discountActive = discountToggle.checked;
    discountLabel.textContent = discountActive ? '25% Discount Applied' : 'Apply 25% Discount';
    clearTimeout(debounceTimer);
    calculateResources();
});

function calculateResources() {
    const participants = parseInt(participantsInput.value) || 1;
    let totalSpiceSand = 0;
    if (isVolumeMode) {
        const volume = parseFloat(mainInput.value) || 0;
        totalSpiceSand = volume ? volume / VOLUME_PER_SPICE_SAND : 0;
    } else {
        totalSpiceSand = parseFloat(mainInput.value) || 0;
    }

    // Use correct conversion rates based on discount
    let sandPerCraft, melangePerCraft, residuePerCraft;
    if (discountActive) {
        sandPerCraft = SPICE_SAND_PER_CRAFT;
        melangePerCraft = 250;
        residuePerCraft = 1250;
    } else {
        sandPerCraft = SPICE_SAND_PER_CRAFT;
        melangePerCraft = MELANGE_PER_CRAFT;
        residuePerCraft = RESIDUE_PER_CRAFT;
    }

    // Calculate melange and residue proportionally
    const totalMelange = (totalSpiceSand / sandPerCraft) * melangePerCraft;
    const totalResidue = (totalSpiceSand / sandPerCraft) * residuePerCraft;

    // Handle participants vs groups display
    if (!isGroupMode) {
        const spiceSandDisplay = (totalSpiceSand / participants).toFixed(2);
        const melangeDisplay = (totalMelange / participants).toFixed(2);
        const residueDisplay = (totalResidue / participants).toFixed(2);

        document.getElementById('spice-sand').innerText = spiceSandDisplay;
        document.getElementById('melange').innerText = melangeDisplay;
        document.getElementById('residue').innerText = residueDisplay;

        // Ensure the heading reflects normal totals context
        const totalsHeading = document.querySelector('.container h2');
        if (totalsHeading) totalsHeading.textContent = 'Totals';
        singleResults.style.display = '';
        groupResults.innerHTML = '';
    } else {
        const numGroups = Math.min(10, Math.max(1, parseInt(numGroupsInput.value) || 0));
        const sizes = [];
        const names = [];
        for (let i = 0; i < numGroups; i++) {
            const v = groupSizeInputs[i] ? parseInt(groupSizeInputs[i].value) : NaN;
            sizes.push(Math.max(1, isNaN(v) ? 0 : v));
            const name = (groupNameInputs[i] && groupNameInputs[i].value || '').trim();
            names.push(name || `Group ${i + 1}`);
        }
        const totalParticipants = Math.max(1, sizes.reduce((a, b) => a + b, 0));

        // Compute and render list of groups with proportional totals
        const gSpice = [], gMelange = [], gResidue = [], pSpice = [], pMelange = [], pResidue = [];
        groupResults.innerHTML = '';
        for (let i = 0; i < numGroups; i++) {
            const share = sizes[i] / totalParticipants;
            const spiceSandPerGroup = (totalSpiceSand * share).toFixed(2);
            const melangePerGroup = (totalMelange * share).toFixed(2);
            const residuePerGroup = (totalResidue * share).toFixed(2);
            const spicePerPerson = (parseFloat(spiceSandPerGroup) / sizes[i]).toFixed(2);
            const melangePerPerson = (parseFloat(melangePerGroup) / sizes[i]).toFixed(2);
            const residuePerPerson = (parseFloat(residuePerGroup) / sizes[i]).toFixed(2);
            gSpice[i] = spiceSandPerGroup; gMelange[i] = melangePerGroup; gResidue[i] = residuePerGroup;
            pSpice[i] = spicePerPerson; pMelange[i] = melangePerPerson; pResidue[i] = residuePerPerson;
            const row = document.createElement('div');
            row.className = 'group-card';
            row.innerHTML = `
                <div class="name">${names[i]} (size ${sizes[i]})</div>
                <div class="line"><span class="label">Total Sand</span> | <span class="digital">${spiceSandPerGroup}</span></div>
                <div class="line"><span class="label">Total Melange</span> | <span class="digital">${melangePerGroup}</span></div>
                <div class="line"><span class="label">Total Residue</span> | <span class="digital">${residuePerGroup}</span></div>`;
            groupResults.appendChild(row);
        }
        // Staggered build-in animation for group cards
        Array.from(groupResults.children).forEach((el, idx) => {
            // Set a vertical drop distance based on this group's size
            const sz = sizes[idx] || 1;
            const drop = Math.min(64, Math.max(8, sz * 2)); // 2px per member, clamped 8–64px
            el.style.setProperty('--drop', `${drop}px`);
            // Staggered reveal
            el.classList.add('build-in');
            el.style.animationDelay = `${idx * 70}ms`;
        });
        // Show per-person totals once in the main totals box
        const totalsHeading = document.querySelector('.container h2');
        if (totalsHeading) totalsHeading.textContent = 'Per Person Totals';
        const perPersonSpice = (totalSpiceSand / totalParticipants).toFixed(2);
        const perPersonMelange = (totalMelange / totalParticipants).toFixed(2);
        const perPersonResidue = (totalResidue / totalParticipants).toFixed(2);
        document.getElementById('spice-sand').innerText = perPersonSpice;
        document.getElementById('melange').innerText = perPersonMelange;
        document.getElementById('residue').innerText = perPersonResidue;
        singleResults.style.display = '';
    }
}

// Debounce logic for live update
let debounceTimer;
function debounceCalculate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(calculateResources, 500);
}

mainInput.addEventListener('input', debounceCalculate);
participantsInput.addEventListener('input', debounceCalculate);
if (numGroupsInput) numGroupsInput.addEventListener('input', () => { renderGroupInputs(); debounceCalculate(); });

// Initialize UI
updateModeUI();
startCursorBlink();

// Group mode toggle behavior
function updateGroupModeUI() {
    isGroupMode = groupModeToggle.checked;
    groupModeLabel.textContent = isGroupMode ? 'Groups Mode' : 'Participants Mode';
    participantsSection.style.display = isGroupMode ? 'none' : '';
    groupsSection.style.display = isGroupMode ? '' : 'none';
    if (isGroupMode) { renderGroupInputs(); document.body.classList.add('groups-active'); }
    else { document.body.classList.remove('groups-active'); }
    debounceCalculate();
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
    }
}

groupModeToggle.addEventListener('change', updateGroupModeUI);
updateGroupModeUI();
