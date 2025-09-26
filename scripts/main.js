const { VOLUMES: ITEM_VOLUMES, RECIPES: ITEM_RECIPES } = window.APP_DATA;

function formatQty(q){
  return Number(q).toLocaleString();
}

function computeVolume(item, qty=1, seen=new Set()){
  if (!ITEM_VOLUMES.hasOwnProperty(item) && !ITEM_RECIPES.hasOwnProperty(item)){
    throw new Error(`Unknown item: ${item}`);
  }

  if (seen.has(item)){
    throw new Error(`Recursive recipe detected for ${item}`);
  }

  if (ITEM_RECIPES[item]){
    seen.add(item);
    let total = 0;
    const recipe = ITEM_RECIPES[item];
    for (const [comp, compQty] of Object.entries(recipe)){
      total += computeVolume(comp, compQty * qty, seen);
    }
    seen.delete(item);
    return total;
  }

  return (ITEM_VOLUMES[item] || 0) * qty;
}

function populateLists(){
  const vl = document.getElementById('volumes-list');
  if (vl){
    vl.innerHTML = '';
    for (const [k, v] of Object.entries(ITEM_VOLUMES)){
      const li = document.createElement('li');
      li.textContent = `${k}: ${v} volume per unit`;
      vl.appendChild(li);
    }
  }

  const rl = document.getElementById('recipes-list');
  if (rl){
    rl.innerHTML = '';
    for (const [prod, recipe] of Object.entries(ITEM_RECIPES)){
      const li = document.createElement('li');
      const parts = Object.entries(recipe).map(([c, q]) => `${q} ${c}`);
      li.textContent = `${prod} = ${parts.join(' + ')}`;
      rl.appendChild(li);
    }
  }

  const sel = document.getElementById('item-select');
  if (sel){
    sel.innerHTML = '';
    const items = Array.from(new Set([...Object.keys(ITEM_VOLUMES), ...Object.keys(ITEM_RECIPES)]));
    for (const it of items){
      const opt = document.createElement('option');
      opt.value = it;
      opt.textContent = it;
      sel.appendChild(opt);
    }
  }
}

