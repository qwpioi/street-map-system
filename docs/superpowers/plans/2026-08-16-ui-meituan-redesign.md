# 美团风格 UI 升级实施计划

> **For agentic workers:** 使用 Agent-teams 并行实施，5 个 Agent 同时工作。

**Goal:** 将微信小程序 5 个核心页面从当前简陋风格升级为美团风格 UI

**Architecture:** 每个页面独立重写 wxml + wxss，JS 业务逻辑不变（收藏页和个中心微调）。全局通过 app.json 统一 TabBar 配色。

**Tech Stack:** 微信小程序原生框架 (wxml + wxss)

**Spec:** `docs/superpowers/specs/2026-08-16-ui-meituan-redesign-design.md`

## Global Constraints

- 主色 `#FFD100`，强调色 `#FF6633`，成功色 `#00C853`
- 背景 `#F5F5F5`，卡片白底圆角 `24rpx`
- 评分星 `#FFD100`，价格 `#FF6633`，距离 `#00C853`
- JS 业务逻辑不改，仅改 wxml 结构 + wxss 样式
- 收藏页/个中心 JS 可微调（新增分类过滤/统计数据）

---

## Task 1: 首页 (pages/index/)

**Files:**
- Modify: `WechatCode/pages/index/index.wxml`
- Modify: `WechatCode/pages/index/index.wxss`
- NOT modify: `WechatCode/pages/index/index.js`

**设计参考:** `WechatCode/ui-preview.html` Phone 1

- [ ] **Step 1: 重写 index.wxml**

核心变更：
1. 新增黄色定位头部（定位信息 + 天气 + 搜索栏）
2. 新增运营 Banner（橙红渐变）
3. 重构功能入口网格（轻量圆形图标 4×2）
4. 新增快速状态条（横向滚动 chip）
5. 重构摊位卡片（评分星标 + 标签 + 营业状态角标 + 外露导航/收藏按钮）
6. 弹窗详情样式升级

关键：保留所有 `bindtap`/`catchtap` 事件绑定和 `wx:if`/`wx:for` 数据绑定不变，JS 不改动。

- [ ] **Step 2: 重写 index.wxss**

全部替换为新设计系统的样式，参照 HTML 预览中的 `.home-header`、`.banner-card`、`.category-grid`、`.quick-strip`、`.vendor-card-mt` 等样式。

- [ ] **Step 3: 验证**

在微信开发者工具中预览首页，确认：头部黄色、Banner 渐变、功能图标圆形、卡片带评分星标和标签、弹窗正常。

---

## Task 2: 摊位详情 (pages/vendor-detail/)

**Files:**
- Modify: `WechatCode/pages/vendor-detail/vendor-detail.wxml`
- Modify: `WechatCode/pages/vendor-detail/vendor-detail.wxss`
- NOT modify: `WechatCode/pages/vendor-detail/vendor-detail.js`

**设计参考:** `WechatCode/ui-preview.html` Phone 2

- [ ] **Step 1: 重写 vendor-detail.wxml**

核心变更：
1. 顶部黄色渐变背景 + 返回/分享按钮
2. 摊位信息卡片紧凑布局
3. 信息区 2×2 grid（地址/距离/电话/人均）+ 主打商品满行
4. 商品列表带月销量
5. 评价区优化
6. 底部操作栏：电话/收藏图标 + 评价/导航双主按钮

关键：保留所有 `bindtap` 事件和 `{{}}` 数据绑定。

- [ ] **Step 2: 重写 vendor-detail.wxss**

全部替换，参照 HTML 预览 `.vd-header`、`.vd-shop-card`、`.vd-section`、`.vd-bottom-bar` 等。

- [ ] **Step 3: 验证**

---

## Task 3: 收藏 (pages/favorite/)

**Files:**
- Modify: `WechatCode/pages/favorite/favorite.wxml`
- Modify: `WechatCode/pages/favorite/favorite.wxss`
- Modify: `WechatCode/pages/favorite/favorite.js`（新增 Tab 过滤逻辑）

**设计参考:** `WechatCode/ui-preview.html` Phone 3

