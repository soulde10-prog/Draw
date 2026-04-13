// Modern Roofing 3D Engine (2026 compatible style)
import * as THREE from 'three';                    // use local three.module.js or CDN with importmap
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ModernRoofing3DEngine {
    constructor(containerId = 'threeContainer') {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.camera.position.set(0, 20, 40);
        this.controls.update();

        this.addLights();
        this.createSampleRoofs();
        this.animate();
    }

    addLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(15, 30, 20);
        sun.castShadow = true;
        this.scene.add(sun);
    }

    createSampleRoofs() {
        // Gable Roof
        const gableMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, side: THREE.DoubleSide });
        const base = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 15), gableMat);
        this.scene.add(base);

        const roofGeo = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            -10, 5, -7.5,   10, 5, -7.5,   0, 12, 0,
            -10, 5,  7.5,   10, 5,  7.5,   0, 12, 0
        ]);
        roofGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        roofGeo.computeVertexNormals();
        const roof = new THREE.Mesh(roofGeo, gableMat);
        this.scene.add(roof);

        // Flat Torch-on
        const flat = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 14), new THREE.MeshStandardMaterial({color: 0x333333}));
        flat.position.set(25, 3, 0);
        this.scene.add(flat);

        // Hip example (simplified pyramid)
        const hip = new THREE.Mesh(new THREE.ConeGeometry(12, 9, 4), new THREE.MeshStandardMaterial({color: 0xA0522D}));
        hip.position.set(-25, 6, 0);
        this.scene.add(hip);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // Future: addFrom2DScene(walls, roofs) { ... convert 2D data to 3D extrusions }
}

 // Usage: new ModernRoofing3DEngine();
