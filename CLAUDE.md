# CLAUDE.md

## 角色与权限

**你是 Spring Boot 后端开发工程师**，只负责后端代码。

| 范围 | 操作 |
|------|------|
| `src/main/java/com/streetmap/backend/`、`docs/*.sql`、`src/main/resources/`、`pom.xml` | ✅ 可修改 |
| `WechatCode/`（前端小程序） | ❌ 只分析，禁止修改 |
| **生产/服务器数据库** | ❌ 禁止直接操作，只输出 SQL 提示词 |

### 前端交接格式

需要前端改动时，**不要动手改前端**，按以下格式输出交接说明：

```
【需要前端修改】
- 位置：WechatCode/pages/xxx/xxx.wxml
- 内容：...
- 数据来源：后端 XxxDTO.field（已添加/待添加）
- 原因：...
```

### 数据库操作交接格式

需要修改数据库时（增删改数据、添加测试数据、数据迁移等），**不要直接操作数据库**，只输出 SQL 提示词/脚本，由用户交给专门的数据库智能体执行：

```
【需要执行数据库操作】
- 目标库：street_map（生产环境 / 本地环境）
- 操作类型：INSERT / UPDATE / DELETE / ALTER TABLE / 数据迁移
- 执行 SQL：
  ```sql
  -- 完整可执行的 SQL 脚本
  ```
- 验证 SQL：
  ```sql
  -- 执行后验证数据是否正确的查询
  ```
- 回滚 SQL（可选）：
  ```sql
  -- 出问题时回滚的 SQL
  ```
- 注意事项：...
```

### 数据库查询请求格式

当需要从数据库获取数据来辅助开发决策时，输出查询提示词：

```
【需要查询数据库】
- 目的：说明为什么要查这个数据
- 查询 SQL：
  ```sql
  -- 需要执行的查询
  ```
```

---

## 一、架构

### 核心业务模型
- **用户与摊主一对一**：`vendor.user_id` → `user.id`，用户可申请成为摊主
- **手机号归属**：`phone` 存在 `user` 表，`vendor` 表不含 phone；VendorMapper 通过 `LEFT JOIN user` 取 phone
- **双头像独立**：`user.avatar`（用户头像）与 `vendor.avatar`（摊位头像）是两个字段，申请摊主时不强制上传摊位头像
- **坐标体系**：WGS84（纬度 latitude / 经度 longitude）
- **状态字段**：`vendor.status`（1=营业中，0=已收摊）；`product.status`（1=上架，0=下架）
- **逻辑删除**：全局配置 `deleted` 字段（1=删除，0=正常），`create_time`/`update_time` 由 `MyMetaObjectHandler` 自动填充

### 数据库
- 库名：`street_map`
- 表结构：`docs/database.sql`；完整导出：`docs/database_full.sql`
- 迁移脚本：`docs/migration_*.sql`（新增字段必须同步写迁移脚本）
- 核心表：`user`、`vendor`、`product`、`favorite`、`review`

### API 约定
- 统一前缀 `/api/`，统一返回 `Result<T>`（`Result.success(data)` / `Result.error(message)`）
- 认证：`Authorization: Bearer <token>`；公开接口需在 `SecurityConfig` 的 `permitAll` 白名单显式注册
- 接口分组：`/api/auth`、`/api/user`、`/api/vendor`、`/api/product`、`/api/review`、`/api/favorite`、`/api/upload`
- 前端 API 封装：`WechatCode/utils/api.js`（查看接口定义和调用方式）

---

## 二、开发命令

```bash
mvn clean install              # 构建
mvn spring-boot:run            # 启动（端口 8081）
mvn test                       # 全量测试
mvn test -Dtest=XxxTest        # 单测类
mvn package                    # 打包
```

### 数据库工作流（禁止直接操作数据库）

**核心原则**：本智能体不直接操作生产/服务器数据库，所有数据库操作均通过输出提示词，由用户交给专门的数据库智能体执行。

#### 场景一：需要修改数据库
触发条件：需要 INSERT / UPDATE / DELETE 数据、添加测试数据、数据迁移等
→ 按上方【需要执行数据库操作】格式输出完整 SQL 脚本（含执行、验证、回滚）→ 用户粘贴给数据库智能体执行 → 拿回执行结果

#### 场景二：需要从数据库获取数据
触发条件：需要了解现有数据分布、排查数据问题、做业务决策等
→ 按上方【需要查询数据库】格式输出查询 SQL → 用户粘贴给数据库智能体执行 → 拿回结果做后续开发

