// Controla el arranque, la velocidad constante, el frenado y los límites del recorrido.
window.Simulation = function createSimulation() {
  const lowerLimit = 0.05;
  const upperLimit = 0.95;
  const cruiseSpeed = 0.6;
  const initialPosition = 0.5;
  let position = initialPosition;
  let velocity = 0;
  let acceleration = 0;
  let direction = 1;
  let phase = 'rest';

  function start(nextDirection, magnitude) {
    if (phase !== 'rest') {
      return false;
    }

    if (isAtLimit(nextDirection)) {
      return false;
    }

    direction = nextDirection;
    acceleration = direction * magnitude;
    phase = 'starting';
    return true;
  }

  function stop(magnitude) {
    if (phase === 'rest') {
      return;
    }

    if (velocity === 0) {
      phase = 'rest';
      acceleration = 0;
      return;
    }

    beginBraking(magnitude);
  }

  function reset() {
    position = initialPosition;
    velocity = 0;
    acceleration = 0;
    direction = 1;
    phase = 'rest';
  }

  function tick(delta, magnitude) {
    if (phase === 'rest') {
      return getState();
    }

    startAutomaticBraking(delta, magnitude);
    advanceMotion(delta, magnitude);
    return getState();
  }

  function startAutomaticBraking(delta, magnitude) {
    if (phase === 'braking' || velocity === 0) {
      return;
    }

    const distance = distanceToLimit(velocity);
    const stoppingDistance = (velocity * velocity) / (2 * magnitude);
    const travelDuringFrame = Math.abs(velocity) * delta;
    const accelerationDistance = phase === 'starting'
      ? 0.5 * magnitude * delta * delta
      : 0;
    const distanceBeforeNextFrame = stoppingDistance
      + travelDuringFrame
      + accelerationDistance;

    if (distanceBeforeNextFrame >= distance) {
      beginBraking(magnitude);
    }
  }

  function beginBraking(magnitude) {
    phase = 'braking';
    acceleration = -Math.sign(velocity) * magnitude;
  }

  function advanceMotion(delta, magnitude) {
    if (phase === 'starting') {
      acceleration = direction * magnitude;
      const nextVelocity = velocity + acceleration * delta;

      if (Math.abs(nextVelocity) >= cruiseSpeed) {
        advancePosition(delta, acceleration);
        velocity = direction * cruiseSpeed;
        acceleration = 0;
        phase = 'cruising';
        return;
      }

      advancePosition(delta, acceleration);
      velocity = nextVelocity;
      return;
    }

    if (phase === 'cruising') {
      acceleration = 0;
      velocity = direction * cruiseSpeed;
      advancePosition(delta, 0);
      return;
    }

    if (phase === 'braking') {
      advanceBraking(delta);
    }
  }

  function advanceBraking(delta) {
    const timeToStop = Math.abs(velocity / acceleration);
    const brakingTime = Math.min(delta, timeToStop);
    const nextVelocity = velocity + acceleration * brakingTime;
    const stopThreshold = 0.005;
    const hasStopped = brakingTime >= timeToStop
      || Math.abs(nextVelocity) < stopThreshold;

    advancePosition(brakingTime, acceleration);

    if (hasStopped) {
      velocity = 0;
      acceleration = 0;
      phase = 'rest';
      return;
    }

    velocity = nextVelocity;
  }

  function advancePosition(delta, currentAcceleration) {
    position += velocity * delta + 0.5 * currentAcceleration * delta * delta;
    position = Math.max(lowerLimit, Math.min(upperLimit, position));
  }

  function distanceToLimit(currentVelocity) {
    if (currentVelocity > 0) {
      return upperLimit - position;
    }

    return position - lowerLimit;
  }

  function isAtLimit(nextDirection) {
    return nextDirection > 0
      ? position >= upperLimit
      : position <= lowerLimit;
  }

  function getState() {
    return { position, velocity, acceleration, phase, direction };
  }

  return { start, stop, reset, tick, getState };
};
