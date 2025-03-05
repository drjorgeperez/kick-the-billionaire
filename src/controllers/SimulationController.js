import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/loaders/FBXLoader.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/postprocessing/EffectComposer.js";
import { OutlinePass } from "https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/postprocessing/OutlinePass.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/shaders/GammaCorrectionShader.js";
import { LightningStrike } from "../libs/lightning/LightningStrike.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm";
import { mobileCheck } from "../utils/utils.js";
import {
  COLORS,
  DEFAULT_LIGHTNING_RAY_PARAMS,
  DRAW_AND_QUARTER_ATTRIBUTES,
  EXPLOSIVE_PROJECTILE_PARAMETERS,
  EXPLOSIVE_PROJECTILES,
  IMPALE_PROJECTILES,
  INTERACTION,
  INTERACTION_PAYOUT,
  MELEE_TYPES,
  PRESS_ORIENTATION,
  PROJECTILE_LOCAL_FORWARD,
  PROJECTILE_TYPES,
  RAGDOLL_TYPES,
} from "../utils/constants.js";
import {
  createBasicRagdoll,
  createBendyRagdoll,
} from "../utils/ragdollUtils.js";
import {
  billionaireBonesToCopyToBodies,
  billionaireRagdollBodyData,
} from "../utils/ragdollData.js";
import PhysicalThing from "../models/PhysicalThing.js";
import InteractionsController from "./InteractionController.js";
import {
  createPlaceholderMesh,
  getCubeDimensionsFromMesh,
} from "../utils/modelUtils.js";
import { distance2D } from "../utils/mathUtils.js";

class SimulationController {
  constructor(
    modelPath,
    texturePath,
    audioPath,
    updateMoney,
    updateModelLoadingLabel
  ) {
    ////////// GLOBAL //////////
    this.canvas = document.querySelector("canvas.webgl");
    this.onMobile = mobileCheck();
    this.windowSizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.simulationSettings = {
      worldTimeStep: 1 / 60,
      gravity: {
        x: 0,
        y: 0,
        z: 0,
      },
      worldBounds: {
        x: 100,
        y: 100,
        z: 100,
      },
      objectLimit: 20,
      fusRoDahForce: 2,
      dragForce: 1,
      projectileType: PROJECTILE_TYPES.BANANA,
      projectileSpeed: 5,
      projectileMass: 1,
      pressGap: 2.5,
      punchStrength: 2,
      meleeType: MELEE_TYPES.SWORD,
    };
    this.currentClickContext = INTERACTION.NONE;
    this.updateMoney = updateMoney ?? (() => {});
    this.updateModelLoadingLabel = updateModelLoadingLabel ?? (() => {});
    this.interactionsController = new InteractionsController(
      audioPath,
      updateMoney
    );
    this.DEBUG = true;

    ////////// THREE //////////
    this.texturePath = texturePath;
    this.gltfLoader = new GLTFLoader().setPath(modelPath);
    this.fbxLoader = new FBXLoader().setPath(modelPath);
    this.textureLoader = new THREE.TextureLoader();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.camera = this.createCamera(75, 0.01, 100, {
      x: 0,
      y: this.onMobile ? 2 : 1,
      z: this.onMobile ? 1.5 : 2.5,
    });
    this.scene = this.createScene(COLORS.WHITE);
    this.renderer = this.createRenderer();
    this.composer = this.createComposer(this.renderer, this.scene, this.camera);
    this.controls = this.createControls(true, false, false);
    this.controlsTargetOffset = {
      x: 0,
      y: 1.25,
      z: 0,
    };
    this.previousClickLocation = null;
    window.addEventListener("resize", this.onWindowResize.bind(this));
    if (this.onMobile) {
      window.addEventListener("touchstart", this.handleMouseDown.bind(this));
      window.addEventListener("touchend", this.handleMouseUp.bind(this));
    } else {
      window.addEventListener("mousedown", this.handleMouseDown.bind(this));
      window.addEventListener("mouseup", this.handleMouseUp.bind(this));
    }

    this.lights = [];
    this.lightsColor = COLORS.WHITE;
    this.lightsIntensity = 2;
    this.dummySettings = {
      modelName: "billionaire.fbx",
      bonesToParentToBodies: billionaireBonesToCopyToBodies,
      bodiesData: billionaireRagdollBodyData,
      ragdollType: RAGDOLL_TYPES.BENDY,
      modelInitParams: {
        x: 0,
        y: 0,
        z: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
      },
    };
    this.dummy = null;
    this.propMeshes = {};

    this.pins = [];
    this.projectiles = [];
    this.stuckProjectiles = [];
    this.press = null;
    this.drawAndQuarter = null;
    this.drawAndQuarterInitialPivot = null;
    this.guillotine = null;
    this.guillotineMesh = null;
    this.meleeWeapon = null;
    this.freezeConstraints = [];
    this.fire = null;
    this.fireTexture = null;
    this.lightningStrike = null;
    this.lightningStrikeMesh = null;
    this.lightningOutlineMeshArray = [];

    ////////// CANNON //////////
    this.world = this.createWorld();
  }

  ////////// THREE JS FUNCTIONS //////////
  initializeThreeScene() {
    const gridHelper = this.createGridHelper(20, 20);
    this.scene.add(gridHelper);

    this.loadDummy(this.dummySettings);
  }

