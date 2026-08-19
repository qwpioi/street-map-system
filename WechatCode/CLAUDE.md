# CLAUDE.md

This file provides guidance to Claude Code when working with the WeChat mini-program frontend.

## 角色定位

**微信小程序前端开发工程师**

### 职责范围

✅ **负责内容（可以修改）：**
- 微信小程序前端代码（`WechatCode/` 目录下所有文件）
- 页面结构（WXML）
- 页面样式（WXSS）
- 页面逻辑（JS）
- 页面配置（JSON）
- 前端工具函数（`utils/`）
- 前端资源文件（`images/`）
- 前端相关文档（本文档、UI 设计文档等）

⚠️ **可以分析但不能修改：**
- 后端代码（`../src/` 目录下的 Java 代码）
- 后端配置（`../src/main/resources/application.yml`）
- 数据库结构（`../docs/database*.sql`）

📝 **需要后端修改时的处理方式：**
当发现需要后端修改时，**不要直接修改后端代码**，而是：
1. 清晰说明需要修改的内容
2. 说明修改的原因和目的
3. 提供具体的修改建议（字段名、接口路径、返回格式等）
4. 等待专门负责后端的同事进行修改

**示例格式：**
```
【需要后端修改】
- 修改位置：`src/main/java/com/streetmap/backend/entity/Vendor.java`
- 修改内容：添加 `avgPrice` 字段（人均消费）
- 字段类型：`Double`
- 原因：前端需要在摊位详情页显示人均消费信息
- 影响范围：`VendorDTO` 也需要添加对应字段
```

### 协作流程

1. **纯前端任务**：直接修改前端代码
2. **涉及后端任务**：
   - 前端部分：完成前端代码修改
   - 后端部分：说明需要后端修改的内容，提交给后端同事
   - 联调测试：后端修改完成后，前后端联调测试

---

## 项目概述
地摊地图微信小程序前端，为用户提供附近摊位发现、收藏、评价等功能。

## 页面架构

