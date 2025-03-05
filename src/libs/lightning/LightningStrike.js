// @author yomboprime https://github.com/yomboprime
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js";
import SimplexNoise from "./SimplexNoise.js";

export class LightningStrike extends THREE.BufferGeometry {
  static RAY_INITIALIZED = 0;
  static RAY_UNBORN = 1;
  static RAY_PROPAGATING = 2;
  static RAY_STEADY = 3;
  static RAY_VANISHING = 4;
  static RAY_EXTINGUISHED = 5;

  static COS30DEG = Math.cos((30 * Math.PI) / 180);
  static SIN30DEG = Math.sin((30 * Math.PI) / 180);

  /**
   * Create a LightningStrike geometry.
   * @param {Object} rayParameters A dictionary of all lightning parameters.
   */
  constructor(rayParameters) {
    super();
    this.type = "LightningStrike";
    this.isLightningStrike = true;

    // Set parameters (with defaults), initialize internal state
    rayParameters = rayParameters || {};
    this.init(LightningStrike.copyParameters(rayParameters, rayParameters));

    // Create the mesh data (buffers)
    this.createMesh();
  }

  /**
   * Called once at construction time to initialize internal state from parameters.
   * @param {Object} rayParameters
   */
  init(rayParameters) {
    this.rayParameters = rayParameters;

    // Store parameters that won't change after creation
    this.maxIterations =
      rayParameters.maxIterations !== undefined
        ? Math.floor(rayParameters.maxIterations)
        : 9;
    rayParameters.maxIterations = this.maxIterations;

    this.isStatic =
      rayParameters.isStatic !== undefined ? rayParameters.isStatic : false;
    rayParameters.isStatic = this.isStatic;

    this.ramification =
      rayParameters.ramification !== undefined
        ? Math.floor(rayParameters.ramification)
        : 5;
    rayParameters.ramification = this.ramification;

    this.maxSubrayRecursion =
      rayParameters.maxSubrayRecursion !== undefined
        ? Math.floor(rayParameters.maxSubrayRecursion)
        : 3;
    rayParameters.maxSubrayRecursion = this.maxSubrayRecursion;

    this.recursionProbability =
      rayParameters.recursionProbability !== undefined
        ? rayParameters.recursionProbability
        : 0.6;
    rayParameters.recursionProbability = this.recursionProbability;

    this.generateUVs =
      rayParameters.generateUVs !== undefined
        ? rayParameters.generateUVs
        : false;
    rayParameters.generateUVs = this.generateUVs;

    // Random generator
    if (rayParameters.randomGenerator !== undefined) {
      this.randomGenerator = rayParameters.randomGenerator;
      this.seedGenerator = rayParameters.randomGenerator;

      if (rayParameters.noiseSeed !== undefined) {
        this.seedGenerator.setSeed(rayParameters.noiseSeed);
      }
    } else {
      // Fallback to default
      this.randomGenerator = LightningStrike.createRandomGenerator();
      this.seedGenerator = Math;
    }

    // Callbacks for subray creation
    if (rayParameters.onDecideSubrayCreation !== undefined) {
      this.onDecideSubrayCreation = rayParameters.onDecideSubrayCreation;
    } else {
      this.createDefaultSubrayCreationCallbacks();

      if (rayParameters.onSubrayCreation !== undefined) {
        this.onSubrayCreation = rayParameters.onSubrayCreation;
      }
    }

    // Internal state
    this.state = LightningStrike.RAY_INITIALIZED;
    this.maxSubrays = Math.ceil(
      1 + Math.pow(this.ramification, Math.max(0, this.maxSubrayRecursion - 1))
    );
    rayParameters.maxSubrays = this.maxSubrays;

    this.maxRaySegments = 2 * (1 << this.maxIterations);

    // Prepare subrays & segments arrays
    this.subrays = [];
    for (let i = 0; i < this.maxSubrays; i++) {
      this.subrays.push(this.createSubray());
    }

    this.raySegments = [];
    for (let i = 0; i < this.maxRaySegments; i++) {
      this.raySegments.push(this.createSegment());
    }

    this.time = 0;
    this.timeFraction = 0;
    this.currentSegmentCallback = null;
    this.currentCreateTriangleVertices = this.generateUVs
      ? this.createTriangleVerticesWithUVs
      : this.createTriangleVerticesWithoutUVs;
    this.numSubrays = 0;
    this.currentSubray = null;
    this.currentSegmentIndex = 0;
    this.isInitialSegment = false;
    this.subrayProbability = 0;

    this.currentVertex = 0;
    this.currentIndex = 0;
    this.currentCoordinate = 0;
    this.currentUVCoordinate = 0;
    this.vertices = null;
    this.uvs = null;
    this.indices = null;
    this.positionAttribute = null;
    this.uvsAttribute = null;

    // Noise
    this.simplexX = new SimplexNoise(this.seedGenerator);
    this.simplexY = new SimplexNoise(this.seedGenerator);
    this.simplexZ = new SimplexNoise(this.seedGenerator);

    // Temp vectors
    this.forwards = new THREE.Vector3();
    this.forwardsFill = new THREE.Vector3();
    this.side = new THREE.Vector3();
    this.down = new THREE.Vector3();
    this.middlePos = new THREE.Vector3();
    this.middleLinPos = new THREE.Vector3();
    this.newPos = new THREE.Vector3();
    this.vPos = new THREE.Vector3();
    this.cross1 = new THREE.Vector3();
  }