  initializeMeshCache() {
    this.getPropMesh(this.simulationSettings.projectileType);
    this.getPropMesh(this.simulationSettings.meleeType);
    this.loadGuillotineMesh();
    this.textureLoader.load(`${this.texturePath}/fire.png`, (fireTexture) => {
      this.fireTexture = fireTexture;
    });
  }

  onWindowResize() {
    this.windowSizes.width = window.innerWidth;
    this.windowSizes.height = window.innerHeight;

    this.camera.aspect = this.windowSizes.width / this.windowSizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.windowSizes.width, this.windowSizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  onDummyLoad(model, modelSettings) {
    this.updateModelLoadingLabel();
    model.position.x = modelSettings.modelInitParams.x;
    model.position.y = modelSettings.modelInitParams.y;
    model.position.z = modelSettings.modelInitParams.z;
    model.rotateX(modelSettings.modelInitParams.rotateX);
    model.rotateY(modelSettings.modelInitParams.rotateY);
    model.rotateZ(modelSettings.modelInitParams.rotateZ);
    model.scale.set(
      modelSettings.modelInitParams.scaleX,
      modelSettings.modelInitParams.scaleY,
      modelSettings.modelInitParams.scaleZ
    );

    this.dummy = new PhysicalThing(model, modelSettings);

    this.scene.add(this.dummy.model);
    this.setControlTarget(this.dummy.model.position, this.controlsTargetOffset);
    this.lights = this.createSceneLights(
      this.dummy.model.position,
      this.lightsColor,
      this.lightsIntensity
    );
    this.lights.forEach((light) => this.scene.add(light));

    const { bodiesMap, constraintsMap } = this.createDummyRagdoll(
      this.dummy.model,
      modelSettings.ragdollType,
      modelSettings.bodiesData
    );
    this.dummy.addBodies(bodiesMap);
    this.dummy.addConstraints(constraintsMap);
    this.dummy.recordInitialBodyPositionsAndQuaternions();
    this.dummy.getBodies().forEach((body) => {
      if (!body) return;
      this.world.addBody(body);
    });
    this.dummy.getConstraints().forEach((constraint) => {
      this.world.addConstraint(constraint);
    });
    if (this.DEBUG) {
      this.dummy.DEBUG = this.DEBUG;
      this.dummy.createDebugMeshes();
      this.dummy.debugMeshes.forEach((mesh) => this.scene.add(mesh));
    }
  }

  onPropMeshLoad(prop, propName) {
    this.propMeshes[propName] = {
      meshName: propName,
      mesh: prop.scene,
      dimensions: getCubeDimensionsFromMesh(prop.scene),
    };
  }

  render() {
    this.controls.update();
    this.updateWorldPhysics();
    if (this.lightningStrike) this.updateLightning(performance.now() / 500);
    this.composer.render();
    // this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }

  createCamera(fov, near, far, cameraPosition) {
    const camera = new THREE.PerspectiveCamera(
      fov,
      this.windowSizes.width / this.windowSizes.height,
      near,
      far
    );
    camera.position.x = cameraPosition.x;
    camera.position.y = cameraPosition.y;
    camera.position.z = cameraPosition.z;
    return camera;
  }

  createScene(backgroundColor) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    return scene;
  }

  changeSceneBackgroundColor(scene, newColor) {
    scene.background = new THREE.Color(newColor);
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
    });
    renderer.setSize(this.windowSizes.width, this.windowSizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    return renderer;
  }

  createComposer(renderer, scene, camera) {
    const composer = new EffectComposer(renderer);
    composer.passes = [];
    composer.addPass(new RenderPass(scene, camera));
    return composer;
  }

  createControls(enableZoom, enableDamping, autoRotate) {
    const controls = new OrbitControls(this.camera, this.canvas);
    controls.enableZoom = enableZoom;
    controls.enableDamping = enableDamping;
    controls.autoRotate = autoRotate;
    return controls;
  }

  setControlTarget(targetPosition, offset) {
    this.controls.target.set(
      targetPosition.x + offset.x,
      targetPosition.y + offset.y,
      targetPosition.z + offset.z
    );
  }

  createSceneLights(center, color, intensity) {
    const distanceFromModel = 100;
    const lights = [];
    const frontSunLight = new THREE.DirectionalLight(color, intensity);
    frontSunLight.position.x = center.x + 0;
    frontSunLight.position.y = center.y + distanceFromModel;
    frontSunLight.position.z = center.z + distanceFromModel;
    frontSunLight.target.position.set(center.x, center.y, center.z);

    const backSunLight = new THREE.DirectionalLight(color, intensity);
    backSunLight.position.x = center.x + 0;
    backSunLight.position.y = center.y + distanceFromModel;
    backSunLight.position.z = center.z - distanceFromModel;
    backSunLight.target.position.set(center.x, center.y, center.z);

    const leftSunLight = new THREE.DirectionalLight(color, intensity);
    leftSunLight.position.x = center.x - distanceFromModel;
    leftSunLight.position.y = center.y + distanceFromModel;
    leftSunLight.position.z = center.z + 0;
    leftSunLight.target.position.set(center.x, center.y, center.z);

    const rightSunLight = new THREE.DirectionalLight(color, intensity);
    rightSunLight.position.x = center.x + distanceFromModel;
    rightSunLight.position.y = center.y + distanceFromModel;
    rightSunLight.position.z = center.z + 0;
    rightSunLight.target.position.set(center.x, center.y, center.z);

    lights.push(frontSunLight);
    lights.push(backSunLight);
    lights.push(leftSunLight);
    lights.push(rightSunLight);
    return lights;
  }

