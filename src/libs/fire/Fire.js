import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js";
import ThreeFireShader from "./FireShader.js";

/**
 * @author mattatz / http://github.com/mattatz
 *
 * Ray tracing based real-time procedural volumetric fire object for three.js
 */

class ThreeFire extends THREE.Mesh {
  constructor(fireTex, color) {
    const fireMaterial = new THREE.ShaderMaterial({
      defines: ThreeFireShader.defines,
      uniforms: THREE.UniformsUtils.clone(ThreeFireShader.uniforms),
      vertexShader: ThreeFireShader.vertexShader,
      fragmentShader: ThreeFireShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    // initialize uniforms
    fireTex.magFilter = fireTex.minFilter = THREE.LinearFilter;
    fireTex.wrapS = fireTex.wrapT = THREE.ClampToEdgeWrapping;

    fireMaterial.uniforms.fireTex.value = fireTex;
    fireMaterial.uniforms.color.value = color || new THREE.Color(0xeeeeee);
    fireMaterial.uniforms.invModelMatrix.value = new THREE.Matrix4();
    fireMaterial.uniforms.scale.value = new THREE.Vector3(1, 1, 1);
    fireMaterial.uniforms.seed.value = Math.random() * 19.19;

    super(new THREE.BoxGeometry(1.0, 1.0, 1.0), fireMaterial);
  }
  update(time) {
    const invModelMatrix = this.material.uniforms.invModelMatrix.value;

    this.updateMatrixWorld();
    invModelMatrix.copy(this.matrixWorld).invert();

    if (time !== undefined) {
      this.material.uniforms.time.value = time;
    }

    this.material.uniforms.invModelMatrix.value = invModelMatrix;

    this.material.uniforms.scale.value = this.scale;
  }
}

export default ThreeFire;