  /**
   * Creates the BufferGeometry data (vertices/indices/uvs).
   */
  createMesh() {
    const maxDrawableSegmentsPerSubRay = 1 << this.maxIterations;
    const maxVerts = 3 * (maxDrawableSegmentsPerSubRay + 1) * this.maxSubrays;
    const maxIndices = 18 * maxDrawableSegmentsPerSubRay * this.maxSubrays;

    this.vertices = new Float32Array(maxVerts * 3);
    this.indices = new Uint32Array(maxIndices);

    if (this.generateUVs) {
      this.uvs = new Float32Array(maxVerts * 2);
    }

    // Populate once
    this.fillMesh(0);

    this.setIndex(new THREE.Uint32BufferAttribute(this.indices, 1));
    this.positionAttribute = new THREE.Float32BufferAttribute(this.vertices, 3);
    this.setAttribute("position", this.positionAttribute);

    if (this.generateUVs) {
      this.uvsAttribute = new THREE.Float32BufferAttribute(this.uvs, 2);
      this.setAttribute("uv", this.uvsAttribute);
    }

    if (!this.isStatic) {
      this.index.dynamic = true;
      this.positionAttribute.dynamic = true;
      if (this.generateUVs) {
        this.uvsAttribute.dynamic = true;
      }
    }

    // Store final references so we can modify them later
    this.vertices = this.positionAttribute.array;
    this.indices = this.index.array;
    if (this.generateUVs) {
      this.uvs = this.uvsAttribute.array;
    }
  }

  /**
   * Updates the geometry at a certain time (if not static).
   * @param {number} time
   */
  update(time) {
    if (this.isStatic) return;

    const rp = this.rayParameters;
    if (rp.isEternal || (rp.birthTime <= time && time <= rp.deathTime)) {
      this.updateMesh(time);

      if (time < this.subrays[0].endPropagationTime) {
        this.state = LightningStrike.RAY_PROPAGATING;
      } else if (time > this.subrays[0].beginVanishingTime) {
        this.state = LightningStrike.RAY_VANISHING;
      } else {
        this.state = LightningStrike.RAY_STEADY;
      }

      this.visible = true;
    } else {
      this.visible = false;
      if (time < rp.birthTime) {
        this.state = LightningStrike.RAY_UNBORN;
      } else {
        this.state = LightningStrike.RAY_EXTINGUISHED;
      }
    }
  }

