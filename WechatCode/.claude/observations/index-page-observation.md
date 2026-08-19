# Index Page — Detailed File Observations

## Project: WechatCode (地摊地图微信小程序)
## Page: pages/index/index (首页)
## Concepts: frontend, wechat, page, index

---

## File 1: pages/index/index.js

### Purpose
Main page controller for the home/index page. Handles location retrieval, vendor loading (smart-recommended), favorites management, vendor detail modal with products/reviews, navigation, and all page navigation flows.

### Page Structure (Lifecycle)
- **onLoad()** → calls `checkLogin()` + `getLocation()`
- **onShow()** → re-checks login; conditionally reloads vendors if `globalData.needRefreshVendors` is set (e.g., returning from product management)

### Data Bindings (Page.data)
| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `address` | string | `''` | Display text for current location |
| `vendors` | array | `[]` | List of smart-recommended vendors |
| `markers` | array | `[]` | Map markers (created but unused in this page's WXML) |
| `latitude` | number | `0` | Current user latitude |
| `longitude` | number | `0` | Current user longitude |
| `isLoggedIn` | boolean | `false` | Login state |
| `userInfo` | object/null | `null` | Cached user info |
| `favoriteVendorIds` | array | `[]` | IDs of favorited vendors |
| `selectedVendor` | object/null | `null` | Currently selected vendor for detail modal |
| `vendorDetailVisible` | boolean | `false` | Controls modal visibility |
| `averageRating` | number | `0` | Average rating of selected vendor |
| `reviewCount` | number | `0` | Total review count for selected vendor |
| `recentReviews` | array | `[]` | Up to 3 most recent reviews |
| `stars` | array | `[1,2,3,4,5]` | Star rating display array |
| `vendorProducts` | array | `[]` | Products for selected vendor |

### Function Definitions (21 functions)

| Function | Type | Description |
|----------|------|-------------|
| `onLoad()` | lifecycle | Entry point: checkLogin + getLocation |
| `onShow()` | lifecycle | Re-checks login; refreshes vendors if needed |
| `loadFavoriteIds()` | async | Fetches user's favorites via `favoriteApi.getFavorites()`, updates `favoriteVendorIds`, then calls `updateVendorFavoriteStatus()` |
| `updateVendorFavoriteStatus()` | sync | Maps `isFavorite` onto each vendor in `vendors` array based on `favoriteVendorIds` |
| `checkLogin()` | sync | Reads token/userInfo from `wx.getStorageSync`; sets `isLoggedIn`; triggers `loadFavoriteIds()` if logged in |
| `getLocation()` | async | Calls `wx.getLocation({type:'gcj02'})`; on success sets address as `北纬X, 东经Y` and calls `loadVendors()` |
| `loadVendors(lat, lng)` | async | Calls `vendorApi.getSmartRecommendedVendors(lat, lng)`; transforms response into vendor objects with `distanceText` (m/km formatting); creates markers; shows toast |
| `createMarkers(vendors)` | sync | Converts vendor array into map marker objects with callouts |
| `onVendorCardTap(e)` | async | Opens detail modal; fetches averageRating, reviewCount, reviews (first 3), and products for selected vendor; sets `vendorDetailVisible: true` |
| `onCloseVendorDetail()` | sync | Closes modal, clears `selectedVendor` |
| `callPhone()` | sync | Calls `wx.makePhoneCall()` with selected vendor's phone |
| `onViewAllReviews()` | sync | Navigates to `/pages/review-list/review-list` with vendorId + vendorName params |
| `onAddReview()` | sync | If not logged in → shows modal + redirect to login; else navigates to `/pages/add-review/add-review` |
| `onToggleFavorite(e)` | async | Toggles favorite on vendor card; calls `favoriteApi.addFavorite()` or `removeFavorite()`; updates local state |
| `onToggleFavoriteInModal(e)` | async | Same as above but for modal context; updates `selectedVendor.isFavorite` via path syntax |
| `navigateToVendor(e)` | sync | Opens native map via `wx.openLocation()` with vendor coords |
| `calculateDistance(lat1,lng1,lat2,lng2)` | sync | Haversine formula; returns formatted distance string (m/km) — **currently unused** (distance comes from API) |
| `handleLogin()` | sync | If logged in → show action sheet (view info / logout); else → navigate to login |
| `logout()` | sync | Clears storage + globalData; resets `isLoggedIn` |
| `goNearby()` | sync | Scrolls page to 800px (smooth) |
| `goBecomeVendor()` | async | If not logged in → redirect login; else calls `vendorApi.getMyVendor()`; if has vendor → `/pages/vendor/vendor`; else → `/pages/apply-vendor/apply-vendor` |
| `goFavorite()` | sync | `wx.switchTab` to `/pages/favorite/favorite` |
| `goCategories()` | sync | Shows "功能开发中" toast (placeholder) |
| `goHotList()` | sync | Navigates to `/pages/hot-ranking/hot-ranking` with lat/lng params |
| `goMap()` | sync | `wx.switchTab` to `/pages/map/map` |
| `goComments()` | sync | If not logged in → redirect login; else → `/pages/my-reviews/my-reviews` |
| `goAllServices()` | sync | Shows "更多功能开发中" toast (placeholder) |
| `goToVendorPage(e)` | sync | Navigates to `/pages/vendor-detail/vendor-detail?id=vendorId` |

### API Calls
| API | Module | Used In | Purpose |
|-----|--------|---------|---------|
| `favoriteApi.getFavorites()` | favorite | `loadFavoriteIds()` | Load user's favorited vendor IDs |
| `vendorApi.getSmartRecommendedVendors(lat, lng)` | vendor | `loadVendors()` | Primary vendor data source |
| `vendorApi.getMyVendor()` | vendor | `goBecomeVendor()` | Check if user already has a vendor stall |
| `reviewApi.getAverageRating(vendorId)` | review | `onVendorCardTap()` | Get average rating for modal |
| `reviewApi.getReviewCount(vendorId)` | review | `onVendorCardTap()` | Get review count for modal |
| `reviewApi.getVendorReviews(vendorId)` | review | `onVendorCardTap()` | Get recent reviews (first 3) for modal |
| `productApi.getProducts(vendorId)` | product | `onVendorCardTap()` | Get vendor's products for modal |
| `favoriteApi.addFavorite(vendorId)` | favorite | `onToggleFavorite()`, `onToggleFavoriteInModal()` | Add vendor to favorites |
| `favoriteApi.removeFavorite(vendorId)` | favorite | `onToggleFavorite()`, `onToggleFavoriteInModal()` | Remove vendor from favorites |

### Event Handlers (WXML → JS)
| Handler | Trigger | Data Params |
|---------|---------|-------------|
| `goNearby` | tap on "附近摊位" grid item | none |
| `goMap` | tap on "地图找摊" grid item | none |
| `goHotList` | tap on "热门排行" grid item | none |
| `goFavorite` | tap on "我的收藏" grid item | none |
| `goCategories` | tap on "美食小吃" grid item | none |
| `goAllServices` | tap on "手工文创" grid item | none |
| `goComments` | tap on "我的评价" grid item | none |
| `goBecomeVendor` | tap on "成为摊主" grid item + quick-chip | none |
| `onVendorCardTap` | tap on vendor card | `data-item` (vendor object) |
| `navigateToVendor` | catchtap on nav-btn / modal primary btn | `data-item` (vendor object) |
| `onToggleFavorite` | catchtap on fav-btn in card | `data-item` (vendor object) |
| `onCloseVendorDetail` | tap on modal mask / close btn | none |
| `callPhone` | tap on phone cell in modal | none |
| `onViewAllReviews` | tap on "查看全部" in modal | none |
| `onAddReview` | tap on "发表评价" button in modal | none |
| `onToggleFavoriteInModal` | catchtap on favorite wrapper in modal | `data-item` (selectedVendor) |
| `goToVendorPage` | tap on detail-header in modal | `data-vendor-id` |

### Navigation Flows
| From | To | Method | Condition |
|------|-----|--------|-----------|
| Index | Login | `wx.navigateTo('/pages/login/login')` | Not logged in, various triggers |
| Index | Map | `wx.switchTab('/pages/map/map')` | goMap() |
| Index | Favorite | `wx.switchTab('/pages/favorite/favorite')` | goFavorite() |
| Index | Hot Ranking | `wx.navigateTo` with lat/lng params | goHotList() |
| Index | My Reviews | `wx.navigateTo('/pages/my-reviews/my-reviews')` | goComments(), requires login |
| Index | Vendor (my) | `wx.navigateTo('/pages/vendor/vendor')` | goBecomeVendor(), already has vendor |
| Index | Apply Vendor | `wx.navigateTo('/pages/apply-vendor/apply-vendor')` | goBecomeVendor(), no vendor |
| Index | Review List | `wx.navigateTo` with vendorId+vendorName | onViewAllReviews() |
| Index | Add Review | `wx.navigateTo` with vendorId+vendorName | onAddReview(), requires login |
| Index | Vendor Detail | `wx.navigateTo` with id param | goToVendorPage() |
| Index | Native Map | `wx.openLocation()` | navigateToVendor() |

### Notable Patterns
1. **Defensive API response handling**: `Array.isArray(res) ? res : (res?.data || [])` pattern used throughout
2. **Favorite state sync**: Two separate functions (`onToggleFavorite` for cards, `onToggleFavoriteInModal` for modal) with duplicated logic
3. **Login gating**: Multiple functions check `isLoggedIn` before allowing actions (favorite, review, become vendor, comments)
4. **GlobalData refresh flag**: `app.globalData.needRefreshVendors` used to trigger data refresh on page return
5. **Distance formatting**: Converts meters to "Xm" and kilometers to "X.XXkm"
6. **Unused function**: `calculateDistance()` (Haversine) is defined but never called — distance comes from API
7. **Event bubbling prevention**: Uses `catchtap` instead of `bindtap` for action buttons inside tappable cards

---

## File 2: pages/index/index.wxml

### Purpose
Template file defining the home page UI structure with 5 major sections: header, banner, category grid, quick strip, vendor list, and vendor detail modal.

### Page Structure (Top to Bottom)
```
.container
├── .home-header (黄色头部)
│   ├── .location-row
│   │   ├── .location-left (📍 + address + ▾)
│   │   └── .weather-badge ("☀️ 发现好摊")
│   └── .search-bar (🔍 + placeholder text)
├── .banner-card (运营Banner)
│   ├── .banner-title ("发现身边好摊位")
│   ├── .banner-sub ("3公里内精选美食摊位")
│   └── .banner-tag ("🔥 今日热门")
├── .category-grid (功能入口 4×2)
│   ├── cat-item: 附近摊位 → goNearby
│   ├── cat-item: 地图找摊 → goMap
│   ├── cat-item: 热门排行 → goHotList
│   ├── cat-item: 我的收藏 → goFavorite
│   ├── cat-item: 美食小吃 → goCategories
│   ├── cat-item: 手工文创 → goAllServices
│   ├── cat-item: 我的评价 → goComments
│   └── cat-item: 成为摊主 → goBecomeVendor
├── .quick-strip (快速状态条)
│   ├── chip: "附近{{vendors.length}}家摊位"
│   ├── chip: "排行榜更新"
│   └── chip: "📝 成为摊主" → goBecomeVendor
├── .vendor-section (推荐摊位)
│   ├── .section-header ("推荐摊位" + "智能排序 ›")
│   ├── .vendor-list
│   │   └── wx:for vendors → .vendor-card-mt
│   │       ├── .vcm-top
│   │       │   ├── .vcm-thumb (🍜 emoji + status badge)
│   │       │   └── .vcm-info (name + stars + distance + tags)
│   │       └── .vcm-bottom
│   │           ├── .vcm-address (📍 address)
│   │           └── .vcm-actions (nav-btn + fav-btn)
│   └── .empty-state (when vendors.length === 0 && location)
└── .vendor-detail-modal (wx:if vendorDetailVisible)
    ├── .modal-mask (overlay, tap to close)
    └── .modal-content
        ├── .close-btn (✕)
        ├── .detail-header (avatar + name + rating + favorite)
        ├── .detail-body → .detail-info-grid (4 cells: address, distance, phone, details)
        ├── .modal-section "🔥 热销产品"
        │   └── wx:for vendorProducts (max 5) → .modal-product-card
        ├── .modal-section "💬 最新评价"
        │   └── wx:for recentReviews → .modal-review-item
        ├── .empty-reviews (when no reviews)
        └── .modal-actions
            ├── "📝 发表评价" button
            └── "🧭 导航前往" button
```

### Data Bindings (WXML expressions)
| Expression | Source Data | Location |
|-----------|-------------|----------|
| `{{address \|\| '定位中...'}}` | `data.address` | location-text |
| `{{vendors.length}}` | `data.vendors.length` | quick-chip |
| `{{vendors}}` | `data.vendors` | wx:for vendor cards |
| `{{item.stallName}}` | vendor item | card name, modal name |
| `{{item.status === 1 ? '' : 'closed'}}` | vendor item | open badge class |
| `{{item.status === 1 ? '营业中' : '已收摊'}}` | vendor item | open badge text |
| `{{item.distanceText}}` | vendor item (computed) | distance display |
| `{{item.hotProducts}}` | vendor item | product tags |
| `{{item.address}}` | vendor item | address display |
| `{{item.isFavorite}}` | vendor item (computed) | favorite heart |
| `{{vendors.length === 0 && location}}` | computed | empty state visibility |
| `{{vendorDetailVisible && selectedVendor}}` | data | modal visibility |
| `{{selectedVendor.*}}` | data | modal content |
| `{{averageRating.toFixed(1)}}` | data (API) | rating score |
| `{{reviewCount}}` | data (API) | review count |
| `{{vendorProducts}}` | data (API) | product list |
| `{{recentReviews}}` | data (API) | review list |
| `{{stars}}` | data ([1,2,3,4,5]) | star rating loop |
| `{{isLoggedIn}}` | data | favorite button visibility |

### Conditional Rendering (wx:if)
| Condition | Element | Purpose |
|-----------|---------|---------|
| `item.hotProducts` | tag row | Show product tags only if available |
| `item.address` | address text | Show address only if available |
| `isLoggedIn` | fav-btn | Only show favorite button when logged in |
| `item.isFavorite` | heart icon | ❤️ vs 🤍 |
| `vendors.length === 0 && location` | empty-state | Show empty when no vendors |
| `vendorDetailVisible && selectedVendor` | modal | Show/hide detail modal |
| `averageRating > 0` | rating display | Show rating or "暂无评分" |
| `selectedVendor.address` | address cell | Conditional info cell |
| `selectedVendor.phone` | phone cell | Conditional phone cell |
| `vendorProducts.length > 0 \|\| selectedVendor.products.length > 0` | products section | Show products if any |
| `index < 5` | product card | Limit to 5 products |
| `item.description` | product desc | Optional description |
| `recentReviews.length > 0` | reviews section | Show reviews or empty state |
| `item.content` | review content | Optional review text |
| `star <= item.rating` / `star > item.rating` | star icons | Filled ★ vs empty ☆ |

### Notable WXML Patterns
1. **Star rendering**: Uses nested `wx:for` with `wx:for-item="star"` and conditional ★/☆
2. **Product limit**: Uses `wx:if="{{index < 5}}"` on `<block>` to limit displayed products
3. **Event bubbling**: `catchtap` on favorite buttons and navigation buttons inside tappable cards
4. **Modal overlay**: Uses `bindtap` on mask (propagates) but `catchtap` would be needed if mask is inside a tappable parent
5. **Placeholder images**: Uses `https://via.placeholder.com/...` as fallback for product/review images
6. **Search bar is non-functional**: Just a static visual element, no input field

---

## File 3: pages/index/index.wxss

### Purpose
Complete stylesheet for the home page. 860 lines covering all visual components with a consistent design system.

### Design System
- **Background**: `#F5F5F5` (light gray)
- **Primary accent**: `#FFD100` (yellow, header/buttons)
- **Secondary accent**: `#FF6633` (orange, CTAs/tags)
- **Hot accent**: `#FF3366` (pink-red, banner gradient)
- **Success/active**: `#00C853` (green, open status/distance)
- **Text hierarchy**: `#1A1A1A` (primary), `#333` (secondary), `#666` (tertiary), `#999` (muted), `#BBB` (placeholder)
- **Card style**: White `#fff`, border-radius `20rpx`, shadow `0 2rpx 12rpx rgba(0,0,0,0.04~0.05)`
- **Font family**: `-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif`

### CSS Sections (in order)
| Section | Lines | Key Classes | Purpose |
|---------|-------|-------------|---------|
| 全局基础 | 1-24 | `page`, `.container` | Reset + base styles |
| 黄色头部 | 26-94 | `.home-header`, `.location-row`, `.search-bar` | Header with location + search |
| 运营Banner | 96-126 | `.banner-card`, `.banner-title/sub/tag` | Promotional gradient banner |
| 功能入口网格 | 128-179 | `.category-grid`, `.cat-item`, `.cat-icon.c1-c8` | 4×2 icon grid with gradient backgrounds |
| 快速状态条 | 181-216 | `.quick-strip`, `.quick-chip`, `.qc-dot` | Status chips with colored dots |
| 推荐摊位Section | 218-242 | `.vendor-section`, `.section-header/title/more` | Section header |
| 摊位卡片 | 244-414 | `.vendor-card-mt`, `.vcm-*` | Card with thumbnail, info, actions |
| 空状态 | 416-434 | `.empty-state`, `.empty-icon/text` | Empty state display |
| 弹窗 | 436-484 | `.vendor-detail-modal`, `.modal-mask/content`, `.close-btn` | Modal overlay + content |
| 弹窗头部 | 486-584 | `.detail-header/avatar/info/name/rating` | Modal header section |
| 弹窗信息网格 | 586-634 | `.detail-body/info-grid/cell` | 2×2 info cells |
| 弹窗内section | 636-662 | `.modal-section`, `.view-all` | Section containers |
| 弹窗商品列表 | 664-735 | `.modal-product-*`, `.price-*` | Product cards in modal |
| 弹窗评价列表 | 737-797 | `.modal-review-*` | Review items in modal |
| 空评价 | 799-809 | `.empty-reviews` | Empty reviews state |
| 弹窗底部操作 | 812-859 | `.modal-actions`, `.modal-action-btn.primary/secondary` | Bottom action buttons |

### Notable CSS Patterns
1. **Vendor prefix doubling**: Every flex property uses both `-webkit-flex` and standard `flex` (maximum compatibility)
2. **Gradient backgrounds**: 8 unique gradient classes (`.c1` through `.c8`) for category icons
3. **Linear gradient banner**: `linear-gradient(135deg, #FF6633, #FF3366)` for promotional banner
4. **Ellipsis overflow**: Consistent `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` pattern
5. **Fixed bottom modal**: `position:fixed; bottom:0` with `max-height:80vh; overflow-y:auto`
6. **Button reset**: `.modal-action-btn::after { border: none; }` removes WeChat default button border
7. **Status badge overlay**: Absolute positioned at bottom of thumbnail with semi-transparent background

---

## File 4: pages/index/index.json

### Purpose
Page-level configuration for the index page.

### Content
```json
{
  "usingComponents": {}
}
```

### Observations
- **No custom components**: Empty `usingComponents` — this page uses only native WeChat components
- **No navigation bar config**: Inherits global `app.json` settings for navigation bar title, color, etc.
- **No enablePullDownRefresh**: Pull-down refresh is not enabled on this page
- **Minimal configuration**: Relies entirely on global config; no page-level overrides
- **No plugins**: No third-party plugins registered

---

## Cross-File Summary

### Architecture Pattern
- **MVC-like**: JS (controller) ↔ WXML (view/template) ↔ WXSS (view styles), with JSON as config
- **Data-driven**: All UI state managed through `Page.data` and `setData()`
- **Modal instead of navigation**: Vendor details shown in bottom-sheet modal rather than separate page
- **API dependency**: Heavy reliance on `utils/api.js` module — imports `favoriteApi`, `vendorApi`, `reviewApi`, `productApi`, `API_BASE_URL`, `getUserId`

### Key Integration Points
1. `vendorApi.getSmartRecommendedVendors()` — primary data source (not `getNearbyVendors`)
2. `favoriteApi` — full CRUD for favorites with local state sync
3. `reviewApi` — rating + reviews for detail modal
4. `productApi` — product list for detail modal
5. `app.globalData` — shared state for `userInfo`, `token`, `needRefreshVendors`

### Potential Issues / Code Smells
1. `calculateDistance()` defined but unused (dead code)
2. Search bar is visual-only (no input, no navigation)
3. `goCategories()` and `goAllServices()` are placeholders (show toast only)
4. Favorite toggle logic duplicated between `onToggleFavorite` and `onToggleFavoriteInModal`
5. `onVendorCardTap` makes 4 sequential API calls (not parallelized)
6. Markers are created but never displayed (no map component in WXML)
7. Hard-coded emoji icons instead of dynamic data (🍜 for all vendors)
8. `address` field shows raw coordinates instead of reverse-geocoded address
