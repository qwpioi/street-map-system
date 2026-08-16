# 地摊地图微信小程序 — 美团风格 UI 升级设计文档

> 日期：2026-08-16
> 分支：frontend
> 设计参考：`WechatCode/ui-preview.html`（已获用户确认）

---

## 1. 全局设计系统

### 1.1 色彩 Token

| Token 名称 | 色值 | 用途 |
|-----------|------|------|
| `--primary` | `#FFD100` | 主色（头部背景、TabBar 高亮、主按钮） |
| `--primary-dark` | `#FFC107` | 主色渐变终点、按钮阴影 |
| `--accent` | `#FF6633` | 强调色（评分数字、价格、热门标签） |
| `--accent-gradient-end` | `#FF3366` | Banner 渐变终点 |
| `--success` | `#00C853` | 营业状态、距离文字 |
| `--danger` | `#FF3366` | 退出按钮、警告 |
| `--bg` | `#F5F5F5` | 页面背景 |
| `--card` | `#FFFFFF` | 卡片/区块背景 |
| `--text-primary` | `#1A1A1A` | 标题、正文 |
| `--text-secondary` | `#666666` | 次要文字 |
| `--text-tertiary` | `#999999` | 辅助文字、占位符 |
| `--text-price` | `#FF6633` | 价格专用 |
| `--border` | `#F0F0F0` | 分割线 |
| `--tag-bg` | `#FFF3E0` | 标签背景 |
| `--tag-text` | `#FF6633` | 标签文字 |
| `--tag-green-bg` | `#E8F5E9` | 绿色标签背景 |
| `--tag-green-text` | `#2E7D32` | 绿色标签文字 |

### 1.2 字体规范

| 角色 | 字号(rpx) | 字重 | 颜色 |
|------|----------|------|------|
| 页面大标题 | 36 | 700 | `--text-primary` |
| 卡片标题/摊位名 | 30 | 600 | `--text-primary` |
| 正文 | 26 | 400 | `--text-secondary` |
| 辅助文字 | 22 | 400 | `--text-tertiary` |
| 数据标签（距离/评分） | 24 | 600 | 各自语义色 |
| 价格 | 32 | 700 | `--text-price` |
| 价格符号 ¥ | 22 | 700 | `--text-price` |

### 1.3 圆角/阴影/间距

| 元素 | 圆角 | 阴影 | 内边距 |
|------|------|------|--------|
| 卡片 | 24rpx | `0 2rpx 12rpx rgba(0,0,0,0.05)` | 24rpx |
| 按钮（主操作） | 36rpx | `0 4rpx 16rpx rgba(255,209,0,0.3)` | — |
| 标签 | 6rpx | 无 | 4rpx 12rpx |
| 缩略图 | 20rpx | 无 | — |
| 头像（圆形） | 50% | 无 | — |

### 1.4 通用组件规范

#### 评分星标
- 5 颗星， filled: `★` 色 `#FFD100`，empty: `★` 色 `#DDDDDD`
- 后跟评分数字（`#FF6633`，加粗）+ 评价数（`#999999`）

#### 营业状态徽标
- 营业中：绿色小圆点 + "营业中"文字，背景 `#E8F5E9`，文字 `#2E7D32`
- 已收摊：灰色小圆点 + "已收摊"文字，背景 `#F5F5F5`，文字 `#999999`
- 缩略图角标版本：覆盖在缩略图底部，半透明背景，白色文字

#### 标签系统
- 品类标签：橙色系（背景 `#FFF3E0`，文字 `#FF6633`）
- 正面标签（热销/口碑）：绿色系（背景 `#E8F5E9`，文字 `#2E7D32`）
- 最多展示 3 个，超出截断

---

## 2. 页面流转图