  /**
   * Re-fill vertex/index/uv data for the given time, then mark buffers as updated.
   */
  updateMesh(time) {
    this.fillMesh(time);
    this.drawRange.count = this.currentIndex;
    this.index.needsUpdate = true;
    this.positionAttribute.needsUpdate = true;
    if (this.generateUVs) {
      this.uvsAttribute.needsUpdate = true;
    }
  }

  /**
   * Build the geometry data by fractal subdividing subrays, generating triangular prisms.
   */
  fillMesh(time) {
    this.currentVertex = 0;
    this.currentIndex = 0;
    this.currentCoordinate = 0;
    this.currentUVCoordinate = 0;

    this.fractalRay(time, (segment) => {
      const subray = this.currentSubray;
      if (time < subray.birthTime) {
        // not born yet
        return;
      } else if (this.rayParameters.isEternal && subray.recursion === 0) {
        // Eternal main ray
        this.createPrism(segment);
        this.onDecideSubrayCreation(segment, this);
      } else if (time < subray.endPropagationTime) {
        // Propagating
        if (
          this.timeFraction >=
          segment.fraction0 * subray.propagationTimeFactor
        ) {
          this.createPrism(segment);
          this.onDecideSubrayCreation(segment, this);
        }
      } else if (time < subray.beginVanishingTime) {
        // Steady
        this.createPrism(segment);
        this.onDecideSubrayCreation(segment, this);
      } else {
        // Vanishing
        if (
          this.timeFraction <=
          subray.vanishingTimeFactor +
            segment.fraction1 * (1 - subray.vanishingTimeFactor)
        ) {
          this.createPrism(segment);
        }
        this.onDecideSubrayCreation(segment, this);
      }
    });
  }

  fractalRay(time, segmentCallback) {
    this.time = time;
    this.currentSegmentCallback = segmentCallback;
    this.numSubrays = 0;

    // Add top-level subray
    this.initSubray(this.addNewSubray(), this.rayParameters);

    // Process all subrays
    for (let subrayIndex = 0; subrayIndex < this.numSubrays; subrayIndex++) {
      const subray = this.subrays[subrayIndex];
      this.currentSubray = subray;

      this.randomGenerator.setSeed(subray.seed);

      subray.endPropagationTime = THREE.MathUtils.lerp(
        subray.birthTime,
        subray.deathTime,
        subray.propagationTimeFactor
      );
      subray.beginVanishingTime = THREE.MathUtils.lerp(
        subray.deathTime,
        subray.birthTime,
        1 - subray.vanishingTimeFactor
      );

      const randomFn = this.randomGenerator.random;
      subray.linPos0
        .set(randomFn(), randomFn(), randomFn())
        .multiplyScalar(1000);
      subray.linPos1
        .set(randomFn(), randomFn(), randomFn())
        .multiplyScalar(1000);

      this.timeFraction =
        (time - subray.birthTime) / (subray.deathTime - subray.birthTime);

      this.currentSegmentIndex = 0;
      this.isInitialSegment = true;

      const segment = this.getNewSegment();
      segment.iteration = 0;
      segment.pos0.copy(subray.pos0);
      segment.pos1.copy(subray.pos1);
      segment.linPos0.copy(subray.linPos0);
      segment.linPos1.copy(subray.linPos1);
      segment.up0.copy(subray.up0);
      segment.up1.copy(subray.up1);
      segment.radius0 = subray.radius0;
      segment.radius1 = subray.radius1;
      segment.fraction0 = 0;
      segment.fraction1 = 1;
      segment.positionVariationFactor = 1 - subray.straightness;

      this.subrayProbability =
        (this.ramification *
          Math.pow(this.recursionProbability, subray.recursion)) /
        (1 << subray.maxIterations);

      this.fractalRayRecursive(segment);
    }

    this.currentSegmentCallback = null;
    this.currentSubray = null;
  }

