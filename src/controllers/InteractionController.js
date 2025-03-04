import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm";
import PhysicalThing from "../models/PhysicalThing.js";
import {
  COLORS,
  DRAW_AND_QUARTER_ATTRIBUTES,
  INTERACTION,
  INTERACTION_PAYOUT,
  MELEE_PARAMETERS,
  PRESS_DIMENSIONS,
  PRESS_NAMES,
  PRESS_ORIENTATION,
  PROJECTILE_LOCAL_FORWARD,
} from "../utils/constants.js";
import AudioController from "./AudioController.js";
import { sleep } from "../utils/utils.js";
import { createMeshWithEdges } from "../utils/modelUtils.js";
import { degreesToRadians } from "../utils/mathUtils.js";
import { getConeTwistConstraintPivotsFromWorldPivotPoint } from "../utils/ragdollUtils.js";
import ThreeFire from "../libs/fire/Fire.js";

class InteractionsController {
  constructor(audioPath, updateMoney) {
    this.audioController = new AudioController(audioPath);
    this.updateMoney = updateMoney ?? (() => {});
  }

  createPin(targetPosition, body) {
    if (!body) return;
    const pinSize = 0.05;
    const pinMeshSize = 0.1;
    const pinName = "pin";
    const pinMass = 0;

    const pinShape = new CANNON.Sphere(pinSize);
    const pinBody = new CANNON.Body({ mass: pinMass });
    pinBody.addShape(pinShape);
    pinBody.position.set(targetPosition.x, targetPosition.y, targetPosition.z);

    const pinConstraint = new CANNON.LockConstraint(body, pinBody);

    const pinMesh = new THREE.Mesh(
      new THREE.SphereGeometry(pinMeshSize),
      new THREE.MeshBasicMaterial({
        color: COLORS.RED,
        opacity: 0.5,
        transparent: true,
      })
    );
    pinMesh.name = pinName;
    pinMesh.position.copy(pinBody.position);
    const pinGroup = new THREE.Group();
    pinGroup.add(pinMesh);

    const bodiesMap = { [pinName]: pinBody };
    const constraintsMap = { [pinName]: pinConstraint };
    const modelSettings = {
      bonesToParentToBodies: [pinName],
      bodiesData: {
        [pinName]: {
          boneName: pinName,
        },
      },
    };
    const pin = new PhysicalThing(pinGroup, modelSettings);
    pin.addBodies(bodiesMap);
    pin.addConstraints(constraintsMap);
    return pin;
  }

  dragModel(model, camera, force, deltaX, deltaY) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const right = new THREE.Vector3()
      .crossVectors(forward, camera.up)
      .normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    const translation = new THREE.Vector3()
      .addScaledVector(right, deltaX * force)
      .addScaledVector(up, deltaY * force);

