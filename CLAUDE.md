# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
这是**地摊地图系统**的后端服务，为微信小程序提供API支持。用户可以查看附近摊位、收藏摊位、评价摊位；摊主可以管理摊位信息、更新营业状态、发布商品。

## 技术栈
- 框架：Spring Boot 3.5.13
- Java版本：21
- 构建工具：Maven
- ORM框架：MyBatis-Plus 3.5.5
- 安全框架：Spring Security + JWT
- 数据库：MySQL 8.0+
- 工具库：Hutool 5.8.23

## 常用命令
```bash
# 项目构建
mvn clean install

# 启动项目
mvn spring-boot:run

# 运行测试
mvn test

# 运行单个测试类
mvn test -Dtest=StreetMapBackendApplicationTests

# 打包
mvn package
```

## 代码架构
采用标准的Spring Boot三层架构：
```
com.streetmap.backend/
├── common/          # 公共组件（返回结果封装、异常处理等）
├── config/          # 配置类（Security配置、Web配置等）
├── controller/      # 控制器层（API接口定义）
├── dto/             # 数据传输对象（请求/响应封装）
├── entity/          # 实体类（与数据库表对应）
├── filter/          # 过滤器（JWT认证过滤器）
├── mapper/          # 数据访问层（MyBatis-Plus Mapper接口）
├── service/         # 业务逻辑层
│   └── impl/        # 业务实现类
└── util/            # 工具类（JWT工具、微信工具等）
```

### 核心模块
1. **用户模块**：微信登录、用户信息管理
2. **摊主模块**：摊位申请、信息管理、营业状态更新、位置上报、摊位头像
3. **商品模块**：商品增删改查、上下架管理
4. **收藏模块**：用户收藏/取消收藏摊位、收藏列表查询
5. **评价模块**：用户评分评价、评价列表查询
6. **地图模块**：附近摊位查询、摊位位置检索

### 关键 DTO
- `VendorDTO`：摊位响应，含 `avatar`（摊位头像）、`phone`（来自user表JOIN）、评价/商品数据
- `UpdateVendorInfoDTO`：编辑摊位信息请求，`stallName`/`phone`/`avatar` 三个可选字段
- `ApplyVendorDTO`：申请摊位请求，含 `stallName`/`phone`/`description`/`latitude`/`longitude`/`address`

## 重要配置说明
### 配置文件
- 实际配置文件：`src/main/resources/application.yml`
- 模板文件：`src/main/resources/application.yml.template`（供参考）
- 敏感配置（JWT密钥、微信密钥）建议通过环境变量传入

### 核心配置项
```yaml
server.port: 8081                          # 服务端口
spring.datasource:                         # MySQL数据库配置
jwt.secret: ${JWT_SECRET}                  # JWT签名密钥（环境变量）
jwt.expiration: 86400000                   # JWT过期时间（24小时）
wechat.appid: wx6fb55954dff3e5e7           # 微信小程序AppID
wechat.secret: ${WECHAT_APP_SECRET}        # 微信小程序密钥（环境变量）
```

### 文件上传
- 最大文件大小：5MB
- 存储路径：`uploads/images/`（相对于项目根目录）
- 上传接口：`POST /api/upload/image`

### 数据库
- 数据库名：`street_map`
- 初始化脚本：`docs/database.sql`
- 完整数据导出：`docs/database_full.sql`
- 测试数据：`vendor_test_data.sql`
- 核心表：user(用户)、vendor(摊主)、product(商品)、favorite(收藏)、review(评价)
- vendor 表含 `avatar` 字段（摊位头像URL，允许NULL），迁移脚本：`docs/migration_add_vendor_avatar.sql`
- MyBatis-Plus已配置逻辑删除（字段`deleted`，1表示删除，0表示正常），review 表已添加 `deleted` 字段，迁移脚本：`docs/migration_add_review_deleted.sql`
- 所有表均配置了`create_time`和`update_time`自动填充
- user 表存手机号（`phone`），vendor 表存摊位信息。自定义 `@Select` 查询通过 LEFT JOIN user 获取 phone