```
┌─────────────────────────────────────────────────┐
│                    TabBar                        │
│  [首页]  ←→  [地图]  ←→  [收藏]  ←→  [我的]     │
└─────────────────────────────────────────────────┘

首页 (index)
├── 点击摊位卡片 → 底部弹窗详情（同页 overlay）
│   ├── 点击头部 → navigateTo: vendor-detail?id=xxx
│   ├── 点击收藏 → 调用 favoriteApi.addFavorite/removeFavorite
│   ├── 点击导航 → wx.openLocation
│   ├── 点击电话 → wx.makePhoneCall
│   ├── 点击"查看全部评价" → navigateTo: review-list
│   └── 点击"发表评价" → navigateTo: add-review
├── 点击"附近摊位" → 滚动到列表区域
├── 点击"成为摊主" → 判断登录态 → navigateTo: vendor 或 apply-vendor
├── 点击"我的收藏" → switchTab: favorite
├── 点击"热门排行" → navigateTo: hot-ranking
├── 点击"地图找摊" → switchTab: map
├── 点击"我的评价" → 判断登录态 → navigateTo: my-reviews
└── 点击"导航"按钮 → wx.openLocation

摊位详情 (vendor-detail)
├── 返回 → navigateBack
├── 收藏 → favoriteApi.toggle
├── 电话 → wx.makePhoneCall
├── 导航 → wx.openLocation
├── 评价 → navigateTo: add-review
└── 查看全部评价 → navigateTo: review-list

收藏 (favorite)
├── 点击卡片 → navigateTo: vendor-detail?id=xxx
├── 点击"取消收藏" → favoriteApi.removeFavorite
├── Tab 切换（全部/营业中/已收摊）→ 本地过滤
└── 空状态"去首页" → switchTab: index

个人中心 (profile)
├── 未登录 → "立即登录" → navigateTo: login
├── "我的收藏" → switchTab: favorite
├── "我的摊位" → 判断是否有摊位 → navigateTo: vendor 或 apply-vendor
├── "我的评价" → navigateTo: my-reviews
├── "成为摊主" → 判断登录态 → navigateTo: vendor 或 apply-vendor
├── "设置" → navigateTo: settings（暂 Toast 开发中）
├── "关于我们" → navigateTo: about（暂 Toast 开发中）
└── "退出登录" → 清除 token/userInfo → 刷新页面

热门排行 (hot-ranking)
├── 点击卡片 → navigateTo: vendor-detail?id=xxx
└── 返回 → navigateBack
```

---

## 3. 各页面完整 Spec

---

### 3.1 首页 (pages/index/)

**文件：** `index.wxml` + `index.wxss`（`index.js` 不改）

**页面职责：** 用户进入小程序的第一个页面，展示附近摊位推荐、功能入口、运营内容。

**入口：** 小程序启动 / TabBar 切换

#### 接收的数据

| 数据 | 来源 | 说明 |
|------|------|------|
| 用户位置 | `wx.getLocation` (gcj02) | onLoad 时获取，存入 data.latitude/longitude |
| 登录态 | `wx.getStorageSync('token')` | checkLogin() 中检测 |
| 用户信息 | `wx.getStorageSync('userInfo')` | 同上 |
| 推荐摊位列表 | `vendorApi.getSmartRecommendedVendors(lat, lng)` | 返回 `{code, data: [{id, stallName, address, phone, hotProducts, latitude, longitude, distance}]}` |
| 已收藏摊位 ID | `favoriteApi.getFavorites()` | 返回 `{code, data: [{vendorId}]}` |
| 摊位评分 | `reviewApi.getAverageRating(id)` | 弹窗内按需加载 |
| 摊位评价数 | `reviewApi.getReviewCount(id)` | 弹窗内按需加载 |
| 摊位评价列表 | `reviewApi.getVendorReviews(id)` | 弹窗内按需加载，取前 3 条 |
| 摊位商品列表 | `productApi.getProducts(id)` | 弹窗内按需加载 |

#### 业务逻辑

1. **onLoad**: 调 checkLogin() + getLocation()
2. **getLocation()**: 获取定位 → 调 loadVendors(lat, lng)
3. **loadVendors()**: 调智能推荐 API → 处理数据（计算距离文字、标记收藏状态）→ setData
4. **checkLogin()**: 读 token/userInfo → 如已登录调 loadFavoriteIds()
5. **loadFavoriteIds()**: 获取收藏列表 → 提取 vendorId 数组 → 更新摊位列表 isFavorite 字段
6. **onVendorCardTap()**: 聚合加载评价+商品数据 → 显示底部弹窗
7. **onToggleFavorite()**: 收藏/取消收藏 → 更新本地 favoriteVendorIds + 摊位列表 isFavorite
8. **navigateToVendor()**: 调 wx.openLocation 导航
9. **各功能入口**: goNearby/goBecomeVendor/goFavorite/goHotList/goMap/goComments/goAllServices

