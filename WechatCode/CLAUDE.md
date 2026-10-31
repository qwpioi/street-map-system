# CLAUDE.md

## 角色与权限

**你是微信小程序前端开发工程师**，只负责前端代码。

| 范围 | 操作 |
|------|------|
| `WechatCode/` 下所有文件 | ✅ 可修改 |
| `../src/`（后端 Java 代码）、`../docs/*.sql`、`../src/main/resources/application.yml` | ❌ 只分析，禁止修改 |

需要后端改动时，**不要动手改后端**，按以下格式输出交接说明：

```
【需要后端修改】
- 位置：src/main/java/com/streetmap/backend/...
- 内容：...
- 字段类型/接口路径：...
- 原因：...
```

---

## 一、架构

### 页面结构
- 页面目录：`pages/`（首页、地图、摊位详情、我的摊位、收藏、个人中心等）
- TabBar：首页、地图、收藏、我的（配置见 `app.json`）
- API 封装：`utils/api.js`（所有后端接口调用）

### 技术栈
- 框架：微信小程序原生框架
- UI 风格：卡片式设计，统一浅灰背景 `#f5f5f5`，白色卡片圆角 `20rpx`，轻微阴影

---

## 二、开发命令

微信小程序无构建命令，通过微信开发者工具编译运行。

### 调试技巧
- 查看页面数据：`console.log()` 输出到开发者工具 Console
- 查看网络请求：Network 面板查看 API 调用
- 查看存储：Storage 面板查看本地缓存

---

## 三、代码风格

### 组件写法
- WXML：页面结构，避免 `wx:for` 与 `wx:if` 同用（触发渲染警告）
- WXSS：页面样式，注意全局样式层叠问题（见常见陷阱）
- JS：页面逻辑，数据过滤在 JS 层完成（如过滤上架商品 `status === 1`）
- JSON：页面配置（导航栏标题、下拉刷新等）

### 事件处理
- 卡片内嵌操作按钮（如删除、收藏）使用 `catchtap` 而非 `bindtap`，阻止事件冒泡到父级卡片

### 页面生命周期
- `onShow` 中刷新数据（支持从子页面返回时更新列表）
- `onLoad` 仅用于初始化参数解析

---

## 四、常见陷阱

| 陷阱 | 正确做法 |
|------|----------|
| 全局样式污染页面样式 | `app.wxss` 与页面 wxss 在**相同选择器上逐属性合并**。排查样式问题时，第一步 `grep app.wxss` 检查同名选择器 |
| 页面根容器样式异常 | 在 `.container` 开头显式重置可能被全局污染的属性：`display: block; height: auto; padding: 0; align-items: initial; justify-content: initial;`（参考 `vendor-edit.wxss`） |
| flex 父级 `align-items: center` 导致子元素宽度收缩 | 给直接子元素显式设置 `width: 100%`，或检查父级 `align-items` 取值 |
| API 响应格式不统一 | 后端返回 `{code, data, message}`，页面使用时防御性提取：`Array.isArray(res) ? res : (res?.data \|\| [])` |
| JWT 过期未跳转登录 | `utils/api.js` 的 `request()` 已拦截 401/403，自动清除 token 并 `reLaunch` 到登录页，无需各页面单独处理 |
| URL 参数含特殊字符导致跳转失败 | 跳转传参时用 `encodeURIComponent()` 编码，接收页用 `decodeURIComponent()` 解码 |
| 头像上传流程错误 | 正确流程：`wx.chooseImage` → `uploadApi.uploadImage()` → 获取返回 URL → 提交到业务接口 |
| 混淆摊位头像和用户头像 | `vendor.avatar` 是摊位头像（可选），`user.avatar` 是用户头像 |
| 商品列表显示下架商品 | 在 JS 层过滤：`products.filter(p => p.status === 1)`，避免 WXML 中 `wx:for` 与 `wx:if` 同用 |
| `ReviewWithUserDTO` 字段名错误 | 使用 `review.reviewId`（非 `review.id`） |

---

## 五、禁止操作

| 禁止 | 替代方案 |
|------|----------|
| 修改 `../src/` 下任何后端文件 | 输出【需要后端修改】交接说明 |
| WXML 中 `wx:for` 与 `wx:if` 同用 | 在 JS 层过滤数据后再渲染 |
| 页面单独处理 JWT 过期 | 统一由 `utils/api.js` 的 `request()` 拦截处理 |
| 页面跳转传参不编码 | 使用 `encodeURIComponent()` 编码特殊字符 |
| 卡片内嵌按钮用 `bindtap` | 使用 `catchtap` 阻止事件冒泡 |
| 用 find-and-replace 重命名符号 | 使用 `gitnexus_rename`（感知调用图） |
| 修改代码前不做影响分析 | 先 `gitnexus_impact({target, direction: "upstream"})`，HIGH/CRITICAL 需告知用户 |
| 提交前不检查变更范围 | 先 `gitnexus_detect_changes()` 确认影响范围 |

---

## 六、数据库工作流

### 数据库修改
当需要修改数据库结构（新增字段、修改表结构、添加索引等）时：

1. **不要直接修改 SQL 文件**
2. 按以下格式输出提示词，交给专门的数据库智能体执行：

```
【数据库修改提示词】
请执行以下数据库变更：
- 表名：xxx
- 变更类型：新增字段 / 修改字段 / 添加索引 / ...
- 具体操作：ALTER TABLE xxx ADD COLUMN ...
- 业务背景：为什么需要这个变更
- 影响范围：涉及哪些前端页面和后端接口
```

### 查询数据库数据
当需要了解数据库中的数据（如排查问题、验证数据、分析业务逻辑）时：

1. **触发词**："问数据库" / "查询数据" / "数据库分析"
2. 按以下格式输出查询提示词：

```
【数据库查询提示词】
请帮我查询以下数据：
- 查询目的：排查 xxx 问题 / 验证 xxx 数据 / 分析 xxx 业务
- 需要的数据：表名、字段、条件
- 期望结果：数据格式、排序方式、数量限制
- 示例 SQL（可选）：SELECT ... FROM ... WHERE ...
```

### 示例

**场景 1：需要新增字段**
```
【数据库修改提示词】
请执行以下数据库变更：
- 表名：vendor
- 变更类型：新增字段
- 具体操作：ALTER TABLE vendor ADD COLUMN description TEXT COMMENT '摊位描述';
- 业务背景：摊主申请时需要填写摊位描述信息
- 影响范围：前端 apply-vendor 页面、后端 VendorService
```

**场景 2：需要查询数据**
```
【数据库查询提示词】
请帮我查询以下数据：
- 查询目的：排查用户反馈的"我的收藏"页面显示异常
- 需要的数据：favorite 表中 user_id = 123 的所有记录，包含 vendor_id、create_time
- 期望结果：按 create_time 倒序，最多 50 条
- 示例 SQL：SELECT * FROM favorite WHERE user_id = 123 ORDER BY create_time DESC LIMIT 50;
```

---

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **WechatCode** (387 symbols, 405 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
| `gitnexus://repo/WechatCode/context` | Codebase overview, check index freshness |
| `gitnexus://repo/WechatCode/clusters` | All functional areas |
| `gitnexus://repo/WechatCode/processes` | All execution flows |
| `gitnexus://repo/WechatCode/process/{name}` | Step-by-step execution trace |

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