  fractalRayRecursive(segment) {
    // Reached leaf iteration
    if (segment.iteration >= this.currentSubray.maxIterations) {
      this.currentSegmentCallback(segment);
      return;
    }

    // Interpolation
    this.forwards.subVectors(segment.pos1, segment.pos0);
    let lForwards = this.forwards.length();
    if (lForwards < 0.000001) {
      this.forwards.set(0, 0, 0.01);
      lForwards = this.forwards.length();
    }

    const middleRadius = (segment.radius0 + segment.radius1) * 0.5;
    const middleFraction = (segment.fraction0 + segment.fraction1) * 0.5;
    const timeDimension =
      this.time * this.currentSubray.timeScale * Math.pow(2, segment.iteration);

    this.middlePos.lerpVectors(segment.pos0, segment.pos1, 0.5);
    this.middleLinPos.lerpVectors(segment.linPos0, segment.linPos1, 0.5);
    const p = this.middleLinPos;

    // Noise
    this.newPos.set(
      this.simplexX.noise4d(p.x, p.y, p.z, timeDimension),
      this.simplexY.noise4d(p.x, p.y, p.z, timeDimension),
      this.simplexZ.noise4d(p.x, p.y, p.z, timeDimension)
    );
    this.newPos
      .multiplyScalar(segment.positionVariationFactor * lForwards)
      .add(this.middlePos);

    // Split into two segments
    const newSegment1 = this.getNewSegment();
    newSegment1.pos0.copy(segment.pos0);
    newSegment1.pos1.copy(this.newPos);
    newSegment1.linPos0.copy(segment.linPos0);
    newSegment1.linPos1.copy(this.middleLinPos);
    newSegment1.up0.copy(segment.up0);
    newSegment1.up1.copy(segment.up1);
    newSegment1.radius0 = segment.radius0;
    newSegment1.radius1 = middleRadius;
    newSegment1.fraction0 = segment.fraction0;
    newSegment1.fraction1 = middleFraction;
    newSegment1.positionVariationFactor =
      segment.positionVariationFactor * this.currentSubray.roughness;
    newSegment1.iteration = segment.iteration + 1;

    const newSegment2 = this.getNewSegment();
    newSegment2.pos0.copy(this.newPos);
    newSegment2.pos1.copy(segment.pos1);
    newSegment2.linPos0.copy(this.middleLinPos);
    newSegment2.linPos1.copy(segment.linPos1);
    this.cross1.crossVectors(segment.up0, this.forwards.normalize());
    newSegment2.up0.crossVectors(this.forwards, this.cross1).normalize();
    newSegment2.up1.copy(segment.up1);
    newSegment2.radius0 = middleRadius;
    newSegment2.radius1 = segment.radius1;
    newSegment2.fraction0 = middleFraction;
    newSegment2.fraction1 = segment.fraction1;
    newSegment2.positionVariationFactor =
      segment.positionVariationFactor * this.currentSubray.roughness;
    newSegment2.iteration = segment.iteration + 1;

    // Recurse
    this.fractalRayRecursive(newSegment1);
    this.fractalRayRecursive(newSegment2);
  }

  createPrism(segment) {
    // Triangular prism for one segment
    this.forwardsFill.subVectors(segment.pos1, segment.pos0).normalize();

    if (this.isInitialSegment) {
      this.currentCreateTriangleVertices(
        segment.pos0,
        segment.up0,
        this.forwardsFill,
        segment.radius0,
        0
      );
      this.isInitialSegment = false;
    }

    this.currentCreateTriangleVertices(
      segment.pos1,
      segment.up0,
      this.forwardsFill,
      segment.radius1,
      segment.fraction1
    );

    this.createPrismFaces();
  }

  createTriangleVerticesWithoutUVs(pos, up, forwards, radius) {
    // Equilateral triangle
    this.side
      .crossVectors(up, forwards)
      .multiplyScalar(radius * LightningStrike.COS30DEG);
    this.down.copy(up).multiplyScalar(-radius * LightningStrike.SIN30DEG);

    const p = this.vPos;
    const v = this.vertices;

    p.copy(pos).sub(this.side).add(this.down);
    v[this.currentCoordinate++] = p.x;
    v[this.currentCoordinate++] = p.y;
    v[this.currentCoordinate++] = p.z;

    p.copy(pos).add(this.side).add(this.down);
    v[this.currentCoordinate++] = p.x;
    v[this.currentCoordinate++] = p.y;
    v[this.currentCoordinate++] = p.z;

    p.copy(up).multiplyScalar(radius).add(pos);
    v[this.currentCoordinate++] = p.x;
    v[this.currentCoordinate++] = p.y;
    v[this.currentCoordinate++] = p.z;

    this.currentVertex += 3;
  }