#### UI 组件清单（美团风格）

```
┌─ 状态栏 (44px, 背景 #FFD100) ─────────────────┐
│                                                 │
├─ 定位头部区域 (背景 #FFD100) ──────────────────┤
│ [📍 朝阳区建国路 ▾]          [☀️ 28°C]        │
│ [🔍 搜索摊位、商品、地址...           ]        │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 运营 Banner ──────────────────────────────────┤
│ [🏮 发现身边好摊位                    ]        │
│ [   3公里内精选美食摊位  [今日热门]    ]        │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 功能入口网格 (4×2, 白底圆角卡片) ────────────┤
│  [🏪附近] [🗺️找摊] [🔥排行] [⭐收藏]        │
│  [🍜美食] [🎨文创] [💬评价]  [⋯更多]         │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 快速状态条 (横向滚动 chip) ──────────────────┤
│  [●附近28家营业中] [●排行榜更新] [📝成为摊主] │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 推荐摊位列表 ────────────────────────────────┤
│  "推荐摊位"                    "智能排序 ›"    │
│                                                 │
│  ┌─ 摊位卡片 ──────────────────────────────┐   │
│  │ [🍜     ]  老张麻辣烫                    │   │
│  │ [营业中  ]  ★★★★★ 4.9  326条           │   │
│  │           [麻辣烫][人均¥18][🔥热销]      │   │
│  ├─────────────────────────────────────────┤   │
│  │ 📍建国路88号路口    350m  [🧭] [❤️]    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─ 摊位卡片 ... ──────────────────────────┐   │
│  └─────────────────────────────────────────┘   │
│                                                 │
├─ 底部弹窗（点击卡片触发）────────────────────┤
│  (保留现有弹窗逻辑，样式升级)                  │
│                                                 │
├─ TabBar ───────────────────────────────────────┤
│  [🏠首页*] [🗺️地图] [⭐收藏] [👤我的]       │
└─────────────────────────────────────────────────┘
```

#### 交互行为

| 交互 | 触发 | 行为 |
|------|------|------|
| 点击定位区域 | tap | 预留，暂不实现（可 Toast "暂不支持切换"） |
| 点击搜索框 | tap | 预留，暂跳转 Toast "搜索开发中" |
| 点击 Banner | tap | 预留，暂不实现 |
| 点击功能图标 | tap | 各 go* 方法（现有逻辑不变） |
| 点击摊位卡片 | tap | onVendorCardTap → 加载数据 → 显示弹窗 |
| 点击卡片收藏图标 | catchtap | onToggleFavorite → 需登录 |
| 点击导航按钮 | catchtap | navigateToVendor → wx.openLocation |
| 弹窗内点击头部 | tap | goToVendorPage → navigateTo vendor-detail |
| 弹窗关闭 | tap mask/✕ | onCloseVendorDetail |

#### 异常/空状态

- **定位失败**: address 设为 "定位失败"，不加载摊位
- **摊位列表为空**: 显示 "😢 附近暂无摊位" 空状态
- **网络错误**: Toast "加载失败"

---

### 3.2 摊位详情 (pages/vendor-detail/)

**文件：** `vendor-detail.wxml` + `vendor-detail.wxss`（`vendor-detail.js` 不改）

**页面职责：** 展示单个摊位的完整信息：基本信息、商品列表、用户评价，提供收藏/导航/评价/电话操作。

**入口：** `navigateTo: vendor-detail?id={vendorId}`（从首页弹窗头部、收藏卡片、热门排行卡片跳转）

#### 接收的数据

