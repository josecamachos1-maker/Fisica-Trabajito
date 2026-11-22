(() => {
  const storageKey = 'lab13-elevador-ajustes-v1';
  const defaults = { mass: 60, acceleration: 2 };
  const limits = {
    mass: [30, 150],
    acceleration: [0.1, 9.8]
  };
  const simulation = window.Simulation();
  const elements = getElements();
  let settings = loadSettings();
  let lastFrameTime = 0;
  let slowModeEnabled = false;

  function getElements() {
    return {
      massInput: document.getElementById('mass-input'),
      massRange: document.getElementById('mass-range'),
      accelerationInput: document.getElementById('acceleration-input'),
      accelerationRange: document.getElementById('acceleration-range'),
      upButton: document.getElementById('up-button'),
      downButton: document.getElementById('down-button'),
      stopButton: document.getElementById('stop-button'),
      resetButton: document.getElementById('reset-button'),
      slowModeButton: document.getElementById('slow-mode-button'),
      slowModeState: document.getElementById('slow-mode-state'),
      phasePill: document.getElementById('phase-pill'),
      phaseLabel: document.getElementById('phase-label'),
      elevator: document.getElementById('elevator'),
      scaleScreen: document.getElementById('scale-screen'),
      positionValue: document.getElementById('position-value'),
      motionIndicator: document.getElementById('motion-indicator'),
      motionArrow: document.querySelector('.motion-arrow'),
      motionText: document.getElementById('motion-text'),
      velocityValue: document.getElementById('velocity-value'),
      velocityNote: document.getElementById('velocity-note'),
      accelerationValue: document.getElementById('acceleration-value'),
      accelerationNote: document.getElementById('acceleration-note'),
      normalValue: document.getElementById('normal-value'),
      referenceValue: document.getElementById('reference-value'),
      differenceValue: document.getElementById('difference-value'),
      comparisonLabel: document.getElementById('comparison-label')
    };
  }

  function validNumber(value, range) {
    const number = Number(value);
    const isInRange = number >= range[0] && number <= range[1];

    if (!Number.isFinite(number) || !isInRange) {
      return null;
    }

    return number;
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      const mass = validNumber(saved?.mass, limits.mass);
      const acceleration = validNumber(saved?.acceleration, limits.acceleration);

      if (mass === null || acceleration === null) {
        return { ...defaults };
      }

      return { mass, acceleration };
    } catch {
      return { ...defaults };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      // El simulador sigue funcionando si el navegador bloquea el almacenamiento.
    }
  }

  function formatNumber(number, decimals = 2) {
    const roundedToZero = Math.abs(number) < 0.005;
    const value = roundedToZero ? 0 : number;

    return value.toFixed(decimals).replace('.', ',');
  }

  function formatSignedNumber(number) {
    const sign = number >= 0 ? '+' : '';
    return sign + formatNumber(number, 1) + ' N';
  }

  function updateSetting(name, value) {
    const validValue = validNumber(value, limits[name]);

    if (validValue === null) {
      elements[name + 'Input'].value = settings[name];
      return;
    }

    settings[name] = validValue;
    elements[name + 'Input'].value = validValue;
    elements[name + 'Range'].value = validValue;
    saveSettings();
    render();
  }

  function getReadings(state) {
    const normalForce = window.Physics.normalForce(settings.mass, state.acceleration);
    const referenceForce = window.Physics.referenceForce(settings.mass);

    return {
      normalForce,
      referenceForce,
      difference: normalForce - referenceForce
    };
  }

  function renderReadings(state, readings) {
    setHtmlIfChanged(
      elements.velocityValue,
      formatNumber(state.velocity) + ' <small>m/s</small>'
    );
    elements.velocityNote.textContent = getVelocityDescription(state.velocity);
    setHtmlIfChanged(
      elements.accelerationValue,
      formatNumber(state.acceleration) + ' <small>m/s²</small>'
    );
    elements.accelerationNote.textContent =
      getAccelerationDescription(state);
    setHtmlIfChanged(
      elements.normalValue,
      formatNumber(readings.normalForce, 1) + ' <small>N</small>'
    );
    elements.referenceValue.textContent =
      formatNumber(readings.referenceForce, 1) + ' N';
    elements.differenceValue.textContent = formatSignedNumber(readings.difference);
    elements.comparisonLabel.textContent = getComparisonLabel(readings.difference);
    elements.scaleScreen.textContent = formatNumber(readings.normalForce, 1);
  }

  function setHtmlIfChanged(element, html) {
    if (element.innerHTML !== html) {
      element.innerHTML = html;
    }
  }

  function getVelocityDescription(velocity) {
    if (velocity === 0) {
      return 'Sin movimiento';
    }

    return velocity > 0 ? 'Hacia arriba' : 'Hacia abajo';
  }

  function getAccelerationDescription(state) {
    if (state.phase === 'rest') {
      return 'En reposo';
    }

    if (state.phase === 'starting') {
      return state.direction > 0 ? 'Acelera hacia arriba' : 'Acelera hacia abajo';
    }

    if (state.phase === 'cruising') {
      return 'Sigue moviéndose a velocidad constante';
    }

    return state.direction > 0 ? 'Frena mientras sube' : 'Frena mientras baja';
  }

  function getComparisonLabel(difference) {
    if (difference > 0.05) {
      return 'Mayor que en reposo';
    }

    if (difference < -0.05) {
      return 'Menor que en reposo';
    }

    return 'Igual que en reposo';
  }

  function renderScene(state) {
    elements.elevator.style.bottom = (2 + state.position * 48) + '%';
    elements.positionValue.textContent = getFloorLabel(state.position);
  }

  function getFloorLabel(position) {
    if (position < 0.34) {
      return 'PISO 01';
    }

    if (position > 0.66) {
      return 'PISO 05';
    }

    return 'PISO 03';
  }

  function renderPhase(state) {
    elements.phaseLabel.textContent = getPhaseLabel(state.phase);
    elements.phasePill.dataset.phase = state.phase;
    elements.motionIndicator.dataset.moving = String(state.phase !== 'rest');
    elements.motionArrow.textContent = state.direction > 0 ? '↑' : '↓';
    elements.motionText.textContent = getMotionDescription(state);
  }

  function getPhaseLabel(phase) {
    const labels = {
      rest: 'En reposo',
      starting: 'Arrancando',
      cruising: 'Velocidad constante',
      braking: 'Frenando'
    };

    return labels[phase];
  }

  function getMotionDescription(state) {
    if (state.phase === 'rest') {
      return 'Ascensor detenido';
    }

    if (state.phase === 'braking') {
      return 'Frenando antes de parar';
    }

    if (state.direction > 0) {
      return 'En movimiento hacia arriba';
    }

    return 'En movimiento hacia abajo';
  }

  function render() {
    const state = simulation.getState();
    const readings = getReadings(state);

    renderScene(state);
    renderPhase(state);
    renderReadings(state, readings);
  }

  function animate(frameTime) {
    if (lastFrameTime === 0) {
      lastFrameTime = frameTime;
    }

    const elapsedSeconds = (frameTime - lastFrameTime) / 1000;
    const frameDelta = Math.min(elapsedSeconds, 0.05);
    const timeScale = slowModeEnabled ? 0.25 : 1;
    const simulationDelta = frameDelta * timeScale;
    lastFrameTime = frameTime;

    simulation.tick(simulationDelta, settings.acceleration);
    render();
    requestAnimationFrame(animate);
  }

  function start(direction) {
    const didStart = simulation.start(direction, settings.acceleration);

    if (didStart) {
      setSelectedDirection(direction);
    }
  }

  function setSelectedDirection(direction) {
    const isUpSelected = direction > 0;
    elements.upButton.classList.toggle('active', isUpSelected);
    elements.downButton.classList.toggle('active', !isUpSelected);
    elements.upButton.setAttribute('aria-pressed', String(isUpSelected));
    elements.downButton.setAttribute('aria-pressed', String(!isUpSelected));
  }

  function setSlowMode(enabled) {
    slowModeEnabled = enabled;
    elements.slowModeButton.classList.toggle('active', enabled);
    elements.slowModeButton.setAttribute('aria-pressed', String(enabled));
    elements.slowModeState.textContent = enabled ? 'Activo' : 'Desactivado';
  }

  elements.massInput.addEventListener('change', event => {
    updateSetting('mass', event.target.value);
  });
  elements.massRange.addEventListener('input', event => {
    updateSetting('mass', event.target.value);
  });
  elements.accelerationInput.addEventListener('change', event => {
    updateSetting('acceleration', event.target.value);
  });
  elements.accelerationRange.addEventListener('input', event => {
    updateSetting('acceleration', event.target.value);
  });
  elements.upButton.addEventListener('click', () => start(1));
  elements.downButton.addEventListener('click', () => start(-1));
  elements.stopButton.addEventListener('click', () => {
    simulation.stop(settings.acceleration);
  });
  elements.slowModeButton.addEventListener('click', () => {
    setSlowMode(!slowModeEnabled);
  });
  elements.resetButton.addEventListener('click', () => {
    simulation.reset();
    setSelectedDirection(1);
    render();
  });

  elements.massInput.value = settings.mass;
  elements.massRange.value = settings.mass;
  elements.accelerationInput.value = settings.acceleration;
  elements.accelerationRange.value = settings.acceleration;
  setSlowMode(false);
  render();
  requestAnimationFrame(animate);
})();
