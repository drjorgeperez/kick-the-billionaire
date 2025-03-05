import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js";

export const GAME_STATE_LOCAL_STORAGE_KEY = "KickTheBillionaireGameState";

export const COLORS = {
  BLACK: "#000000",
  WHITE: "#FFFFFF",
  RED: "#FF0000",
  GREEN: "#00FF00",
  BLUE: "#0000FF",
  YELLOW: "#FFFF00",
  CYAN: "#00FFFF",
  MAGENTA: "#FF00FF",
  GOLD: "#FFD700",
  AMBER: "#FFBF00",
  BLENDER_GRAY: "#7F7F7F",
  TWITTER_BLUE: "#26a7de",
};

export const CANNON_BODY_TYPES = {
  CUBE: "cube",
  SPHERE: "sphere",
};

export const RAGDOLL_TYPES = {
  T_POSE: "t-pose",
  BASIC: "basic",
  BENDY: "bendy",
  REALISTIC: "realistic",
};

export const APP_BUTTONS = {
  SETTINGS: "settings",
  PIN: "pin",
  RELOAD: "reload",
  GET_LEFT_PROPS: "getLeftInteractions",
  GET_RIGHT_PROPS: "getRightInteractions",
};

export const INTERACTION = {
  NONE: "none",
  PIN: "pin",
  FREEZE: "freeze",
  DRAG_DUMMY: "dragDummy",
  PUNCH: "punch",
  PROJECTILE: "projectile",
  MELEE: "melee",
  PRESS: "press",
  DRAW_AND_QUARTER: "drawAndQuarter",
  GUILLOTINE: "guillotine",
  FIRE: "fire",
  LIGHTNING: "lightning",
  FUS_RO_DAH: "fusRoDah",
  GOLDEN_WIND: "goldenWind",
  // ROTATING_BLADES: "rotatingBlades",
  // SPAWN_PROP: "spawnProp",
  // WATER: "water",
};

export const INTERACTION_PAYOUT = {
  [INTERACTION.NONE]: 0,
  [INTERACTION.PIN]: 0,
  [INTERACTION.FREEZE]: 0,
  [INTERACTION.DRAG_DUMMY]: 0,
  [INTERACTION.PUNCH]: 1,
  [INTERACTION.PROJECTILE]: 50,
  [INTERACTION.MELEE]: 0,
  [INTERACTION.PRESS]: 0,
  [INTERACTION.DRAW_AND_QUARTER]: 2,
  [INTERACTION.GUILLOTINE]: 0,
  [INTERACTION.FUS_RO_DAH]: 100,
  [INTERACTION.FIRE]: 50,
  [INTERACTION.LIGHTNING]: 25,
  [INTERACTION.GOLDEN_WIND]: 100,
};

export const MELEE_TYPES = {
  BAT: "baseballBat",
  SWORD: "sword",
};

export const MELEE_PARAMETERS = {
  pivotName: "meleeWeaponPivot",
  pivotCameraOffset: {
    x: 0.25,
    y: -0.25,
    z: -1.5,
  },
  weaponCameraOffset: {
    x: 0.25,
    y: -0.25,
    z: -1.5,
  },
};

export const PROJECTILE_TYPES = {
  ARROW: "arrow",
  BANANA: "banana",
  BULLET: "bullet",
  CHAIR: "chair",
  CIRCULAR_SAW_BLADE: "circularSawBlade",
  CYBERTRUCK: "cybertruck",
  DAGGER: "dagger",
  GRENADE: "grenade",
  KATANA: "katana",
  MARS: "mars",
  MISSILE: "missile",
  POOP: "poop",
  SHURIKEN: "giantShuriken",
  SPEAR: "spear",
  SWORD: "sword",
  SYRINGE: "syringe",
  VENUS: "venusStatue",
};

