import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm";
import { getBoneByName } from "./modelUtils.js";
import { CANNON_BODY_TYPES } from "./constants.js";
import {
  DEFAULT_BASIC_RAGDOLL_BODY_MASSES,
  DEFAULT_BASIC_RAGDOLL_BODY_PROPORTIONS,
  DEFAULT_BASIC_RAGDOLL_JOINT_ANGLES,
} from "./ragdollData.js";

export function createBasicRagdoll(
  scale = 0.65,
  bodyPorportions = DEFAULT_BASIC_RAGDOLL_BODY_PROPORTIONS,
  bodyMasses = DEFAULT_BASIC_RAGDOLL_BODY_MASSES,
  jointAngles = DEFAULT_BASIC_RAGDOLL_JOINT_ANGLES
) {
  const bodiesMap = {
    lowerLeftLeg: null,
    lowerRightLeg: null,
    upperLeftLeg: null,
    upperRightLeg: null,
    pelvis: null,
    upperBody: null,
    head: null,
    upperLeftArm: null,
    upperRightArm: null,
    lowerLeftArm: null,
    lowerRightArm: null,
  };
  const constraintsMap = {
    neckJoint: null,
    leftKneeJoint: null,
    rightKneeJoint: null,
    leftHipJoint: null,
    leftHipJoint: null,
    spineJoint: null,
    leftShoulder: null,
    rightShoulder: null,
    leftElbowJoint: null,
    rightElbowJoint: null,
  };

  const shouldersDistance = bodyPorportions.shouldersDistance * scale;
  const upperArmLength = bodyPorportions.upperArmLength * scale;
  const lowerArmLength = bodyPorportions.lowerArmLength * scale;
  const armThickness = bodyPorportions.armThickness * scale;
  const neckLength = bodyPorportions.neckLength * scale;
  const headRadius = bodyPorportions.headRadius * scale;
  const upperBodyLength = bodyPorportions.upperBodyLength * scale;
  const pelvisLength = bodyPorportions.pelvisLength * scale;
  const upperLegLength = bodyPorportions.upperLegLength * scale;
  const legThickness = bodyPorportions.legThickness * scale;
  const lowerLegLength = bodyPorportions.lowerLegLength * scale;

  // SHAPES
  const headShape = new CANNON.Sphere(headRadius);
  const upperArmShape = new CANNON.Box(
    new CANNON.Vec3(
      upperArmLength * 0.5,
      armThickness * 0.5,
      armThickness * 0.5
    )
  );
  const lowerArmShape = new CANNON.Box(
    new CANNON.Vec3(
      lowerArmLength * 0.5,
      armThickness * 0.5,
      armThickness * 0.5
    )
  );
  const upperBodyShape = new CANNON.Box(
    new CANNON.Vec3(
      shouldersDistance * 0.5,
      upperBodyLength * 0.5,
      armThickness * 0.5
    )
  );
  const pelvisShape = new CANNON.Box(
    new CANNON.Vec3(
      shouldersDistance * 0.5,
      pelvisLength * 0.5,
      armThickness * 0.5
    )
  );
  const upperLegShape = new CANNON.Box(
    new CANNON.Vec3(
      legThickness * 0.5,
      upperLegLength * 0.5,
      armThickness * 0.5
    )
  );
  const lowerLegShape = new CANNON.Box(
    new CANNON.Vec3(
      legThickness * 0.5,
      lowerLegLength * 0.5,
      armThickness * 0.5
    )
  );

  // BODIES
  const lowerLeftLeg = new CANNON.Body({
    mass: bodyMasses.lowerLeftLeg,
    position: new CANNON.Vec3(shouldersDistance / 2, lowerLegLength / 2, 0),
  });
  const lowerRightLeg = new CANNON.Body({
    mass: bodyMasses.lowerRightLeg,
    position: new CANNON.Vec3(-shouldersDistance / 2, lowerLegLength / 2, 0),
  });
  lowerLeftLeg.addShape(lowerLegShape);
  lowerRightLeg.addShape(lowerLegShape);
  const upperLeftLeg = new CANNON.Body({
    mass: bodyMasses.upperLeftLeg,
    position: new CANNON.Vec3(
      shouldersDistance / 2,
      lowerLeftLeg.position.y + (lowerLegLength / 2 + upperLegLength / 2),
      0
    ),
  });
  const upperRightLeg = new CANNON.Body({
    mass: bodyMasses.upperRightLeg,
    position: new CANNON.Vec3(
      -shouldersDistance / 2,
      lowerRightLeg.position.y + (lowerLegLength / 2 + upperLegLength / 2),
      0
    ),
  });
  upperLeftLeg.addShape(upperLegShape);
  upperRightLeg.addShape(upperLegShape);
  const pelvis = new CANNON.Body({
    mass: bodyMasses.pelvis,
    position: new CANNON.Vec3(
      0,
      upperLeftLeg.position.y + (upperLegLength / 2 + pelvisLength / 2),
      0
    ),
  });
  pelvis.addShape(pelvisShape);
  const upperBody = new CANNON.Body({
    mass: bodyMasses.upperBody,
    position: new CANNON.Vec3(
      0,
      pelvis.position.y + (pelvisLength / 2 + upperBodyLength / 2),
      0
    ),
  });
  upperBody.addShape(upperBodyShape);
  const head = new CANNON.Body({
    mass: bodyMasses.head,
    position: new CANNON.Vec3(
      0,
      upperBody.position.y + (upperBodyLength / 2 + headRadius + neckLength),
      0
    ),
  });
  head.addShape(headShape);
  const upperLeftArm = new CANNON.Body({
    mass: bodyMasses.upperLeftArm,
    position: new CANNON.Vec3(
      shouldersDistance / 2 + upperArmLength / 2,
      upperBody.position.y + upperBodyLength / 2,
      0
    ),
  });
  const upperRightArm = new CANNON.Body({
    mass: bodyMasses.upperRightArm,
    position: new CANNON.Vec3(
      -(shouldersDistance / 2) - upperArmLength / 2,
      upperBody.position.y + upperBodyLength / 2,
      0
    ),
  });
  upperLeftArm.addShape(upperArmShape);
  upperRightArm.addShape(upperArmShape);
  const lowerLeftArm = new CANNON.Body({
    mass: bodyMasses.lowerLeftArm,
    position: new CANNON.Vec3(
      upperLeftArm.position.x + (lowerArmLength / 2 + upperArmLength / 2),
      upperLeftArm.position.y,
      0
    ),
  });
  const lowerRightArm = new CANNON.Body({
    mass: bodyMasses.lowerRightArm,
    position: new CANNON.Vec3(
      upperRightArm.position.x - (lowerArmLength / 2 + upperArmLength / 2),
      upperRightArm.position.y,
      0
    ),
  });
  lowerLeftArm.addShape(lowerArmShape);
  lowerRightArm.addShape(lowerArmShape);

  bodiesMap.lowerLeftLeg = lowerLeftLeg;
  bodiesMap.lowerRightLeg = lowerRightLeg;
  bodiesMap.upperLeftLeg = upperLeftLeg;
  bodiesMap.upperRightLeg = upperRightLeg;
  bodiesMap.pelvis = pelvis;
  bodiesMap.upperBody = upperBody;
  bodiesMap.head = head;
  bodiesMap.upperLeftArm = upperLeftArm;
  bodiesMap.upperRightArm = upperRightArm;
  bodiesMap.lowerLeftArm = lowerLeftArm;
  bodiesMap.lowerRightArm = lowerRightArm;

  // JOINTS
  // --- Neck joint (head -> upperBody) ---
  const neckJoint = new CANNON.ConeTwistConstraint(head, upperBody, {
    pivotA: new CANNON.Vec3(0, -headRadius - neckLength / 2, 0),
    pivotB: new CANNON.Vec3(0, upperBodyLength / 2, 0),
    // For a human neck, some twist around Y is okay, but bending forward/back is around X.
    axisA: CANNON.Vec3.UNIT_Y,
    axisB: CANNON.Vec3.UNIT_Y,
    collideConnected: false,
    angle: jointAngles.neck.angle,
    twistANgle: jointAngles.neck.twistAngle,
  });
  constraintsMap.neckJoint = neckJoint;

  // --- Knee joints (lowerLeg -> upperLeg)
  // Leg is elongated in Y, so we want a hinge around X (or Z).
  const leftKneeJoint = new CANNON.ConeTwistConstraint(
    lowerLeftLeg,
    upperLeftLeg,
    {
      pivotA: new CANNON.Vec3(0, lowerLegLength / 2, 0),
      pivotB: new CANNON.Vec3(0, -upperLegLength / 2, 0),
      // Let’s rotate around X, so they can bend forward/back
      axisA: CANNON.Vec3.UNIT_X,
      axisB: CANNON.Vec3.UNIT_X,
      collideConnected: false,
      angle: jointAngles.leftKnee.angle,
      twistANgle: jointAngles.leftKnee.twistAngle,
    }
  );
  const rightKneeJoint = new CANNON.ConeTwistConstraint(
    lowerRightLeg,
    upperRightLeg,
    {
      pivotA: new CANNON.Vec3(0, lowerLegLength / 2, 0),
      pivotB: new CANNON.Vec3(0, -upperLegLength / 2, 0),
      axisA: CANNON.Vec3.UNIT_X,
      axisB: CANNON.Vec3.UNIT_X,
      collideConnected: false,
      angle: jointAngles.rightKnee.angle,
      twistANgle: jointAngles.rightKnee.twistAngle,
    }
  );
  constraintsMap.leftKneeJoint = leftKneeJoint;
  constraintsMap.rightKneeJoint = rightKneeJoint;

  // --- Hip joints (upperLeg -> pelvis) ---
  const leftHipJoint = new CANNON.ConeTwistConstraint(upperLeftLeg, pelvis, {
    pivotA: new CANNON.Vec3(0, upperLegLength / 2, 0),
    pivotB: new CANNON.Vec3(shouldersDistance / 2, -pelvisLength / 2, 0),
    // Hips can rotate forward/back around X, twist a bit around Y, etc.
    axisA: CANNON.Vec3.UNIT_X,
    axisB: CANNON.Vec3.UNIT_X,
    collideConnected: false,
    angle: jointAngles.leftHip.angle,
    twistANgle: jointAngles.leftHip.twistAngle,
  });
  const rightHipJoint = new CANNON.ConeTwistConstraint(upperRightLeg, pelvis, {
    pivotA: new CANNON.Vec3(0, upperLegLength / 2, 0),
    pivotB: new CANNON.Vec3(-shouldersDistance / 2, -pelvisLength / 2, 0),
    axisA: CANNON.Vec3.UNIT_X,
    axisB: CANNON.Vec3.UNIT_X,
    collideConnected: false,
    angle: jointAngles.rightHip.angle,
    twistANgle: jointAngles.rightHip.twistAngle,
  });
  constraintsMap.leftHipJoint = leftHipJoint;
  constraintsMap.rightHipJoint = rightHipJoint;

  // --- Spine (pelvis -> upperBody) ---
  // Let’s allow forward/back bending around X
  const spineJoint = new CANNON.ConeTwistConstraint(pelvis, upperBody, {
    pivotA: new CANNON.Vec3(0, pelvisLength / 2, 0),
    pivotB: new CANNON.Vec3(0, -upperBodyLength / 2, 0),
    axisA: CANNON.Vec3.UNIT_X,
    axisB: CANNON.Vec3.UNIT_X,
    collideConnected: false,
    angle: jointAngles.spine.angle,
    twistANgle: jointAngles.spine.twistAngle,
  });
  constraintsMap.spineJoint = spineJoint;

  // --- Shoulders (upperBody -> upperArms)
  // Arms are elongated in X, so if we want them to rotate up/down,
  // we typically pivot around Z (or Y).
  const leftShoulder = new CANNON.ConeTwistConstraint(upperBody, upperLeftArm, {
    pivotA: new CANNON.Vec3(shouldersDistance / 2, upperBodyLength / 2, 0),
    pivotB: new CANNON.Vec3(-upperArmLength / 2, 0, 0),
    axisA: CANNON.Vec3.UNIT_Z,
    axisB: CANNON.Vec3.UNIT_Z,
    collideConnected: false,
    angle: jointAngles.leftShoulder.angle,
    twistANgle: jointAngles.leftShoulder.twistAngle,
  });
  const rightShoulder = new CANNON.ConeTwistConstraint(
    upperBody,
    upperRightArm,
    {
      pivotA: new CANNON.Vec3(-shouldersDistance / 2, upperBodyLength / 2, 0),
      pivotB: new CANNON.Vec3(upperArmLength / 2, 0, 0),
      axisA: CANNON.Vec3.UNIT_Z,
      axisB: CANNON.Vec3.UNIT_Z,
      collideConnected: false,
      angle: jointAngles.rightShoulder.angle,
      twistANgle: jointAngles.rightShoulder.twistAngle,
    }
  );
  constraintsMap.leftShoulder = leftShoulder;
  constraintsMap.rightShoulder = rightShoulder;

  // --- Elbows (lowerArm -> upperArm)
  // Since arms are elongated along X, elbow bending is typically around Z
  // (like a hinge that raises/lowers the forearm in front).
  const leftElbowJoint = new CANNON.ConeTwistConstraint(
    lowerLeftArm,
    upperLeftArm,
    {
      pivotA: new CANNON.Vec3(-lowerArmLength / 2, 0, 0),
      pivotB: new CANNON.Vec3(upperArmLength / 2, 0, 0),
      axisA: CANNON.Vec3.UNIT_Z,
      axisB: CANNON.Vec3.UNIT_Z,
      collideConnected: false,
      angle: jointAngles.leftElbow.angle,
      twistANgle: jointAngles.leftElbow.twistAngle,
    }
  );
  const rightElbowJoint = new CANNON.ConeTwistConstraint(
    lowerRightArm,
    upperRightArm,
    {
      pivotA: new CANNON.Vec3(lowerArmLength / 2, 0, 0),
      pivotB: new CANNON.Vec3(-upperArmLength / 2, 0, 0),
      axisA: CANNON.Vec3.UNIT_Z,
      axisB: CANNON.Vec3.UNIT_Z,
      collideConnected: false,
      angle: jointAngles.rightElbow.angle,
      twistANgle: jointAngles.rightElbow.twistAngle,
    }
  );
  constraintsMap.leftElbowJoint = leftElbowJoint;
  constraintsMap.rightElbowJoint = rightElbowJoint;

  return { bodiesMap, constraintsMap };
}