| 数据 | 来源 | 说明 |
|------|------|------|
| vendorId | URL 参数 `options.id` | onLoad 解析 |
| 摊位详情 | `vendorApi.getVendorById(id)` | 返回 `{code, data: {id, stallName, address, phone, avatar, status, latitude, longitude, hotProducts, products: [...], reviews: [...]}}` |
| 平均评分 | `reviewApi.getAverageRating(id)` | 返回 `{code, data: 4.9}` |
| 评价数量 | `reviewApi.getReviewCount(id)` | 返回 `{code, data: 326}` |
| 评价列表 | `reviewApi.getVendorReviews(id)` | 返回 `{code, data: [{reviewId, userName, userAvatar, rating, content, createTime}]}` |
| 商品列表 | `productApi.getProducts(id)` | 返回 `{code, data: [{id, name, description, price, imageUrl, status}]}` |
| 收藏状态 | `favoriteApi.checkFavorite(vendorId)` | 返回 `{code, data: true/false}` |

#### 业务逻辑

1. **onLoad**: 解析 vendorId → 调 loadData()
2. **loadData()**: 并发请求摊位详情 + 评分 + 评价数 + 评价列表 + 商品列表 + 收藏状态 → setData
3. **toggleFavorite()**: 收藏/取消 → 更新 isFavorite 状态
4. **callPhone()**: `wx.makePhoneCall({phoneNumber})`
5. **navigateTo()**: `wx.openLocation({lat, lng, name, address})`
6. **viewAllReviews()**: navigateTo review-list
7. **addReview()**: 检查登录态 → navigateTo add-review

#### UI 组件清单（美团风格）

```
┌─ 状态栏 (44px, 背景 #FFD100) ─────────────────┐
├─ 黄色渐变背景区 ──────────────────────────────┤
│  [‹ 返回]                         [↗ 分享]    │
│                                                 │
│  ┌─ 摊位信息卡片 (白底圆角) ────────────────┐ │
│  │ [🍜]  老张麻辣烫                         │ │
│  │       [★4.9] 326条评价   [●营业中]       │ │
│  │                                          │ │
│  │ [📍建国路88号] [📏350m]                  │ │
│  │ [📞138****1234] [💰人均¥18]             │ │
│  │ [🔥主打：麻辣烫 / 冒菜 / 酸辣粉  (满行)] │ │
│  └──────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 商品列表区 (白底圆角卡片) ──────────────────┤
│  🥘 全部商品 [6]                               │
│  ┌──────────────────────────────────────────┐  │
│  │ [🍲] 招牌麻辣烫（大份）                  │  │
│  │      自选食材，浓郁骨汤底                │  │
│  │      ¥22                    月售186      │  │
│  ├──────────────────────────────────────────┤  │
│  │ [🌶️] 酸辣粉                             │  │
│  │      手工红薯粉，酸辣开胃                │  │
│  │      ¥12                    月售98       │  │
│  └──────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 评价区 (白底圆角卡片) ──────────────────────┤
│  💬 最新评价                     查看全部 ›   │
│  ┌──────────────────────────────────────────┐  │
│  │ [avatar] 小明同学  ★★★★★  2天前         │  │
│  │        汤底很浓郁，食材新鲜...           │  │
│  ├──────────────────────────────────────────┤  │
│  │ [avatar] 吃货少女  ★★★★★  5天前         │  │
│  │        酸辣粉太好吃了！                  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
├─ 底部操作栏 (固定底部) ──────────────────────┤
│  [📞电话] [❤️收藏]  [📝评价] [🧭导航前往]   │
└─────────────────────────────────────────────────┘
```

#### 交互行为

| 交互 | 触发 | 行为 |
|------|------|------|
| 返回按钮 | tap | navigateBack() |
| 分享按钮 | tap | 预留（可触发 wx.showShareMenu） |
| 收藏 | tap | toggleFavorite() |
| 电话 | tap | callPhone() |
| 导航 | tap | navigateTo() → wx.openLocation |
| 评价 | tap | addReview() → 检查登录 → navigateTo add-review |
| 查看全部评价 | tap | viewAllReviews() → navigateTo review-list |

#### 异常/空状态