## API接口规范
- 所有接口统一前缀：`/api/`
- 返回结果统一封装为`Result`类，成功返回`Result.success(data)`，失败返回`Result.error(message)`
- 需要认证的接口需在请求头携带`Authorization: Bearer <token>`
- SecurityConfig 白名单（`permitAll`）需显式配置公开接口路径

### 接口分组
| 前缀 | 模块 | 说明 |
|------|------|------|
| `/api/auth/*` | 认证模块 | 微信登录 |
| `/api/user/*` | 用户模块 | 用户信息管理 |
| `/api/vendor/*` | 摊主模块 | 摊位申请、信息管理、附近查询、热门排行、编辑摊位信息、编辑手机号 |
| `/api/product/*` | 商品模块 | 商品增删改查、上下架 |
| `/api/review/*` | 评价模块 | 发表评价、查询评价列表、我的评价、删除评价 |
| `/api/favorite/*` | 收藏模块 | 收藏/取消收藏、收藏列表、检查收藏状态 |
| `/api/upload/*` | 上传模块 | 图片上传 |

### Vendor 模块端点
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/vendor/open` | 查询所有开摊摊位 | 否 |
| GET | `/api/vendor/nearby` | 附近摊位查询 | 否 |
| GET | `/api/vendor/smart-list` | 智能推荐摊位（距离+质量） | 否 |
| GET | `/api/vendor/hot-ranking` | 热门排行（3KM纯评分排序） | 否 |
| GET | `/api/vendor/{id}` | 摊位详情（含评价+商品） | 否 |
| GET | `/api/vendor/my` | 获取我的摊位 | 是 |
| POST | `/api/vendor/apply` | 申请成为摊主 | 是 |
| PUT | `/api/vendor/status` | 开摊/收摊 | 是 |
| PUT | `/api/vendor/info` | 编辑摊位信息（名称/头像/手机号） | 是 |
| PUT | `/api/vendor/phone` | 编辑手机号 | 是 |

## 开发注意事项
1. **用户与摊主关系**：普通用户和摊主是一对一关系（通过`vendor.user_id`关联），用户可通过申请成为摊主
2. **坐标体系**：位置信息使用WGS84坐标（纬度latitude/经度longitude）
3. **微信登录**：小程序端调用`wx.login`获取code，后端调用微信接口换取openid，与本地用户关联
4. **摊位营业状态**：`vendor.status`字段控制营业中/已收摊，开摊时需上报经纬度位置
5. **商品状态**：`product.status`字段控制上架/下架
6. **用户头像 vs 摊位头像**：两个独立字段，`user.avatar` 是用户头像，`vendor.avatar` 是摊位头像。申请摊主时不强制上传摊位头像，后续可编辑
7. **手机号存储**：手机号在 `user.phone` 字段，编辑摊位信息时通过 `VendorServiceImpl.updateVendorInfo()` 同步更新 user 表
8. **自定义 SQL 查询**：`VendorMapper` 中 3 个自定义 `@Select` 查询通过 LEFT JOIN user 获取 phone，新增 vendor 字段时需同步更新这些 SQL
9. **Security 白名单**：新增需认证的接口后，前端 `request()` 中 401/403 处理会自动跳转登录页

## 部署信息
- 部署服务器：阿里云 ECS（47.94.23.66）
- JAR路径：`/opt/street-map-backend.jar`
- 生产配置：`/opt/street-map/application-prod.yml`
- JVM参数：`-Xmx384m -Xms128m`
- 日志文件：`/opt/street-map-backend.log`
- 启动脚本：`start-backend.bat`（本地Windows开发）
- 数据库迁移：新增 `vendor.avatar` 字段需在生产库执行 `docs/migration_add_vendor_avatar.sql`

## 微信小程序前端结构

### 项目目录
```
WechatCode/
├── app.json              # 小程序全局配置
├── app.js                # 小程序入口
├── pages/                # 页面目录
│   ├── index/            # 首页（附近摊位列表，功能入口）
│   ├── map/              # 地图页（摊位位置展示）
│   ├── vendor-detail/    # 摊位详情页（卡片式风格）
│   ├── vendor/           # 我的摊位页（摊位管理、编辑入口）
│   ├── vendor-edit/      # 编辑摊位信息页（头像/名称/手机号）
│   ├── apply-vendor/     # 申请摊位页
│   ├── favorite/         # 收藏页（TabBar）
│   ├── hot-ranking/      # 热门排行页（3KM内按评分排序）
│   ├── product-manage/   # 商品管理页
│   ├── product-form/     # 商品表单页（添加/编辑）
│   ├── my-reviews/       # 我的评价页（全屏，统计+可跳转+删除）
│   ├── add-review/       # 发表评价页
│   ├── review-list/      # 评价列表半屏弹窗（摊位评价）
│   ├── edit-phone/       # 编辑手机号页
│   ├── login/            # 登录页
│   ├── profile/          # 个人中心（TabBar）
│   ├── agreement/        # 协议页
│   └── logs/             # 日志页
├── utils/                # 工具函数
│   └── api.js            # API 请求封装（含401/403自动跳转登录）
└── images/               # 图片资源
```

### 前端技术栈
- 框架：微信小程序原生框架
- UI 风格：卡片式设计，统一浅灰背景 `#f5f5f5`，白色卡片圆角 `20rpx`，轻微阴影
- API 通信：通过 `utils/api.js` 封装请求，调用后端 `/api/*` 接口