    model.applyImpulse([], {
      x: translation.x,
      y: translation.y,
      z: translation.z,
    });
  }

  fusRoDah(model, camera, windStrength) {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const windDir = new CANNON.Vec3(
      cameraDirection.x,
      cameraDirection.y,
      cameraDirection.z
    );
    windDir.scale(windStrength, windDir);
    const sound = {
      soundName: "fusRoDah",
      soundType: "mp3",
    };
    if (this.audioController.currentAudioName != sound.soundName)
      this.audioController.setAudio({
        fileName: sound.soundName,
        fileType: sound.soundType,
      });
    this.audioController.stopAudio();
    this.audioController.startAudio()?.then(async () => {
      while (this.audioController.getAudioCurrentTime() < 1) {
        await sleep(100);
      }
      model.applyImpulse([], {
        x: windDir.x,
        y: windDir.y,
        z: windDir.z,
      });
      this.updateMoney(INTERACTION_PAYOUT[INTERACTION.FUS_RO_DAH]);
    });
  }

  createProjectile(
    projectileName,
    mesh,
    meshDimensions,
    mass,
    speed,
    throwDirection,
    throwOrigin
  ) {
    const projectileShape = new CANNON.Box(
      new CANNON.Vec3(
        meshDimensions.x / 2,
        meshDimensions.y / 2,
        meshDimensions.z / 2
      )
    );
    const projectileBody = new CANNON.Body({ mass: mass });
    projectileBody.addShape(projectileShape);
    projectileBody.position.set(throwOrigin.x, throwOrigin.y, throwOrigin.z);
    const projectileSpeed = speed;
    projectileBody.velocity.set(
      throwDirection.x * projectileSpeed,
      throwDirection.y * projectileSpeed,
      throwDirection.z * projectileSpeed
    );

    const direction3 = new THREE.Vector3(
      throwDirection.x,
      throwDirection.y,
      throwDirection.z
    );
    direction3.normalize();
    let projectileLocalForward = PROJECTILE_LOCAL_FORWARD[projectileName];
    if (!projectileLocalForward) projectileLocalForward = { x: 0, y: 0, z: -1 };
    const localForward = new THREE.Vector3(
      projectileLocalForward.x,
      projectileLocalForward.y,
      projectileLocalForward.z
    );
    const quat = new THREE.Quaternion().setFromUnitVectors(
      localForward,
      direction3
    );
    projectileBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);

    const bodiesMap = { [projectileName]: projectileBody };
    const modelSettings = {
      bonesToParentToBodies: [projectileName],
      bodiesData: {
        [projectileName]: {
          boneName: projectileName,
        },
      },
    };
    let meshGroup;
    if (mesh.isMesh) {
      meshGroup = new THREE.Group();
      meshGroup.add(mesh);
    } else {
      meshGroup = mesh.clone();
    }
    const projectile = new PhysicalThing(meshGroup, modelSettings);
    projectile.addBodies(bodiesMap);
    return projectile;
  }

  createPressMeshAndBody(
    orientation = PRESS_ORIENTATION.VERTICAL,
    darkMode = false
  ) {
    const pressMass = 0;
    const pressDimensions = PRESS_DIMENSIONS[orientation];
    const pressShape = new CANNON.Box(
      new CANNON.Vec3(pressDimensions.x, pressDimensions.y, pressDimensions.z)
    );
    const pressBody = new CANNON.Body({ mass: pressMass });
    pressBody.addShape(pressShape);

    const pressMeshGeometry = new THREE.BoxGeometry(
      pressDimensions.x * 2,
      pressDimensions.y * 2,
      pressDimensions.z * 2
    );
    const pressMesh = createMeshWithEdges(
      pressMeshGeometry,
      darkMode ? COLORS.WHITE : COLORS.BLACK
    );

    return { pressMesh, pressBody };
  }

  createPress(
    targetPosition,
    gap = 2,
    orientation = PRESS_ORIENTATION.VERTICAL,
    darkMode = false
  ) {
    let firstPressPosition;
    let secondPressPosition;
    if (orientation === PRESS_ORIENTATION.HORIZONTAL) {
      firstPressPosition = {
        x: targetPosition.x - gap / 2,
        y: targetPosition.y,
        z: targetPosition.z,
      };
      secondPressPosition = {
        x: targetPosition.x + gap / 2,
        y: targetPosition.y,
        z: targetPosition.z,
      };
    } else if (orientation === PRESS_ORIENTATION.VERTICAL) {
      firstPressPosition = {
        x: targetPosition.x,
        y: targetPosition.y - gap / 2,
        z: targetPosition.z,
      };
      secondPressPosition = {
        x: targetPosition.x,
        y: targetPosition.y + gap / 2,
        z: targetPosition.z,
      };
    }
    const { pressBody: firstPressBody, pressMesh: firstPressMesh } =
      this.createPressMeshAndBody(orientation, darkMode);
    firstPressBody.position.set(
      firstPressPosition.x,
      firstPressPosition.y,
      firstPressPosition.z
    );
    firstPressMesh.position.copy(firstPressBody.position);
    firstPressMesh.name = PRESS_NAMES.FIRST_PRESS;
    const { pressBody: secondPressBody, pressMesh: secondPressMesh } =
      this.createPressMeshAndBody(orientation, darkMode);
    secondPressBody.position.set(
      secondPressPosition.x,
      secondPressPosition.y,
      secondPressPosition.z
    );
    secondPressMesh.position.copy(secondPressBody.position);
    secondPressMesh.name = PRESS_NAMES.SECOND_PRESS;

    const pressGroup = new THREE.Group();
    pressGroup.add(firstPressMesh);
    pressGroup.add(secondPressMesh);

    const bodiesMap = {
      [PRESS_NAMES.FIRST_PRESS]: firstPressBody,
      [PRESS_NAMES.SECOND_PRESS]: secondPressBody,
    };
    const modelSettings = {
      bonesToParentToBodies: [
        PRESS_NAMES.FIRST_PRESS,
        PRESS_NAMES.SECOND_PRESS,
      ],
      bodiesData: {
        [PRESS_NAMES.FIRST_PRESS]: {
          boneName: PRESS_NAMES.FIRST_PRESS,
        },
        [PRESS_NAMES.SECOND_PRESS]: {
          boneName: PRESS_NAMES.SECOND_PRESS,
        },
      },
    };
    const press = new PhysicalThing(pressGroup, modelSettings);
    press.addBodies(bodiesMap);
    press.recordInitialBodyPositionsAndQuaternions();
    return press;
  }

  movePress(press, pressGap, value, orientation = PRESS_ORIENTATION.VERTICAL) {
    const firstPressBody = press.bodiesMap[PRESS_NAMES.FIRST_PRESS];
    const secondPressBody = press.bodiesMap[PRESS_NAMES.SECOND_PRESS];
    const originalSpawPositionFirst =
      press.bodiesInitialSpawnPosition[PRESS_NAMES.FIRST_PRESS];
    const originalSpawPositionSecond =
      press.bodiesInitialSpawnPosition[PRESS_NAMES.SECOND_PRESS];
    if (
      !firstPressBody ||
      !secondPressBody ||
      !originalSpawPositionFirst ||
      !originalSpawPositionSecond
    )
      return;
    let newFirstPosition;
    let newSecondPosition;
    if (orientation === PRESS_ORIENTATION.VERTICAL) {
      newFirstPosition = {
        x: firstPressBody.position.x,
        y: originalSpawPositionFirst.y + (parseFloat(value) * pressGap) / 2,
        z: firstPressBody.position.z,
      };
      newSecondPosition = {
        x: secondPressBody.position.x,
        y: originalSpawPositionSecond.y - (parseFloat(value) * pressGap) / 2,
        z: secondPressBody.position.z,
      };
    } else {
      newFirstPosition = {
        x: originalSpawPositionFirst.x + (parseFloat(value) * pressGap) / 2,
        y: firstPressBody.position.y,
        z: firstPressBody.position.z,
      };
      newSecondPosition = {
        x: originalSpawPositionSecond.x - (parseFloat(value) * pressGap) / 2,
        y: secondPressBody.position.y,
        z: secondPressBody.position.z,
      };
    }
    firstPressBody.position.set(
      newFirstPosition.x,
      newFirstPosition.y,
      newFirstPosition.z
    );
    secondPressBody.position.set(
      newSecondPosition.x,
      newSecondPosition.y,
      newSecondPosition.z
    );
  }

  createDrawAndQuarterAnchorBody(pivot, angleDeg, stretch) {
    let up = new CANNON.Vec3(0, 0, 1);
    pivot.quaternion.vmult(up, up);

    let direction = new CANNON.Vec3(1, 0, 0);
    pivot.quaternion.vmult(direction, direction);

    const angleRad = degreesToRadians(angleDeg);
    const threeDir = new THREE.Vector3(direction.x, direction.y, direction.z);
    const threeAxis = new THREE.Vector3(up.x, up.y, up.z).normalize();
    threeDir.applyAxisAngle(threeAxis, angleRad);

    direction.set(threeDir.x, threeDir.y, threeDir.z).normalize();

    const anchorBody = new CANNON.Body({ mass: 0 });
    anchorBody.position = new CANNON.Vec3()
      .copy(pivot.position)
      .vadd(direction.scale(stretch));
    anchorBody.quaternion.setFromVectors(up, direction);

    return anchorBody;
  }

  createDrawAndQuarter(dummy, angle, stretchPercentage) {
    const pivot = dummy.bodiesMap[DRAW_AND_QUARTER_ATTRIBUTES.DUMMY_PIVOT];
    const dummyLeftHandBody = dummy.bodiesMap["lowerLeftArm"];
    const dummyRightHandBody = dummy.bodiesMap["lowerRightArm"];
    const dummyLeftLegBody = dummy.bodiesMap["lowerLeftLeg"];
    const dummyRightLegBody = dummy.bodiesMap["lowerRightLeg"];
    const stretch =
      DRAW_AND_QUARTER_ATTRIBUTES.MIN_STRETCH +
      (DRAW_AND_QUARTER_ATTRIBUTES.MAX_STRETCH -
        DRAW_AND_QUARTER_ATTRIBUTES.MIN_STRETCH) *
        stretchPercentage;
    const leftHandAnchorBody = this.createDrawAndQuarterAnchorBody(
      pivot,
      angle,
      stretch
    );
    const rightHandAnchorBody = this.createDrawAndQuarterAnchorBody(
      pivot,
      DRAW_AND_QUARTER_ATTRIBUTES.QUARTER_ANGLE * 2 - angle,
      stretch
    );
    const rightFootAnchorBody = this.createDrawAndQuarterAnchorBody(
      pivot,
      2 * DRAW_AND_QUARTER_ATTRIBUTES.QUARTER_ANGLE + angle,
      stretch
    );
    const leftFootAnchorBody = this.createDrawAndQuarterAnchorBody(
      pivot,
      4 * DRAW_AND_QUARTER_ATTRIBUTES.QUARTER_ANGLE - angle,
      stretch
    );

    const anchorMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1),
      new THREE.MeshBasicMaterial({
        color: COLORS.RED,
        opacity: 0.5,
        transparent: true,
      })
    );

    const leftHandAnchorName = "leftHandAnchor";
    const rightHandAnchorName = "rightHandAnchor";
    const rightFootAnchorName = "rightFootAnchor";
    const leftFootAnchorName = "leftFootAnchor";

    const leftHandAnchorMesh = anchorMesh.clone();
    leftHandAnchorMesh.name = leftHandAnchorName;
    leftHandAnchorMesh.position.copy(leftHandAnchorBody.position);
    dummyLeftHandBody.position.copy(leftHandAnchorBody.position);
    dummyLeftHandBody.quaternion.copy(leftHandAnchorBody.quaternion);
    const rightHandAnchorMesh = anchorMesh.clone();
    rightHandAnchorMesh.name = rightHandAnchorName;
    rightHandAnchorMesh.position.copy(rightHandAnchorBody.position);
    dummyRightHandBody.position.copy(rightHandAnchorBody.position);
    dummyRightHandBody.quaternion.copy(rightHandAnchorBody.quaternion);
    const rightFootAnchorMesh = anchorMesh.clone();
    rightFootAnchorMesh.name = rightFootAnchorName;
    rightFootAnchorMesh.position.copy(rightFootAnchorBody.position);
    dummyRightLegBody.position.copy(rightFootAnchorBody.position);
    dummyRightLegBody.quaternion.copy(rightFootAnchorBody.quaternion);
    const leftFootAnchorMesh = anchorMesh.clone();
    leftFootAnchorMesh.name = leftFootAnchorName;
    leftFootAnchorMesh.position.copy(leftFootAnchorBody.position);
    dummyLeftLegBody.position.copy(leftFootAnchorBody.position);
    dummyLeftLegBody.quaternion.copy(leftFootAnchorBody.quaternion);

    const anchorGroup = new THREE.Group();
    anchorGroup.add(leftHandAnchorMesh);
    anchorGroup.add(rightHandAnchorMesh);
    anchorGroup.add(rightFootAnchorMesh);
    anchorGroup.add(leftFootAnchorMesh);

    const bodiesMap = {
      [leftHandAnchorName]: leftHandAnchorBody,
      [rightHandAnchorName]: rightHandAnchorBody,
      [rightFootAnchorName]: rightFootAnchorBody,
      [leftFootAnchorName]: leftFootAnchorBody,
    };
    const modelSettings = {
      bonesToParentToBodies: [
        leftHandAnchorName,
        rightHandAnchorName,
        rightFootAnchorName,
        leftFootAnchorName,
      ],
      bodiesData: {
        [leftHandAnchorName]: {
          boneName: leftHandAnchorName,
        },
        [rightHandAnchorName]: {
          boneName: rightHandAnchorName,
        },
        [rightFootAnchorName]: {
          boneName: rightFootAnchorName,
        },
        [leftFootAnchorName]: {
          boneName: leftFootAnchorName,
        },
      },
    };
    const anchor = new PhysicalThing(anchorGroup, modelSettings);
    anchor.addBodies(bodiesMap);
    const leftHandAnchorConstraint = new CANNON.LockConstraint(
      dummyLeftHandBody,
      leftHandAnchorBody
    );
    const rightHandAnchorConstraint = new CANNON.LockConstraint(
      dummyRightHandBody,
      rightHandAnchorBody
    );
    const rightFootAnchorConstraint = new CANNON.LockConstraint(
      dummyRightLegBody,
      rightFootAnchorBody
    );
    const leftFootAnchorConstraint = new CANNON.LockConstraint(
      dummyLeftLegBody,
      leftFootAnchorBody
    );
    anchor.addConstraints({
      [leftHandAnchorName]: leftHandAnchorConstraint,
      [rightHandAnchorName]: rightHandAnchorConstraint,
      [rightFootAnchorName]: rightFootAnchorConstraint,
      [leftFootAnchorName]: leftFootAnchorConstraint,
    });
    return anchor;
  }

  moveDrawAndQuarter(pivot, anchor, angle, stretchPercentage) {
    const stretch =
      DRAW_AND_QUARTER_ATTRIBUTES.MIN_STRETCH +
      (DRAW_AND_QUARTER_ATTRIBUTES.MAX_STRETCH -
        DRAW_AND_QUARTER_ATTRIBUTES.MIN_STRETCH) *
        stretchPercentage;
    const leftHandAnchorBody = anchor.bodiesMap["leftHandAnchor"];
    const rightHandAnchorBody = anchor.bodiesMap["rightHandAnchor"];
    const rightFootAnchorBody = anchor.bodiesMap["rightFootAnchor"];
    const leftFootAnchorBody = anchor.bodiesMap["leftFootAnchor"];

    const leftHandAnchorPosition = this.createDrawAndQuarterAnchorBody(
      pivot,
      angle,
      stretch
    ).position;
    const rightHandAnchorPosition = this.createDrawAndQuarterAnchorBody(
      pivot,
      DRAW_AND_QUARTER_ATTRIBUTES.QUARTER_ANGLE * 2 - angle,
      stretch
    ).position;
    const rightFootAnchorPosition = this.createDrawAndQuarterAnchorBody(
      pivot,
      2 * DRAW_AND_QUARTER_ATTRIBUTES.QUARTER_ANGLE + angle,
      stretch
    ).position;
    const leftFootAnchorPosition = this.createDrawAndQuarterAnchorBody(
      pivot,
      4 * DRAW_AND_QUARTER_ATTRIBUTES.QUARTER_ANGLE - angle,
      stretch
    ).position;

    leftHandAnchorBody.position.copy(leftHandAnchorPosition);
    rightHandAnchorBody.position.copy(rightHandAnchorPosition);
    rightFootAnchorBody.position.copy(rightFootAnchorPosition);
    leftFootAnchorBody.position.copy(leftFootAnchorPosition);
  }

  punchDummy(model, camera, punchStrength, bodyNames = []) {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const punchDir = new CANNON.Vec3(
      cameraDirection.x,
      cameraDirection.y,
      cameraDirection.z
    );
    punchDir.scale(punchStrength, punchDir);
    const sound = {
      soundName: "punch",
      soundType: "mp3",
    };
    if (this.audioController.currentAudioName != sound.soundName)
      this.audioController.setAudio({
        fileName: sound.soundName,
        fileType: sound.soundType,
      });
    this.audioController.startAudio()?.then(async () => {
      model.applyImpulse(bodyNames, {
        x: punchDir.x,
        y: punchDir.y,
        z: punchDir.z,
      });
      await sleep(200);
      this.playHurtSound();
    });
  }

  freezeDummy(dummy) {
    const upperBodyBody = dummy.bodiesMap["upperBody"];
    const shoulderLeftBody = dummy.bodiesMap["shoulderLeft"];
    const shoulderRightBody = dummy.bodiesMap["shoulderRight"];
    const elbowLeftBody = dummy.bodiesMap["elbowLeft"];
    const elbowRightBody = dummy.bodiesMap["elbowRight"];
    const pelvisBody = dummy.bodiesMap["pelvis"];
    const femurLeftBody = dummy.bodiesMap["femurLeft"];
    const femurRightBody = dummy.bodiesMap["femurRight"];
    const kneeLeftBody = dummy.bodiesMap["kneeLeft"];
    const kneeRightBody = dummy.bodiesMap["kneeRight"];
    const freezeConstraints = [
      new CANNON.LockConstraint(upperBodyBody, shoulderLeftBody),
      new CANNON.LockConstraint(upperBodyBody, shoulderRightBody),
      new CANNON.LockConstraint(upperBodyBody, elbowLeftBody),
      new CANNON.LockConstraint(upperBodyBody, elbowRightBody),
      new CANNON.LockConstraint(upperBodyBody, pelvisBody),
      new CANNON.LockConstraint(upperBodyBody, femurLeftBody),
      new CANNON.LockConstraint(upperBodyBody, femurRightBody),
      new CANNON.LockConstraint(upperBodyBody, kneeLeftBody),
      new CANNON.LockConstraint(upperBodyBody, kneeRightBody),
    ];
    return freezeConstraints;
  }

  applyExplosionImpulse(world, explosionCenter, blastRadius, blastForce) {
    world.bodies.forEach((body) => {
      if (body.type === CANNON.Body.STATIC || body.mass === 0) return;

      const distanceVec = body.position.vsub(explosionCenter);
      const distance = distanceVec.length();

      if (distance < blastRadius) {
        const strength = (1 - distance / blastRadius) * blastForce;
        distanceVec.normalize();
        const impulse = distanceVec.scale(strength);
        body.applyImpulse(impulse, body.position);
      }
    });
  }

  createGuillotine(guillotineMesh) {
    const guillotineBaseShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.6, 2));
    const guillotineBaseBody = new CANNON.Body({ mass: 0 });
    guillotineBaseBody.addShape(guillotineBaseShape);

    const guillotineBladeShape = new CANNON.Box(
      new CANNON.Vec3(0.5, 0.1, 0.05)
    );
    const guillotineBladeBody = new CANNON.Body({ mass: 0 });
    guillotineBaseBody.addShape(guillotineBladeShape);
    guillotineBladeBody.position.set(0, 0, 0);

    const guillotineBaseName = "guillotine";
    const guillotineBladeName = "guillotineBlade";
    const bodiesMap = {
      [guillotineBaseName]: guillotineBaseBody,
      [guillotineBladeName]: guillotineBladeBody,
    };
    const modelSettings = {
      bonesToParentToBodies: [guillotineBaseName, guillotineBladeName],
      bodiesData: {
        [guillotineBaseName]: {
          boneName: guillotineBaseName,
        },
        [guillotineBladeName]: {
          boneName: guillotineBladeName,
        },
      },
    };
    const guillotine = new PhysicalThing(guillotineMesh, modelSettings);
    guillotine.addBodies(bodiesMap);
    guillotine.recordInitialBodyPositionsAndQuaternions();
    return guillotine;
  }

  moveGuillotineBlade(guillotine, dropHeightPercentage) {
    const dropHeight = 1.5;
    const guillotineBladeBodyName = "guillotineBlade";
    const guillotineBladeBody = guillotine.bodiesMap[guillotineBladeBodyName];
    const originalSpawnPosition =
      guillotine.bodiesInitialSpawnPosition[guillotineBladeBodyName];
    if (!guillotineBladeBody || !originalSpawnPosition) return;
    const newBladePosition = {
      x: originalSpawnPosition.x,
      y:
        originalSpawnPosition.y - dropHeight * parseFloat(dropHeightPercentage),
      z: originalSpawnPosition.z,
    };
    guillotineBladeBody.position.set(
      newBladePosition.x,
      newBladePosition.y,
      newBladePosition.z
    );
  }

  playHurtSound() {
    const randomGruntSoundIndex = Math.floor(Math.random() * 5) + 1;
    const sound = {
      soundName: `grunt${randomGruntSoundIndex}`,
      soundType: "mp3",
    };
    if (this.audioController.currentAudioName != sound.soundName)
      this.audioController.setAudio({
        fileName: sound.soundName,
        fileType: sound.soundType,
      });
    this.audioController.startAudio();
  }

  playExplosionSound(callback = () => {}) {
    const sound = {
      soundName: "explosion",
      soundType: "mp3",
    };
    if (this.audioController.currentAudioName != sound.soundName)
      this.audioController.setAudio({
        fileName: sound.soundName,
        fileType: sound.soundType,
      });
    this.audioController.startAudio()?.then(() => {
      callback();
    });
  }

  playGunshotSound() {
    const sound = {
      soundName: "gunshot",
      soundType: "mp3",
    };
    this.audioController.stopAudio();
    if (this.audioController.currentAudioName != sound.soundName)
      this.audioController.setAudio({
        fileName: sound.soundName,
        fileType: sound.soundType,
      });
    this.audioController.startAudio();
  }

  createMeleeWeapon(
    camera,
    meleeWeaponName,
    meleeWeaponMeshData,
    meleeWeaponMass
  ) {
    const pivotBody = new CANNON.Body({ mass: 0 });
    const pivotLocalOffset = new THREE.Vector3(
      MELEE_PARAMETERS.pivotCameraOffset.x,
      MELEE_PARAMETERS.pivotCameraOffset.y,
      MELEE_PARAMETERS.pivotCameraOffset.z
    );
    const pivotWorldOffset = pivotLocalOffset
      .clone()
      .applyQuaternion(camera.quaternion);
    const weaponPivotPosition = new THREE.Vector3()
      .copy(camera.position)
      .add(pivotWorldOffset);
    pivotBody.position.set(
      weaponPivotPosition.x,
      weaponPivotPosition.y,
      weaponPivotPosition.z
    );

    const vector = new THREE.Vector3();
    camera.getWorldDirection(vector);
    vector.normalize();
    const pivotLocalForward = new THREE.Vector3(0, 0, -1);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      pivotLocalForward,
      vector
    );
    pivotBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);

    const pivotName = MELEE_PARAMETERS.pivotName;
    const pivotMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshPhongMaterial()
    );
    pivotMesh.name = pivotName;

    const meleeWeaponMesh = meleeWeaponMeshData.mesh;
    const meleeWeaponDimensions = meleeWeaponMeshData.dimensions;
    const meleeWeaponShape = new CANNON.Box(
      new CANNON.Vec3(
        meleeWeaponDimensions.x / 2,
        meleeWeaponDimensions.y / 2,
        meleeWeaponDimensions.z / 2
      )
    );
    const meleeWeaponBody = new CANNON.Body({
      mass: meleeWeaponMass,
    });
    meleeWeaponBody.addShape(meleeWeaponShape);

    const weaponLength = Math.max(
      meleeWeaponDimensions.x,
      meleeWeaponDimensions.y,
      meleeWeaponDimensions.z
    );
    const weaponLocalOffset = new THREE.Vector3(
      MELEE_PARAMETERS.weaponCameraOffset.x,
      MELEE_PARAMETERS.weaponCameraOffset.y,
      MELEE_PARAMETERS.weaponCameraOffset.z - weaponLength / 2
    );
    const weaponWorldOffset = weaponLocalOffset
      .clone()
      .applyQuaternion(camera.quaternion);
    const weaponPosition = new THREE.Vector3()
      .copy(camera.position)
      .add(weaponWorldOffset);
    meleeWeaponBody.position.set(
      weaponPosition.x,
      weaponPosition.y,
      weaponPosition.z
    );

    let meshLocalForward = PROJECTILE_LOCAL_FORWARD[meleeWeaponName];
    if (!meshLocalForward) meshLocalForward = { x: 0, y: 0, z: -1 };
    const weaponLocalForward = new THREE.Vector3(
      meshLocalForward.x,
      meshLocalForward.y,
      meshLocalForward.z
    );
    const weaponQuaternion = new THREE.Quaternion().setFromUnitVectors(
      weaponLocalForward,
      vector
    );
    meleeWeaponBody.quaternion.set(
      weaponQuaternion.x,
      weaponQuaternion.y,
      weaponQuaternion.z,
      weaponQuaternion.w
    );

    const weaponGroup = new THREE.Group();
    weaponGroup.add(meleeWeaponMesh);

    const weaponPositionCannon = new CANNON.Vec3(
      weaponPosition.x,
      weaponPosition.y,
      weaponPosition.z
    );
    const weaponPivotPositionCannon = new CANNON.Vec3(
      weaponPivotPosition.x,
      weaponPivotPosition.y,
      weaponPivotPosition.z
    );
    const distanceVec = weaponPositionCannon.vsub(weaponPivotPositionCannon);
    const midpoint = weaponPivotPositionCannon.vadd(distanceVec.scale(0.1));
    const constraintPivots = getConeTwistConstraintPivotsFromWorldPivotPoint(
      pivotBody,
      meleeWeaponBody,
      midpoint
    );
    const lockConstraint = new CANNON.HingeConstraint(
      pivotBody,
      meleeWeaponBody,
      {
        pivotA: constraintPivots.A,
        axisA: new CANNON.Vec3(1, 0, 0),
        axisB: new CANNON.Vec3(1, 0, 0),
        pivotB: constraintPivots.B,
      }
    );

    const bodiesMap = {
      [pivotName]: pivotBody,
      [meleeWeaponName]: meleeWeaponBody,
    };
    const modelSettings = {
      bonesToParentToBodies: [pivotName, meleeWeaponName],
      bodiesData: {
        [pivotName]: {
          boneName: pivotName,
        },
        [meleeWeaponName]: {
          boneName: meleeWeaponName,
        },
      },
    };
    const constraintsMap = {
      lockConstraint: lockConstraint,
    };
    const pivot = new PhysicalThing(weaponGroup, modelSettings);
    pivot.addBodies(bodiesMap);
    pivot.addConstraints(constraintsMap);
    pivot.recordInitialBodyPositionsAndQuaternions();
    return pivot;
  }

  swingMeleeWeapon(meleeWeaponBody) {
    // const impulse = new CANNON.Vec3(0, 1, 0);
    // meleeWeapon.applyImpulse(
    //   [this.simulationSettings.meleeType],
    //   impulse
    // );
    meleeWeaponBody.angularVelocity.set(-100, -100, -100);
  }

  moveMeleeWeaponPivot(camera, meleeWeapon) {
    Object.keys(meleeWeapon.bodiesMap).forEach((bodyName) => {
      if (bodyName !== MELEE_PARAMETERS.pivotName) return;
      const body = meleeWeapon.bodiesMap[bodyName];
      const localOffset = new THREE.Vector3(
        MELEE_PARAMETERS.pivotCameraOffset.x,
        MELEE_PARAMETERS.pivotCameraOffset.y,
        MELEE_PARAMETERS.pivotCameraOffset.z
      );
      const worldOffset = localOffset
        .clone()
        .applyQuaternion(camera.quaternion);
      const weaponPos = new THREE.Vector3()
        .copy(camera.position)
        .add(worldOffset);
      body.position.set(weaponPos.x, weaponPos.y, weaponPos.z);

      const vector = new THREE.Vector3();
      camera.getWorldDirection(vector);
      vector.normalize();
      const pivotLocalForward = { x: 0, y: 0, z: -1 };
      const localForward = new THREE.Vector3(
        pivotLocalForward.x,
        pivotLocalForward.y,
        pivotLocalForward.z
      );
      const quat = new THREE.Quaternion().setFromUnitVectors(
        localForward,
        vector
      );
      body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
    });
  }

  goldenWind(dummy, camera, removePins) {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    let windDir = new CANNON.Vec3(
      cameraDirection.x,
      cameraDirection.y,
      cameraDirection.z
    );
    const windStrenth = 10;
    windDir.scale(windStrenth, windDir);
    const sound = {
      soundName: "goldenWind",
      soundType: "mp3",
    };
    if (this.audioController.currentAudioName != sound.soundName)
      this.audioController.setAudio({
        fileName: sound.soundName,
        fileType: sound.soundType,
      });
    this.audioController.stopAudio();
    this.audioController.startAudio()?.then(async () => {
      while (this.audioController.getAudioCurrentTime() < 12) {
        await sleep(100);
      }
      while (this.audioController.getAudioCurrentTime() < 27) {
        const randomBodyPartName =
          dummy.bodyNames[Math.floor(Math.random() * dummy.bodyNames.length)];
        windDir = new CANNON.Vec3(
          cameraDirection.x,
          cameraDirection.y,
          cameraDirection.z
        );
        windDir.scale(windStrenth, windDir);
        dummy.applyImpulse([randomBodyPartName], {
          x: windDir.x,
          y: windDir.y,
          z: windDir.z,
        });
        this.updateMoney(INTERACTION_PAYOUT[INTERACTION.GOLDEN_WIND]);
        await sleep(50);
      }
      while (this.audioController.getAudioCurrentTime() < 41) {
        const randomBodyPartName =
          dummy.bodyNames[Math.floor(Math.random() * dummy.bodyNames.length)];
        windDir = new CANNON.Vec3(
          cameraDirection.x,
          cameraDirection.y,
          cameraDirection.z
        );
        windDir.scale(windStrenth, windDir);
        dummy.applyImpulse([randomBodyPartName], {
          x: windDir.x,
          y: windDir.y,
          z: windDir.z,
        });
        this.updateMoney(INTERACTION_PAYOUT[INTERACTION.GOLDEN_WIND]);
        await sleep(25);
      }
      removePins();
      windDir = new CANNON.Vec3(
        cameraDirection.x,
        cameraDirection.y,
        cameraDirection.z
      );
      windDir.scale(windStrenth, windDir);
      dummy.applyImpulse(["upperBody"], {
        x: windDir.x * 10,
        y: windDir.y * 10,
        z: windDir.z * 10,
      });
      this.updateMoney(INTERACTION_PAYOUT[INTERACTION.GOLDEN_WIND] * 100);
    });
  }

  createFire(dummy, fireTexture) {
    const dummyBody = dummy.bodiesMap["upperBody"];
    const fireName = "fire";
    const fireBody = new CANNON.Body({ mass: 0 });
    fireBody.position.set(dummyBody.position.x, 1.5, dummyBody.position.z);
    const fireMesh = new ThreeFire(fireTexture);
    fireMesh.name = fireName;
    fireMesh.position.copy(fireBody.position);
    fireMesh.scale.set(1.5, 3, 1.5);
    const fireGroup = new THREE.Group();
    fireGroup.add(fireMesh);

    const bodiesMap = { [fireName]: fireBody };
    const modelSettings = {
      bonesToParentToBodies: [fireName],
      bodiesData: {
        [fireName]: {
          boneName: fireName,
        },
      },
    };
    const fire = new PhysicalThing(fireMesh, modelSettings);
    fire.addBodies(bodiesMap);
    return fire;
  }
}

export default InteractionsController;