  createGridHelper(size = 10, divisions = 10) {
    return new THREE.GridHelper(size, divisions);
  }

  loadDummy(modelSettings) {
    this.fbxLoader.load(modelSettings.modelName, (model) => {
      this.onDummyLoad(model, modelSettings);
    });
  }

  loadGuillotineMesh() {
    this.gltfLoader.load("props/guillotine.glb", (guillotine) => {
      this.guillotineMesh = guillotine.scene;
    });
  }

  getPropMesh(propName, gltfOrFbx = "glb") {
    if (this.propMeshes[propName]) return this.propMeshes[propName];
    const propPath = `props/${propName}.${gltfOrFbx}`;
    if (gltfOrFbx === "glb") {
      this.gltfLoader.load(propPath, (prop) => {
        this.onPropMeshLoad(prop, propName);
      });
    } else if (gltfOrFbx === "fbx") {
      this.fbxLoader.load(propPath, (prop) => {
        this.onPropMeshLoad(prop, propName);
      });
    }
    return createPlaceholderMesh();
  }

  checkInMobileNoClickZones(clickX, clickY) {
    if (clickY < -0.42 || clickX > 0.577) return true;
  }

  checkInDesktopNoClickZones(clickX, clickY) {
    if (clickY < -0.65 || clickX > 0.923) return true;
  }

  getCurrentMouseLocation(event) {
    let x;
    let y;
    if (
      (event.type === "touchstart" || event.type === "touchend") &&
      event.changedTouches.length > 0
    ) {
      x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
      y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
    } else {
      x = (event.clientX / window.innerWidth) * 2 - 1;
      y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    return { x: x, y: y };
  }

  recordPreviousClickLocation(event) {
    this.previousClickLocation = this.getCurrentMouseLocation(event);
  }

  getIntersectedObjects() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(this.scene.children);
  }

  getClosestIntersectedObject() {
    const intersectedObjects = this.getIntersectedObjects();
    let closestIntersectedObject;
    if (intersectedObjects.length > 0) {
      const objects = intersectedObjects.filter(
        (intersectedObject) => intersectedObject.object.type !== "GridHelper"
      );
      if (objects.length > 0) {
        closestIntersectedObject = objects[0];
        // const intersectedPartName = closestIntersectedObject.object.name;
        // console.log(closestIntersectedObject);
      }
    }
    return closestIntersectedObject;
  }

  setCurrentClickContext(newClickContext = INTERACTION.NONE) {
    this.currentClickContext = newClickContext;
    if (this.currentClickContext === INTERACTION.DRAG_DUMMY) {
      this.controls.enabled = false;
    } else {
      this.controls.enabled = true;
    }
  }

  removeThing(thing) {
    if (!thing) return;
    this.scene.remove(thing.model);
    thing.getBodies().forEach((body) => {
      if (!body) return;
      this.world.removeBody(body);
    });
    thing.getConstraints().forEach((constraint) => {
      this.world.removeConstraint(constraint);
    });
    thing.debugMeshes.forEach((mesh) => this.scene.remove(mesh));
  }
  ////////// THREE JS FUNCTIONS //////////
  ////////// CANNON JS FUNCTIONS //////////
  createWorld() {
    const world = new CANNON.World();
    world.gravity.set(
      this.simulationSettings.gravity.x,
      this.simulationSettings.gravity.y,
      this.simulationSettings.gravity.z
    );
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    return world;
  }

  createGround(sizeX = 100, sizeY = 100) {
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(sizeX, sizeY),
      new THREE.MeshPhongMaterial()
    );
    groundMesh.rotation.x = -Math.PI / 2;

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.position.set(
      groundMesh.position.x,
      groundMesh.position.y,
      groundMesh.position.z
    );
    groundBody.quaternion.x = groundMesh.quaternion.x;
    groundBody.quaternion.y = groundMesh.quaternion.y;
    groundBody.quaternion.z = groundMesh.quaternion.z;
    groundBody.quaternion.w = groundMesh.quaternion.w;

