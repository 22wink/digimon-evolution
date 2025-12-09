# 数码宝贝进化动画

使用 Three.js 实现的亚古兽进化成战斗暴龙兽的3D动画效果。

## 功能特点

- 🎬 完整的进化动画流程（6个阶段）
- ✨ 数据流和粒子特效
- 🌟 平滑的模型切换过渡
- 🎨 后处理光晕效果
- 🔄 重置功能

## 本地运行

### 方法1: 使用 Python

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

然后在浏览器中打开：`http://localhost:8000`

### 方法2: 使用 Node.js

```bash
npx http-server -p 8000
```

### 方法3: 使用 VS Code Live Server

安装 "Live Server" 扩展，然后右键点击 `index.html` 选择 "Open with Live Server"

## 部署到 GitHub Pages

### 步骤1: 启用 GitHub Pages

1. 在 GitHub 仓库中，点击 **Settings**（设置）
2. 在左侧菜单中找到 **Pages**（页面）
3. 在 **Source**（源）部分，选择：
   - **Source**: `Deploy from a branch`
   - **Branch**: `gh-pages` 或 `main`（根据你的设置）
   - **Folder**: `/ (root)`
4. 点击 **Save**（保存）

### 步骤2: 推送代码

将代码推送到 GitHub 仓库后，GitHub Actions 会自动部署：

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 步骤3: 查看部署状态

1. 在仓库页面，点击 **Actions**（操作）标签
2. 查看工作流运行状态
3. 部署完成后，在 **Settings > Pages** 中可以看到你的网站 URL

## 进化动画流程

1. **能量聚集阶段**（2.5秒）：亚古兽开始发光，周围能量聚集
2. **数据流启动阶段**（3秒）：螺旋上升的数据流粒子系统
3. **能量爆发阶段**（2秒）：强烈的光效闪烁，模拟中间形态
4. **形态转换阶段**（1.5秒）：数据重组，模型切换
5. **新形态显现阶段**（2.5秒）：战斗暴龙兽从光中显现
6. **最终展示阶段**（2秒）：战斗暴龙兽完全展现并旋转展示

## 文件说明

- `index.html` - 主页面结构
- `main.js` - Three.js 核心逻辑和进化动画
- `style.css` - 界面样式
- `public/亚古兽.glb` - 亚古兽3D模型
- `public/战斗暴龙兽.glb` - 战斗暴龙兽3D模型
- `.github/workflows/deploy.yml` - GitHub Actions 部署配置

## 技术栈

- Three.js - 3D图形库
- GLTFLoader - 3D模型加载器
- EffectComposer - 后处理效果
- UnrealBloomPass - 光晕效果

## 注意事项

- 确保 `.glb` 文件路径正确
- 建议使用现代浏览器（Chrome、Firefox、Edge）
- 如果模型加载失败，请检查浏览器控制台的错误信息
- GitHub Pages 部署可能需要几分钟时间

## 许可证

MIT License