  createTriangleVerticesWithUVs(pos, up, forwards, radius, u) {
    // Equilateral triangle w/ UV
    this.side
      .crossVectors(up, forwards)
      .multiplyScalar(radius * LightningStrike.COS30DEG);
    this.down.copy(up).multiplyScalar(-radius * LightningStrike.SIN30DEG);

    const p = this.vPos;
    const v = this.vertices;
    const uv = this.uvs;

    p.copy(pos).sub(this.side).add(this.down);
    v[this.currentCoordinate++] = p.x;
    v[this.currentCoordinate++] = p.y;
    v[this.currentCoordinate++] = p.z;
    uv[this.currentUVCoordinate++] = u;
    uv[this.currentUVCoordinate++] = 0;

    p.copy(pos).add(this.side).add(this.down);
    v[this.currentCoordinate++] = p.x;
    v[this.currentCoordinate++] = p.y;
    v[this.currentCoordinate++] = p.z;
    uv[this.currentUVCoordinate++] = u;
    uv[this.currentUVCoordinate++] = 0.5;

    p.copy(up).multiplyScalar(radius).add(pos);
    v[this.currentCoordinate++] = p.x;
    v[this.currentCoordinate++] = p.y;
    v[this.currentCoordinate++] = p.z;
    uv[this.currentUVCoordinate++] = u;
    uv[this.currentUVCoordinate++] = 1;

    this.currentVertex += 3;
  }

  createPrismFaces() {
    // 6 new vertices => 3 from the previous segment, 3 from the new, so 6 total
    const indices = this.indices;
    const vertex = this.currentVertex - 6;

    // 6 faces => 2 triangles per side for a triangular prism
    indices[this.currentIndex++] = vertex + 1;
    indices[this.currentIndex++] = vertex + 2;
    indices[this.currentIndex++] = vertex + 5;
    indices[this.currentIndex++] = vertex + 1;
    indices[this.currentIndex++] = vertex + 5;
    indices[this.currentIndex++] = vertex + 4;
    indices[this.currentIndex++] = vertex + 0;
    indices[this.currentIndex++] = vertex + 1;
    indices[this.currentIndex++] = vertex + 4;
    indices[this.currentIndex++] = vertex + 0;
    indices[this.currentIndex++] = vertex + 4;
    indices[this.currentIndex++] = vertex + 3;
    indices[this.currentIndex++] = vertex + 2;
    indices[this.currentIndex++] = vertex + 0;
    indices[this.currentIndex++] = vertex + 3;
    indices[this.currentIndex++] = vertex + 2;
    indices[this.currentIndex++] = vertex + 3;
    indices[this.currentIndex++] = vertex + 5;
  }