function createBendyRagdollBodyFromBone(model, bodyData) {
  if (!bodyData) return;
  const boneName = bodyData.boneName;
  let bonePos = new THREE.Vector3(0, 0, 0);
  let boneQuat = new THREE.Quaternion(0, 0, 0, 0);
  if (boneName) {
    const bone = getBoneByName(model, boneName);
    bone.updateMatrixWorld();
    bonePos.setFromMatrixPosition(bone.matrixWorld);
    boneQuat.setFromRotationMatrix(bone.matrixWorld);
  } else if (
    bodyData.parentBoneName !== null &&
    bodyData.childBoneName !== null
  ) {
    const parentBonePos = new THREE.Vector3(0, 0, 0);
    const parentBone = getBoneByName(model, bodyData.parentBoneName);
    parentBone.updateMatrixWorld();
    parentBonePos.setFromMatrixPosition(parentBone.matrixWorld);
    const childBonePos = new THREE.Vector3(0, 0, 0);
    const childBone = getBoneByName(model, bodyData.childBoneName);
    childBone.updateMatrixWorld();
    childBonePos.setFromMatrixPosition(childBone.matrixWorld);
    bonePos = parentBonePos.add(childBonePos).multiplyScalar(0.5);
    if (
      bodyData.childBoneName === "LeftFoot" ||
      bodyData.childBoneName === "RightFoot"
    ) {
      const parentBoneQuat = new THREE.Quaternion(0, 0, 0, 0);
      parentBoneQuat.setFromRotationMatrix(parentBone.matrixWorld);
      boneQuat = parentBoneQuat;
    } else {
      const parentBoneQuat = new THREE.Quaternion(0, 0, 0, 0);
      parentBoneQuat.setFromRotationMatrix(parentBone.matrixWorld);
      const childBoneQuat = new THREE.Quaternion(0, 0, 0, 0);
      childBoneQuat.setFromRotationMatrix(childBone.matrixWorld);
      boneQuat = parentBoneQuat.slerp(childBoneQuat, 0.5);
    }
  }

  let bodyShape;
  if (bodyData.bodyType === CANNON_BODY_TYPES.CUBE) {
    bodyShape = new CANNON.Box(
      new CANNON.Vec3(bodyData.sizeX, bodyData.sizeY, bodyData.sizeZ)
    );
  } else if (bodyData.bodyType === CANNON_BODY_TYPES.SPHERE) {
    bodyShape = new CANNON.Sphere(bodyData.radius);
  }

  const body = new CANNON.Body({
    mass: bodyData.mass,
    position: new CANNON.Vec3(bonePos.x, bonePos.y, bonePos.z),
    quaternion: new CANNON.Quaternion(
      boneQuat.x,
      boneQuat.y,
      boneQuat.z,
      boneQuat.w
    ),
  });
  body.addShape(bodyShape);
  body.velocity.set(0, 0, 0);
  body.angularVelocity.set(0, 0, 0);
  return body;
}

