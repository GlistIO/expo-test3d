export default {
  id: 0,
  playerStart: { x: 0, y: 0 }, // kur cilvēciņš parādās
  obstacles: [
    { x: 0.5, y: 0, size: 0.5 },
    // ...ja vajag vēl
  ],
  coins: [
    { x: -1, y: 1 },
  ],
  exits: {
    left: { scene: 1, yRange: [-0.5, -0.5] },  // pārslēdz uz scene1, ja iet pa kreisi
    right: null,
    top: null,
    bottom: null,
  },
  bg: null, // ja gribi fonu
};