  /**
   * Default callbacks for subray creation if none is specified in parameters.
   */
  createDefaultSubrayCreationCallbacks() {
    const random1 = this.randomGenerator.random;
    this.onDecideSubrayCreation = (segment, lightningStrike) => {
      const subray = lightningStrike.currentSubray;

      const period = lightningStrike.rayParameters.subrayPeriod;
      const dutyCycle = lightningStrike.rayParameters.subrayDutyCycle;

      let phase0;
      if (lightningStrike.rayParameters.isEternal && subray.recursion === 0) {
        phase0 = -random1() * period;
      } else {
        phase0 =
          THREE.MathUtils.lerp(
            subray.birthTime,
            subray.endPropagationTime,
            segment.fraction0
          ) -
          random1() * period;
      }

      const phase = lightningStrike.time - phase0;
      const currentCycle = Math.floor(phase / period);
      const childSubraySeed = random1() * (currentCycle + 1);

      const isActive = phase % period <= dutyCycle * period;

      let probability = 0;
      if (isActive) {
        probability = lightningStrike.subrayProbability;
      }

      if (
        subray.recursion < lightningStrike.maxSubrayRecursion &&
        lightningStrike.numSubrays < lightningStrike.maxSubrays &&
        random1() < probability
      ) {
        const childSubray = lightningStrike.addNewSubray();

        const parentSeed = lightningStrike.randomGenerator.getSeed();
        childSubray.seed = childSubraySeed;
        lightningStrike.randomGenerator.setSeed(childSubraySeed);

        childSubray.recursion = subray.recursion + 1;
        childSubray.maxIterations = Math.max(1, subray.maxIterations - 1);

        childSubray.linPos0
          .set(random1(), random1(), random1())
          .multiplyScalar(1000);
        childSubray.linPos1
          .set(random1(), random1(), random1())
          .multiplyScalar(1000);
        childSubray.up0.copy(subray.up0);
        childSubray.up1.copy(subray.up1);
        childSubray.radius0 =
          segment.radius0 * lightningStrike.rayParameters.radius0Factor;
        childSubray.radius1 = Math.min(
          lightningStrike.rayParameters.minRadius,
          segment.radius1 * lightningStrike.rayParameters.radius1Factor
        );

        childSubray.birthTime = phase0 + currentCycle * period;
        childSubray.deathTime = childSubray.birthTime + period * dutyCycle;

        if (
          !lightningStrike.rayParameters.isEternal &&
          subray.recursion === 0
        ) {
          childSubray.birthTime = Math.max(
            childSubray.birthTime,
            subray.birthTime
          );
          childSubray.deathTime = Math.min(
            childSubray.deathTime,
            subray.deathTime
          );
        }

        childSubray.timeScale = subray.timeScale * 2;
        childSubray.roughness = subray.roughness;
        childSubray.straightness = subray.straightness;
        childSubray.propagationTimeFactor = subray.propagationTimeFactor;
        childSubray.vanishingTimeFactor = subray.vanishingTimeFactor;

        lightningStrike.onSubrayCreation(
          segment,
          subray,
          childSubray,
          lightningStrike
        );

        lightningStrike.randomGenerator.setSeed(parentSeed);
      }
    };

    // Helper vectors
    const vec1Pos = new THREE.Vector3();
    const vec2Forward = new THREE.Vector3();
    const vec3Side = new THREE.Vector3();
    const vec4Up = new THREE.Vector3();
    const random1Again = random1; // same random function reference

    this.onSubrayCreation = (
      segment,
      parentSubray,
      childSubray,
      lightningStrike
    ) => {
      // By default, position child in a "cylinder" around the parent's segment
      lightningStrike.subrayCylinderPosition(
        segment,
        parentSubray,
        childSubray,
        0.5,
        0.6,
        0.2
      );
    };

    this.subrayConePosition = function (
      segment,
      parentSubray,
      childSubray,
      heightFactor,
      sideWidthFactor,
      minSideWidthFactor
    ) {
      childSubray.pos0.copy(segment.pos0);

      vec1Pos.subVectors(parentSubray.pos1, parentSubray.pos0);
      vec2Forward.copy(vec1Pos).normalize();
      vec1Pos.multiplyScalar(
        segment.fraction0 +
          (1 - segment.fraction0) * (random1Again() * heightFactor)
      );
      const length = vec1Pos.length();
      vec3Side.crossVectors(parentSubray.up0, vec2Forward);
      const angle = 2 * Math.PI * random1Again();
      vec3Side.multiplyScalar(Math.cos(angle));
      vec4Up.copy(parentSubray.up0).multiplyScalar(Math.sin(angle));

      childSubray.pos1
        .copy(vec3Side)
        .add(vec4Up)
        .multiplyScalar(
          length *
            sideWidthFactor *
            (minSideWidthFactor + random1Again() * (1 - minSideWidthFactor))
        )
        .add(vec1Pos)
        .add(parentSubray.pos0);
    };

    this.subrayCylinderPosition = function (
      segment,
      parentSubray,
      childSubray,
      heightFactor,
      sideWidthFactor,
      minSideWidthFactor
    ) {
      childSubray.pos0.copy(segment.pos0);

      vec1Pos.subVectors(parentSubray.pos1, parentSubray.pos0);
      vec2Forward.copy(vec1Pos).normalize();
      vec1Pos.multiplyScalar(
        segment.fraction0 +
          (1 - segment.fraction0) * ((2 * random1Again() - 1) * heightFactor)
      );
      const length = vec1Pos.length();
      vec3Side.crossVectors(parentSubray.up0, vec2Forward);
      const angle = 2 * Math.PI * random1Again();
      vec3Side.multiplyScalar(Math.cos(angle));
      vec4Up.copy(parentSubray.up0).multiplyScalar(Math.sin(angle));

      childSubray.pos1
        .copy(vec3Side)
        .add(vec4Up)
        .multiplyScalar(
          length *
            sideWidthFactor *
            (minSideWidthFactor + random1Again() * (1 - minSideWidthFactor))
        )
        .add(vec1Pos)
        .add(parentSubray.pos0);
    };
  }

