# pi-chrome 离线镜像（含完整伴生 Chrome 扩展）

[pi-chrome](https://github.com/tianrendong/pi-chrome) 的 **0.15.51 本机可用构建**离线副本，供无法从 npm 安装 pi-chrome 的
机器使用。含 OMP 侧插件（`extensions/chrome-profile-bridge/index.ts`）**与**完整伴生 Chrome 扩展
（`extensions/chrome-profile-bridge/browser-extension/`，manifest v3，带 `offscreen` 保活）。

> 非官方镜像。代码版权归上游，MIT，见 [LICENSE](LICENSE)。
> 上游仓库：<https://github.com/tianrendong/pi-chrome> · npm：<https://www.npmjs.com/package/pi-chrome>

## 为什么需要这个镜像

npm 上 `pi-chrome@0.15.51` 的 tarball 与本机安装的 0.15.51 **不是同一份代码**：

| 文件 | npm tarball | 本镜像（本机可用构建） |
|---|---|---|
| `extensions/chrome-profile-bridge/browser-extension/manifest.json` | 无 `offscreen` 权限 | 含 `offscreen` 权限 |
| `extensions/chrome-profile-bridge/browser-extension/offscreen.html` | **缺失** | 存在 |
| `extensions/chrome-profile-bridge/browser-extension/offscreen.js` | **缺失** | 存在 |
| `extensions/chrome-profile-bridge/browser-extension/service_worker.js` | 无保活逻辑 | `ensureOffscreen()` + 启动即 `pollLoop()` |
| `extensions/chrome-profile-bridge/index.ts` | 旧构建 | 含 private-network CORS、GET `/result`、重载处理等修复 |

缺 `offscreen` 保活时，MV3 service worker 被 Chrome 回收后不再轮询 `127.0.0.1:17318`，
表现为"扩展已加载但 Agent 连不上"。**这是 Chrome 升级后最常见的失效原因**，装本镜像即可。

## 安装（不依赖 npm）

### 1. OMP 侧插件

```bash
git clone https://github.com/JingYangYuan/pi-chrome-mirror.git ~/pi-chrome-mirror
omp install ~/pi-chrome-mirror          # 本地路径安装，不需要 npm 下载
# 或先看计划：omp install ~/pi-chrome-mirror --dry-run
```

装完在 OMP 里 `/reload`，然后：

```text
/chrome authorize
/chrome doctor          # 应显示 ✓ Chrome is connected
```

也可完全手工：把本仓库目录放到 `~/.omp/plugins/node_modules/pi-chrome/`，
并让 `~/.omp/plugins/package.json` 的依赖指向它。

### 2. 伴生 Chrome 扩展（手动加载一次）

最省事：下载本仓库 Releases 里的 `pi-chrome-companion-0.15.51.zip`，解压得到含
`manifest.json` 的目录。然后 Chrome → `chrome://extensions` → 开启**开发者模式** →
**加载已解压的扩展程序** → 选择该目录（或本仓库的 `extensions/chrome-profile-bridge/browser-extension/`）。

扩展名 `Pi Chrome Connector`，加载后工具条应显示已启用；`/chrome doctor` 会报告连接状态。

## 校验

`checksums.sha256` 列出除本说明类文件外每个 vendored 文件的哈希：

```bash
shasum -a 256 -c checksums.sha256
```

本镜像构建指纹：`e9943577c6eb`（源目录 91 个文件，逐字节复制，未做任何改写）。

## 注意

- 本机可用构建会在 `index.ts` 里把桥接请求元数据追加写入 `/tmp/pi-chrome-requests.log`（调试用）。
  镜像保持逐字节一致，未移除该行为；介意可自行删除 `index.ts` 中对应的 `appendFileSync` 调用。
- 伴生扩展权限较宽（`<all_urls>`、`debugger` 等），运行在你真实的 Chrome profile 中；只用于你自己授权的任务。
- 升级时重跑 `python3 scripts/export_pi_chrome_plugin.py` 并重新推送本仓库（见 `MIRROR.md`）。