### 核心页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/pages/index/index` | 附近摊位列表+功能入口，支持弹窗查看摊位详情 |
| 地图 | `/pages/map/map` | 地图展示所有摊位位置，支持弹窗查看详情 |
| 摊位详情 | `/pages/vendor-detail/vendor-detail` | 卡片式布局，展示摊位信息、商品、评价 |
| 我的摊位 | `/pages/vendor/vendor` | 摊主管理摊位：头像+名称+状态、营业开关、商品管理、编辑入口 |
| 编辑摊位 | `/pages/vendor-edit/vendor-edit` | 编辑摊位头像/名称/手机号，头像上传调用 `/api/upload/image` |
| 我的评价 | `/pages/my-reviews/my-reviews` | 全屏页，统计卡片+评价列表，可点击跳转摊位、删除评价 |
| 发表评价 | `/pages/add-review/add-review` | 星星评分+文字评价，提交后返回刷新 |
| 评价列表 | `/pages/review-list/review-list` | 半屏弹窗，展示摊位评价+删除功能 |
| 申请摊位 | `/pages/apply-vendor/apply-vendor` | 摊主申请页面，含手机号必填 |
| 热门排行 | `/pages/hot-ranking/hot-ranking` | 3KM内按评分降序排列，卡片式排行列表 |
| 收藏 | `/pages/favorite/favorite` | 收藏摊位列表（TabBar页） |

### 开发注意事项
1. **头像显示**：摊位详情页使用渐变背景 + emoji 图标（如 🍜），避免直接使用网络图片导致空白
2. **商品过滤**：在 JS 层过滤上架商品（`status === 1`），避免 WXML 中 `wx:for` 与 `wx:if` 同用触发渲染警告
3. **底部操作栏**：固定定位 `position: fixed; bottom: 0`，需添加底部占位元素防止内容遮挡
4. **手机号拨打**：使用 `wx.makePhoneCall` API
5. **API 响应格式**：后端统一返回 `Result<T>` 包装 `{code, data, message}`，`request()` 返回整个对象。页面使用时需防御性提取：`Array.isArray(res) ? res : (res?.data || [])`
6. **评价删除**：仅评价作者可删除，后端 `deleteReview()` 校验 `userId` 匹配，前端通过 `item.userId === currentUserId` 控制删除按钮可见性
7. **DTP 字段名**：`ReviewWithUserDTO` 使用 `reviewId`（非 `id`），前端 map 时需取 `review.reviewId`
8. **阻止事件冒泡**：卡片内嵌操作按钮（如删除）使用 `catchtap` 而非 `bindtap`，防止触发卡片自身的点击事件
9. **JWT 过期处理**：`utils/api.js` 的 `request()` 拦截 401/403 状态码，自动清除 token 并跳转登录页
10. **URL 参数编码**：页面跳转传参时使用 `encodeURIComponent()` 编码（特别是名称和头像URL含特殊字符时）

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