#### 场景三："问数据库"
触发词："问数据库" / "数据库分析" / "DB review"
→ 当前 Claude 根据用户问题生成完整的分析提示词（含查询 SQL + 分析目标）→ 用户粘贴给专门的数据库分析实例 → 拿回结果做业务决策

---

## 三、代码风格

### 分层规范
遵循 `controller → service(impl) → mapper → entity` 标准三层，DTO 用于请求/响应封装，禁止 Entity 直接暴露给前端。

### VendorMapper 自定义 SQL 规则
`VendorMapper` 有 3 个 `@Select` 自定义查询（`findOpenVendors`、`findByUserId`、`findNearbyVendors`），均通过 `LEFT JOIN user` 取 `u.phone`。**新增 vendor 字段时，必须同步更新这 3 条 SQL 的 SELECT 列表**，否则返回数据缺字段。

### 手机号同步
编辑摊位信息（`VendorServiceImpl.updateVendorInfo()`）时，需同步更新 `user.phone`，不能只改 vendor 表。

### DTO 命名
- `ReviewWithUserDTO` 使用 `reviewId`（非 `id`），前端 map 时注意

---

## 四、常见陷阱

| 陷阱 | 正确做法 |
|------|----------|
| 新增 vendor 字段后查询缺数据 | 同步更新 `VendorMapper` 3 条 `@Select` 的 SELECT 列表 |
| 改 `vendor.phone` 不生效 | phone 在 `user` 表，需通过 `updateVendorInfo()` 同步 |
| 混淆两个 avatar | `user.avatar` 用户头像，`vendor.avatar` 摊位头像 |
| 新接口 401 | 检查 `SecurityConfig` 白名单是否已加 `permitAll` |
| 新增字段未同步到生产 | 写 `docs/migration_*.sql`，生产库手动执行 |
| `ReviewWithUserDTO.id` 取不到 | 应取 `reviewId` |

---

## 五、禁止操作

| 禁止 | 替代方案 |
|------|----------|
| 修改 `WechatCode/` 下任何文件 | 输出【需要前端修改】交接说明 |
| 直接提交含密钥的 `application.yml` | 敏感值走环境变量：`JWT_SECRET`、`WECHAT_APP_SECRET` |
| 用 find-and-replace 重命名符号 | 使用 `gitnexus_rename`（感知调用图） |
| 修改代码前不做影响分析 | 先 `gitnexus_impact({target, direction: "upstream"})`，HIGH/CRITICAL 需告知用户 |
| 提交前不检查变更范围 | 先 `gitnexus_detect_changes()` 确认影响范围 |
| 新增表字段不写迁移脚本 | 在 `docs/` 下新增 `migration_xxx.sql` |
| 绕过 `Result<T>` 直接返回裸数据 | 所有接口统一 `Result.success()` / `Result.error()` |

---

## 六、后端代码部署流程

**触发条件**：每次修改后端代码文件（`src/`、`pom.xml`、`src/main/resources/` 等）后，必须询问用户：

> 后端代码已修改，是否需要更新部署到服务器？

**操作流程**：
1. 用户回答"不需要" → 跳过，继续后续工作
2. 用户回答"需要" → 读取部署教程文档：`D:\BaiduSyncdisk\进行中\01-地摊地图系统\微信小程序\98-待整理\上线\后端代码更新详细教程.md`
3. 严格按照文档中的步骤执行部署操作

**注意**：不要自行假设部署步骤，必须以文档内容为准。

---

## 环境配置

- 配置文件：`src/main/resources/application.yml`（模板：`application.yml.template`）
- 必填环境变量：`JWT_SECRET`（≥32字符）、`WECHAT_APP_SECRET`
- 文件上传：最大 5MB，存储路径由 `upload.path` 配置，访问前缀 `upload.image-base-url`
- 本地启动脚本：`start-backend.bat`
- 生产部署：阿里云 ECS（47.94.23.66），JAR `/opt/street-map-backend.jar`，配置 `/opt/street-map/application-prod.yml`，JVM `-Xmx384m -Xms128m`

---

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **street-map-system** (1295 symbols, 2421 relationships, 98 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/street-map-system/context` | Codebase overview, check index freshness |
| `gitnexus://repo/street-map-system/clusters` | All functional areas |
| `gitnexus://repo/street-map-system/processes` | All execution flows |
| `gitnexus://repo/street-map-system/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
