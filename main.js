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
    this.agumonModel = null; // 亚古兽
    this.greymonModel = null; // 暴龙兽
    this.metalGreymonModel = null; // 机械暴龙兽
    this.wargreymonModel = null; // 战斗暴龙兽
    this.currentModel = null;
    this.isEvolving = false;
    this.particles = null;
    this.dataStreams = null; // 数据流粒子系统
    this.lights = [];
    this.composer = null;
    this.evolutionStage = 0; // 进化阶段：0-准备, 1-数据流, 2-能量爆发, 3-形态转换, 4-新形态显现
    this.evolutionLevel = 0; // 当前进化等级：0-亚古兽, 1-暴龙兽, 2-机械暴龙兽, 3-战斗暴龙兽
    this.modelCache = null; // IndexedDB缓存

    this.init();
    this.initCache().then(() => {
      this.loadModels();
    });
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
    // 创建龙卷风效果的数据流粒子（从底部螺旋上升）
    const streamCount = 3000; // 增加粒子数量以增强效果
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(streamCount * 3);
    const colors = new Float32Array(streamCount * 3);
    const speeds = new Float32Array(streamCount);
    const radii = new Float32Array(streamCount);
    const angles = new Float32Array(streamCount);
    const heights = new Float32Array(streamCount); // 初始高度
    const verticalSpeeds = new Float32Array(streamCount); // 垂直上升速度
    const rotationSpeeds = new Float32Array(streamCount); // 旋转速度

    const color1 = new THREE.Color(0x00ffff); // 青色数据流
    const color2 = new THREE.Color(0xff00ff); // 品红色数据流

    for (let i = 0; i < streamCount; i++) {
      const i3 = i * 3;
      // 龙卷风形状：底部半径大，顶部半径小
      const heightRatio = Math.random(); // 0-1，表示在龙卷风中的高度比例
      const baseRadius = 4; // 底部最大半径
      const topRadius = 0.5; // 顶部最小半径
      const radius = baseRadius - (baseRadius - topRadius) * heightRatio;

      const angle = Math.random() * Math.PI * 2;
      const height = -2 + heightRatio * 10; // 从底部(-2)到顶部(8)

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

      // 旋转速度：底部快，顶部更快（形成螺旋）
      rotationSpeeds[i] = 0.05 + Math.random() * 0.1 + heightRatio * 0.1;
      // 垂直上升速度
      verticalSpeeds[i] = 0.03 + Math.random() * 0.05;
      // 半径变化速度（向中心收缩）
      speeds[i] = 0.01 + Math.random() * 0.02;
      radii[i] = radius;
      angles[i] = angle;
      heights[i] = height;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.userData.speeds = speeds;
    geometry.userData.radii = radii;
    geometry.userData.angles = angles;
    geometry.userData.heights = heights;
    geometry.userData.verticalSpeeds = verticalSpeeds;
    geometry.userData.rotationSpeeds = rotationSpeeds;

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.dataStreams = new THREE.Points(geometry, material);
    this.scene.add(this.dataStreams);
  }

  // 初始化IndexedDB缓存
  async initCache() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("DigimonModelsCache", 1);

      request.onerror = () => {
        console.warn("IndexedDB不可用，将使用网络加载");
        resolve();
      };

      request.onsuccess = () => {
        this.modelCache = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("models")) {
          db.createObjectStore("models", { keyPath: "url" });
        }
      };
    });
  }

  // 从缓存加载模型
  async loadFromCache(url) {
    if (!this.modelCache) return null;

    return new Promise((resolve) => {
      const transaction = this.modelCache.transaction(["models"], "readonly");
      const store = transaction.objectStore("models");
      const request = store.get(url);

      request.onsuccess = () => {
        if (request.result && request.result.data) {
          // 检查缓存是否过期（7天）
          const cacheAge = Date.now() - request.result.timestamp;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天

          if (cacheAge < maxAge) {
            resolve(request.result.data);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  // 保存模型到缓存
  async saveToCache(url, arrayBuffer) {
    if (!this.modelCache) return;

    try {
      const transaction = this.modelCache.transaction(["models"], "readwrite");
      const store = transaction.objectStore("models");
      await store.put({
        url: url,
        data: arrayBuffer,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn("保存缓存失败:", error);
    }
  }

  // 优化的模型加载函数（支持缓存和并行加载）
  async loadModelWithCache(
    url,
    name,
    loader,
    priority = false,
    onProgress = null
  ) {
    // 尝试从缓存加载
    const cachedData = await this.loadFromCache(url);

    if (cachedData) {
      // 从缓存加载（快速，无需进度）
      if (onProgress) onProgress({ loaded: 100, total: 100, fromCache: true });

      const blob = new Blob([cachedData]);
      const blobUrl = URL.createObjectURL(blob);

      return new Promise((resolve, reject) => {
        loader.load(
          blobUrl,
          (gltf) => {
            URL.revokeObjectURL(blobUrl);
            resolve(gltf);
          },
          undefined,
          (error) => {
            URL.revokeObjectURL(blobUrl);
            reject(error);
          }
        );
      });
    }

    // 从网络加载（带进度跟踪）
    return new Promise((resolve, reject) => {
      // 使用fetch获取，支持进度跟踪
      fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const contentLength = response.headers.get("content-length");
          const total = contentLength ? parseInt(contentLength, 10) : 0;

          if (!response.body) {
            return response.arrayBuffer().then((buffer) => ({ buffer, total }));
          }

          const reader = response.body.getReader();
          const chunks = [];
          let loaded = 0;

          const pump = () => {
            return reader.read().then(({ done, value }) => {
              if (done) {
                const buffer = new Uint8Array(loaded);
                let offset = 0;
                for (const chunk of chunks) {
                  buffer.set(chunk, offset);
                  offset += chunk.length;
                }
                return { buffer: buffer.buffer, total };
              }

              chunks.push(value);
              loaded += value.length;

              if (onProgress && total > 0) {
                onProgress({ loaded, total, fromCache: false });
              }

              return pump();
            });
          };

          return pump();
        })
        .then(({ buffer, total }) => {
          const arrayBuffer =
            buffer instanceof ArrayBuffer ? buffer : buffer.buffer;

          // 保存到缓存
          this.saveToCache(url, arrayBuffer);

          // 创建Blob URL并加载
          const blob = new Blob([arrayBuffer]);
          const blobUrl = URL.createObjectURL(blob);

          loader.load(
            blobUrl,
            (gltf) => {
              URL.revokeObjectURL(blobUrl);
              resolve(gltf);
            },
            (progress) => {
              // GLTFLoader的进度回调
              if (onProgress && progress.total > 0) {
                onProgress({
                  loaded: progress.loaded,
                  total: progress.total,
                  fromCache: false,
                  stage: "parsing",
                });
              }
            },
            (error) => {
              URL.revokeObjectURL(blobUrl);
              reject(error);
            }
          );
        })
        .catch(reject);
    });
  }

  // 设置模型属性
  setupModel(model, visible = true) {
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    model.visible = visible;
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return model;
  }

  async loadModels() {
    const loader = new GLTFLoader();
    const statusEl = document.getElementById("status");

    try {
      // 模型配置
      const modelConfigs = [
        {
          url: "./public/亚古兽.glb",
          name: "亚古兽",
          property: "agumonModel",
          priority: true,
        },
        {
          url: "./public/暴龙兽.glb",
          name: "暴龙兽",
          property: "greymonModel",
          priority: false,
        },
        {
          url: "./public/机械暴龙兽.glb",
          name: "机械暴龙兽",
          property: "metalGreymonModel",
          priority: false,
        },
        {
          url: "./public/战斗暴龙兽.glb",
          name: "战斗暴龙兽",
          property: "wargreymonModel",
          priority: false,
        },
      ];

      // 跟踪总体加载进度
      let totalLoaded = 0;
      let totalSize = 0;
      const modelProgress = {};

      // 更新总体进度显示
      const updateOverallProgress = () => {
        const percent =
          totalSize > 0 ? Math.floor((totalLoaded / totalSize) * 100) : 0;
        const loadedMB = (totalLoaded / 1024 / 1024).toFixed(1);
        const totalMB = (totalSize / 1024 / 1024).toFixed(1);
        statusEl.textContent = `加载进度: ${percent}% (${loadedMB}MB / ${totalMB}MB)`;
      };

      // 先加载优先级模型（亚古兽）
      const priorityModel = modelConfigs.find((m) => m.priority);
      if (priorityModel) {
        statusEl.textContent = `正在加载${priorityModel.name}...`;
        const data = await this.loadModelWithCache(
          priorityModel.url,
          priorityModel.name,
          loader,
          true,
          (progress) => {
            if (progress.fromCache) {
              statusEl.textContent = `从缓存加载${priorityModel.name}...`;
            } else {
              if (!modelProgress[priorityModel.name]) {
                modelProgress[priorityModel.name] = {
                  loaded: 0,
                  total: progress.total || 0,
                };
                totalSize += progress.total || 0;
              }
              modelProgress[priorityModel.name].loaded = progress.loaded;
              totalLoaded = Object.values(modelProgress).reduce(
                (sum, p) => sum + p.loaded,
                0
              );
              const percent =
                progress.total > 0
                  ? Math.floor((progress.loaded / progress.total) * 100)
                  : 0;
              statusEl.textContent = `加载${priorityModel.name}: ${percent}%`;
            }
          }
        );
        this[priorityModel.property] = this.setupModel(data.scene, true);
        this.scene.add(this[priorityModel.property]);
        this.currentModel = this[priorityModel.property];

        // 启动动画循环（让用户看到亚古兽）
        this.animate();
      }

      // 并行加载其他模型
      statusEl.textContent = `正在并行加载其他模型...`;

      const loadPromises = modelConfigs
        .filter((m) => !m.priority)
        .map(async (config) => {
          try {
            const data = await this.loadModelWithCache(
              config.url,
              config.name,
              loader,
              false,
              (progress) => {
                if (progress.fromCache) {
                  // 缓存加载，快速完成
                  if (!modelProgress[config.name]) {
                    modelProgress[config.name] = { loaded: 0, total: 0 };
                  }
                } else {
                  if (!modelProgress[config.name]) {
                    modelProgress[config.name] = {
                      loaded: 0,
                      total: progress.total || 0,
                    };
                    totalSize += progress.total || 0;
                  }
                  modelProgress[config.name].loaded = progress.loaded;
                  totalLoaded = Object.values(modelProgress).reduce(
                    (sum, p) => sum + p.loaded,
                    0
                  );
                  updateOverallProgress();
                }
              }
            );
            this[config.property] = this.setupModel(data.scene, false);
            this.scene.add(this[config.property]);

            // 更新进度
            if (modelProgress[config.name]) {
              modelProgress[config.name].loaded =
                modelProgress[config.name].total;
            }
            totalLoaded = Object.values(modelProgress).reduce(
              (sum, p) => sum + p.loaded,
              0
            );
            updateOverallProgress();

            return { success: true, name: config.name };
          } catch (error) {
            console.error(`加载${config.name}失败:`, error);
            return { success: false, name: config.name, error };
          }
        });

      // 等待所有模型加载完成
      const results = await Promise.all(loadPromises);

      // 检查是否有加载失败的模型
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        console.warn("部分模型加载失败:", failed);
      }

      statusEl.textContent = "加载完成！";
      document.getElementById("evolveBtn").disabled = false;

      // 2秒后自动隐藏加载完成提示
      setTimeout(() => {
        statusEl.textContent = "";
      }, 2000);
    } catch (error) {
      console.error("加载模型失败:", error);
      statusEl.textContent = "加载失败: " + error.message;
    }
  }

  async evolve() {
    if (
      this.isEvolving ||
      !this.agumonModel ||
      !this.greymonModel ||
      !this.metalGreymonModel ||
      !this.wargreymonModel
    )
      return;

    this.isEvolving = true;
    const statusEl = document.getElementById("status");
    const evolveBtn = document.getElementById("evolveBtn");
    evolveBtn.disabled = true;

    // 创建进化遮罩
    const overlay = document.createElement("div");
    overlay.className = "evolution-overlay active";
    document.body.appendChild(overlay);

    // 第一阶段：亚古兽 → 暴龙兽
    statusEl.textContent = "⚡ 进化开始！能量聚集中...";
    await this.phase1_EnergyGathering(); // 能量聚集阶段

    statusEl.textContent = "💫 数据流启动！亚古兽 → 暴龙兽";
    await this.phase2_DataStream(); // 数据流阶段

    statusEl.textContent = "✨ 形态转换！暴龙兽显现！";
    await this.phase4_FormTransformation(0, 1); // 切换到暴龙兽
    this.evolutionLevel = 1;

    statusEl.textContent = "🌟 暴龙兽！";
    await this.phase5_NewFormAppear(); // 新形态显现阶段
    await this.phase6_FinalShowcase(); // 短暂展示

    // 第二阶段：暴龙兽 → 机械暴龙兽
    statusEl.textContent = "⚡ 继续进化！能量再次聚集...";
    await this.phase1_EnergyGathering(); // 能量聚集阶段

    statusEl.textContent = "💫 数据流加速！暴龙兽 → 机械暴龙兽";
    await this.phase2_DataStream(); // 数据流阶段

    statusEl.textContent = "🔥 能量爆发！机械暴龙兽显现！";
    await this.phase3_EnergyBurst(); // 能量爆发阶段

    statusEl.textContent = "✨ 形态转换！机械暴龙兽！";
    await this.phase4_FormTransformation(1, 2); // 切换到机械暴龙兽
    this.evolutionLevel = 2;

    statusEl.textContent = "🌟 机械暴龙兽！";
    await this.phase5_NewFormAppear(); // 新形态显现阶段
    await this.phase6_FinalShowcase(); // 短暂展示

    // 第三阶段：机械暴龙兽 → 战斗暴龙兽
    statusEl.textContent = "⚡ 最终进化！能量极限聚集...";
    await this.phase1_EnergyGathering(); // 能量聚集阶段

    statusEl.textContent = "💫 数据流极限！机械暴龙兽 → 战斗暴龙兽";
    await this.phase2_DataStream(); // 数据流阶段

    statusEl.textContent = "🔥 终极能量爆发！";
    await this.phase3_EnergyBurst(); // 能量爆发阶段

    statusEl.textContent = "✨ 最终形态重组！战斗暴龙兽！";
    await this.phase4_FormTransformation(2, 3); // 切换到战斗暴龙兽
    this.evolutionLevel = 3;

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

        // 模型逐渐加速旋转（准备龙卷风效果）
        const rotationSpeed = 0.02 + easeProgress * 0.08; // 从慢到快
        this.currentModel.rotation.y += rotationSpeed;

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

  // 阶段2: 数据流 - 龙卷风效果，数据流围绕模型快速旋转
  async phase2_DataStream() {
    return new Promise((resolve) => {
      const duration = 3000; // 3秒
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.easeInOutQuad(progress);

        // 数据流显现并增强
        this.dataStreams.material.opacity = easeProgress * 0.9;

        const positions = this.dataStreams.geometry.attributes.position.array;
        const speeds = this.dataStreams.geometry.userData.speeds;
        const radii = this.dataStreams.geometry.userData.radii;
        const angles = this.dataStreams.geometry.userData.angles;
        const heights = this.dataStreams.geometry.userData.heights;
        const verticalSpeeds =
          this.dataStreams.geometry.userData.verticalSpeeds;
        const rotationSpeeds =
          this.dataStreams.geometry.userData.rotationSpeeds;

        // 龙卷风旋转速度（随进度加速）
        const tornadoSpeed = 1 + easeProgress * 3; // 从1倍速到4倍速

        for (let i = 0; i < positions.length; i += 3) {
          const idx = i / 3;

          // 快速旋转（龙卷风效果）
          angles[idx] += rotationSpeeds[idx] * tornadoSpeed;

          // 向中心收缩（形成龙卷风形状）
          const targetRadius = radii[idx] * (0.3 + easeProgress * 0.2); // 逐渐收缩
          const currentRadius = radii[idx] * (1 - easeProgress * 0.5);
          const radius = Math.max(targetRadius, currentRadius);

          // 垂直上升
          heights[idx] =
            (heights[idx] + verticalSpeeds[idx] * tornadoSpeed) % 10;
          if (heights[idx] < -2) heights[idx] += 10; // 循环到底部

          // 更新位置（围绕模型中心旋转）
          positions[i] = Math.cos(angles[idx]) * radius;
          positions[i + 1] = -2 + heights[idx];
          positions[i + 2] = Math.sin(angles[idx]) * radius;
        }
        this.dataStreams.geometry.attributes.position.needsUpdate = true;

        // 模型快速旋转（龙卷风中心）
        this.currentModel.rotation.y += 0.15 * tornadoSpeed; // 快速旋转

        // 光效增强
        this.lights.forEach((light) => {
          light.intensity = 3 + easeProgress * 4;
          // 光效也围绕模型旋转
          const lightAngle = Date.now() * 0.002 * tornadoSpeed;
          light.position.x = Math.cos(lightAngle) * 3;
          light.position.z = Math.sin(lightAngle) * 3;
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

  // 阶段3: 能量爆发 - 强烈的光效爆发，龙卷风效果达到峰值
  async phase3_EnergyBurst() {
    return new Promise((resolve) => {
      const duration = 2000; // 2秒
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 强烈的光效闪烁
        const flashIntensity = 6 + Math.sin(progress * Math.PI * 8) * 3;
        this.lights.forEach((light, index) => {
          light.intensity = flashIntensity;
          light.color.setHSL(0.1 + progress * 0.3, 1, 0.5);
          // 光效快速旋转
          const lightAngle = Date.now() * 0.005 + index * Math.PI;
          light.position.x = Math.cos(lightAngle) * 3;
          light.position.z = Math.sin(lightAngle) * 3;
        });

        // 数据流加速旋转（龙卷风效果达到峰值）
        const positions = this.dataStreams.geometry.attributes.position.array;
        const speeds = this.dataStreams.geometry.userData.speeds;
        const angles = this.dataStreams.geometry.userData.angles;
        const radii = this.dataStreams.geometry.userData.radii;
        const heights = this.dataStreams.geometry.userData.heights;
        const verticalSpeeds =
          this.dataStreams.geometry.userData.verticalSpeeds;
        const rotationSpeeds =
          this.dataStreams.geometry.userData.rotationSpeeds;

        // 龙卷风速度达到峰值（5-8倍速）
        const tornadoSpeed = 5 + progress * 3;

        for (let i = 0; i < positions.length; i += 3) {
          const idx = i / 3;
          // 极速旋转
          angles[idx] += rotationSpeeds[idx] * tornadoSpeed;
          // 向中心收缩
          const radius = radii[idx] * (0.2 + progress * 0.1);

          // 快速上升
          heights[idx] =
            (heights[idx] + verticalSpeeds[idx] * tornadoSpeed * 2) % 10;
          if (heights[idx] < -2) heights[idx] += 10;

          positions[i] = Math.cos(angles[idx]) * radius;
          positions[i + 1] = -2 + heights[idx];
          positions[i + 2] = Math.sin(angles[idx]) * radius;
        }
        this.dataStreams.geometry.attributes.position.needsUpdate = true;

        // 模型极速旋转（龙卷风中心）
        const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.3;
        this.currentModel.scale.set(scale, scale, scale);
        this.currentModel.rotation.y += 0.3 * tornadoSpeed; // 极速旋转

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
  // fromLevel: 当前进化等级, toLevel: 目标进化等级
  async phase4_FormTransformation(fromLevel, toLevel) {
    return new Promise((resolve) => {
      const duration = 1500; // 1.5秒
      const startTime = Date.now();

      // 获取目标模型
      const modelMap = [
        this.agumonModel,
        this.greymonModel,
        this.metalGreymonModel,
        this.wargreymonModel,
      ];
      const targetModel = modelMap[toLevel];

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.easeInOutQuad(progress);

        // 当前模型淡出并继续旋转
        this.currentModel.rotation.y += 0.1 * (1 - easeProgress); // 旋转速度逐渐减慢
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

        // 数据流向中心收缩（龙卷风效果减弱）
        const positions = this.dataStreams.geometry.attributes.position.array;
        const radii = this.dataStreams.geometry.userData.radii;
        const angles = this.dataStreams.geometry.userData.angles;
        const heights = this.dataStreams.geometry.userData.heights;
        const rotationSpeeds =
          this.dataStreams.geometry.userData.rotationSpeeds;

        // 旋转速度逐渐减慢
        const tornadoSpeed = 1 - easeProgress * 0.7;

        for (let i = 0; i < positions.length; i += 3) {
          const idx = i / 3;
          // 继续旋转但速度减慢
          angles[idx] += rotationSpeeds[idx] * tornadoSpeed;
          // 向中心收缩
          const targetRadius = radii[idx] * (0.2 + easeProgress * 0.1);
          const angle = angles[idx];

          positions[i] = Math.cos(angle) * targetRadius;
          positions[i + 2] = Math.sin(angle) * targetRadius;
          positions[i + 1] = -2 + heights[idx] * (1 - easeProgress * 0.5);
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
          this.currentModel = targetModel;
          this.currentModel.visible = true;
          // 根据进化等级设置初始缩放（亚古兽为1.0，其他形态从0.3开始放大）
          const initialScale = toLevel === 0 ? 1.0 : 0.3;
          this.currentModel.scale.set(initialScale, initialScale, initialScale);
          // 新模型从当前旋转角度开始（保持旋转连续性）
          this.currentModel.rotation.y = this.currentModel.rotation.y || 0;

          // 设置初始透明度为0（将在phase5中淡入）
          this.currentModel.traverse((child) => {
            if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  if (mat.transparent !== undefined) {
                    mat.transparent = true;
                    mat.opacity = 0;
                  }
                });
              } else {
                child.material.transparent = true;
                child.material.opacity = 0;
              }
            }
          });

          // 重置数据流
          this.resetDataStreams();
          resolve();
        }
      };
      animate();
    });
  }

  // 阶段5: 新形态显现 - 新形态从光中显现
  async phase5_NewFormAppear() {
    return new Promise((resolve) => {
      const duration = 2500; // 2.5秒
      const startTime = Date.now();

      // 根据进化等级确定目标缩放
      const targetScales = [1.0, 1.0, 1.0, 1.0]; // 所有形态最终都缩放到1.0
      const currentScale = this.currentModel.scale.x;
      const targetScale = targetScales[this.evolutionLevel] || 1.0;
      const scaleRange = targetScale - currentScale;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.easeOutCubic(progress);

        // 新形态缩放出现并旋转
        const scale = currentScale + easeProgress * scaleRange;
        this.currentModel.scale.set(scale, scale, scale);
        // 模型继续旋转（从慢到快）
        const rotationSpeed = 0.05 + easeProgress * 0.1;
        this.currentModel.rotation.y += rotationSpeed;

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
    const heights = this.dataStreams.geometry.userData.heights;

    for (let i = 0; i < positions.length; i += 3) {
      const idx = i / 3;
      const heightRatio = Math.random();
      const baseRadius = 4;
      const topRadius = 0.5;
      const radius = baseRadius - (baseRadius - topRadius) * heightRatio;
      const angle = Math.random() * Math.PI * 2;
      const height = -2 + heightRatio * 10;

      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = height;
      positions[i + 2] = Math.sin(angle) * radius;

      angles[idx] = angle;
      heights[idx] = height;
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

    // 重置所有其他模型
    this.greymonModel.visible = false;
    this.greymonModel.scale.set(1, 1, 1);
    this.greymonModel.rotation.y = 0;

    this.metalGreymonModel.visible = false;
    this.metalGreymonModel.scale.set(1, 1, 1);
    this.metalGreymonModel.rotation.y = 0;

    this.wargreymonModel.visible = false;
    this.wargreymonModel.scale.set(1, 1, 1);
    this.wargreymonModel.rotation.y = 0;

    // 重置进化等级
    this.evolutionLevel = 0;

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

    // 恢复所有模型的材质
    const allModels = [
      this.agumonModel,
      this.greymonModel,
      this.metalGreymonModel,
      this.wargreymonModel,
    ];
    allModels.forEach((model) => {
      model.traverse((child) => {
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
