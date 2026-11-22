// Modelo físico puro: no depende del navegador ni de la interfaz.
const GRAVITY = 9.81;

window.Physics = Object.freeze({
  gravity: GRAVITY,

  normalForce(mass, acceleration) {
    return mass * (GRAVITY + acceleration);
  },

  referenceForce(mass) {
    return mass * GRAVITY;
  }
});