- **摊位不存在**: 显示加载中，无数据时提示
- **无商品**: 显示 "🍽️ 暂无上架商品"
- **无评价**: 显示 "😢 暂无评价，快来成为第一个评价的人吧！"

---

### 3.3 收藏 (pages/favorite/)

**文件：** `favorite.wxml` + `favorite.wxss`（`favorite.js` 需微调以支持分类过滤）

**页面职责：** 展示用户收藏的所有摊位，支持分类筛选、取消收藏、跳转详情。

**入口：** TabBar 切换 / 首页"我的收藏"

#### 接收的数据

| 数据 | 来源 | 说明 |
|------|------|------|
| 用户 ID | `getUserId()` from utils/api.js | 当前登录用户 |
| 收藏列表 | `favoriteApi.getFavorites()` | 返回 `{code, data: [{id, vendorId, vendorName, stallName, address, hotProducts, createTime, vendor: {...}}]}` |

#### 业务逻辑

1. **onShow**: 调 loadFavorites()（每次显示刷新，支持从详情页返回后更新）
2. **loadFavorites()**: 调 API → setData → 计算分类数据（全部/营业中/已收摊）
3. **onCancelFavorite()**: catchtap → favoriteApi.removeFavorite → 从列表移除 → 刷新
4. **onFavoriteItemTap()**: navigateTo vendor-detail
5. **switchTab(tab)**: 切换当前筛选 Tab → 过滤显示（新增逻辑）
6. **goHome()**: switchTab → index

#### UI 组件清单（美团风格）

```
┌─ 状态栏 (44px, 背景 #FFD100) ─────────────────┐
├─ 黄色标题栏 ──────────────────────────────────┤
│  我的收藏                      共5个摊位      │
├─ 分类 Tab ────────────────────────────────────┤
│  [全部*]  [营业中]  [已收摊]                   │
│  ═══ (黄色下划线指示器)                        │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 收藏卡片列表 ────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  │
│  │ [🍜]  老张麻辣烫                         │  │
│  │       ★4.9 · 326条 · 营业中              │  │
│  │                                          │  │
│  │ 收藏于 3天前              [取消收藏]      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ [🥘]  李姐煎饼果子                       │  │
│  │       ★4.3 · 128条 · 营业中              │  │
│  │ 收藏于 5天前              [取消收藏]      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
├─ TabBar ───────────────────────────────────────┤
│  [🏠首页] [🗺️地图] [⭐收藏*] [👤我的]       │
└─────────────────────────────────────────────────┘
```

#### 分类筛选逻辑（新增）

```
data: {
  currentTab: 'all',   // 'all' | 'open' | 'closed'
  favorites: [],        // 全量数据
  filteredFavorites: [] // 过滤后显示
}

switchTab(tab):
  currentTab = tab
  filteredFavorites = favorites.filter(item => {
    if tab === 'all': return true
    if tab === 'open': return item.status === 1
    if tab === 'closed': return item.status !== 1
  })
```

> **注意：** 需要 favoriteApi 返回的数据中包含 `status` 字段。如果 API 未返回 status，需在 JS 层做兼容处理（默认显示全部）。

#### 交互行为

| 交互 | 触发 | 行为 |
|------|------|------|
| 点击 Tab | tap | switchTab → 过滤列表 |
| 点击卡片 | tap | onFavoriteItemTap → navigateTo vendor-detail |
| 取消收藏 | catchtap | onCancelFavorite → 确认弹窗 → removeFavorite → 刷新列表 |
| 空状态"去首页" | tap | goHome → switchTab index |

#### 异常/空状态

- **列表为空**: "⭐ 暂无收藏摊位" + "去首页发现更多美食吧~" + 按钮
- **取消收藏后为空**: 同上

---

### 3.4 个人中心 (pages/profile/)

**文件：** `profile.wxml` + `profile.wxss`（`profile.js` 需微调以支持统计数据）

**页面职责：** 展示用户信息、数据统计、功能入口菜单。

**入口：** TabBar 切换

#### 接收的数据