  /**
   * Create a new subray object (not a full LightningStrike, just a sub-part).
   */
  createSubray() {
    return {
      seed: 0,
      maxIterations: 0,
      recursion: 0,
      pos0: new THREE.Vector3(),
      pos1: new THREE.Vector3(),
      linPos0: new THREE.Vector3(),
      linPos1: new THREE.Vector3(),
      up0: new THREE.Vector3(),
      up1: new THREE.Vector3(),
      radius0: 0,
      radius1: 0,
      birthTime: 0,
      deathTime: 0,
      timeScale: 0,
      roughness: 0,
      straightness: 0,
      propagationTimeFactor: 0,
      vanishingTimeFactor: 0,
      endPropagationTime: 0,
      beginVanishingTime: 0,
    };
  }

  /**
   * Create a new segment object (one piece of a subray).
   */
  createSegment() {
    return {
      iteration: 0,
      pos0: new THREE.Vector3(),
      pos1: new THREE.Vector3(),
      linPos0: new THREE.Vector3(),
      linPos1: new THREE.Vector3(),
      up0: new THREE.Vector3(),
      up1: new THREE.Vector3(),
      radius0: 0,
      radius1: 0,
      fraction0: 0,
      fraction1: 0,
      positionVariationFactor: 0,
    };
  }

  addNewSubray() {
    return this.subrays[this.numSubrays++];
  }

  initSubray(subray, rayParameters) {
    subray.pos0.copy(rayParameters.sourceOffset);
    subray.pos1.copy(rayParameters.destOffset);
    subray.up0.copy(rayParameters.up0);
    subray.up1.copy(rayParameters.up1);
    subray.radius0 = rayParameters.radius0;
    subray.radius1 = rayParameters.radius1;
    subray.birthTime = rayParameters.birthTime;
    subray.deathTime = rayParameters.deathTime;
    subray.timeScale = rayParameters.timeScale;
    subray.roughness = rayParameters.roughness;
    subray.straightness = rayParameters.straightness;
    subray.propagationTimeFactor = rayParameters.propagationTimeFactor;
    subray.vanishingTimeFactor = rayParameters.vanishingTimeFactor;

    subray.maxIterations = this.maxIterations;
    subray.seed =
      rayParameters.noiseSeed !== undefined ? rayParameters.noiseSeed : 0;
    subray.recursion = 0;
  }

  getNewSegment() {
    return this.raySegments[this.currentSegmentIndex++];
  }

  /**
   * Copies geometry parameters from another lightning instance.
   */
  copy(source) {
    super.copy(source);
    this.init(LightningStrike.copyParameters({}, source.rayParameters));
    return this;
  }

  /**
   * Clones this geometry into a new LightningStrike.
   */
  clone() {
    return new LightningStrike(
      LightningStrike.copyParameters({}, this.rayParameters)
    );
  }

