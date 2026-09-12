# 来源、许可与构建对照

## 来源

| 项 | 值 |
|---|---|
| 上游项目 | pi-chrome（[pi-chrome contributors](https://github.com/tianrendong/pi-chrome)） |
| 上游许可 | MIT，见 `LICENSE`（原样保留，未修改） |
| 本仓版本 | 0.15.51 |
| 构建指纹 | `05e9bfde498b`（`checksums.sha256` 的 sha256 前 12 位） |
| 复制方式 | 逐字节复制，未做任何改写；只纳入运行所需的 `extensions/`、`package.json`、`LICENSE` |

## 为什么本仓自带插件

本仓的 0.15.51 与上游 npm 发布通道上的 0.15.51 **同号不同构**。上游发布版的伴生扩展没有
MV3 `offscreen` 保活，Chrome 回收空闲 service worker 后桥接轮询即停止；Chrome 升级会加快 worker
回收，因此升级后集中表现为"扩展已加载但 `/chrome doctor` 连不上"。

| 文件 | 上游发布通道 | 本仓（本机实测可用） |
|---|---|---|
| `extensions/chrome-profile-bridge/browser-extension/manifest.json` | 无 `offscreen` 权限 | 含 `offscreen` 权限 |
| `extensions/chrome-profile-bridge/browser-extension/offscreen.html` | 不存在 | 存在 |
| `extensions/chrome-profile-bridge/browser-extension/offscreen.js` | 不存在 | 存在 |
| `extensions/chrome-profile-bridge/browser-extension/service_worker.js` | 无保活逻辑 | `ensureOffscreen()` + 启动即 `pollLoop()` |
| `extensions/chrome-profile-bridge/index.ts` | 旧构建 | 含 private-network CORS、GET `/result`、重载处理等修复 |

因此本仓不使用、也不建议任何上游官方安装通道；升级路径见下。

## 维护

本仓由 `paper-master-4ss` 的 `scripts/export_pi_chrome_repo.py` 生成，**请勿直接编辑**：

```bash
python3 scripts/export_pi_chrome_repo.py                 # 从本机 pi-chrome 安装重导
python3 scripts/export_pi_chrome_repo.py --check         # 校验本仓与源逐字节一致
python3 scripts/export_pi_chrome_repo.py --zip-out /tmp  # 出伴生扩展 zip
python3 scripts/publish_family.py pi-chrome-mirror       # 推送
```

导出脚本内置两道闸门，任一不过即拒绝导出：

1. **完整性**：`manifest.json` 必须含 `offscreen` 权限；`offscreen.html`、`offscreen.js` 必须存在；
   `service_worker.js` 必须引用 `offscreen.html`；`package.json` 的 `pi.extensions` 入口必须存在。
2. **无官方安装通道**：生成物与 vendored 文本文件中不得出现上游官方安装指令（包管理器形式的 pi-chrome 引用，见脚本 `FORBIDDEN`）。

升级到新构建时：在本机装好并验证可用后，重跑导出（版本号与校验和随之更新），重建 release zip 并推送。