function wire(){
  populateLists();
  document.getElementById('compute-btn')?.addEventListener('click', ()=>{
    const item = document.getElementById('item-select').value;
    const qty = Number(document.getElementById('qty-input').value) || 1;
    try{
      const vol = computeVolume(item, qty);
      document.getElementById('result').textContent = `${formatQty(qty)} A- ${item} = ${vol.toLocaleString()} total volume`;
    }catch(e){
      document.getElementById('result').textContent = `Error: ${e.message}`;
    }
  });

  const modeToggle = document.getElementById('mode-toggle');
  const modeLabel = document.getElementById('mode-label');
  const discountToggle = document.getElementById('discount-toggle');
  const discountLabel = document.getElementById('discount-label');
  const volumeInput = document.getElementById('volume-input');
  const participantsInput = document.getElementById('participants-input');
  const resultsDiv = document.getElementById('volume-results');
  const totalsList = document.getElementById('totals-list');
  let discountActive = false;

  function renderTotals(vol, unitName, perUnit, details=null){
    if (!totalsList){
      return;
    }

    totalsList.innerHTML = '';
    if (!vol){
      const li = document.createElement('li');
      li.textContent = 'Enter a volume above zero to see totals.';
      totalsList.appendChild(li);
      return;
    }

    if (!unitName || !perUnit || perUnit <= 0){
      const li = document.createElement('li');
      li.textContent = 'Cannot compute totals for the selected ore.';
      totalsList.appendChild(li);
      return;
    }

    const totalUnitsRaw = details?.totalUnits ?? (vol / perUnit);
    const participants = details?.participants ?? 1;
    const perParticipantUnits = participants > 1 ? Number((totalUnitsRaw / participants).toFixed(1)) : null;
    const roundedUnits = Number(totalUnitsRaw.toFixed(1));
    const discountApplied = Boolean(details?.discountActive);

    const addTotalsItem = (title, value, className) => {
      const li = document.createElement('li');
      if (className){
        li.classList.add(className);
      }
      const nameSpan = document.createElement('span');
      nameSpan.className = 'totals-item-name';
      nameSpan.textContent = title;

      const valueSpan = document.createElement('span');
      valueSpan.className = 'totals-item-value';
      valueSpan.textContent = value;

      li.appendChild(nameSpan);
      li.appendChild(valueSpan);
      totalsList.appendChild(li);
    };

    const baseValue = perParticipantUnits !== null ? `${roundedUnits.toLocaleString(undefined,{ maximumFractionDigits: 1 })} units | ${perParticipantUnits.toLocaleString(undefined,{ maximumFractionDigits: 1 })} ${unitName} each for ${formatQty(participants)} participants` : `${roundedUnits.toLocaleString(undefined,{ maximumFractionDigits: 1 })} units`;
    const primaryValue = discountApplied ? `${baseValue} (25% discount applied)` : baseValue;
    addTotalsItem(unitName, primaryValue, 'totals-item--active');

    if (unitName === 'Stravidium Mass'){
      const fiberRecipe = ITEM_RECIPES['Stravidium Fiber'] || {};
      const massPerFiber = Number(fiberRecipe['Stravidium Mass'] || 3);
      const waterPerFiber = Number(fiberRecipe['Water'] || 0);
      const fiberCount = massPerFiber > 0 ? Math.floor(totalUnitsRaw / massPerFiber) : 0;
      if (fiberCount > 0){
        const fiberWater = fiberCount * waterPerFiber;
        addTotalsItem('Stravidium Fiber', `${formatQty(fiberCount)} units; uses ${formatQty(fiberWater)} Water`, 'totals-item--secondary');
      }
    }

    const plastaniumInfo = (() => {
      const perIngotTitanium = 6;
      const perIngotStravidiumMass = 3;
      const perIngotWater = 1350;
      if (unitName === 'Titanium Ore'){
        const possible = Math.floor(totalUnitsRaw / perIngotTitanium);
        return {
          count: possible,
          requiredFiber: possible,
          requiredWater: possible * perIngotWater
        };
      }
      if (unitName === 'Stravidium Mass'){
        const possible = Math.floor(totalUnitsRaw / perIngotStravidiumMass);
        return {
          count: possible,
          requiredTitanium: possible * perIngotTitanium,
          requiredWater: possible * perIngotWater
        };
      }
      return null;
    })();

    if (plastaniumInfo){
      const { count, requiredFiber = 0, requiredTitanium = 0, requiredWater = 0 } = plastaniumInfo;
      const value = unitName === 'Stravidium Mass'
        ? `${formatQty(count)} ingots; needs ${formatQty(requiredTitanium)} Titanium Ore and ${formatQty(requiredWater)} Water`
        : `${formatQty(count)} ingots; needs ${formatQty(requiredFiber)} Stravidium Fiber and ${formatQty(requiredWater)} Water`;
      addTotalsItem('Plastanium', value, 'totals-item--secondary');
    }
  }

  if (!modeToggle || !volumeInput || !resultsDiv){
    renderTotals(0, null, null);
    return;
  }

  function updateModeLabel(isTitaniumMode){
    if (modeLabel){
      modeLabel.textContent = isTitaniumMode ? 'Titanium Ore Mode' : 'Stravidium Mass Mode';
      modeLabel.classList.toggle('toggle-label--alt', !isTitaniumMode);
    }
  }
  function updateDiscountLabelState(){
    if (discountLabel){
      discountLabel.textContent = discountActive ? '25% Discount Applied' : 'Apply 25% Discount';
      discountLabel.classList.toggle('toggle-label--alt', discountActive);
    }
  }


  function normaliseParticipants(){
    if (!participantsInput){
      return 1;
    }
    const rawText = participantsInput.value.trim();
    if (!rawText){
      return 1;
    }
    const rawNumber = Number(rawText);
    if (!Number.isFinite(rawNumber) || rawNumber <= 0){
      return 1;
    }
    const clamped = Math.floor(rawNumber);
    if (clamped !== rawNumber){
      participantsInput.value = String(clamped);
    }
    return clamped;
  }

  function computeFromVolume(){
    const vol = Number(volumeInput.value) || 0;
    const participants = normaliseParticipants();
    const isTitaniumMode = !modeToggle.checked;
    const titaniumVolPer = ITEM_VOLUMES['Titanium Ore'];
    const stravidiumVolPer = ITEM_VOLUMES['Stravidium Mass'];
    const perUnit = isTitaniumMode ? titaniumVolPer : stravidiumVolPer;
    const unitName = isTitaniumMode ? 'Titanium Ore' : 'Stravidium Mass';
    updateModeLabel(isTitaniumMode);

    if (!perUnit || perUnit <= 0){
      resultsDiv.innerHTML = "";
      renderTotals(vol, unitName, perUnit);
      return;
    }

    const discountMultiplier = discountActive ? 1.25 : 1;
    const totalUnits = (vol / perUnit) * discountMultiplier;
    resultsDiv.innerHTML = "";

    renderTotals(vol, unitName, perUnit, { totalUnits, participants, discountActive });
  }

  volumeInput.addEventListener('input', computeFromVolume);
  volumeInput.addEventListener('change', computeFromVolume);
  participantsInput?.addEventListener('input', computeFromVolume);
  participantsInput?.addEventListener('change', computeFromVolume);

  function handleModeToggle(){
    computeFromVolume();
  }

  modeToggle.addEventListener('input', handleModeToggle);
  modeToggle.addEventListener('change', handleModeToggle);

  modeLabel?.addEventListener('click', () => {
    modeToggle.checked = !modeToggle.checked;
    computeFromVolume();
  });
  const handleDiscountToggle = () => {
    discountActive = Boolean(discountToggle && discountToggle.checked);
    updateDiscountLabelState();
    computeFromVolume();
  };

  if (discountToggle){
    discountToggle.addEventListener('input', handleDiscountToggle);
    discountToggle.addEventListener('change', handleDiscountToggle);
  }

  discountLabel?.addEventListener('click', () => {
    if (!discountToggle){
      return;
    }
    discountToggle.checked = !discountToggle.checked;
    handleDiscountToggle();
  });

  discountActive = Boolean(discountToggle && discountToggle.checked);
  updateDiscountLabelState();

  modeToggle.checked = false;
  updateModeLabel(true);
  computeFromVolume();
}

window.addEventListener('DOMContentLoaded', wire);