### 页面列表
| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/pages/index/index` | 附近摊位列表+功能入口，支持弹窗查看摊位详情 |
| 地图 | `/pages/map/map` | 地图展示所有摊位位置，支持弹窗查看详情 |
| 摊位详情 | `/pages/vendor-detail/vendor-detail` | 卡片式布局，展示摊位信息、商品、评价 |
| 我的摊位 | `/pages/vendor/vendor` | 摊主管理摊位：头像+状态+营业开关+商品管理+编辑入口 |
| 编辑摊位 | `/pages/vendor-edit/vendor-edit` | 编辑摊位头像（上传）/名称/手机号，保存调 PUT /api/vendor/info |
| 热门排行 | `/pages/hot-ranking/hot-ranking` | 3KM内按评分降序排列，卡片式排行列表 |
| 我的评价 | `/pages/my-reviews/my-reviews` | 全屏页，统计卡片+评价列表，可点击跳转摊位、删除评价 |
| 发表评价 | `/pages/add-review/add-review` | 星星评分+文字评价，提交后返回刷新 |
| 评价列表 | `/pages/review-list/review-list` | 半屏弹窗，展示摊位评价+删除功能 |
| 申请摊位 | `/pages/apply-vendor/apply-vendor` | 摊主申请页面，含手机号必填 |
| 收藏 | `/pages/favorite/favorite` | 收藏摊位列表（TabBar页） |
| 个人中心 | `/pages/profile/profile` | 用户信息和功能入口（TabBar页） |
| 登录 | `/pages/login/login` | 微信登录 |
| 商品管理 | `/pages/product-manage/product-manage` | 摊位商品列表管理 |
| 商品表单 | `/pages/product-form/product-form` | 添加/编辑商品 |
| 编辑手机号 | `/pages/edit-phone/edit-phone` | 单独编辑手机号 |
| 协议 | `/pages/agreement/agreement` | 用户协议展示 |
| 日志 | `/pages/logs/logs` | 调试日志 |

### TabBar
| Tab | 路径 | 图标 |
|-----|------|------|
| 首页 | `/pages/index/index` | - |
| 地图 | `/pages/map/map` | - |
| 收藏 | `/pages/favorite/favorite` | - |
| 我的 | `/pages/profile/profile` | - |

### API 接口
所有 API 封装在 `utils/api.js`，通过 `vendorApi`、`favoriteApi`、`reviewApi`、`productApi`、`uploadApi`、`userApi` 模块调用。

| 模块 | 方法 | 后端接口 | 说明 |
|------|------|------|------|
| vendorApi | `getOpenVendors()` | `GET /api/vendor/open` | 开摊摊位列表 |
| vendorApi | `getNearbyVendors(lat, lng)` | `GET /api/vendor/nearby` | 附近摊位 |
| vendorApi | `getSmartRecommendedVendors(lat, lng)` | `GET /api/vendor/smart-list` | 智能推荐摊位 |
| vendorApi | `getHotRankingVendors(lat, lng)` | `GET /api/vendor/hot-ranking` | 热门排行（3KM纯评分） |
| vendorApi | `getMyVendor()` | `GET /api/vendor/my` | 获取我的摊位 |
| vendorApi | `getVendorById(id)` | `GET /api/vendor/{id}` | 摊位详情 |
| vendorApi | `updateVendorStatus(status, lat, lng)` | `PUT /api/vendor/status` | 开摊/收摊 |
| vendorApi | `applyVendor(data)` | `POST /api/vendor/apply` | 申请摊主 |
| vendorApi | `updateVendorInfo(data)` | `PUT /api/vendor/info` | 编辑摊位信息（名称/头像/手机号） |
| favoriteApi | `getFavorites()` | `GET /api/favorite/user/{userId}` | 收藏列表 |
| favoriteApi | `addFavorite(vendorId)` | `POST /api/favorite/add` | 添加收藏 |
| favoriteApi | `removeFavorite(vendorId)` | `DELETE /api/favorite/remove` | 取消收藏 |
| favoriteApi | `checkFavorite(vendorId)` | `GET /api/favorite/check` | 检查收藏状态 |
| reviewApi | `getVendorReviews(vendorId)` | `GET /api/review/vendor/{id}/list` | 摊位评价列表 |
| reviewApi | `getUserReviews()` | `GET /api/review/user/my-reviews` | 我的评价 |
| reviewApi | `addReview(vendorId, rating, content)` | `POST /api/review/add` | 发表评价 |
| reviewApi | `getAverageRating(vendorId)` | `GET /api/review/average/{id}` | 平均评分 |
| reviewApi | `getReviewCount(vendorId)` | `GET /api/review/count/{id}` | 评价数量 |
| reviewApi | `deleteReview(reviewId)` | `DELETE /api/review/{id}` | 删除评价 |
| productApi | `getProducts(vendorId)` | `GET /api/product/vendor/{id}` | 商品列表 |
| productApi | `addProduct(product)` | `POST /api/product/add` | 添加商品 |
| productApi | `updateProduct(product)` | `PUT /api/product/update` | 更新商品 |
| productApi | `deleteProduct(productId)` | `DELETE /api/product/{id}` | 删除商品 |
| uploadApi | `uploadImage(filePath)` | `POST /api/upload/image` | 图片上传（`wx.uploadFile`） |
| userApi | `wechatLogin(code)` | `POST /api/auth/wechat-login` | 微信登录 |

### 开发注意事项
1. **卡片风格**：浅灰背景 `#f5f5f5`，白色卡片圆角 `20rpx`，轻微阴影
2. **商品过滤**：在 JS 层过滤上架商品（`status === 1`），避免 WXML 中 `wx:for` 与 `wx:if` 同用
3. **事件冒泡**：卡片内嵌按钮使用 `catchtap` 而非 `bindtap`
4. **API 响应格式**：后端统一返回 `{code, data, message}`，`request()` 返回整个对象，页面使用时需防御性提取
5. **JWT 过期处理**：`request()` 拦截 401/403 状态码，自动清除 token 并 `reLaunch` 到登录页，无需各页面单独处理
6. **URL 参数编码**：页面跳转传参时需用 `encodeURIComponent()` 编码（特别是摊位名称、头像URL等含特殊字符的字段），接收页用 `decodeURIComponent()` 解码
7. **头像上传流程**：`wx.chooseImage` → `uploadApi.uploadImage()` → 获取返回URL → 提交到业务接口
8. **摊位头像 vs 用户头像**：两个独立字段，`vendor.avatar` 为摊位头像（可选），用户头像在 `user.avatar`
9. **页面生命周期**：`onShow` 中刷新数据以支持从子页面返回时更新列表
10. **全局样式层叠陷阱**：`app.wxss` 是全局样式，会与每个页面的 wxss 在**相同选择器上逐属性合并**（不是整块替换）。如果 `app.wxss` 里有个同名类（如 `.container`），页面 wxss 里没显式覆盖的属性会从全局穿透生效，且**简写属性只覆盖同名的 longhand**（如 `padding-bottom: 20rpx` 不会清掉全局的 `padding-top`）。排查"样式怎么改都不好使"时，第一步永远是 `grep app.wxss` 看有没有同名选择器泄漏。
11. **防御性重置**：页面根容器（如 `.container`）建议在 wxss 开头显式重置可能被全局样式污染的常用属性，参考 `vendor-edit.wxss` 的写法：
    ```css
    .container {
      display: block;           /* 防全局 flex 泄漏 */
      height: auto;             /* 防全局 height:100% */
      padding: 0;               /* 防全局 padding:200rpx 残留 */
      align-items: initial;     /* 防子元素 shrink-to-fit */
      justify-content: initial; /* 防子元素被垂直撑开 */
      /* 再写页面自己的样式 */
      width: 750rpx;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    ```
12. **flex 父级 `align-items: center` 的隐形副作用**：会让**没写显式宽度的直接子元素**从"撑满整行"立刻变成"收缩到内容宽度"，视觉上表现为"组件大小混乱"。遇到此类症状，优先检查父级 flex 容器的 `align-items` 取值。

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
