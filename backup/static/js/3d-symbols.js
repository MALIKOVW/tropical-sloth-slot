import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class SymbolRenderer {
    constructor() {
        console.log('Initializing SymbolRenderer');
        this.loader = new GLTFLoader();
        this.models = {};
        this.renderer = null;
        this.symbolValues = {
            // Low value symbols (wooden letters)
            'wooden_a': { path: '/static/models/wooden_a.glb', value: 10 },
            'wooden_k': { path: '/static/models/wooden_k.glb', value: 15 },
            'wooden_arch': { path: '/static/models/wooden_arch.glb', value: 20 },

            // Medium value symbols (animals)
            'snake': { path: '/static/models/snake.glb', value: 30 },
            'gorilla': { path: '/static/models/gorilla.glb', value: 40 },
            'jaguar': { path: '/static/models/jaguar.glb', value: 50 },
            'crocodile': { path: '/static/models/crocodile.glb', value: 60 },
            'gator': { path: '/static/models/gator.glb', value: 70 },
            'leopard': { path: '/static/models/leopard.glb', value: 80 },

            // High value symbol
            'dragon': { path: '/static/models/dragon.glb', value: 100 },

            // Scatter symbol
            'sloth': { path: '/static/models/sloth.glb', value: 0 }
        };

        // Loading state
        this.onProgress = null;
        this.onLoad = null;
        this.totalModels = Object.keys(this.symbolValues).length;
        this.loadedModels = 0;

        // Initialize scene and camera
        this.initializeScene();
    }

    initializeScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        this.camera.position.z = 1.5;

        // Enhanced lighting setup
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        this.directionalLight.position.set(1, 1, 1);

        this.scene.add(this.ambientLight);
        this.scene.add(this.directionalLight);
    }

    async loadModels() {
        const loadPromises = [];

        for (const [symbol, data] of Object.entries(this.symbolValues)) {
            const promise = new Promise((resolve) => {
                this.loader.load(
                    data.path,
                    (gltf) => {
                        try {
                            console.log(`Loading model for ${symbol}`);
                            const model = gltf.scene;

                            // Center and scale the model
                            const box = new THREE.Box3().setFromObject(model);
                            const center = box.getCenter(new THREE.Vector3());
                            const size = box.getSize(new THREE.Vector3());
                            const maxDim = Math.max(size.x, size.y, size.z);
                            const scale = 1.2 / maxDim;

                            model.scale.setScalar(scale);
                            model.position.sub(center.multiplyScalar(scale));

                            this.models[symbol] = model;
                            this.loadedModels++;

                            if (this.onProgress) {
                                this.onProgress(this.loadedModels, this.totalModels);
                            }

                            resolve();
                        } catch (error) {
                            console.error(`Error processing model for ${symbol}:`, error);
                            resolve();
                        }
                    },
                    null,
                    (error) => {
                        console.warn(`Failed to load model ${symbol}:`, error);
                        resolve();
                    }
                );
            });

            loadPromises.push(promise);
        }

        try {
            await Promise.all(loadPromises);
            if (this.onLoad) {
                this.onLoad();
            }
        } catch (error) {
            console.error('Error during model loading:', error);
        }
    }

    renderSymbol(symbol, canvas, size) {
        if (!this.models[symbol]) {
            return false;
        }

        try {
            // Create new renderer for each canvas
            const renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: true
            });

            renderer.setSize(size, size, false);
            renderer.setClearColor(0x000000, 0);

            // Clear scene
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }

            // Add lights
            this.scene.add(this.ambientLight);
            this.scene.add(this.directionalLight);

            const model = this.models[symbol].clone();
            model.rotation.y = Math.PI / 4;
            this.scene.add(model);

            // Render scene
            renderer.render(this.scene, this.camera);

            // Dispose of renderer immediately after use
            renderer.dispose();

            return true;
        } catch (error) {
            console.error(`Error rendering symbol ${symbol}:`, error);
            return false;
        }
    }

    dispose() {
        try {
            // Dispose of all models
            Object.values(this.models).forEach(model => {
                if (model && model.traverse) {
                    model.traverse(child => {
                        if (child.geometry) {
                            child.geometry.dispose();
                        }
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(material => material.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    });
                }
            });
            this.models = {};
        } catch (error) {
            console.error('Error during resource disposal:', error);
        }
    }

    getSymbolValue(symbol) {
        return this.symbolValues[symbol]?.value || 0;
    }

    isScatter(symbol) {
        return symbol === 'sloth';
    }
}

const symbolRenderer = new SymbolRenderer();
export { symbolRenderer };