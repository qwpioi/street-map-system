# 本地开发环境指南

> 目标：小程序 + 后端 + MySQL **全部跑在本地**，开发调优后再部署服务器。
> 本机环境实测：MySQL 8.4.9（root/123456）、Java 21、Maven 3.9.16、本机 IP **192.168.1.5**。

## 数据流

```
微信小程序(WechatCode/) ──http://192.168.1.5:8081/api──▶ 本地后端(sprin boot, 端口8081) ──jdbc:mysql://localhost:3306/street_map──▶ 本地MySQL
```

---

## 一、首次准备（一次性）

### 1. 启动 MySQL

本机 MySQL 已安装为 Windows 服务（当前可能为停止状态）。以**管理员身份**打开 PowerShell 或 CMD：

```bat
net start MySQL
```

验证连接：

```bat
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" --host=127.0.0.1 --user=root --password=123456 -e "SHOW DATABASES;"
```

> 应能看到 `street_map` 库（本机已有数据：21 用户 / 19 摊位 / 24 商品 / 10 评价）。
> 若连不上，检查 Windows 服务「MySQL」是否启动、密码是否为 `123456`。

### 2. 构建后端（首次会下载依赖，需外网，较慢）

用 **VS Code** 打开后端目录 `D:\Code\project\street-map-system`：

1. VS Code 打开后，Java 扩展会自动开始编译项目并下载依赖（右下角有进度提示，首次需要几分钟）
2. 等待左下角状态栏出现 ✅ 完成标记 / 输出面板显示 BUILD 完成

> 依赖下载到 `C:\Users\EDY\.m2\repository`（已配置阿里云镜像，首次联网约几分钟）。
> 本机已装全套 Java 扩展（redhat.java / Spring Boot / Maven），无需额外配置。

### 3. 启动后端

- **方式 A（推荐）**：打开 `src/main/java/com/streetmap/backend/StreetMapBackendApplication.java`，点击 main 方法上方的 **Run ▶ / Debug** 按钮（或按 `F5` 调试启动）
- 方式 B（终端）：VS Code 内按 `` Ctrl+` `` 打开终端，项目根目录执行 `mvn spring-boot:run`
- 方式 C（Maven 面板）：右键 Explorer 中的 `pom.xml` → Maven → 执行 `spring-boot:run`

验证后端已启动：浏览器访问

```
http://localhost:8081/api/vendor/open
```

应返回 JSON 摊位列表。后端日志出现 `Started StreetMapBackendApplication` 即成功。

### 4. 导入微信小程序

1. 微信开发者工具 → 导入项目 → 选择 `WechatCode` 目录（AppID 填 `wx6fb55954dff3e5e7` 或测试号）
2. **关键**：右上角「详情」→「本地设置」→ 勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**
3. 编译运行，首页应能拉到本机后端数据

---

## 二、日常启动流程（每天）

```mermaid
1. 启动 MySQL 服务（net start MySQL，管理员）
2. VS Code 运行后端（Run StreetMapBackendApplication 或 mvn spring-boot:run）
3. 微信开发者工具编译小程序
```

---

## 三、真机预览（手机调试）

- 手机与电脑连**同一 WiFi**
- 前端 API 已配置为局域网 IP `192.168.1.5`，真机可直接访问
- 若本机 IP 变化：`ipconfig` 查看当前 IPv4，替换以下 3 处：

| 文件 | 位置 |
|------|------|
| `WechatCode/utils/api.js` | `API_BASE_URL` |
| `WechatCode/pages/login/login.js` | `API_BASE_URL` |
| `src/main/resources/application.yml` | `upload.image-base-url` |

---

## 四、图片上传

- 本地图片存于 `D:/Code/project/street-map-system/uploads/images/`（已创建，已被 .gitignore 排除）
- 访问地址：`http://192.168.1.5:8081/images/xxx.jpg`

---

## 五、上线回切（本地开发完 → 部署服务器）

| 项 | 本地值 | 上线值 |
|----|--------|--------|
| `WechatCode/utils/api.js` | `http://192.168.1.5:8081/api` | `http://47.94.23.66/api` |
| `WechatCode/pages/login/login.js` | 同上 | 同上 |
| 后端生产配置 | （本地 application.yml 不参与生产） | 服务器 `/opt/street-map/application-prod.yml` |

> 本地 `application.yml` 只影响本地；生产配置在服务器上独立存在，互不干扰。
> 部署步骤见 `docs/deploy-guide.md`。

---

## 六、注意事项

1. 微信开发者工具不勾选「不校验合法域名」将无法请求 `http://192.168.1.5:8081`
2. 首次 Maven 构建需联网下载依赖，之后离线可用缓存
3. 后端日志在 VS Code 终端/调试控制台；SQL 日志已开启（MyBatis-Plus StdOutImpl），排查方便
4. 小程序正式发布仍需 HTTPS + 合法域名（上线阶段问题，开发阶段不受影响）