    return groundBody;
  }

  initializeCannonWorld() {
    this.world.addBody(this.createGround());
  }

  updateWorldPhysics() {
    if (!this.world) return;
    this.world.step(this.simulationSettings.worldTimeStep);
    this.cullExtraObjectsAboveLimit();
    this.resetObjectsIfOutOfBounds();
    this.handleCustomProjectiles();
    this.dummy?.update();
    this.pins.forEach((pin) => pin.update(false));
    this.projectiles.forEach((projectile) => projectile.updateSimple());
    this.stuckProjectiles.forEach((projectile) => projectile.updateSimple());
    this.press?.updateSimple();
    this.drawAndQuarter?.updateSimple();
    this.guillotine?.updateSimple();
    this.moveMeleeWeaponPivot();
    this.meleeWeapon?.updateSimple();
    if (this.fire) {
      this.fire.model.update(performance.now() / 1000);
      if (
        this.fire.model.position.distanceTo(
          this.dummy.getBodyPosition("pelvis")
        ) < 1
      ) {
        this.updateMoney(INTERACTION_PAYOUT[INTERACTION.FIRE]);
      }
    }
  }

  createDummyRagdoll(dummyModel, ragdollType, dummyBodiesData) {
    let ragdoll;
    if (ragdollType == RAGDOLL_TYPES.BASIC) {
      ragdoll = createBasicRagdoll();
    } else if (ragdollType == RAGDOLL_TYPES.BENDY) {
      ragdoll = createBendyRagdoll(dummyModel, dummyBodiesData);
    }
    return ragdoll;
  }

  getClosestBodyNameToPoint(
    targetPosition,
    threshold = 0.5,
    physicalThing = this.dummy
  ) {
    if (!physicalThing || !physicalThing.bodiesMap) return;
    const distances = [];
    Object.keys(physicalThing.bodiesMap).forEach((bodyName) => {
      const body = physicalThing.bodiesMap[bodyName];
      if (!body) return;
      const distance = body.position.distanceTo(targetPosition);
      distances.push({ bodyName, distance });
    });
    distances.sort((a, b) => a.distance - b.distance);
    if (distances[0].distance < threshold) {
      return distances[0].bodyName;
    }
  }

  getClosestBodyToPoint(targetPosition, threshold = 0.5) {
    const distances = [];
    this.world.bodies.forEach((body) => {
      if (!body) return;
      const distance = body.position.distanceTo(targetPosition);
      distances.push({ body, distance });
    });
    distances.sort((a, b) => a.distance - b.distance);
    if (distances.length > 1 && distances[1].distance < threshold) {
      return distances[1].body;
    }
  }

  computeForwardTip(projectileBody, projectileName) {
    const width = projectileBody.shapes[0].halfExtents.x;
    const height = projectileBody.shapes[0].halfExtents.y;
    const depth = projectileBody.shapes[0].halfExtents.z;
    let projectileLocalForward = PROJECTILE_LOCAL_FORWARD[projectileName];
    if (!projectileLocalForward) projectileLocalForward = { x: 0, y: 0, z: -1 };
    const localTip = new CANNON.Vec3(
      projectileLocalForward.x * width,
      projectileLocalForward.y * height,
      projectileLocalForward.z * depth
    );
    const tipPosWorld = projectileBody.pointToWorldFrame(localTip);
    return tipPosWorld;
  }

  changeWorldGravity(newGravity) {
    this.simulationSettings.gravity = {
      x: this.simulationSettings.gravity.x,
      y: parseFloat(newGravity),
      z: this.simulationSettings.gravity.z,
    };
    this.world.gravity.set(
      this.simulationSettings.gravity.x,
      this.simulationSettings.gravity.y,
      this.simulationSettings.gravity.z
    );
  }

  resetObjectsIfOutOfBounds() {
    const upperBody = this.dummy?.bodiesMap["upperBody"];
    if (!upperBody) return;
    const worldBounds = this.simulationSettings.worldBounds;
    if (
      upperBody.position.y > worldBounds.y ||
      upperBody.position.y < -worldBounds.y ||
      upperBody.position.x > worldBounds.x ||
      upperBody.position.x < -worldBounds.x ||
      upperBody.position.z > worldBounds.z ||
      upperBody.position.z < -worldBounds.z
    ) {
      this.dummy?.resetBodiesToInitialPositions();
    }
    this.projectiles.forEach((projectile) => {
      const projectileBody = projectile.getBodies()[0];
      if (!projectileBody) return;
      if (
        projectileBody.position.y > worldBounds.y ||
        projectileBody.position.y < -worldBounds.y ||
        projectileBody.position.x > worldBounds.x ||
        projectileBody.position.x < -worldBounds.x ||
        projectileBody.position.z > worldBounds.z ||
        projectileBody.position.z < -worldBounds.z
      ) {
        this.removeThing(projectile);
        this.projectiles = this.projectiles.filter(
          (proj) => proj !== projectile
        );
      }
    });
    if (this.stuckProjectiles.length > 0) {
      const stuckProjectile = this.stuckProjectiles[0];
      const projectileBody = stuckProjectile.getBodies()[0];
      if (!projectileBody) return;
      if (
        projectileBody.position.y > worldBounds.y ||
        projectileBody.position.y < -worldBounds.y ||
        projectileBody.position.x > worldBounds.x ||
        projectileBody.position.x < -worldBounds.x ||
        projectileBody.position.z > worldBounds.z ||
        projectileBody.position.z < -worldBounds.z
      ) {
        this.stuckProjectiles.forEach((stuckProjectile) => {
          this.removeThing(stuckProjectile);
        });
        this.stuckProjectiles = [];
      }
    }
  }

  isImpaleProjectile(projectile) {
    let isImpale = false;
    projectile.bodyNames.forEach((bodyName) => {
      if (IMPALE_PROJECTILES.includes(bodyName)) isImpale = true;
    });
    return isImpale;
  }

  isExplosiveProjectile(projectile) {
    let isExplosive = false;
    projectile.bodyNames.forEach((bodyName) => {
      if (EXPLOSIVE_PROJECTILES.includes(bodyName)) isExplosive = true;
    });
    return isExplosive;
  }

  handleStickyProjectile(projectile) {
    const projectileBody = projectile.getBodies()[0];
    if (!projectileBody) return;
    const projectileName = projectile.bodyNames[0];
    const stickThreshold = 0.1;
    const tipPosWorld = this.computeForwardTip(projectileBody, projectileName);
    const closestBodyName = this.getClosestBodyNameToPoint(
      tipPosWorld,
      stickThreshold,
      this.dummy
    );
    const closestBody = this.dummy?.bodiesMap[closestBodyName];
    if (!closestBody) return;

    this.projectiles = this.projectiles.filter((proj) => proj !== projectile);
    const stuckConstraint = new CANNON.LockConstraint(
      closestBody,
      projectileBody
    );
    const constraintMap = {
      stuckConstraint: stuckConstraint,
    };
    projectile.addConstraints(constraintMap);
    projectile.getConstraints().forEach((constraint) => {
      this.world.addConstraint(constraint);
    });
    this.stuckProjectiles.push(projectile);
    this.updateMoney(INTERACTION_PAYOUT[INTERACTION.PROJECTILE]);
    this.interactionsController.playHurtSound();
  }

  handleExplosiveProjectile(projectile) {
    const projectileBody = projectile.getBodies()[0];
    if (!projectileBody) return;
    const projectileName = projectile.bodyNames[0];
    const tipPosWorld = this.computeForwardTip(projectileBody, projectileName);
    const closestBody = this.getClosestBodyToPoint(
      tipPosWorld,
      EXPLOSIVE_PROJECTILE_PARAMETERS.proximityRadius
    );
    if (!closestBody) return;
    const explosionForce =
      EXPLOSIVE_PROJECTILE_PARAMETERS.explosionForce *
      (Math.abs(this.simulationSettings.gravity.y) + 1);
    this.interactionsController.playExplosionSound(() => {
      this.interactionsController.applyExplosionImpulse(
        this.world,
        tipPosWorld,
        EXPLOSIVE_PROJECTILE_PARAMETERS.explosionRadius,
        explosionForce
      );
      this.projectiles = this.projectiles.filter((proj) => proj !== projectile);
      this.removeThing(projectile);
      this.updateMoney(INTERACTION_PAYOUT[INTERACTION.PROJECTILE] * 10);
    });
  }

  handleCustomProjectiles() {
    this.projectiles.forEach((projectile) => {
      if (this.isImpaleProjectile(projectile))
        this.handleStickyProjectile(projectile);
      else if (this.isExplosiveProjectile(projectile))
        this.handleExplosiveProjectile(projectile);
    });
  }

  cullExtraObjectsAboveLimit() {
    while (this.projectiles.length > this.simulationSettings.objectLimit) {
      const projectile = this.projectiles.shift();
      this.removeThing(projectile);
    }
    while (this.stuckProjectiles.length > this.simulationSettings.objectLimit) {
      const stuckProjectile = this.stuckProjectiles.shift();
      this.removeThing(stuckProjectile);
    }
  }

  clearAllNonDummyObjects() {
    this.clearAllProjectiles();
  }
  ////////// CANNON JS FUNCTIONS //////////
  ////////// EVENT HANDLERS //////////
  handleMouseClick(event) {
    if (
      (event.type === "mousedown" || event.type === "mouseup") &&
      event.which != 1
    )
      return;

    const mouseLocation = this.getCurrentMouseLocation(event);
    if (mouseLocation.x == null || mouseLocation.y == null) return;
    this.pointer.x = mouseLocation.x;
    this.pointer.y = mouseLocation.y;

    if (
      (this.onMobile &&
        this.checkInMobileNoClickZones(this.pointer.x, this.pointer.y)) ||
      (!this.onMobile &&
        this.checkInDesktopNoClickZones(this.pointer.x, this.pointer.y))
    )
      return;

    const closestIntersectedObject = this.getClosestIntersectedObject();

    if (this.currentClickContext === INTERACTION.PIN) {
      this.handlePin(closestIntersectedObject);
    } else if (this.currentClickContext === INTERACTION.PROJECTILE) {
      this.handleThrowProjectile();
    } else if (this.currentClickContext === INTERACTION.PUNCH) {
      this.handlePunchDummy(closestIntersectedObject);
    } else if (this.currentClickContext === INTERACTION.MELEE) {
      this.swingMeleeWeapon();
    }
  }

  handleMouseDrag(event) {
    if (this.currentClickContext === INTERACTION.DRAG_DUMMY) {
      this.handleDragDummy(event);
    }
  }

  handleMouseDown(event) {
    this.recordPreviousClickLocation(event);
  }

  handleMouseUp(event) {
    const currentMouseLocation = this.getCurrentMouseLocation(event);
    if (currentMouseLocation.x == null || currentMouseLocation.y == null)
      return;
    const distanceBetweenClicks =
      this.previousClickLocation &&
      distance2D(currentMouseLocation, this.previousClickLocation);
    if (distanceBetweenClicks < 0.01) {
      this.handleMouseClick(event);
    } else {
      this.handleMouseDrag(event);
    }
  }

  handleDarkModeToggle(appSettings) {
    this.changeSceneBackgroundColor(
      this.scene,
      appSettings.darkMode
        ? appSettings.darkModeBackgroundColor
        : appSettings.lightModeBackgroundColor
    );
  }

  handleReloadScene() {
    this.clearAllNonDummyObjects();
    const previouslyFrozen = this.freezeConstraints.length > 0;
    if (previouslyFrozen) this.handleUnfreezeDummy();
    this.dummy?.resetBodiesToInitialPositions();
    if (previouslyFrozen) this.handleFreezeDummy();
  }

  handlePin(target) {
    if (!target || !target.point) return;
    const targetBodyName = this.getClosestBodyNameToPoint(target.point);
    const targetBody = this.dummy?.bodiesMap[targetBodyName];
    if (!targetBody) return;
    const pin = this.interactionsController.createPin(target.point, targetBody);

    this.scene.add(pin.model);
    pin.getBodies().forEach((body) => {
      if (!body) return;
      this.world.addBody(body);
    });
    pin.getConstraints().forEach((constraint) => {
      this.world.addConstraint(constraint);
    });

    this.pins.push(pin);
  }

  handleClearAllPins() {
    this.pins.forEach((pin) => {
      this.removeThing(pin);
    });
    this.pins = [];
  }

  handleDragDummy(event) {
    const previousMouseLocation = this.previousClickLocation;
    const currentMouseLocation = this.getCurrentMouseLocation(event);
    if (
      currentMouseLocation.x == null ||
      currentMouseLocation.y == null ||
      previousMouseLocation.x == null ||
      previousMouseLocation.y == null
    )
      return;
    const deltaX = currentMouseLocation.x - previousMouseLocation.x;
    const deltaY = currentMouseLocation.y - previousMouseLocation.y;
    this.interactionsController.dragModel(
      this.dummy,
      this.camera,
      Math.abs(this.simulationSettings.gravity.y) +
        this.simulationSettings.dragForce,
      deltaX,
      deltaY
    );
  }

  handleFusRoDah() {
    this.interactionsController.fusRoDah(
      this.dummy,
      this.camera,
      this.simulationSettings.fusRoDahForce
    );
  }

  handleGoldenWind() {
    if (!this.dummy) return;
    this.dummy?.resetBodiesToInitialPositions();
    this.handleClearAllPins();
    const anchorBodyName = "upperBody";
    const pinPosition = {
      point: {
        x: this.dummy.bodiesMap[anchorBodyName].position.x,
        y: this.dummy.bodiesMap[anchorBodyName].position.y,
        z: this.dummy.bodiesMap[anchorBodyName].position.z - 0.2,
      },
    };
    this.handlePin(pinPosition);
    this.interactionsController.goldenWind(
      this.dummy,
      this.camera,
      this.handleClearAllPins.bind(this)
    );
  }

  updateThrowProjectileSettings(
    projectileType,
    projectileMass,
    projectileSpeed
  ) {
    if (!this.propMeshes[projectileType]) {
      this.getPropMesh(projectileType, "glb");
    }
    this.simulationSettings.projectileType = projectileType;
    this.simulationSettings.projectileMass = projectileMass;
    this.simulationSettings.projectileSpeed = projectileSpeed;
  }

  updateMeleeSettings(meleeType) {
    if (!this.propMeshes[meleeType]) {
      this.getPropMesh(meleeType, "glb");
    }
    this.simulationSettings.meleeType = meleeType;
    this.disableMeleeWeapon();
    this.enableMeleeWeapon();
  }

  clearAllProjectiles() {
    this.projectiles.forEach((projectile) => {
      this.removeThing(projectile);
    });
    this.stuckProjectiles.forEach((stuckProjectile) => {
      this.removeThing(stuckProjectile);
    });
    this.projectiles = [];
    this.stuckProjectiles = [];
  }

  handleThrowProjectile() {
    const throwDirection = this.raycaster.ray.direction;
    const propName = this.simulationSettings.projectileType;
    const propMesh = this.getPropMesh(propName, "glb");
    const propMass = this.simulationSettings.projectileMass;
    const propSpeed = this.simulationSettings.projectileSpeed;
    const throwOrigin = {
      x: this.camera.position.x,
      y: this.camera.position.y - 0.1,
      z: this.camera.position.z,
    };
    if (propName === PROJECTILE_TYPES.BULLET)
      this.interactionsController.playGunshotSound();
    const projectile = this.interactionsController.createProjectile(
      propMesh.meshName,
      propMesh.mesh,
      propMesh.dimensions,
      propMass,
      propSpeed,
      throwDirection,
      throwOrigin
    );
    if (this.DEBUG) {
      projectile.createDebugMeshes();
      projectile.DEBUG = true;
      projectile.debugMeshes.forEach((mesh) => this.scene.add(mesh));
    }
    this.projectiles.push(projectile);
    this.scene.add(projectile.model);
    projectile.getBodies().forEach((body) => {
      if (!body) return;
      this.world.addBody(body);
    });
  }

  removePress() {
    this.removeThing(this.press);
    this.press = null;
  }

  changePressType(orientation = PRESS_ORIENTATION.VERTICAL, darkMode = false) {
    this.removePress();
    this.spawnPress(orientation, darkMode);
  }

  spawnPress(orientation = PRESS_ORIENTATION.VERTICAL, darkMode = false) {
    const targetPosition =
      orientation === PRESS_ORIENTATION.VERTICAL
        ? this.dummy.getBodyPosition("pelvis")
        : this.dummy.getBodyPosition("upperBody");
    const press = this.interactionsController.createPress(
      targetPosition ?? { x: 0, y: 0, z: 0 },
      this.simulationSettings.pressGap,
      orientation,
      darkMode
    );
    this.press = press;
    this.scene.add(press.model);
    press.getBodies().forEach((body) => {
      if (!body) return;
      this.world.addBody(body);
    });
  }

  movePress(value, orientation = PRESS_ORIENTATION.VERTICAL) {
    if (!this.press) return;
    this.interactionsController.movePress(
      this.press,
      this.simulationSettings.pressGap,
      value,
      orientation
    );
  }

  removeDrawAndQuarter() {
    this.removeThing(this.drawAndQuarter);
    this.drawAndQuarter = null;
    this.drawAndQuarterInitialPivot = null;
  }

  spawnDrawAndQuarter(angle, stretchPercentage) {
    this.drawAndQuarterInitialPivot = new CANNON.Body();
    this.drawAndQuarterInitialPivot.position.copy(
      this.dummy?.bodiesMap[DRAW_AND_QUARTER_ATTRIBUTES.DUMMY_PIVOT].position
    );
    this.drawAndQuarterInitialPivot.quaternion.copy(
      this.dummy?.bodiesMap[DRAW_AND_QUARTER_ATTRIBUTES.DUMMY_PIVOT].quaternion
    );
    const drawAndQuarter = this.interactionsController.createDrawAndQuarter(
      this.dummy,
      parseFloat(angle),
      parseFloat(stretchPercentage)
    );
    this.drawAndQuarter = drawAndQuarter;
    this.scene.add(drawAndQuarter.model);
    drawAndQuarter.getBodies().forEach((body) => {
      if (!body) return;
      this.world.addBody(body);
    });
    drawAndQuarter.getConstraints().forEach((constraint) => {
      this.world.addConstraint(constraint);
    });
  }

  moveDrawAndQuarter(angle, stretchPercentage) {
    if (!this.drawAndQuarter) return;
    this.interactionsController.moveDrawAndQuarter(
      this.drawAndQuarterInitialPivot,
      this.drawAndQuarter,
      parseFloat(angle),
      parseFloat(stretchPercentage)
    );
    if (parseFloat(stretchPercentage) > 0) {
      this.updateMoney(INTERACTION_PAYOUT[INTERACTION.DRAW_AND_QUARTER]);
    }
  }

  handlePunchDummy(target) {
    if (!target || !target.point) return;
    const targetBodyName = this.getClosestBodyNameToPoint(target.point);
    const targetBody = this.dummy?.bodiesMap[targetBodyName];
    if (!targetBody) return;
    this.interactionsController.punchDummy(
      this.dummy,
      this.camera,
      Math.abs(this.simulationSettings.gravity.y) +
        this.simulationSettings.punchStrength,
      [targetBodyName]
    );
    this.updateMoney(INTERACTION_PAYOUT[INTERACTION.PUNCH]);
  }

  handleFreezeDummy() {
    if (this.freezeConstraints.length > 0) return;
    this.freezeConstraints = this.interactionsController.freezeDummy(
      this.dummy
    );
    this.freezeConstraints.forEach((constraint) => {
      this.world.addConstraint(constraint);
    });
  }

  handleUnfreezeDummy() {
    this.freezeConstraints.forEach((constraint) => {
      this.world.removeConstraint(constraint);
    });
    this.freezeConstraints = [];
  }

  spawnGuillotine() {
    if (this.guillotine) return;
    if (!this.guillotineMesh) {
      this.loadGuillotineMesh();
      return;
    }
    const guillotine = this.interactionsController.createGuillotine(
      this.guillotineMesh
    );
    this.scene.add(guillotine.model);
    guillotine.getBodies().forEach((body) => {
      if (!body) return;
      this.world.addBody(body);
    });
    guillotine.debugMeshes.forEach((mesh) => this.scene.add(mesh));
    this.guillotine = guillotine;

    this.dummy?.resetBodiesToInitialPositions();
    this.dummy?.moveBody([], {
      x: this.guillotine.getBodies()[0].position.x,
      y: this.guillotine.getBodies()[0].position.y + 0.5,
      z: this.guillotine.getBodies()[0].position.z - 0.49,
    });
    this.dummy?.applyImpulse(["head"], { x: -0.05, y: 0, z: 1 });
    this.dummy?.applyImpulse(["lowerLeftLeg", "lowerRightLeg"], {
      x: 0,
      y: 0,
      z: -0.5,
    });
  }

  removeGuillotine() {
    this.removeThing(this.guillotine);
    this.guillotine = null;
  }

  moveGuillotineBlade(value) {
    if (!this.guillotine) return;
    this.interactionsController.moveGuillotineBlade(this.guillotine, value);
  }

  moveMeleeWeaponPivot() {
    if (!this.meleeWeapon) return;
    this.interactionsController.moveMeleeWeaponPivot(
      this.camera,
      this.meleeWeapon
    );
  }

  enableMeleeWeapon() {
    if (!this.meleeWeapon) {
      this.meleeWeapon = this.interactionsController.createMeleeWeapon(
        this.camera,
        this.simulationSettings.meleeType,
        this.getPropMesh(this.simulationSettings.meleeType, "glb"),
        5
      );
      this.scene.add(this.meleeWeapon.model);
      this.meleeWeapon.getBodies().forEach((body) => {
        if (!body) return;
        this.world.addBody(body);
      });
      this.meleeWeapon.getConstraints().forEach((constraint) => {
        this.world.addConstraint(constraint);
      });
    }
  }

  disableMeleeWeapon() {
    this.removeThing(this.meleeWeapon);
    this.meleeWeapon = null;
  }

  swingMeleeWeapon() {
    if (!this.meleeWeapon) return;
    this.interactionsController.swingMeleeWeapon(
      this.meleeWeapon.bodiesMap[this.simulationSettings.meleeType]
    );
  }

  removeFire() {
    this.removeThing(this.fire);
    this.fire = null;
  }

  createFire() {
    if (!this.fireTexture) return;
    if (this.fire) this.removeFire();
    this.fire = this.interactionsController.createFire(
      this.dummy,
      this.fireTexture
    );
    this.scene.add(this.fire.model);
    this.fire.getBodies().forEach((body) => {
      if (!body) return;
      this.world.addBody(body);
    });
  }

  changeLightningColor(lightningColor, lightningOutlineColor) {
    this.removeLightning();
    this.createLightning(lightningColor, lightningOutlineColor);
  }

  removeLightning() {
    if (this.lightningStrikeMesh) {
      this.scene.remove(this.lightningStrikeMesh);
    }
    this.lightningStrikeMesh = null;
    this.lightningStrike = null;
    this.composer = this.createComposer(this.renderer, this.scene, this.camera);
    this.interactionsController.stopLightningAudio();
  }

  recreateRay(lightningColor) {
    if (this.lightningStrikeMesh) {
      this.scene.remove(this.lightningStrikeMesh);
    }
    this.lightningStrike = new LightningStrike(DEFAULT_LIGHTNING_RAY_PARAMS);
    const lightningMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(lightningColor),
    });
    this.lightningStrikeMesh = new THREE.Mesh(
      this.lightningStrike,
      lightningMaterial
    );
    this.lightningOutlineMeshArray.length = 0;
    this.lightningOutlineMeshArray.push(this.lightningStrikeMesh);
    this.scene.add(this.lightningStrikeMesh);
  }

  createLightningOutline(scene, camera, composer, objectsArray, visibleColor) {
    const lightningOutlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera,
      objectsArray
    );
    lightningOutlinePass.edgeStrength = 2.5;
    lightningOutlinePass.edgeGlow = 0.7;
    lightningOutlinePass.edgeThickness = 2.8;
    lightningOutlinePass.visibleEdgeColor = visibleColor;
    lightningOutlinePass.hiddenEdgeColor.set(0);
    lightningOutlinePass.renderToScreen = true;
    return lightningOutlinePass;
  }

  createLightning(lightningColor, lightningOutlineColor) {
    this.recreateRay(lightningColor);
    this.composer = this.createComposer(this.renderer, this.scene, this.camera);
    const lightningOutlinePass = this.createLightningOutline(
      this.scene,
      this.camera,
      this.composer,
      this.lightningOutlineMeshArray,
      new THREE.Color(lightningOutlineColor)
    );
    this.composer.addPass(lightningOutlinePass);
    const gammaCorrection = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaCorrection);
    this.interactionsController.playLightningAudio();
  }

  updateLightning(time) {
    if (this.dummy && this.lightningStrike) {
      const cameraPosition = this.camera.position;
      const dummyPosition = this.dummy.getBodyPosition("upperBody");
      this.lightningStrike.rayParameters.sourceOffset.copy(cameraPosition);
      this.lightningStrike.rayParameters.sourceOffset.y -= 1;
      this.lightningStrike.rayParameters.destOffset.copy(dummyPosition);
      this.lightningStrike.update(time);

      const randomBodyPartName =
        this.dummy.bodyNames[
          Math.floor(Math.random() * this.dummy.bodyNames.length)
        ];
      const randomShockDirectionX = -1 + Math.random() * 2;
      const randomShockDirectionY = -1 + Math.random() * 2;
      const randomShockDirectionZ = -1 + Math.random() * 2;
      const shockDirection = new CANNON.Vec3(
        randomShockDirectionX,
        randomShockDirectionY,
        randomShockDirectionZ
      );
      const shockStrength = 0.5;
      shockDirection.scale(shockStrength, shockDirection);
      this.dummy.applyImpulse([randomBodyPartName], {
        x: shockDirection.x,
        y: shockDirection.y,
        z: shockDirection.z,
      });
      this.updateMoney(INTERACTION_PAYOUT[INTERACTION.LIGHTNING]);
    }
  }
  ////////// EVENT HANDLERS //////////
}

export default SimulationController;
