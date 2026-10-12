# AI 维护与开发规范

本文档用于约束后续使用 AI 对本项目进行维护、修复和发布时的工作方式。目标是减少误改、误发、误升级，并让每次改动都能被人类维护者快速复核。

## 基本原则

- 先读代码，再改代码。不要仅凭报错或记忆推断项目结构。
- 保持改动范围小。只修改与当前任务直接相关的文件。
- 尊重已有代码和已完成改动，不回滚非本次任务产生的变更。
- 不主动升级版本号、依赖大版本或构建链，除非任务明确要求。
- 修改运行行为时，同步检查打包后的行为，不只验证开发模式。
- 涉及安全、发布、数据迁移、删除文件、重写 tag 等高风险操作时，要在执行前说明影响。

## 项目结构要点

- `app.js` 是 Electron 主进程入口。
- `source/`、`static/`、`views/` 是应用资源目录，打包后位于安装目录或 `app.asar` 中。
- 默认用户数据目录是 `~/.antsword/antData`，用于保存数据库、缓存、插件、自定义编码器等运行数据。
- 程序资源目录和用户数据目录必须分离。不要把运行数据写入 `.app`、`Resources/app.asar` 或源码资源目录。
- `modules/config.js` 负责后端配置和数据目录初始化。
- `package-lock.json` 是 CI 安装依赖的权威来源，不能随意删除或重生成。

## 数据目录规范

- 程序资源读取应使用 `AS_WORKDIR`，保持指向应用自身目录。
- 用户数据写入应使用 `AS_DATA_PATH`，默认指向 `~/.antsword/antData`。
- 新增数据库、缓存、下载临时文件、插件数据、自定义编码器、密钥等写入路径时，优先使用 `AS_DATA_PATH`。
- 新增目录创建逻辑时应使用 `fs.mkdirSync(path, { recursive: true })` 或等价安全方式，避免首次启动因父目录不存在失败。
- macOS 打包后不能向 `app.asar` 内写入文件，否则会触发 `EROFS: read-only file system`。

## 依赖与安装规范

- CI 使用 `npm ci`，因此 `package-lock.json` 必须保持可用。
- 不要把 lockfile 中的 tarball 地址指向过期或不稳定镜像源，例如旧的 `registry.npm.taobao.org`。
- lockfile 中 `resolved` 地址应优先使用 `https://registry.npmjs.org/...`。
- 本地为验证下载可临时使用镜像环境变量，但不要把个人镜像配置写入项目，除非维护者明确要求。
- 如果运行 `npm ci --ignore-scripts`，要注意 Electron 的 postinstall 不会下载真实可执行文件。本地启动前需要执行 `npm rebuild electron` 或重新安装依赖。
- deprecated warning 不等同于构建失败。只有明确的 error、安装失败、测试失败或安全要求才应触发依赖改动。

## 开发与验证规范

常用检查命令：

```bash
node --check app.js
node --check modules/config.js
node --check source/app.entry.js
npm ci --ignore-scripts
```

启动本地 Electron：

```bash
npm start
```

如果 AI 执行环境设置了 `ELECTRON_RUN_AS_NODE=1`，本地启动 Electron 会表现异常。验证真实 Electron 启动时可使用：

```bash
env -u ELECTRON_RUN_AS_NODE npm start
```

验证重点：

- 开发模式能启动，不停留在 loading/splash 页面。
- 打包后不会向只读安装目录写入运行数据。
- 首次启动时默认数据目录可自动创建。
- 自定义编码器、插件目录、缓存目录仍在用户数据目录下。
- 修改 GitHub Actions 或发布配置后，应确认 workflow 可以被预期事件触发。

## Git 工作流规范

- 提交前运行 `git status --short --branch`，确认只包含本任务相关文件。
- 提交信息使用简短英文祈使句，例如：
  - `Fix packaged app data directory`
  - `Use npm registry tarballs in lockfile`
  - `Document default data directory`