- [ ] **Step 1: 重写 favorite.wxml**

核心变更：
1. 黄色标题头部
2. 分类 Tab（全部/营业中/已收摊）
3. 卡片重构为左图右文紧凑布局

- [ ] **Step 2: 重写 favorite.wxss**

- [ ] **Step 3: 微调 favorite.js**

新增数据字段和方法：
```js
// data 新增
currentTab: 'all',
filteredFavorites: [],

// 新增方法
switchTab(e) {
  const tab = e.currentTarget.dataset.tab
  const favorites = this.data.favorites
  let filtered = favorites
  if (tab === 'open') filtered = favorites.filter(f => f.status === 1)
  else if (tab === 'closed') filtered = favorites.filter(f => f.status !== 1)
  this.setData({ currentTab: tab, filteredFavorites: filtered })
}
```

在 loadFavorites 中增加：`filteredFavorites: favorites`

- [ ] **Step 4: 验证**

---

## Task 4: 个人中心 (pages/profile/)

**Files:**
- Modify: `WechatCode/pages/profile/profile.wxml`
- Modify: `WechatCode/pages/profile/profile.wxss`
- Modify: `WechatCode/pages/profile/profile.js`（新增统计数据加载）

**设计参考:** `WechatCode/ui-preview.html` Phone 4

- [ ] **Step 1: 重写 profile.wxml**

核心变更：
1. 黄色渐变用户头部
2. 数据统计卡片（收藏/评价/常去/摊位）
3. "常用功能"快捷入口（4 圆形图标）
4. 菜单项彩色图标背景
5. 红色角标

- [ ] **Step 2: 重写 profile.wxss**

- [ ] **Step 3: 微调 profile.js**

新增统计数据加载：
```js
// data 新增
stats: { favorites: 0, reviews: 0, frequent: 0, vendors: 0 },

// 新增方法
loadStats() {
  if (!this.data.isLoggedIn) return
  favoriteApi.getFavorites().then(res => {
    const data = res?.data || []
    this.setData({ 'stats.favorites': data.length })
  }).catch(() => {})
  reviewApi.getUserReviews().then(res => {
    const data = Array.isArray(res) ? res : (res?.data || [])
    this.setData({ 'stats.reviews': data.length })
  }).catch(() => {})
}
```

在 checkLogin() 成功后调用 `this.loadStats()`。

需要在文件顶部确认已导入 `favoriteApi` 和 `reviewApi`。

- [ ] **Step 4: 验证**

---

## Task 5: 全局配置 + 热门排行色彩统一

**Files:**
- Modify: `WechatCode/app.json`（TabBar selectedColor）
- Modify: `WechatCode/pages/hot-ranking/hot-ranking.wxss`（色彩统一）
- NOT modify: `WechatCode/pages/hot-ranking/hot-ranking.wxml`（结构不变）

- [ ] **Step 1: 修改 app.json**

将 tabBar.selectedColor 从 `#4CAF50` 改为 `#FFD100`

- [ ] **Step 2: 更新 hot-ranking.wxss 色彩**

替换规则：
- `#ff6b00` → `#FF6633`
- `#f44336` → `#FF3366`
- `#f37b1d` → `#FF6633`
- `#4CAF50` → `#00C853`
- rank-top 渐变改为 `linear-gradient(135deg, #FF6633, #FF3366)`

- [ ] **Step 3: 验证**

---

## 执行策略：Agent-Teams 并行

5 个 Task 完全独立（文件无交叉），可同时派发 5 个 Agent 并行执行。

```
主 Agent
├── 创建 frontend 分支 ✅
├── 提交设计文档 ✅
├── 并行派发 5 个 Agent
│   ├── Agent 1: Task 1 (首页)
│   ├── Agent 2: Task 2 (详情页)
│   ├── Agent 3: Task 3 (收藏)
│   ├── Agent 4: Task 4 (个人中心)
│   └── Agent 5: Task 5 (全局配置+排行)
├── 等待全部完成
├── git add + commit
├── git push origin frontend
└── 汇报结果
```
