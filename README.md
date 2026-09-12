# pi-chrome 离线发行版（完整插件 + CNKI 适配）

本仓库同时提供两样东西：

1. **可离线安装的 pi-chrome 插件本体** —— `extensions/`、`package.json`、`LICENSE`，逐字节复制自一份
   在 macOS + Chrome 上实测跑通的 0.15.51 安装，含 MV3 `offscreen` 保活的完整伴生 Chrome 扩展。
   `omp install <本仓库>` 即可，不需要任何外部下载通道。
2. **CNKI 知网适配文档与工具** —— [pi-chrome-browser.md](pi-chrome-browser.md)（安装授权、目标模型、能力映射、
   失败恢复、与 ZCode 后端差异）与 [scripts/cnki/cookie_sink.py](scripts/cnki/cookie_sink.py)（Cookie 回环落盘）。

> 为什么自带插件而不是让用户去装上游发布的版本：上游发布通道的 0.15.51 与本机可用构建**同号不同构**，
> 缺 `offscreen.html` / `offscreen.js` 与 manifest 的 `offscreen` 权限，MV3 service worker 被 Chrome 回收后
> 不再轮询 `127.0.0.1:17318`，表现为"扩展已加载但连不上"。事实对照见 [NOTICE.md](NOTICE.md)。
> 本仓库是唯一受支持的分发点。

## 安装

```bash
git clone https://github.com/JingYangYuan/pi-chrome-mirror.git
cd pi-chrome-mirror
omp install .                 # 本地路径安装；先加 --dry-run 看计划
```

装完在 OMP 里 `/reload`，然后：

```text
/chrome authorize             # 默认 15 分钟；长期用 /chrome authorize indefinite
/chrome doctor                # 应显示 ✓ Chrome is connected
/chrome revoke                # 用完撤销
```

伴生 Chrome 扩展（手动加载一次）：`chrome://extensions` → 开启**开发者模式** →
**加载已解压的扩展程序** → 选择本仓库的 `extensions/chrome-profile-bridge/browser-extension/`
（或下载 [Releases](https://github.com/JingYangYuan/pi-chrome-mirror/releases) 里的 `pi-chrome-companion-0.15.51.zip` 解压后选择解压目录）。
扩展名 `Pi Chrome Connector`；`/chrome onboard` 也会显示安装后的扩展目录路径。

### 升级本仓库

```bash
cd pi-chrome-mirror && git pull
omp install .                 # 软链形态下 git pull 即时生效
```

`omp install` 在 macOS 上遇到**同名实目录**会报 `EPERM: operation not permitted, unlink ...`
（内部对目录调 `unlink`，已实测复现）。遇到时先删旧目录再装：

```bash
rm -rf ~/.omp/plugins/node_modules/pi-chrome && omp install .
```

## 每次 CNKI 阶段前的四项验收

| 步骤 | 命令 | 通过标准 |
|---|---|---|
| 1 | `chrome_tab action=list` | 返回标签页列表，不报错 |
| 2 | `chrome_tab action=version` | 返回 `extensionVersion` / `bridgeUrl` / `capabilities` |
| 3 | `chrome_navigate`（**不带 target**）到 `about:blank` | 返回 `Navigated to about:blank` |
| 4 | `chrome_evaluate`（**不带 targetId**）读 `location.href` | 返回 `about:blank` |

任一项失败即记录 `浏览器控制不可用` 并停止 CNKI 阶段；先 `/chrome doctor`，再确认伴生扩展已加载。

## 三条硬约束（2026-09-12 实测，本仓 0.15.51）

1. **不要传 `targetId`**：`chrome_evaluate` / `chrome_snapshot` / `chrome_click` 传 `targetId` 会返回
   `Runtime.evaluate: Detached while handling command`。全流程只走 `chrome_navigate` 建立的单一自动化目标。
2. **页内异步不得 `awaitPromise`**：await 慢 fetch 会中断调用。写成立即返回的 fire-and-forget 挂到
   `window.__x`，再用 `chrome_wait_for { kind: "expression", value: "window.__x !== null" }` 轮询。
3. **点击与读取一律用 `chrome_evaluate`**：kns8s 这类重页面上 `chrome_snapshot` 会
   `inject snapshot script ... timed out after 8000ms`，`chrome_click` 会 `DOM click fallback ... timed out`。
   默认 `hardBackground: true` 下 `chrome_tab activate` 被拒属预期，由用户切到 `Pi Session:` 分组标签
   完成登录/验证码。

完整失败模式表与恢复步骤见 [pi-chrome-browser.md](pi-chrome-browser.md) §7。

## Cookie：走回环 sink，不进对话

页面不能写文件，而把 `document.cookie` 打印进对话等于把会话凭证写进日志与模型上下文。

```bash
python3 scripts/cnki/cookie_sink.py --out /tmp/cnki_cookie.txt --port 17399 --timeout 240
```

```js
// 页面侧（chrome_evaluate）：立即返回，不 await
fetch('http://127.0.0.1:17399/c', { method: 'POST', body: document.cookie })
  .then(r => r.status)
```

```bash
rm -f /tmp/cnki_cookie.txt     # 下载器用完立即删除
```

## 文件

| 路径 | 内容 |
|---|---|
| `extensions/chrome-profile-bridge/` | OMP 侧插件（桥接服务，监听 `127.0.0.1:17318`） |
| `extensions/chrome-profile-bridge/browser-extension/` | 伴生 Chrome 扩展（manifest v3，5 文件，含 `offscreen` 保活） |
| `package.json` | 插件元数据（`pi.extensions` 入口、版本） |
| [pi-chrome-browser.md](pi-chrome-browser.md) | CNKI 适配协议：安装授权、目标模型、能力映射、失败模式表、Cookie 导出、与 ZCode 后端差异、实测记录 |
| [scripts/cnki/cookie_sink.py](scripts/cnki/cookie_sink.py) | Cookie 回环 sink（超时 rc=2，非法载荷 rc=3，0600 落盘） |
| [checksums.sha256](checksums.sha256) | 上述插件的逐字节校验清单 |
| [NOTICE.md](NOTICE.md) | 来源、许可、构建对照与维护说明 |

## 校验

```bash
shasum -a 256 -c checksums.sha256
```

## 来源与许可

- 插件代码来自 [pi-chrome contributors](https://github.com/tianrendong/pi-chrome)，MIT 许可（`LICENSE` 原样保留）。
  本仓库**未修改**任何插件文件；只做分发与文档。
- CNKI 适配文档与 `cookie_sink.py` 属于 [https://github.com/JingYangYuan/paper-master-4ss](https://github.com/JingYangYuan/paper-master-4ss) / [https://github.com/JingYangYuan/paper-lit-4ss](https://github.com/JingYangYuan/paper-lit-4ss) 的文献模块，
  由 `scripts/export_pi_chrome_repo.py` 同步导出，请勿直接编辑本仓库。
- 本仓不含上游的 `docs/`、`test-suite/` 与上游 README：它们不影响插件的安装与运行。
