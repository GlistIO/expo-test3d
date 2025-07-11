export default {
  id: 1,
  playerStart: { x: 0, y: 0 }, // kur cilvēciņš parādās
  obstacles: [
    { x: 0.5, y: 0, size: 0.5 },
    // ...ja vajag vēl
  ],
  pickups: [
    { x: -1, y: 1, type: "coin", icon: "coin" },   // monēta
    // { x: 1, y: 0, type: "key", icon: "key" },    // piem. atslēga
    // { x: 1, y: -1, type: "heart", icon: "heart" }, // sirsniņa utt.
  ],
  exits: {
    left: null,  // pārslēdz uz scene1, ja iet pa kreisi
    right: 0,
    top: null,
    bottom: null,
  },
  bg: null, // ja gribi fonu
};
