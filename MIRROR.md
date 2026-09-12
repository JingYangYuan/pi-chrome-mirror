# 镜像维护说明

本仓库由 `paper-master-4ss` 的 `scripts/export_pi_chrome_plugin.py` 从**本机已安装且已验证可用**的
pi-chrome 目录导出，不是从 npm 拉取。

```bash
python3 scripts/export_pi_chrome_plugin.py                 # 导出/刷新 ../pi-chrome-mirror
python3 scripts/export_pi_chrome_plugin.py --check         # 校验镜像与源逐字节一致
python3 scripts/export_pi_chrome_plugin.py --zip-out /tmp  # 另出伴生扩展 zip
python3 scripts/publish_family.py pi-chrome-mirror         # 推送本仓库
```

## 为什么源是本机目录而不是 npm

2026-09-12 实测：`npm pack pi-chrome@0.15.51` 得到的 tarball 与 OMP 本机安装的 0.15.51
**同一版本号、不同代码**。npm 版缺 `offscreen.html` / `offscreen.js` 与 manifest 的
`offscreen` 权限，MV3 service worker 无保活；Chrome 回收 worker 后桥接轮询停止，
用户侧表现为"扩展加载了但连不上"。本机安装目录是当前实际工作、且已在本会话验证的构建，
故以它为源。

导出脚本内置完整性闸门，源若不满足以下条件会**直接失败**，避免再发出一个"看起来完整但连不上"的包：

- `extensions/chrome-profile-bridge/browser-extension/manifest.json` 含 `offscreen` 权限
- `extensions/chrome-profile-bridge/browser-extension/offscreen.html`、`offscreen.js` 存在
- `service_worker.js` 引用 `offscreen.html`
- `package.json` 的 `pi.extensions` 指向的入口文件存在

## 发布 release（zip 资产）

```bash
python3 scripts/export_pi_chrome_plugin.py --zip-out /tmp
gh release create pi-chrome-0.15.51 /tmp/pi-chrome-companion-0.15.51.zip \
  --repo JingYangYuan/pi-chrome-mirror \
  --title "pi-chrome 0.15.51 (本机可用构建)" \
  --notes "完整伴生 Chrome 扩展，含 offscreen 保活；用于 npm tarball 缺失 offscreen 文件的场景。"
```

## 上游归属

代码与文档版权归 pi-chrome 上游作者，MIT 许可（本仓库保留上游 `LICENSE`）。
本仓库只做逐字节镜像与安装说明，未修改任何 vendored 文件。