| 数据 | 来源 | 说明 |
|------|------|------|
| 登录态 | `wx.getStorageSync('token')` | onShow 检测 |
| 用户信息 | `wx.getStorageSync('userInfo')` | nickName, avatarUrl 等 |
| 收藏数 | `favoriteApi.getFavorites()` → data.length | 用于统计卡片角标 |
| 评价数 | `reviewApi.getUserReviews()` → data.length | 用于统计卡片角标 |

#### 业务逻辑

1. **onShow**: checkLogin() → 如已登录加载统计数据
2. **loadStats()**: 并发获取收藏数 + 评价数 → setData
3. **goLogin()**: navigateTo login
4. **goFavorite()**: switchTab favorite
5. **goVendor()**: vendorApi.getMyVendor() → 有摊位跳 vendor，无跳 apply-vendor
6. **goComments()**: navigateTo my-reviews
7. **goBecomeVendor()**: 检查登录 → navigateTo vendor 或 apply-vendor
8. **goSettings()**: Toast "开发中"
9. **goAbout()**: Toast "开发中"
10. **logout()**: 清除 token/userInfo → 刷新页面

#### UI 组件清单（美团风格）

```
┌─ 状态栏 (44px, 背景 #FFD100) ─────────────────┐
├─ 用户头部 (黄色渐变背景) ────────────────────┤
│  [😊]  小明同学                               │
│        探索城市味道，已打卡 12 个摊位          │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 数据统计卡片 (白底圆角, 负 margin 上浮) ────┤
│  [  5  ]  [  12  ]  [  3  ]  [  1  ]          │
│   收藏     评价     常去     摊位              │
├─────────────────────────────────────────────────┤
│                                                 │
├─ "我的订单" 快捷入口 (美团风格) ─────────────┤
│  我的订单                        查看全部 ›   │
│  [💰待付款] [🎫待使用] [⭐待评价] [↩️退款]   │
│                                                 │
│  注: 地摊地图暂无订单系统，此区域可改为        │
│  "常用功能" 或直接隐藏。建议改为：            │
│  [🏪我的摊位] [⭐我的收藏]                     │
│  [💬我的评价]  [📝发表评价]                     │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 功能菜单 ────────────────────────────────────┤
│  [⭐] 我的收藏              [5]  ›            │
│  [🏪] 我的摊位                   ›            │
│  [💬] 我的评价             [12]  ›            │
│  [📝] 成为摊主                   ›            │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 设置菜单 ────────────────────────────────────┤
│  [⚙️] 设置                       ›            │
│  [ℹ️] 关于我们                   ›            │
├─────────────────────────────────────────────────┤
│                                                 │
│  [         退出登录          ]                  │
│                                                 │
├─ TabBar ───────────────────────────────────────┤
│  [🏠首页] [🗺️地图] [⭐收藏] [👤我的*]       │
└─────────────────────────────────────────────────┘
```

#### "我的订单"区域决策

由于地摊地图目前没有订单/支付系统，"我的订单"区域**不照搬美团**，改为 **"常用功能"** 快捷入口：

```
常用功能
[🏪我的摊位] [⭐我的收藏]
[💬我的评价]  [📝成为摊主]
```

4 个圆形图标横排，点击跳转对应页面。

#### 交互行为

| 交互 | 触发 | 行为 |
|------|------|------|
| 未登录点击登录 | tap | goLogin → navigateTo login |
| 点击菜单项 | tap | 各 go* 方法 |
| 退出登录 | tap | logout → 清除存储 → 刷新 |

#### 异常/空状态

- **未登录**: 显示默认头像 + "未登录" + "登录后可收藏摊位、发布评论" + 登录按钮
- **统计数据加载失败**: 显示 0

---

### 3.5 热门排行 (pages/hot-ranking/)

**文件：** `hot-ranking.wxml` + `hot-ranking.wxss`（`hot-ranking.js` 不改）

**页面职责：** 展示 3KM 内按评分降序排列的摊位排行榜。

**入口：** 首页"热门排行"图标 → `navigateTo: hot-ranking?latitude=xx&longitude=yy`

#### 接收的数据

