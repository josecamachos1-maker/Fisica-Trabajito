const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const projectFiles = ['physics.js', 'simulation.js'];
const modelContext = { window: {}, Math };
vm.createContext(modelContext);

for (const fileName of projectFiles) {
  vm.runInContext(fs.readFileSync(fileName, 'utf8'), modelContext);
}

const physics = modelContext.window.Physics;
const Simulation = modelContext.window.Simulation;
assert.equal(physics.normalForce(60, 0), 588.6);
assert.ok(Math.abs(physics.normalForce(60, 2) - 708.6) < 1e-9);
assert.equal(physics.normalForce(60, -2), 468.6);

function advanceUntilRest(simulation, acceleration) {
  let state = simulation.getState();

  for (let step = 0; step < 1000 && state.phase !== 'rest'; step += 1) {
    state = simulation.tick(0.05, acceleration);
    assert.ok(state.position >= 0.05 && state.position <= 0.95);
  }

  assert.equal(state.phase, 'rest');
  return state;
}

const simulation = Simulation();
assert.equal(simulation.getState().position, 0.5);
assert.equal(simulation.start(1, 2), true);
let state = simulation.tick(0.05, 2);
assert.equal(state.acceleration, 2);
assert.equal(physics.normalForce(60, state.acceleration), 708.6);
while (state.phase === 'starting') {
  state = simulation.tick(0.05, 2);
}
assert.equal(state.phase, 'cruising');
assert.equal(state.acceleration, 0);

simulation.stop(2);
state = simulation.getState();
assert.equal(state.phase, 'braking');
assert.equal(state.acceleration, -2);
assert.ok(state.velocity > 0, 'la cabina todavía sube al comenzar a frenar');
assert.equal(physics.normalForce(60, state.acceleration), 468.6);

let previousVelocity = state.velocity;
while (simulation.getState().phase !== 'rest') {
  state = simulation.tick(0.01, 2);
  assert.ok(state.velocity >= 0, 'el ascensor que sube no invierte el sentido al frenar');
  assert.ok(state.velocity <= previousVelocity, 'la velocidad disminuye durante el frenado');
  previousVelocity = state.velocity;
}

assert.ok(state.position < 0.95, 'el ascensor se detiene antes del límite superior');
assert.equal(state.velocity, 0);
assert.equal(simulation.start(-1, 2), true);
state = simulation.tick(0.05, 2);
assert.equal(state.acceleration, -2);
assert.equal(physics.normalForce(60, state.acceleration), 468.6);
simulation.stop(2);
state = simulation.getState();
assert.equal(state.acceleration, 2, 'al frenar mientras baja, la aceleración apunta hacia arriba');
assert.ok(state.velocity < 0);
assert.equal(physics.normalForce(60, state.acceleration), 708.6);
state = advanceUntilRest(simulation, 2);
assert.ok(state.position > 0.05, 'el ascensor se detiene antes del límite inferior');

const automaticStop = Simulation();
automaticStop.start(1, 2);
state = advanceUntilRest(automaticStop, 2);
assert.ok(state.position < 0.95, 'el frenado automático precede al límite superior');
automaticStop.start(-1, 2);
state = advanceUntilRest(automaticStop, 2);
assert.ok(state.position > 0.05, 'el frenado automático precede al límite inferior');
automaticStop.reset();
assert.deepEqual(
  JSON.parse(JSON.stringify(automaticStop.getState())),
  { position: 0.5, velocity: 0, acceleration: 0, phase: 'rest', direction: 1 }
);

function makeElement(id) {
  const element = {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    dataset: {},
    style: {},
    attributes: {},
    listeners: {},
    classes: new Set(),
    addEventListener(type, callback) {
      this.listeners[type] ??= [];
      this.listeners[type].push(callback);
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    trigger(type, event = {}) {
      for (const callback of this.listeners[type] ?? []) {
        callback(event);
      }
    }
  };
  element.classList = {
    toggle(name, enabled) {
      if (enabled) {
        element.classes.add(name);
      } else {
        element.classes.delete(name);
      }
    }
  };

  return element;
}

function createHarness(storage) {
  const elements = new Map();
  let scheduledFrame = null;

  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, makeElement(id));
    }

    return elements.get(id);
  }

  const document = {
    getElementById: getElement,
    querySelector: getElement
  };
  const browserWindow = { Physics: physics, Simulation };
  const context = {
    window: browserWindow,
    document,
    localStorage: storage,
    requestAnimationFrame(callback) {
      scheduledFrame = callback;
    },
    Math,
    JSON,
    Number,
    String
  };

  vm.runInNewContext(fs.readFileSync('app.js', 'utf8'), context);

  return {
    elements,
    frame(timestamp) {
      const callback = scheduledFrame;
      scheduledFrame = null;
      callback(timestamp);
    }
  };
}

const storageData = new Map();
const storage = {
  getItem(key) {
    return storageData.get(key) ?? null;
  },
  setItem(key, value) {
    storageData.set(key, value);
  }
};
const harness = createHarness(storage);
const ui = harness.elements;
const getUi = id => ui.get(id);

assert.equal(getUi('normal-value').innerHTML, '588,6 <small>N</small>');
getUi('up-button').trigger('click');
harness.frame(1000);
harness.frame(1050);
assert.equal(getUi('normal-value').innerHTML, '708,6 <small>N</small>');
getUi('stop-button').trigger('click');
harness.frame(1066);
assert.equal(getUi('acceleration-value').innerHTML, '-2,00 <small>m/s²</small>');
assert.equal(getUi('normal-value').innerHTML, '468,6 <small>N</small>');
assert.equal(getUi('comparison-label').textContent, 'Menor que en reposo');

harness.frame(1110);
getUi('down-button').trigger('click');
harness.frame(1126);
harness.frame(1142);
assert.equal(getUi('normal-value').innerHTML, '468,6 <small>N</small>');
getUi('stop-button').trigger('click');
harness.frame(1158);
assert.equal(getUi('normal-value').innerHTML, '708,6 <small>N</small>');
harness.frame(1174);

getUi('mass-input').trigger('change', { target: { value: '75' } });
getUi('acceleration-input').trigger('change', { target: { value: '3.5' } });
assert.deepEqual(
  JSON.parse(storageData.get('lab13-elevador-ajustes-v1')),
  { mass: 75, acceleration: 3.5 }
);
getUi('up-button').trigger('click');
harness.frame(1190);
getUi('reset-button').trigger('click');
assert.equal(getUi('phase-label').textContent, 'En reposo');
assert.equal(getUi('position-value').textContent, 'PISO 03');
assert.equal(getUi('mass-input').value, 75);
assert.equal(getUi('acceleration-input').value, 3.5);

const reloaded = createHarness(storage);
assert.equal(reloaded.elements.get('mass-input').value, 75);
assert.equal(reloaded.elements.get('acceleration-input').value, 3.5);
assert.equal(reloaded.elements.get('phase-label').textContent, 'En reposo');

storageData.set(
  'lab13-elevador-ajustes-v1',
  JSON.stringify({ mass: 200, acceleration: -1 })
);
const invalidSettings = createHarness(storage);
assert.equal(invalidSettings.elements.get('mass-input').value, 60);
assert.equal(invalidSettings.elements.get('acceleration-input').value, 2);

const blockedStorage = {
  getItem() {
    throw new Error('almacenamiento bloqueado');
  },
  setItem() {
    throw new Error('almacenamiento bloqueado');
  }
};
assert.doesNotThrow(() => createHarness(blockedStorage));
console.log('OK: lecturas, botones, límites, frenado y persistencia');
