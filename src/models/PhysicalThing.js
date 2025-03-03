import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm";
import { getRandomColorHexCode } from "../utils/utils.js";
import { bodyToMesh } from "../utils/modelUtils.js";

class PhysicalThing {
  constructor(model, modelSettings = {}, bodiesMap = {}, constraintsMap = {}) {
    this.model = model;
    this.modelSettings = modelSettings ?? {};
    this.bodiesMap = bodiesMap ?? {};
    this.bodyNames = [];
    this.bodies = [];
    this.constraintsMap = constraintsMap ?? {};
    this.constraintNames = [];
    this.constraints = [];
    this.bodiesInitialSpawnPosition = {};
    this.bodiesInitialSpawnQuaternion = {};
    this.DEBUG = false;
    this.debugMeshes = [];
  }

  clearBodies() {
    this.bodiesMap = {};
    this.bodyNames = [];
    this.bodies = [];
  }

  clearConstraints() {
    this.constraintsMap = {};
    this.constraintNames = [];
    this.constraints = [];
  }

  addBodies(bodiesMap) {
    this.bodiesMap = { ...this.bodiesMap, ...bodiesMap };
    this.bodyNames = Object.keys(this.bodiesMap);
    this.bodies = Object.values(this.bodiesMap);
  }

  addConstraints(constraintsMap) {
    this.constraintsMap = { ...this.constraintsMap, ...constraintsMap };
    this.constraintNames = Object.keys(this.constraintsMap);
    this.constraints = Object.values(this.constraintsMap);
  }

  getBodies() {
    return this.bodies;
  }

  getConstraints() {
    return this.constraints;
  }

  getBodyPosition(bodyName) {
    const body = this.bodiesMap[bodyName];
    if (!body) return;
    return body.position;
  }

  getBodyNameFromBoneName(boneName) {
    return Object.keys(this.modelSettings.bodiesData).find(
      (key) => this.modelSettings.bodiesData[key].boneName == boneName
    );
  }

  updateDebugMeshes() {
    this.debugMeshes.forEach((debugMesh) => {
      const body = this.bodiesMap[debugMesh.name];
      if (!body) return;
      debugMesh.position.copy(body.position);
      debugMesh.quaternion.copy(body.quaternion);
    });
  }

  updateSimple() {
    this.model?.traverse((child) => {
      const bodyName = this.getBodyNameFromBoneName(child.name);
      if (!bodyName) return;
      const body = this.bodiesMap[bodyName];
      if (!body) return;
      child.position.copy(body.position);
      child.quaternion.copy(body.quaternion);
    });
    if (this.DEBUG) this.updateDebugMeshes();
  }

  update(bonesOnly = true) {
    this.model?.traverse((child) => {
      const boneName = child.name;
      if (
        (bonesOnly && !child.isBone) ||
        !this.modelSettings.bonesToParentToBodies.includes(boneName)
      )
        return;
      const bone = child;
      const bodyName = this.getBodyNameFromBoneName(boneName);
      if (!bodyName) return;
      const body = this.bodiesMap[bodyName];
      if (!body) return;

      const bodyPosition = new THREE.Vector3(
        body.position.x,
        body.position.y,
        body.position.z
      );
      const bodyQuaternion = new THREE.Quaternion(
        body.quaternion.x,
        body.quaternion.y,
        body.quaternion.z,
        body.quaternion.w
      );

      const bodyMatrixWorld = new THREE.Matrix4().compose(
        bodyPosition,
        bodyQuaternion,
        new THREE.Vector3(1, 1, 1)
      );

      bone.parent.updateMatrixWorld(true);

      const parentMatrixWorldInv = new THREE.Matrix4()
        .copy(bone.parent.matrixWorld)
        .invert();

      const localMatrix = parentMatrixWorldInv.multiply(bodyMatrixWorld);

      localMatrix.decompose(bone.position, bone.quaternion, bone.scale);
    });
    if (this.DEBUG) this.updateDebugMeshes();
  }

  moveBody(bodyNames, delta) {
    if (bodyNames.length > 0) {
      bodyNames.forEach((bodyName) => {
        const body = this.bodiesMap[bodyName];
        if (!body) return;
        body.position.set(
          body.position.x + delta.x,
          body.position.y + delta.y,
          body.position.z + delta.z
        );
      });
    } else {
      this.bodies.forEach((body) => {
        body.position.set(
          body.position.x + delta.x,
          body.position.y + delta.y,
          body.position.z + delta.z
        );
      });
    }
  }

  applyImpulse(bodyNames, impulse) {
    if (bodyNames.length > 0) {
      bodyNames.forEach((bodyName) => {
        const body = this.bodiesMap[bodyName];
        if (!body) return;
        body.applyImpulse(
          new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
          new CANNON.Vec3(0, 0, 0)
        );
      });
    } else {
      this.bodies.forEach((body) => {
        body.applyImpulse(
          new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
          new CANNON.Vec3(0, 0, 0)
        );
      });
    }
  }

  recordInitialBodyPositionsAndQuaternions() {
    Object.keys(this.bodiesMap).forEach((bodyName) => {
      const body = this.bodiesMap[bodyName];
      if (!body) return;
      const bodyPosition = new THREE.Vector3(
        body.position.x,
        body.position.y,
        body.position.z
      );
      const bodyQuaternion = new THREE.Quaternion(
        body.quaternion.x,
        body.quaternion.y,
        body.quaternion.z,
        body.quaternion.w
      );
      this.bodiesInitialSpawnPosition[bodyName] = {
        x: bodyPosition.x,
        y: bodyPosition.y,
        z: bodyPosition.z,
      };
      this.bodiesInitialSpawnQuaternion[bodyName] = {
        x: bodyQuaternion.x,
        y: bodyQuaternion.y,
        z: bodyQuaternion.z,
        w: bodyQuaternion.w,
      };
    });
  }

  resetBodiesToInitialPositions() {
    Object.keys(this.bodiesMap).forEach((bodyName) => {
      const body = this.bodiesMap[bodyName];
      if (!body) return;
      const initialBodyPosition = this.bodiesInitialSpawnPosition[bodyName];
      const initialBoneQuaternion = this.bodiesInitialSpawnQuaternion[bodyName];
      if (!initialBodyPosition || !initialBoneQuaternion) return;
      body.position.set(
        initialBodyPosition.x,
        initialBodyPosition.y,
        initialBodyPosition.z
      );
      body.quaternion.set(
        initialBoneQuaternion.x,
        initialBoneQuaternion.y,
        initialBoneQuaternion.z,
        initialBoneQuaternion.w
      );
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
    });
  }

  createDebugMeshes() {
    const ragdollMeshes = [];
    Object.keys(this.bodiesMap).forEach((bodyName) => {
      const body = this.bodiesMap[bodyName];
      if (!body) return;
      const meshMaterial = new THREE.MeshPhongMaterial({
        color: getRandomColorHexCode(),
      });
      meshMaterial.transparent = true;
      meshMaterial.opacity = 0.5;
      const mesh = bodyToMesh(body, meshMaterial);
      mesh.name = bodyName;
      ragdollMeshes.push(mesh);
    });
    this.debugMeshes = ragdollMeshes;
  }
}

export default PhysicalThing;
