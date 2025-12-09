import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

class DigimonEvolution {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.agumonModel = null;
    this.wargreymonModel = null;
    this.currentModel = null;
    this.isEvolving = false;
    this.particles = null;
    this.dataStreams = null; // 数据流粒子系统
    this.lights = [];
    this.composer = null;
    this.evolutionStage = 0; // 进化阶段：0-准备, 1-数据流, 2-能量爆发, 3-形态转换, 4-新形态显现

    this.init();
    this.loadModels();
    this.setupEventListeners();
  }

  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

    // 创建相机
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 1, 0);

    // 创建渲染器
    const canvas = document.getElementById("canvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 后处理效果
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // 强度
      0.4, // 半径
      0.85 // 阈值
    );
    this.composer.addPass(bloomPass);

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // 添加主光源
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    // 添加点光源用于进化特效
    const pointLight1 = new THREE.PointLight(0xff6b6b, 2, 10);
    pointLight1.position.set(-3, 3, 0);
    this.lights.push(pointLight1);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4ecdc4, 2, 10);
    pointLight2.position.set(3, 3, 0);
    this.lights.push(pointLight2);
    this.scene.add(pointLight2);

    // 创建粒子系统
    this.createParticles();

    // 创建数据流系统
    this.createDataStreams();

    // 添加地面
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 窗口调整
    window.addEventListener("resize", () => this.onWindowResize());
  }

  createParticles() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color1 = new THREE.Color(0xff6b6b);
    const color2 = new THREE.Color(0x4ecdc4);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // 位置
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = Math.random() * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;

      // 颜色混合
      const mixedColor = new THREE.Color().lerpColors(
        color1,
        color2,
        Math.random()
      );
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      // 大小
      sizes[i] = Math.random() * 0.1 + 0.05;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createDataStreams() {
    // 创建螺旋上升的数据流粒子
    const streamCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(streamCount * 3);
    const colors = new Float32Array(streamCount * 3);
    const speeds = new Float32Array(streamCount);
    const radii = new Float32Array(streamCount);
    const angles = new Float32Array(streamCount);

    const color1 = new THREE.Color(0x00ffff); // 青色数据流
    const color2 = new THREE.Color(0xff00ff); // 品红色数据流

    for (let i = 0; i < streamCount; i++) {
      const i3 = i * 3;
      const radius = 0.5 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      const height = Math.random() * 8;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const mixedColor = new THREE.Color().lerpColors(
        color1,
        color2,
        Math.random()
      );
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      speeds[i] = 0.02 + Math.random() * 0.03;
      radii[i] = radius;
      angles[i] = angle;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.userData.speeds = speeds;
    geometry.userData.radii = radii;
    geometry.userData.angles = angles;

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.dataStreams = new THREE.Points(geometry, material);
    this.scene.add(this.dataStreams);
  }

  async loadModels() {
    const loader = new GLTFLoader();
    const statusEl = document.getElementById("status");

    try {
      statusEl.textContent = "正在加载亚古兽...";

      // 加载亚古兽
      const agumonData = await new Promise((resolve, reject) => {
        loader.load(
          "./public/亚古兽.glb",
          (gltf) => resolve(gltf),
          (progress) => {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(
              0
            );
            statusEl.textContent = `加载亚古兽: ${percent}%`;
          },
          (error) => reject(error)
        );
      });

      this.agumonModel = agumonData.scene;
      this.agumonModel.scale.set(1, 1, 1);
      this.agumonModel.position.set(0, 0, 0);
      this.agumonModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      statusEl.textContent = "正在加载战斗暴龙兽...";

      // 加载战斗暴龙兽
      const wargreymonData = await new Promise((resolve, reject) => {
        loader.load(
          "./public/战斗暴龙兽.glb",
          (gltf) => resolve(gltf),
          (progress) => {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(
              0
            );
            statusEl.textContent = `加载战斗暴龙兽: ${percent}%`;
          },
          (error) => reject(error)
        );
      });

      this.wargreymonModel = wargreymonData.scene;
      this.wargreymonModel.scale.set(1, 1, 1);
      this.wargreymonModel.position.set(0, 0, 0);
      this.wargreymonModel.visible = false; // 初始隐藏
      this.wargreymonModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // 添加到场景
      this.scene.add(this.agumonModel);
      this.scene.add(this.wargreymonModel);
      this.currentModel = this.agumonModel;

      statusEl.textContent = '加载完成！点击"开始进化"按钮';
      document.getElementById("evolveBtn").disabled = false;

      this.animate();
    } catch (error) {
      console.error("加载模型失败:", error);
      statusEl.textContent = "加载失败: " + error.message;
    }
  }

  async evolve() {
    if (this.isEvolving || !this.agumonModel || !this.wargreymonModel) return;

    this.isEvolving = true;
    const statusEl = document.getElementById("status");
    const evolveBtn = document.getElementById("evolveBtn");
    evolveBtn.disabled = true;

    // 创建进化遮罩
    const overlay = document.createElement("div");
    overlay.className = "evolution-overlay active";
    document.body.appendChild(overlay);

    // 完整的进化流程
    statusEl.textContent = "⚡ 进化开始！能量聚集中...";
    await this.phase1_EnergyGathering(); // 能量聚集阶段

    statusEl.textContent = "💫 数据流启动！亚古兽 → 暴龙兽";
    await this.phase2_DataStream(); // 数据流阶段

    statusEl.textContent = "🔥 能量爆发！暴龙兽 → 机械暴龙兽";
    await this.phase3_EnergyBurst(); // 能量爆发阶段

    statusEl.textContent = "✨ 形态重组！机械暴龙兽 → 战斗暴龙兽";
    await this.phase4_FormTransformation(); // 形态转换阶段

    statusEl.textContent = "🌟 新形态显现！战斗暴龙兽！";
    await this.phase5_NewFormAppear(); // 新形态显现阶段

    statusEl.textContent = "🎉 进化完成！战斗暴龙兽！";
    await this.phase6_FinalShowcase(); // 最终展示阶段

    // 清理
    overlay.classList.remove("active");
    setTimeout(() => overlay.remove(), 500);

    document.getElementById("resetBtn").style.display = "inline-block";
    this.isEvolving = false;
  }

  // 阶段1: 能量聚集 - 亚古兽开始发光，周围能量聚集
  async phase1_EnergyGathering() {
    return new Promise((resolve) => {
      const duration = 2500; // 2.5秒
      const startTime = Date.now();
      const startRotation = this.currentModel.rotation.y;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.easeInOutQuad(progress);

        // 亚古兽缓慢旋转
        this.currentModel.rotation.y =
          startRotation + easeProgress * Math.PI * 0.5;

        // 光效逐渐增强
        this.lights.forEach((light, index) => {
          light.intensity = 1 + easeProgress * 2;
          const angle = easeProgress * Math.PI * 1.5 + index * Math.PI;
          light.position.x = Math.cos(angle) * 2.5;
          light.position.z = Math.sin(angle) * 2.5;
          light.position.y = 2 + Math.sin(easeProgress * Math.PI * 2) * 0.5;
        });

        // 环境粒子向中心聚集
        const positions = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          const dx = -positions[i] * 0.02 * easeProgress;
          const dy = (1 - positions[i + 1] / 10) * 0.05 * easeProgress;
          const dz = -positions[i + 2] * 0.02 * easeProgress;
          positions[i] += dx;
          positions[i + 1] += dy;
          positions[i + 2] += dz;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;

        // 相机缓慢拉近
        this.camera.position.z = 8 - easeProgress * 1.5;
        this.camera.position.y = 2 + Math.sin(easeProgress * Math.PI) * 0.3;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  // 阶段2: 数据流 - 螺旋上升的数据流效果
  async phase2_DataStream() {
    return new Promise((resolve) => {
      const duration = 3000; // 3秒
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.easeInOutQuad(progress);

        // 数据流显现并旋转上升
        this.dataStreams.material.opacity = easeProgress * 0.8;

        const positions = this.dataStreams.geometry.attributes.position.array;
        const speeds = this.dataStreams.geometry.userData.speeds;
        const radii = this.dataStreams.geometry.userData.radii;
        const angles = this.dataStreams.geometry.userData.angles;

        for (let i = 0; i < positions.length; i += 3) {
          const idx = i / 3;
          // 螺旋上升
          angles[idx] += speeds[idx] * (1 + easeProgress * 2);
          const radius = radii[idx] * (1 - easeProgress * 0.3);

          positions[i] = Math.cos(angles[idx]) * radius;
          positions[i + 1] = (positions[i + 1] + speeds[idx] * 2) % 8;
          positions[i + 2] = Math.sin(angles[idx]) * radius;
        }
        this.dataStreams.geometry.attributes.position.needsUpdate = true;
        this.dataStreams.rotation.y += 0.01;

        // 亚古兽继续旋转，光效增强
        this.currentModel.rotation.y += 0.02;
        this.lights.forEach((light) => {
          light.intensity = 3 + easeProgress * 3;
        });

        // 相机继续拉近
        this.camera.position.z = 6.5 - easeProgress * 2;
        this.camera.lookAt(0, 1 + easeProgress * 0.5, 0);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  // 阶段3: 能量爆发 - 强烈的光效爆发，模拟中间形态
  async phase3_EnergyBurst() {
    return new Promise((resolve) => {
      const duration = 2000; // 2秒
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 强烈的光效闪烁
        const flashIntensity = 6 + Math.sin(progress * Math.PI * 8) * 3;
        this.lights.forEach((light) => {
          light.intensity = flashIntensity;
          light.color.setHSL(0.1 + progress * 0.3, 1, 0.5);
        });

        // 数据流加速
        const positions = this.dataStreams.geometry.attributes.position.array;
        const speeds = this.dataStreams.geometry.userData.speeds;
        const angles = this.dataStreams.geometry.userData.angles;
        const radii = this.dataStreams.geometry.userData.radii;

        for (let i = 0; i < positions.length; i += 3) {
          const idx = i / 3;
          angles[idx] += speeds[idx] * 5;
          const radius = radii[idx] * (0.7 - progress * 0.4);
          positions[i] = Math.cos(angles[idx]) * radius;
          positions[i + 1] = (positions[i + 1] + speeds[idx] * 5) % 8;
          positions[i + 2] = Math.sin(angles[idx]) * radius;
        }
        this.dataStreams.geometry.attributes.position.needsUpdate = true;

        // 亚古兽缩放和旋转
        const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.3;
        this.currentModel.scale.set(scale, scale, scale);
        this.currentModel.rotation.y += 0.05;

        // 相机震动效果
        this.camera.position.x = Math.sin(progress * Math.PI * 10) * 0.1;
        this.camera.position.y = 2.3 + Math.sin(progress * Math.PI * 8) * 0.1;
        this.camera.position.z = 4.5 - progress * 1;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  // 阶段4: 形态转换 - 数据重组，模型切换
  async phase4_FormTransformation() {
    return new Promise((resolve) => {
      const duration = 1500; // 1.5秒
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.easeInOutQuad(progress);

        // 亚古兽淡出
        this.currentModel.traverse((child) => {
          if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.transparent !== undefined) {
                  mat.transparent = true;
                  mat.opacity = 1 - easeProgress;
                }
              });
            } else {
              child.material.transparent = true;
              child.material.opacity = 1 - easeProgress;
            }
          }
        });

        // 数据流向中心收缩
        const positions = this.dataStreams.geometry.attributes.position.array;
        const radii = this.dataStreams.geometry.userData.radii;
        for (let i = 0; i < positions.length; i += 3) {
          const idx = i / 3;
          const targetRadius = radii[idx] * (1 - easeProgress);
          const angle = Math.atan2(positions[i + 2], positions[i]);
          positions[i] = Math.cos(angle) * targetRadius;
          positions[i + 2] = Math.sin(angle) * targetRadius;
          positions[i + 1] = 1 + (positions[i + 1] - 1) * (1 - easeProgress);
        }
        this.dataStreams.geometry.attributes.position.needsUpdate = true;
        this.dataStreams.material.opacity = 0.8 * (1 - easeProgress);

        // 光效达到峰值后减弱
        this.lights.forEach((light) => {
          light.intensity = 9 * (1 - easeProgress * 0.7);
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 切换模型
          this.currentModel.visible = false;
          this.currentModel = this.wargreymonModel;
          this.currentModel.visible = true;
          this.currentModel.scale.set(0.3, 0.3, 0.3);
          this.currentModel.rotation.y = 0;

          // 重置数据流
          this.resetDataStreams();
          resolve();
        }
      };
      animate();
    });
  }

  // 阶段5: 新形态显现 - 战斗暴龙兽从光中显现
  async phase5_NewFormAppear() {
    return new Promise((resolve) => {
      const duration = 2500; // 2.5秒
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.easeOutCubic(progress);

        // 战斗暴龙兽缩放出现
        const scale = 0.3 + easeProgress * 0.7;
        this.currentModel.scale.set(scale, scale, scale);

        // 淡入
        this.currentModel.traverse((child) => {
          if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.transparent !== undefined) {
                  mat.transparent = true;
                  mat.opacity = easeProgress;
                }
              });
            } else {
              child.material.transparent = true;
              child.material.opacity = easeProgress;
            }
          }
        });

        // 光效恢复并增强
        this.lights.forEach((light, index) => {
          light.intensity = 2 + easeProgress * 4;
          light.color.setHSL(0.4 + index * 0.1, 1, 0.5);
          const angle = easeProgress * Math.PI * 2 + index * Math.PI;
          light.position.x = Math.cos(angle) * 3;
          light.position.z = Math.sin(angle) * 3;
          light.position.y = 3 + Math.sin(easeProgress * Math.PI) * 1;
        });

        // 相机拉远展示
        this.camera.position.z = 3.5 + easeProgress * 3;
        this.camera.position.y = 2.3 + easeProgress * 0.5;
        this.camera.lookAt(0, 1.5, 0);

        // 旋转展示
        this.currentModel.rotation.y = easeProgress * Math.PI * 1.5;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 恢复材质透明度
          this.currentModel.traverse((child) => {
            if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  if (mat.transparent !== undefined) {
                    mat.opacity = 1;
                  }
                });
              } else {
                child.material.opacity = 1;
              }
            }
          });
          resolve();
        }
      };
      animate();
    });
  }

  // 阶段6: 最终展示 - 战斗暴龙兽完全展现
  async phase6_FinalShowcase() {
    return new Promise((resolve) => {
      const duration = 2000; // 2秒
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 最终旋转展示
        this.currentModel.rotation.y += 0.02;

        // 光效稳定
        this.lights.forEach((light, index) => {
          light.intensity = 6 + Math.sin(progress * Math.PI * 2) * 1;
          const angle = progress * Math.PI * 0.5 + index * Math.PI;
          light.position.x = Math.cos(angle) * 3;
          light.position.z = Math.sin(angle) * 3;
        });

        // 相机环绕
        const angle = progress * Math.PI * 0.5;
        this.camera.position.x = Math.sin(angle) * 1;
        this.camera.position.z = 6.5 + Math.cos(angle) * 0.5;
        this.camera.lookAt(0, 1.5, 0);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 隐藏数据流
          this.dataStreams.material.opacity = 0;
          resolve();
        }
      };
      animate();
    });
  }

  // 工具函数：缓动函数
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // 重置数据流
  resetDataStreams() {
    const positions = this.dataStreams.geometry.attributes.position.array;
    const radii = this.dataStreams.geometry.userData.radii;
    const angles = this.dataStreams.geometry.userData.angles;

    for (let i = 0; i < positions.length; i += 3) {
      const idx = i / 3;
      const radius = radii[idx];
      const angle = Math.random() * Math.PI * 2;
      const height = Math.random() * 8;

      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = height;
      positions[i + 2] = Math.sin(angle) * radius;

      angles[idx] = angle;
    }
    this.dataStreams.geometry.attributes.position.needsUpdate = true;
  }

  reset() {
    if (this.isEvolving) return;

    // 重置模型
    this.currentModel.visible = false;
    this.currentModel = this.agumonModel;
    this.currentModel.visible = true;
    this.currentModel.scale.set(1, 1, 1);
    this.currentModel.rotation.y = 0;

    // 重置战斗暴龙兽
    this.wargreymonModel.visible = false;
    this.wargreymonModel.scale.set(1, 1, 1);
    this.wargreymonModel.rotation.y = 0;

    // 重置相机
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 1, 0);

    // 重置光效
    this.lights.forEach((light, index) => {
      light.intensity = 2;
      light.position.set(index === 0 ? -3 : 3, 3, 0);
      light.color.setHex(0xffffff);
    });

    // 重置粒子
    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = Math.random() * 10;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    // 重置数据流
    this.dataStreams.material.opacity = 0;
    this.resetDataStreams();

    // 恢复材质
    this.agumonModel.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat.transparent !== undefined) {
              mat.opacity = 1;
            }
          });
        } else {
          child.material.opacity = 1;
        }
      }
    });

    document.getElementById("status").textContent =
      '已重置！点击"开始进化"按钮';
    document.getElementById("evolveBtn").disabled = false;
    document.getElementById("resetBtn").style.display = "none";
  }

  setupEventListeners() {
    document
      .getElementById("evolveBtn")
      .addEventListener("click", () => this.evolve());
    document
      .getElementById("resetBtn")
      .addEventListener("click", () => this.reset());
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // 粒子动画
    if (this.particles && !this.isEvolving) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.005;
        if (positions[i] > 10) {
          positions[i] = 0;
          positions[i - 1] = (Math.random() - 0.5) * 20;
          positions[i + 1] = (Math.random() - 0.5) * 20;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // 模型旋转（非进化时）
    if (this.currentModel && !this.isEvolving) {
      this.currentModel.rotation.y += 0.005;
    }

    // 更新数据流（非进化时保持静止但可见）
    if (this.dataStreams && !this.isEvolving) {
      // 数据流在非进化时保持隐藏
    }

    // 渲染
    this.composer.render();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
}

// 启动应用
new DigimonEvolution();