- 不要提交本地构建产物、release 包、日志、临时文件或个人配置。
- 不要使用 `git reset --hard`、`git checkout -- <file>` 等会丢弃他人改动的命令，除非维护者明确要求。
- 如果工作区已有无关改动，应保留并绕开，不要顺手整理。

## GitHub 与发布规范

当前发布工作流位于 `.github/workflows/release.yml`：

- 推送匹配 `v*` 的 tag 会触发 release 构建。
- 也可以通过 `workflow_dispatch` 手动触发。
- 构建矩阵包含 macOS、Windows、Linux 的 x64 与 arm64。
- 工作流使用 Node.js 22 和 `npm ci`。
- `electron-builder` 通过 `GH_TOKEN` 发布资产。

发布规则：

- 未经明确要求，不修改 `package.json` 中的版本号。
- 如果需要在相同应用版本下重复发布维护构建，使用递增维护 tag，例如：
  - `v2.1.16-maint.1`
  - `v2.1.16-maint.2`
  - `v2.1.16-maint.3`
- 不要强制移动已发布 tag，除非维护者明确选择这种方式并理解影响。
- 发布前确认当前提交已推送到目标远端分支。
- 发布后用 `gh run list` 或 GitHub Actions 页面确认 workflow 状态。
- 如果某次 tag 构建失败，优先修复根因并推送新的递增 tag，不要覆盖旧 tag。

常用命令：

```bash
git status --short --branch
git log --oneline --decorate -6
git tag --list "v2.1.16-maint*"
git push origin master
git tag -a v2.1.16-maint.N -m "Release v2.1.16-maint.N"
git push origin v2.1.16-maint.N
gh run list --workflow "Build release" --limit 5
```

## GitHub Actions 修改规范

- 修改 `.github/workflows/release.yml` 前，先说明变更目的。
- 不要降低权限边界，除非发布确实需要。当前 `contents: write` 用于创建或更新 release 资产。
- 不要把密钥、token、私有 registry 凭据写入仓库。
- 优先使用官方 action 的稳定主版本，例如 `actions/checkout@v4`、`actions/setup-node@v4`。
- CI 安装命令应保持可复现，优先使用 `npm ci`，不要随意改为 `npm install`。
- 修改构建矩阵时，要说明会影响哪些平台和架构的 release 产物。

## README 与文档规范

- 面向用户的运行、安装、数据目录说明应同步更新 `README.md` 和 `README_EN.md`。
- 如果代码行为变更但 README 没变，要主动提示是否需要补文档。
- 文档应描述当前事实，不记录临时调试过程。
- 中文 README 使用中文说明，英文 README 使用英文说明。

## AI 输出规范

- 最终回复应说明改了哪些文件、验证了什么、是否已提交或发布。
- 如果命令输出对用户判断重要，要总结关键行，例如 commit hash、tag、Actions URL。
- 如果某一步未执行或失败，要明确说明原因和剩余风险。
- 不要把大段无关 diff、日志或依赖 warning 原样贴给用户。

## 高风险检查清单

执行以下操作前必须特别谨慎：

- 修改默认数据目录、迁移旧数据、删除用户数据。
- 改动 `package-lock.json`、Electron 版本、electron-builder 配置。
- 发布 release、创建 tag、删除或移动 tag。
- 修改 GitHub Actions 权限、secret 使用、发布目标仓库。
- 修改安全相关逻辑，例如 XSS 过滤、终端输出、外链打开、webSecurity 配置。
- 改动跨平台路径逻辑，尤其是 macOS `.app`、Windows 安装目录、Linux AppImage。

## 已知历史坑位

- macOS 打包后 `app.asar` 是只读的，不能在其中创建 `antData`。
- 如果把 `AS_WORKDIR` 改成用户目录，渲染端会找不到 `source/core` 等资源，导致卡在 loading 页面。
- 旧淘宝 npm registry 证书可能过期，lockfile 中残留的 `registry.npm.taobao.org` 会导致 CI `npm ci` 失败。
- AI 执行环境可能设置 `ELECTRON_RUN_AS_NODE=1`，导致 Electron 被当成 Node 运行，出现 `app` 或 `ipcMain` 为空的假象。