export const PROJECTILE_LOCAL_FORWARD = {
  [PROJECTILE_TYPES.ARROW]: {
    x: 0,
    y: 0,
    z: -1,
  },
  [PROJECTILE_TYPES.BANANA]: {
    x: 0,
    y: 0,
    z: -1,
  },
  [PROJECTILE_TYPES.BULLET]: {
    x: 0,
    y: 1,
    z: 0,
  },
  [PROJECTILE_TYPES.CHAIR]: {
    x: 0,
    y: 0,
    z: -1,
  },
  [PROJECTILE_TYPES.CIRCULAR_SAW_BLADE]: {
    x: 0,
    y: 0,
    z: -1,
  },
  [PROJECTILE_TYPES.CYBERTRUCK]: {
    x: 0,
    y: 0,
    z: 1,
  },
  [PROJECTILE_TYPES.DAGGER]: {
    x: -1,
    y: 0,
    z: 0,
  },
  [PROJECTILE_TYPES.GRENADE]: {
    x: 0,
    y: 0,
    z: -1,
  },
  [PROJECTILE_TYPES.KATANA]: {
    x: -1,
    y: 0,
    z: 0,
  },
  [PROJECTILE_TYPES.MARS]: {
    x: 0,
    y: -1,
    z: 0,
  },
  [PROJECTILE_TYPES.MISSILE]: {
    x: 0,
    y: 0,
    z: -1,
  },
  [PROJECTILE_TYPES.POOP]: {
    x: 0,
    y: 0,
    z: -1,
  },
  [PROJECTILE_TYPES.SHURIKEN]: {
    x: 0,
    y: 0,
    z: -1,
  },
  [PROJECTILE_TYPES.SWORD]: {
    x: 0,
    y: -1,
    z: 0,
  },
  [PROJECTILE_TYPES.SPEAR]: {
    x: 0,
    y: 1,
    z: 0,
  },
  [PROJECTILE_TYPES.SYRINGE]: {
    x: 0,
    y: 1,
    z: 0,
  },
  [PROJECTILE_TYPES.VENUS]: {
    x: 1,
    y: 0,
    z: 0,
  },
};

export const IMPALE_PROJECTILES = [
  PROJECTILE_TYPES.ARROW,
  PROJECTILE_TYPES.CIRCULAR_SAW_BLADE,
  PROJECTILE_TYPES.DAGGER,
  PROJECTILE_TYPES.KATANA,
  PROJECTILE_TYPES.POOP,
  PROJECTILE_TYPES.SPEAR,
  PROJECTILE_TYPES.SWORD,
  PROJECTILE_TYPES.SYRINGE,
];

export const EXPLOSIVE_PROJECTILES = [
  PROJECTILE_TYPES.GRENADE,
  PROJECTILE_TYPES.MARS,
  PROJECTILE_TYPES.MISSILE,
];

export const EXPLOSIVE_PROJECTILE_PARAMETERS = {
  proximityRadius: 1,
  explosionForce: 2,
  explosionRadius: 5,
};

export const SPINNING_PROJECTILES = [
  PROJECTILE_TYPES.CIRCULAR_SAW_BLADE,
  PROJECTILE_TYPES.SHURIKEN,
];

export const PRESS_ORIENTATION = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal",
};

export const PRESS_DIMENSIONS = {
  [PRESS_ORIENTATION.VERTICAL]: {
    x: 2,
    y: 0.35,
    z: 1,
  },
  [PRESS_ORIENTATION.HORIZONTAL]: {
    x: 0.5,
    y: 1,
    z: 2,
  },
};

export const PRESS_NAMES = {
  FIRST_PRESS: "firstPress",
  SECOND_PRESS: "secondPress",
};

export const DRAW_AND_QUARTER_ATTRIBUTES = {
  QUARTER_ANGLE: 90,
  MIN_STRETCH: 1,
  MAX_STRETCH: 2,
  DUMMY_PIVOT: "upperBody",
};

export const DEFAULT_LIGHTNING_RAY_PARAMS = {
  sourceOffset: new THREE.Vector3(),
  destOffset: new THREE.Vector3(),
  radius0: 0.05,
  radius1: 0.05,
  minRadius: 2.5,
  maxIterations: 7,
  isEternal: true,

  timeScale: 0.7,

  propagationTimeFactor: 0.05,
  vanishingTimeFactor: 0.95,
  subrayPeriod: 3.5,
  subrayDutyCycle: 0.6,
  maxSubrayRecursion: 3,
  ramification: 7,
  recursionProbability: 0.6,

  roughness: 0.85,
  straightness: 0.6,
};

export const SOUNDS = {
  EXPLOSION: {
    fileName: "explosion",
    fileType: "mp3",
  },
  GUNSHOT: {
    fileName: "gunshot",
    fileType: "mp3",
  },
  FUS_RO_DAH: {
    fileName: "fusRoDah",
    fileType: "mp3",
  },
  GOLDEN_WIND: {
    fileName: "goldenWind",
    fileType: "mp3",
  },
  LIGHTNING: {
    fileName: "lightning",
    fileType: "mp3",
  },
  PUNCH: {
    fileName: "punch",
    fileType: "mp3",
  },
};