  /**
   * Static helper to create a random generator with a seeded array of randoms.
   */
  static createRandomGenerator() {
    const numSeeds = 2053;
    const seeds = [];
    for (let i = 0; i < numSeeds; i++) {
      seeds.push(Math.random());
    }
    const generator = {
      currentSeed: 0,
      random: function () {
        const value = seeds[generator.currentSeed];
        generator.currentSeed = (generator.currentSeed + 1) % numSeeds;
        return value;
      },
      getSeed: function () {
        return generator.currentSeed / numSeeds;
      },
      setSeed: function (seed) {
        generator.currentSeed = Math.floor(seed * numSeeds) % numSeeds;
      },
    };
    return generator;
  }

  /**
   * Static helper to copy user parameters with defaults.
   */
  static copyParameters(dest, source) {
    source = source || {};
    dest = dest || {};

    const vecCopy = (v) => (source === dest ? v : v.clone());

    dest.sourceOffset =
      source.sourceOffset !== undefined
        ? vecCopy(source.sourceOffset)
        : new THREE.Vector3(0, 100, 0);
    dest.destOffset =
      source.destOffset !== undefined
        ? vecCopy(source.destOffset)
        : new THREE.Vector3(0, 0, 0);
    dest.timeScale = source.timeScale !== undefined ? source.timeScale : 1;
    dest.roughness = source.roughness !== undefined ? source.roughness : 0.9;
    dest.straightness =
      source.straightness !== undefined ? source.straightness : 0.7;
    dest.up0 =
      source.up0 !== undefined
        ? vecCopy(source.up0)
        : new THREE.Vector3(0, 0, 1);
    dest.up1 =
      source.up1 !== undefined
        ? vecCopy(source.up1)
        : new THREE.Vector3(0, 0, 1);
    dest.radius0 = source.radius0 !== undefined ? source.radius0 : 1;
    dest.radius1 = source.radius1 !== undefined ? source.radius1 : 1;
    dest.radius0Factor =
      source.radius0Factor !== undefined ? source.radius0Factor : 0.5;
    dest.radius1Factor =
      source.radius1Factor !== undefined ? source.radius1Factor : 0.2;
    dest.minRadius = source.minRadius !== undefined ? source.minRadius : 0.2;

    // Lifetime
    dest.isEternal =
      source.isEternal !== undefined
        ? source.isEternal
        : source.birthTime === undefined || source.deathTime === undefined;
    dest.birthTime = source.birthTime;
    dest.deathTime = source.deathTime;
    dest.propagationTimeFactor =
      source.propagationTimeFactor !== undefined
        ? source.propagationTimeFactor
        : 0.1;
    dest.vanishingTimeFactor =
      source.vanishingTimeFactor !== undefined
        ? source.vanishingTimeFactor
        : 0.9;
    dest.subrayPeriod =
      source.subrayPeriod !== undefined ? source.subrayPeriod : 4;
    dest.subrayDutyCycle =
      source.subrayDutyCycle !== undefined ? source.subrayDutyCycle : 0.6;

    // Unchangeable after creation
    dest.maxIterations =
      source.maxIterations !== undefined ? source.maxIterations : 9;
    dest.isStatic = source.isStatic !== undefined ? source.isStatic : false;
    dest.ramification =
      source.ramification !== undefined ? source.ramification : 5;
    dest.maxSubrayRecursion =
      source.maxSubrayRecursion !== undefined ? source.maxSubrayRecursion : 3;
    dest.recursionProbability =
      source.recursionProbability !== undefined
        ? source.recursionProbability
        : 0.6;
    dest.generateUVs =
      source.generateUVs !== undefined ? source.generateUVs : false;

    dest.randomGenerator = source.randomGenerator;
    dest.noiseSeed = source.noiseSeed;
    dest.onDecideSubrayCreation = source.onDecideSubrayCreation;
    dest.onSubrayCreation = source.onSubrayCreation;

    return dest;
  }
}