| 数据 | 来源 | 说明 |
|------|------|------|
| 用户位置 | URL 参数 `options.latitude/longitude` | onLoad 解析 |
| 排行数据 | `vendorApi.getHotRankingVendors(lat, lng)` | 返回 `{code, data: [{id, stallName, address, averageRating, reviewCount, distance, distanceText, hotProducts, hotProductsArray, rank}]}` |

#### 业务逻辑

1. **onLoad**: 解析经纬度参数 → 调 loadVendors()
2. **loadVendors()**: 调 API → 处理数据（添加 rank 字段、距离文字、分割 hotProducts）→ setData
3. **onVendorTap()**: navigateTo vendor-detail

#### UI 组件清单（美团风格）

> 热门排行页的视觉升级相对轻量，主要是色彩统一到新设计系统。

```
┌─ 状态栏 (44px, 背景 #FFD100) ─────────────────┐
├─ 黄色标题栏 ──────────────────────────────────┤
│  🔥 热门排行 · 3KM内                           │
├─────────────────────────────────────────────────┤
│                                                 │
├─ 排行卡片列表 ────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  │
│  │ [🥇]  老张麻辣烫            ›           │  │
│  │        ★★★★★ 4.9分 (326条)              │  │
│  │        📍 建国路88号路口                 │  │
│  │        [麻辣烫] [冒菜] [酸辣粉]          │  │
│  │        350m                              │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ [🥈]  王叔烤串               ›          │  │
│  │        ★★★★☆ 4.8分 (256条)              │  │
│  │        ...                               │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 色彩变更
- 排名徽章 top3 渐变色：`#ff6b00→#f44336` → `#FF6633→#FF3366`
- 评分数字：`#f37b1d` → `#FF6633`
- 距离文字：`#4CAF50` → `#00C853`
- 标签：`#ff6b00` → `#FF6633`

#### 异常/空状态

- **无数据**: "🔥 3KM内暂无摊位" + "换个地方试试吧"

---

## 4. 全局配置变更

### app.json TabBar 配色

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#FFD100",
    "backgroundColor": "#ffffff",
    ...
  }
}
```

将 `selectedColor` 从 `#4CAF50` 改为 `#FFD100`。

---

## 5. 不变的部分

以下内容本次**不修改**：
- 所有 `.js` 文件的核心业务逻辑（仅收藏页和个中心可能需要微调以支持新功能）
- `utils/api.js` — API 封装层不变
- `pages/map/` — 地图页暂不升级
- `pages/login/` — 登录页暂不升级
- `pages/vendor/` — 摊主管理页暂不升级
- `pages/vendor-edit/` — 编辑页暂不升级
- `pages/apply-vendor/` — 申请页暂不升级
- `pages/product-manage/` — 商品管理页暂不升级
- `pages/product-form/` — 商品表单页暂不升级
- `pages/my-reviews/` — 我的评价页暂不升级
- `pages/add-review/` — 发表评价页暂不升级
- `pages/review-list/` — 评价列表页暂不升级
- `pages/edit-phone/` — 编辑手机号页暂不升级
- 后端 API — 无变更

---

## 6. 实施范围总结

| 文件 | 操作 | 说明 |
|------|------|------|
| `pages/index/index.wxml` | 重写 | 首页结构 |
| `pages/index/index.wxss` | 重写 | 首页样式 |
| `pages/vendor-detail/vendor-detail.wxml` | 重写 | 详情页结构 |
| `pages/vendor-detail/vendor-detail.wxss` | 重写 | 详情页样式 |
| `pages/favorite/favorite.wxml` | 重写 | 收藏页结构 |
| `pages/favorite/favorite.wxss` | 重写 | 收藏页样式 |
| `pages/favorite/favorite.js` | 微调 | 新增 Tab 分类过滤逻辑 |
| `pages/profile/profile.wxml` | 重写 | 个人中心结构 |
| `pages/profile/profile.wxss` | 重写 | 个人中心样式 |
| `pages/profile/profile.js` | 微调 | 新增统计数据加载 |
| `pages/hot-ranking/hot-ranking.wxml` | 微调 | 色彩统一 |
| `pages/hot-ranking/hot-ranking.wxss` | 微调 | 色彩统一 |
| `app.json` | 修改 | TabBar selectedColor |