export function getConeTwistConstraintPivotsFromWorldPivotPoint(
  bodyA,
  bodyB,
  worldPivotPoint
) {
  const pivotPoint = new CANNON.Vec3(
    worldPivotPoint.x,
    worldPivotPoint.y,
    worldPivotPoint.z
  );
  let pivotA = new CANNON.Vec3();
  pivotA.copy(pivotPoint).vsub(bodyA.position, pivotA);
  const invQuatA = bodyA.quaternion.inverse();
  pivotA = invQuatA.vmult(pivotA);

  let pivotB = new CANNON.Vec3();
  pivotB.copy(pivotPoint).vsub(bodyB.position, pivotB);
  const invQuatB = bodyB.quaternion.inverse();
  pivotB = invQuatB.vmult(pivotB);
  return {
    A: pivotA,
    B: pivotB,
  };
}

export function createBendyRagdoll(model, bodyData) {
  const bodiesMap = {
    lowerLeftLeg: null,
    lowerRightLeg: null,
    upperLeftLeg: null,
    upperRightLeg: null,
    pelvis: null,
    upperBody: null,
    head: null,
    upperLeftArm: null,
    upperRightArm: null,
    lowerLeftArm: null,
    lowerRightArm: null,
    kneeLeft: null,
    kneeRight: null,
    femurLeft: null,
    femurRight: null,
    shoulderLeft: null,
    shoulderRight: null,
    elbowLeft: null,
    elbowRight: null,
  };
  const constraintsMap = {
    neckJoint: null,
    leftBicepConstraint: null,
    rightBicepConstraint: null,
    forearmLimbLeftConstraint: null,
    forearmLimbRightConstraint: null,
    leftThighConstraint: null,
    rightThighConstraint: null,
    shinLeftConstraint: null,
    shinRightConstraint: null,
    leftShoulderConstraint: null,
    leftElbowConstraint: null,
    rightShoulderConstraint: null,
    rightElbowConstraint: null,
    leftKneeConstraint: null,
    rightKneeConstraint: null,
    leftFemurConstraint: null,
    rightFemurConstraint: null,
    pelvisConstraint: null,
  };

  Object.keys(bodiesMap).forEach((bodyName) => {
    bodiesMap[bodyName] = createBendyRagdollBodyFromBone(
      model,
      bodyData[bodyName]
    );
  });

  const neckJoint = new CANNON.LockConstraint(
    bodiesMap["head"],
    bodiesMap["upperBody"]
  );
  const leftBicepConstraint = new CANNON.LockConstraint(
    bodiesMap["shoulderLeft"],
    bodiesMap["upperLeftArm"]
  );
  const rightBicepConstraint = new CANNON.LockConstraint(
    bodiesMap["shoulderRight"],
    bodiesMap["upperRightArm"]
  );
  const forearmLimbLeftConstraint = new CANNON.LockConstraint(
    bodiesMap["elbowLeft"],
    bodiesMap["lowerLeftArm"]
  );
  const forearmLimbRightConstraint = new CANNON.LockConstraint(
    bodiesMap["elbowRight"],
    bodiesMap["lowerRightArm"]
  );
  const leftThighConstraint = new CANNON.LockConstraint(
    bodiesMap["femurLeft"],
    bodiesMap["upperLeftLeg"]
  );
  const rightThighConstraint = new CANNON.LockConstraint(
    bodiesMap["femurRight"],
    bodiesMap["upperRightLeg"]
  );
  const shinLeftConstraint = new CANNON.LockConstraint(
    bodiesMap["kneeLeft"],
    bodiesMap["lowerLeftLeg"]
  );
  const shinRightConstraint = new CANNON.LockConstraint(
    bodiesMap["kneeRight"],
    bodiesMap["lowerRightLeg"]
  );
  const pelvisConstraint = new CANNON.LockConstraint(
    bodiesMap["upperBody"],
    bodiesMap["pelvis"]
  );
  constraintsMap.neckJoint = neckJoint;
  constraintsMap.leftBicepConstraint = leftBicepConstraint;
  constraintsMap.rightBicepConstraint = rightBicepConstraint;
  constraintsMap.forearmLimbLeftConstraint = forearmLimbLeftConstraint;
  constraintsMap.forearmLimbRightConstraint = forearmLimbRightConstraint;
  constraintsMap.leftThighConstraint = leftThighConstraint;
  constraintsMap.rightThighConstraint = rightThighConstraint;
  constraintsMap.shinLeftConstraint = shinLeftConstraint;
  constraintsMap.shinRightConstraint = shinRightConstraint;

  const shoulderLeftPivot = getConeTwistConstraintPivotsFromWorldPivotPoint(
    bodiesMap["upperBody"],
    bodiesMap["shoulderLeft"],
    new CANNON.Vec3(
      bodyData.shoulderLeft.jointPivotPoint.x,
      bodyData.shoulderLeft.jointPivotPoint.y,
      bodyData.shoulderLeft.jointPivotPoint.z
    )
  );
  const leftShoulderConstraint = new CANNON.ConeTwistConstraint(
    bodiesMap["upperBody"],
    bodiesMap["shoulderLeft"],
    {
      pivotA: shoulderLeftPivot.A,
      pivotB: shoulderLeftPivot.B,
      axisA: CANNON.Vec3.UNIT_Z,
      axisB: CANNON.Vec3.UNIT_Z,
      collideConnected: false,
      angle: bodyData.shoulderLeft.angle,
      twistAngle: bodyData.shoulderLeft.twistAngle,
    }
  );

  // const elbowLeftPivot = getConeTwistConstraintPivotsFromWorldPivotPoint(
  //   bodiesMap["upperLeftArm"],
  //   bodiesMap["elbowLeft"],
  //   new CANNON.Vec3(
  //     bodyData.elbowLeft.jointPivotPoint.x,
  //     bodyData.elbowLeft.jointPivotPoint.y,
  //     bodyData.elbowLeft.jointPivotPoint.z
  //   )
  // );
  // const leftElbowConstraint = new CANNON.HingeConstraint(
  //   bodiesMap["upperLeftArm"],
  //   bodiesMap["elbowLeft"],
  //   {
  //     pivotA: elbowLeftPivot.A,
  //     pivotB: elbowLeftPivot.B,
  //     axisA: CANNON.Vec3.UNIT_Z,
  //     axisB: CANNON.Vec3.UNIT_Z,
  //     collideConnected: false,
  //   }
  // );
  const leftElbowConstraint = new CANNON.LockConstraint(
    bodiesMap["upperLeftArm"],
    bodiesMap["elbowLeft"]
  );

  const shoulderRightPivot = getConeTwistConstraintPivotsFromWorldPivotPoint(
    bodiesMap["upperBody"],
    bodiesMap["shoulderRight"],
    new CANNON.Vec3(
      bodyData.shoulderRight.jointPivotPoint.x,
      bodyData.shoulderRight.jointPivotPoint.y,
      bodyData.shoulderRight.jointPivotPoint.z
    )
  );
  const rightShoulderConstraint = new CANNON.ConeTwistConstraint(
    bodiesMap["upperBody"],
    bodiesMap["shoulderRight"],
    {
      pivotA: shoulderRightPivot.A,
      pivotB: shoulderRightPivot.B,
      axisA: CANNON.Vec3.UNIT_Z,
      axisB: CANNON.Vec3.UNIT_Z,
      collideConnected: false,
      angle: bodyData.shoulderRight.angle,
      twistAngle: bodyData.shoulderRight.twistAngle,
    }
  );

  // const elbowRightPivot = getConeTwistConstraintPivotsFromWorldPivotPoint(
  //   bodiesMap["upperRightArm"],
  //   bodiesMap["elbowRight"],
  //   new CANNON.Vec3(
  //     bodyData.elbowRight.jointPivotPoint.x,
  //     bodyData.elbowRight.jointPivotPoint.y,
  //     bodyData.elbowRight.jointPivotPoint.z
  //   )
  // );
  // const rightElbowConstraint = new CANNON.HingeConstraint(
  //   bodiesMap["upperRightArm"],
  //   bodiesMap["elbowRight"],
  //   {
  //     pivotA: elbowRightPivot.A,
  //     pivotB: elbowRightPivot.B,
  //     axisA: CANNON.Vec3.UNIT_Z,
  //     axisB: CANNON.Vec3.UNIT_Z,
  //     collideConnected: false,
  //   }
  // );
  const rightElbowConstraint = new CANNON.LockConstraint(
    bodiesMap["upperRightArm"],
    bodiesMap["elbowRight"]
  );

  const kneeLeftPivot = getConeTwistConstraintPivotsFromWorldPivotPoint(
    bodiesMap["upperLeftLeg"],
    bodiesMap["kneeLeft"],
    new CANNON.Vec3(
      bodyData.kneeLeft.jointPivotPoint.x,
      bodyData.kneeLeft.jointPivotPoint.y,
      bodyData.kneeLeft.jointPivotPoint.z
    )
  );
  // const leftKneeConstraint = new CANNON.HingeConstraint(
  //   bodiesMap["upperLeftLeg"],
  //   bodiesMap["kneeLeft"],
  //   {
  //     pivotA: kneeLeftPivot.A,
  //     pivotB: kneeLeftPivot.B,
  //     axisA: CANNON.Vec3.UNIT_X,
  //     axisB: CANNON.Vec3.UNIT_X,
  //     collideConnected: false,
  //   }
  // );
  const leftKneeConstraint = new CANNON.ConeTwistConstraint(
    bodiesMap["upperLeftLeg"],
    bodiesMap["kneeLeft"],
    {
      pivotA: kneeLeftPivot.A,
      pivotB: kneeLeftPivot.B,
      axisA: CANNON.Vec3.UNIT_Z,
      axisB: CANNON.Vec3.UNIT_Z,
      collideConnected: false,
      angle: bodyData.kneeLeft.angle,
      twistAngle: bodyData.kneeLeft.twistAngle,
    }
  );

  const kneeRightPivot = getConeTwistConstraintPivotsFromWorldPivotPoint(
    bodiesMap["upperRightLeg"],
    bodiesMap["kneeRight"],
    new CANNON.Vec3(
      bodyData.kneeRight.jointPivotPoint.x,
      bodyData.kneeRight.jointPivotPoint.y,
      bodyData.kneeRight.jointPivotPoint.z
    )
  );
  // const rightKneeConstraint = new CANNON.HingeConstraint(
  //   bodiesMap["upperRightLeg"],
  //   bodiesMap["kneeRight"],
  //   {
  //     pivotA: kneeRightPivot.A,
  //     pivotB: kneeRightPivot.B,
  //     axisA: CANNON.Vec3.UNIT_X,
  //     axisB: CANNON.Vec3.UNIT_X,
  //     collideConnected: false,
  //   }
  // );
  const rightKneeConstraint = new CANNON.ConeTwistConstraint(
    bodiesMap["upperRightLeg"],
    bodiesMap["kneeRight"],
    {
      pivotA: kneeRightPivot.A,
      pivotB: kneeRightPivot.B,
      axisA: CANNON.Vec3.UNIT_Z,
      axisB: CANNON.Vec3.UNIT_Z,
      collideConnected: false,
      angle: bodyData.kneeRight.angle,
      twistAngle: bodyData.kneeRight.twistAngle,
    }
  );

  const femurLeftPivot = getConeTwistConstraintPivotsFromWorldPivotPoint(
    bodiesMap["pelvis"],
    bodiesMap["femurLeft"],
    new CANNON.Vec3(
      bodyData.femurLeft.jointPivotPoint.x,
      bodyData.femurLeft.jointPivotPoint.y,
      bodyData.femurLeft.jointPivotPoint.z
    )
  );
  const leftFemurConstraint = new CANNON.HingeConstraint(
    bodiesMap["pelvis"],
    bodiesMap["femurLeft"],
    {
      pivotA: femurLeftPivot.A,
      pivotB: femurLeftPivot.B,
      axisA: CANNON.Vec3.UNIT_X,
      axisB: CANNON.Vec3.UNIT_X,
      collideConnected: false,
    }
  );

  const femurRightPivot = getConeTwistConstraintPivotsFromWorldPivotPoint(
    bodiesMap["pelvis"],
    bodiesMap["femurRight"],
    new CANNON.Vec3(
      bodyData.femurRight.jointPivotPoint.x,
      bodyData.femurRight.jointPivotPoint.y,
      bodyData.femurRight.jointPivotPoint.z
    )
  );
  const rightFemurConstraint = new CANNON.HingeConstraint(
    bodiesMap["pelvis"],
    bodiesMap["femurRight"],
    {
      pivotA: femurRightPivot.A,
      pivotB: femurRightPivot.B,
      axisA: CANNON.Vec3.UNIT_X,
      axisB: CANNON.Vec3.UNIT_X,
      collideConnected: false,
    }
  );

  constraintsMap.leftShoulderConstraint = leftShoulderConstraint;
  constraintsMap.leftElbowConstraint = leftElbowConstraint;
  constraintsMap.rightShoulderConstraint = rightShoulderConstraint;
  constraintsMap.rightElbowConstraint = rightElbowConstraint;
  constraintsMap.leftKneeConstraint = leftKneeConstraint;
  constraintsMap.rightKneeConstraint = rightKneeConstraint;
  constraintsMap.leftFemurConstraint = leftFemurConstraint;
  constraintsMap.rightFemurConstraint = rightFemurConstraint;
  constraintsMap.pelvisConstraint = pelvisConstraint;

  return { bodiesMap, constraintsMap };
}
