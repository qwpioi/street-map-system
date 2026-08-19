# WeChat Mini-Program Codebase — Complete Page Analysis

> Generated: 2026-08-19
> Files analyzed: 52 files across 13 pages
> Note: The "observe" tool was unavailable, so findings are compiled here directly.

---

## Table of Contents

1. [Favorite Page](#favorite-page)
2. [Profile Page](#profile-page)
3. [Hot Ranking Page](#hot-ranking-page)
4. [My Reviews Page](#my-reviews-page)
5. [Add Review Page](#add-review-page)
6. [Review List Page](#review-list-page)
7. [Apply Vendor Page](#apply-vendor-page)
8. [Product Manage Page](#product-manage-page)
9. [Product Form Page](#product-form-page)
10. [Edit Phone Page](#edit-phone-page)
11. [Login Page](#login-page)
12. [Agreement Page](#agreement-page)
13. [Logs Page](#logs-page)
14. [Cross-Page Patterns](#cross-page-patterns)

---

## 1. Favorite Page

### favorite.js
**Purpose:** Favorite list page (TabBar). Requires login. Displays user's saved vendors.

**Data Fields:** `favorites: []`, `loading: false`, `isLoggedIn: false`

**Functions:**
- `onLoad()` → calls `checkLogin()`
- `onShow()` → refreshes favorites if logged in
- `checkLogin()` → reads `getUserId()` and token; if missing, shows modal and redirects to index via `wx.switchTab`
- `loadFavorites()` → calls `favoriteApi.getFavorites()`, processes data mapping `vendorId/stallName/address/hotProducts/latitude/longitude/favoriteId/createTime`. Defensive: checks `res.code === 200`
- `onFavoriteItemTap(e)` → opens `wx.openLocation()` for the vendor's coordinates
- `onCancelFavorite(e)` → shows confirm modal, calls `favoriteApi.removeFavorite()`, removes from local array
- `goHome()` → `wx.switchTab` to index

**API Calls:** `favoriteApi.getFavorites()`, `favoriteApi.removeFavorite(vendorId)`

**Notable Patterns:**
- Defensive API response parsing: checks `res.code !== 200`
- Local-first delete: removes from array without reloading
- `catchtap` on cancel button prevents bubbling to card tap

### favorite.wxml
**Structure:** Three states: loading → empty → data
- Loading: hourglass emoji
- Empty: star emoji + "去首页逛逛" button
- Data: yellow header ("我的收藏" + count) + card list

**Bindings:** `{{loading}}`, `{{favorites.length === 0}}`, `{{favorites}}`, `{{item.stallName}}`, `{{item.address}}`, `{{item.hotProducts}}`, `{{item.createTime}}`

**Events:** `bindtap="onFavoriteItemTap"`, `catchtap="onCancelFavorite"`, `bindtap="goHome"`

### favorite.wxss
**Key Styles:** `#F5F5F5` bg, `#FFD100` yellow header, white cards `20rpx` rounded, `#FFE0B2→#FFCC80` gradient thumb, `#FF6633` orange for unfavorite button, `#FFF3E0` tint. Uses webkit flex prefixes for old iOS.

### favorite.json
```json
{ "usingComponents": {} }
```
No custom nav bar.

---

## 2. Profile Page

### profile.js
**Purpose:** Personal center TabBar page. Displays user info, navigation to various features.

**Data Fields:** `userInfo: null`, `isLoggedIn: false`, `isVendor: false`, `vendorInfo: null`

**Functions:**
- `onLoad()` → `checkLogin()`
- `onShow()` → refreshes if logged in
- `checkLogin()` → reads userId/token, calls `loadUserInfo()` and `loadVendorInfo()` if logged in
- `loadUserInfo()` → calls `userApi.getUserInfo()` (or reads from storage)
- `loadVendorInfo()` → calls `vendorApi.getMyVendor()`, sets `isVendor` if success
- `onAvatarTap()` → if logged in, shows action sheet to change avatar; else prompts login
- `goLogin()` → `wx.navigateTo` to login page
- `goVendor()` → `wx.navigateTo` to vendor page (only if isVendor)
- `goApplyVendor()` → `wx.navigateTo` to apply-vendor (only if not isVendor)
- `goFavorite()` → `wx.switchTab` to favorite
- `goMyReviews()` → `wx.navigateTo` to my-reviews
- `goHotRanking()` → gets location via `wx.getLocation`, navigates to hot-ranking with lat/lng params
- `goAgreement()` / `goPrivacy()` → `wx.navigateTo` to agreement page with type param
- `logout()` → clears storage + globalData, reLaunch to login
- `onCustomerService()` → placeholder for customer service

**API Calls:** `userApi.getUserInfo()`, `vendorApi.getMyVendor()`

**Navigation:** login, vendor, apply-vendor, favorite, my-reviews, hot-ranking, agreement

**Notable Patterns:**
- Heavy navigation hub — acts as main menu
- Uses `wx.getLocation` before hot-ranking to pass coords
- Logout clears both storage and globalData then `reLaunch` to login
- Menu items shown conditionally based on vendor status

### profile.wxml
**Structure:**
- User section: avatar (with tap), name, phone
- Menu list: 我的摊位 / 申请成为摊主 / 我的收藏 / 我的评价 / 热门排行 / 用户协议 / 隐私政策 / 联系客服 / 退出登录
- Each menu item: icon emoji + text + right arrow

**Bindings:** `{{userInfo.avatar}}`, `{{userInfo.nickName || '未登录'}}`, `{{userInfo.phone || '未绑定手机'}}`, `{{isLoggedIn}}`, `{{isVendor}}`

**Events:** `bindtap` on avatar, each menu item, logout

### profile.wxss
**Key Styles:** `#FFD100` yellow header section with gradient, white menu items with `#F5F5F5` bg, `20rpx` card radius, avatar 120rpx circle, menu items with bottom border separator, `#FF6633` logout button, `#FFD100` icons on some items.

### profile.json
```json
{
  "navigationBarTitleText": "个人中心",
  "navigationBarBackgroundColor": "#FFD100",
  "navigationBarTextStyle": "black"
}
```

---

## 3. Hot Ranking Page

### hot-ranking.js
**Purpose:** Hot ranking page. Loads vendors within 3KM sorted by rating descending.

**Data Fields:** `vendors: []`, `loading: true`, `latitude/longitude: 0`, `stars: [1,2,3,4,5]` (unused)

**Functions:**
- `onLoad(options)` → parses lat/lng from URL, calls `loadHotRanking()`
- `loadHotRanking(lat, lng)` → calls `vendorApi.getHotRankingVendors()`. Defensive: `Array.isArray(res) ? res : (res?.data || [])`. Maps to add `rank` (index+1), `distanceText` (m/km), `hotProductsArray` (splits by Chinese+English comma)
- `onVendorTap(e)` → `wx.navigateTo` to vendor-detail

**API Calls:** `vendorApi.getHotRankingVendors(lat, lng)` → `GET /api/vendor/hot-ranking`

**Notable Patterns:**
- `stars` in data is dead code (WXML uses inline `[1,2,3,4,5]`)
- `hotProducts.split(/[,，]/)` handles both comma types but no empty-string filtering
- No `wx.getLocation` fallback if coords missing — shows empty state silently

### hot-ranking.wxml
**Structure:** Three states: loading → empty (🔥) → ranked cards

**Bindings:** `{{vendors}}`, `{{item.rank}}`, `{{item.rank <= 3 ? 'top' : 'normal'}}` (class), `{{item.rank === 1/2/3}}` (medal emoji), `{{item.stallName}}`, `{{item.averageRating}}`, `{{item.reviewCount}}`, `{{item.address}}`, `{{item.hotProductsArray.length > 0}}`, `{{item.distanceText}}`

**Events:** `bindtap="onVendorTap"`

### hot-ranking.wxss
**Key Styles:** `#f5f5f5` bg, white cards `20rpx` rounded, `linear-gradient(135deg, #FF6633, #FF3366)` for top-3 rank badge, `#FF6633` rating text, `rgba(255,102,51,0.08)` tag bg, `#00C853` green distance text, `#f0f0f0` normal rank badge.

### hot-ranking.json
```json
{ "navigationBarTitleText": "热门排行", "usingComponents": {} }
```
Default nav bar (no custom color).

---

## 4. My Reviews Page

### my-reviews.js
**Purpose:** User's review history with stats. Supports delete and navigate to vendor.

**Data Fields:** `reviews: []`, `loading: false`, `isLoggedIn: false`, `stats: { totalCount: 0, averageRating: 0 }`, `stars: [1,2,3,4,5]` (actually used)

**Functions:**
- `onLoad()` → `checkLogin()`
- `onShow()` → reloads if logged in
- `checkLogin()` → auth check, redirects to index if not logged in
- `loadReviews()` → `reviewApi.getUserReviews()`, defensive normalize, maps `reviewId→id`, formats time, calls `computeStats()`
- `computeStats(reviews)` → calculates totalCount + averageRating (1 decimal). Uses path setData `'stats.totalCount'`
- `onReviewTap(e)` → navigate to vendor-detail
- `deleteReview(e)` → confirm modal, `reviewApi.deleteReview()`, local filter, recompute stats
- `goHome()` → `wx.switchTab` to index
- `formatTime(timeStr)` → relative time: <1min 刚刚, <1hr X分钟前, <24hr X小时前, <7days X天前, else M/D

**API Calls:** `reviewApi.getUserReviews()`, `reviewApi.deleteReview(reviewId)`

### my-reviews.wxml
**Structure:** Three states + stats card + review list

**Bindings:** `{{stats.totalCount}}`, `{{stats.averageRating}}`, `{{stars}}` (in stats), `{{reviews}}`, `{{item.vendorId}}`, `{{item.vendorName}}`, `{{item.id}}`, `{{item.rating}}`, `{{item.content}}`, `{{item.createTime}}`

**Events:** `bindtap="onReviewTap"`, `catchtap="deleteReview"` (uses catchtap to prevent bubbling)

### my-reviews.wxss
**Key Styles:** `#FFD100` nav bar + stat values, `#e74c3c` delete button, stat value extra-large `56rpx` bold, delete button as outlined red pill.

### my-reviews.json
```json
{
  "navigationBarTitleText": "我的评价",
  "navigationBarBackgroundColor": "#FFD100",
  "navigationBarTextStyle": "black"
}
```
Custom yellow nav bar.

---

## 5. Add Review Page

### add-review.js
**Purpose:** Form to submit a review with star rating and text content.

**Data Fields:** `vendorId`, `vendorName`, `rating: 0`, `content: ''`, `stars: [1,2,3,4,5]`, `submitting: false`

**Functions:**
- `onLoad(options)` → sets vendorId/vendorName from URL
- `onStarTap(e)` → sets rating to tapped star value
- `onContentInput(e)` → updates content
- `onSubmit()` → validates (userId, rating > 0, content not empty), calls `reviewApi.addReview()`. On success, navigates back and refreshes prev page via `prevPage.loadVendorDetail(vendorId)`

**API Calls:** `reviewApi.addReview(vendorId, rating, content)`

**Notable Patterns:**
- Reaches into parent page's method to trigger refresh: `prevPage.loadVendorDetail(vendorId)` — fragile coupling
- 1.5s delay before navigateBack
- `rating == 0` uses loose equality

### add-review.wxml
**Structure:** Vendor info card → rating section (5 stars + text) → content section (textarea + char count) → submit button

**Bindings:** `{{vendorName}}`, `{{stars}}`, `{{star <= rating ? 'active' : ''}}`, `{{rating}}`, `{{content}}`, `{{content.length}}/500`, `{{!rating || !content}}` (disabled)

**Events:** `bindtap="onStarTap"`, `bindinput="onContentInput"`, `bindtap="onSubmit"`

### add-review.wxss
**Key Styles:** `#f5f5f5` bg, white cards `10rpx` rounded (less rounded than other pages), `#ff9800` orange rating text, active star `transform: scale(1.1)`, inactive `opacity: 0.3`, `#07c160` WeChat green submit button, `#ccc` when disabled.

**Notable:** Uses `10rpx` border-radius (inconsistent with `20rpx` standard elsewhere). Submit button `#07c160` green — inconsistent with project's `#FFD100` yellow.

### add-review.json
```json
{ "usingComponents": {}, "navigationBarTitleText": "添加评价" }
```

---

## 6. Review List Page

### review-list.js
**Purpose:** Half-screen modal showing vendor reviews with swipe-down-to-close gesture. Auto-opens on load.

**Data Fields:** `reviews: []`, `averageRating: 0`, `vendorId`, `vendorName`, `loading: false`, `showModal: false`, `stars: [1,2,3,4,5]`, `currentUserId`, `touchStartY`, `touchMoveY`, `touchThreshold: 100`

**Functions:**
- `onLoad(options)` → reads vendorId/vendorName, sets currentUserId, calls `showReviewModal()`
- `onShow()` → reloads reviews if returning from add-review
- `showReviewModal()` → sets `showModal: true`, delays `loadReviews()` by 300ms (for animation)
- `closeModal()` → hides modal, delays `wx.navigateBack` by 300ms
- `loadReviews()` → calls `reviewApi.getVendorReviews()`, maps `reviewId→id`, then chains `reviewApi.getAverageRating()` for average. Uses `.then()` chaining
- `goToAddReview()` → navigate to add-review with vendorId/vendorName
- `deleteReview(e)` → confirm modal, `reviewApi.deleteReview()`, local filter
- `onDragStart/Move/End()` → tracks touch gesture, closes modal if swipe down > 100px threshold
- `formatTime(timeStr)` → same relative time formatter as my-reviews

**API Calls:** `reviewApi.getVendorReviews()`, `reviewApi.getAverageRating()`, `reviewApi.deleteReview()`

**Notable Patterns:**
- `catchtouchmove="{{true}}"` on modal root prevents background scroll
- Promise chaining for two sequential API calls (reviews + average)
- Delete button visibility: `item.userId === currentUserId` (string comparison, both normalized via `String()`)
- Touch gesture handling for native-feeling swipe-to-dismiss

### review-list.wxml
**Structure:** Full-screen overlay + half-screen modal sliding from bottom

**Sections:**
- Modal drag bar (with drag indicator)
- Header: title + close button (✕)
- Average rating section: big score + filled/empty stars + count (gradient bg)
- Scrollable review list: per review — username, time, delete (conditional), stars, content
- Empty/loading states inside scroll
- Footer: "✍️ 写评价" button
- Background overlay

**Bindings:** `{{showModal}}`, `{{vendorName}}`, `{{averageRating.toFixed(1)}}`, `{{[1,2,3,4,5]}}` (stars), `{{reviews}}`, `{{item.userName}}`, `{{item.createTime}}`, `{{item.userId === currentUserId}}`, `{{item.id}}`, `{{item.rating}}`, `{{item.content}}`

**Events:** `bindtouchstart/move/end="onDragStart/Move/End"`, `bindtap="closeModal"`, `bindtap="goToAddReview"`, `bindtap="deleteReview"`

### review-list.wxss
**Key Styles:** 
- `page { background-color: transparent }` — hides original page
- Modal: fixed bottom, `translateY(100%)` → `0` transition, `max-height: 65vh`, `24rpx` top border-radius
- Drag indicator: `80rpx × 8rpx` gray pill
- Average section: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` purple gradient bg, white text, `80rpx` big score
- `#e74c3c` delete button, `#FFD100` "写评价" button
- `z-index: 1000` for modal, `999` for overlay

**Notable:** Uses custom navigation (`"navigationStyle": "custom"`) — only page in this set with custom nav style. Purple gradient is unique to this page.

### review-list.json
```json
{
  "usingComponents": {},
  "navigationBarTitleText": "评价列表",
  "navigationStyle": "custom"
}
```

---

## 7. Apply Vendor Page

### apply-vendor.js
**Purpose:** Vendor application form with location pickup.

**Data Fields:** `stallName`, `hotProducts`, `description`, `phone`, `latitude`, `longitude`, `address`, `submitting: false`

**Functions:**
- `onInputStallName/Products/Desc/Phone(e)` → input handlers
- `getLocation()` → `wx.getLocation(type: 'gcj02')`, updates lat/lng/address
- `onSubmit()` → validates stallName (required), phone (regex `/^1[3-9]\d{9}$/`), location. Calls `vendorApi.applyVendor()`. On success, `wx.redirectTo` to vendor page after 1.5s

**API Calls:** `vendorApi.applyVendor({stallName, phone, address, latitude, longitude, hotProducts, description})` → `POST /api/vendor/apply`

**Notable Patterns:**
- Uses `wx.redirectTo` (not navigateTo) to prevent return stack
- Phone regex validates Chinese mobile numbers
- Location failure shows modal prompting authorization
- Address defaults to '未知地址' if empty

### apply-vendor.wxml
**Structure:** Card with 5 form groups + submit button
- 摊位名称 (required input)
- 联系电话 (required, number type, maxlength=11)
- 摊位地址 (disabled input + 📍 location button)
- 热销产品 (optional input)
- 摊位描述 (optional textarea)
- 提交申请 button with loading state

**Bindings:** `{{address}}`, `{{submitting}}`

**Events:** `bindinput` for all fields, `bindtap="getLocation"`, `bindtap="onSubmit"`

### apply-vendor.wxss
**Key Styles:** `#f5f5f5` bg, white card `20rpx` rounded, `#f9f9f9` input bg, `#FFD100` location and submit buttons. Uses `env(safe-area-inset-bottom)` for iPhone X+ safe area. Submit button shadow uses `rgba(76,175,80,0.3)` (green, inconsistent with yellow main color).

### apply-vendor.json
```json
{
  "navigationBarTitleText": "申请摊位",
  "navigationBarBackgroundColor": "#FFD100",
  "navigationBarTextStyle": "black"
}
```

---

## 8. Product Manage Page

### product-manage.js
**Purpose:** Product list management — add, edit, delete products.

**Data Fields:** `vendorId`, `products: []`, `loading: false`

**Functions:**
- `onLoad(options)` → gets vendorId param, validates, calls `loadProducts()`
- `onShow()` → refreshes if vendorId exists and not loading
- `loadProducts()` → `productApi.getProducts(vendorId)`
- `onAdd()` → navigate to product-form with vendorId
- `onEdit(e)` → navigate to product-form with vendorId + product id
- `onDelete(e)` → confirm modal (red confirm color), `productApi.deleteProduct(id)`, refreshes list, sets `globalData.needRefreshVendors = true`

**API Calls:** `productApi.getProducts()`, `productApi.deleteProduct()`

### product-manage.wxml
**Structure:** Header (title + add button) → product list (or empty state)

**Bindings:** `{{products.length > 0}}`, `{{products}}`, `{{item.imageUrl}}`, `{{item.name}}`, `{{item.description}}`, `{{item.price}}`, `{{item.status == 1 ? '上架' : '下架'}}`, `{{item.id}}`

**Events:** `bindtap="onAdd"`, `bindtap="onEdit"`, `bindtap="onDelete"`

**Notable Bug:** `{{item.description && item.description.indexOf('') === -1}}` — `indexOf('')` always returns 0, so condition is always false. Description is NEVER shown. This is a bug.

### product-manage.wxss
**Key Styles:** Three-column layout using float (image + info + actions). Image `120rpx × 120rpx` with `🍳` emoji placeholder, info uses `margin-left: 140rpx` and `margin-right: 120rpx`. `#ff6b00` orange price, `#e8f4fd` blue edit button, `#fde8e8` red delete button, `#e6f9ef` green tag bg. Uses `::after` clearfix.

### product-manage.json
```json
{ "navigationBarTitleText": "商品管理" }
```

---

## 9. Product Form Page

### product-form.js
**Purpose:** Add/edit product form with image upload.

**Data Fields:** `vendorId`, `productId`, `isEdit`, `formData: { name, description, price, imageUrl }`, `imageTempPath`, `uploading: false`

**Functions:**
- `onLoad(options)` → extracts vendorId/productId, sets `isEdit = !!productId`, calls `loadProduct()` if editing
- `loadProduct(id)` → `productApi.getProducts(vendorId)`, finds by loose `==` id match
- `onChooseImage()` → `wx.chooseMedia`, sets `imageTempPath`
- `onRemoveImage()` → clears imageTempPath and formData.imageUrl
- `onSubmit(e)` → validates name + price. If temp image exists, calls `doUploadAndSubmit`; else `doSubmit`
- `doUploadAndSubmit()` → `uploadApi.uploadImage()`, stores returned URL, then `doSubmit`
- `doSubmit()` → guards against double-submit, routes to `doAdd` or `doUpdate`
- `doAdd(data)` / `doUpdate(data)` → `productApi.addProduct/updateProduct`. Sets `globalData.needRefreshVendors = true`
- `onCancel()` → navigateBack

**API Calls:** `productApi.getProducts()`, `productApi.addProduct()`, `productApi.updateProduct()`, `uploadApi.uploadImage()`

**Notable Patterns:**
- Two-phase submit: image upload → form submit
- Loose equality `p.id == id` for product lookup
- Upload guard prevents double-submit

### product-form.wxml
**Structure:** Form with 4 groups (name, description, price, image) + submit/cancel buttons

**Bindings:** `{{formData.name}}`, `{{formData.description}}`, `{{formData.price}}`, `{{!imageTempPath}}` / `{{imageTempPath}}`, `{{uploading}}`, `{{isEdit}}`

**Events:** `bindsubmit="onSubmit"`, `bindtap="onChooseImage"`, `bindtap="onRemoveImage"`, `bindtap="onCancel"`

### product-form.wxss
**Key Styles:** White card form groups `12rpx` rounded, `#f9f9f9` input bg, `#07C160` WeChat green submit button (**inconsistent with project's #FFD100**), `200rpx` image picker with 📷 emoji, remove button absolute positioned top-right with custom corner radius.

### product-form.json
```json
{ "navigationBarTitleText": "商品编辑" }
```

---

## 10. Edit Phone Page

### edit-phone.js
**Purpose:** Edit vendor's phone number. Uses **raw `wx.request`** instead of wrapped API.

**Data Fields:** `phone`, `saving: false`

**Functions:**
- `onLoad(options)` → sets initial phone from options
- `onInputPhone(e)` → updates phone
- `onSave()` → validates phone regex `/^1[3-9]\d{9}$/`, manually constructs `wx.request` PUT to `/vendor/phone` with `Authorization: Bearer ${token}` header

**API Calls:** Raw `wx.request` to `PUT ${API_BASE_URL}/vendor/phone`

**Notable Patterns:**
- **Bypasses the centralized API wrapper** — doesn't get automatic 401/403 handling
- Manual token handling via `getToken()`
- Error uses `wx.showModal` (dialog), validation uses `wx.showToast`

### edit-phone.wxml
**Structure:** Minimal — one form group (label + input) + save button

**Bindings:** `{{phone}}`, `{{saving}}` (button loading state)

**Events:** `bindinput="onInputPhone"`, `bindtap="onSave"`

### edit-phone.wxss
**Key Styles:** Compact. Input `#f5f5f5` bg on page bg (no card wrapper), `#FFD100` save button (consistent with project).

### edit-phone.json
```json
{ "navigationBarTitleText": "编辑联系电话" }
```

---

## 11. Login Page

### login.js
**Purpose:** WeChat OAuth login page.

**Data Fields:** none

**Functions:**
- `onLoad()` → if token exists, `wx.reLaunch` to index
- `wxLogin()` → `wx.login` → `loginToServer(code)`
- `loginToServer(code)` → direct `wx.request` to `http://192.168.1.5:8081/api/auth/wechat-login` (**hardcoded local dev URL!**). Stores token+userInfo in storage and globalData. After 1s delay, reLaunch to index
- `goAgreement()` / `goPrivacy()` → navigate to agreement page

**API Calls:** Direct `wx.request` to `/api/auth/wechat-login` (hardcoded dev URL)

**Notable Patterns:**
- **Hardcoded `192.168.1.5:8081`** — should use API_BASE_URL
- Dual storage: localStorage + globalData

### login.wxml
**Structure:** Logo (🛒 emoji) + welcome text + login button (💚) + legal tips (agreement + privacy links)

### login.wxss
**Key Styles:** `linear-gradient(135deg, #FFD100, #FFC107)` yellow bg, white text, white button with yellow text, `50rpx` pill radius. Heavy `!important` on button.

### login.json
```json
{
  "navigationBarTitleText": "登录",
  "navigationBarBackgroundColor": "#FFD100",
  "navigationBarTextStyle": "black"
}
```

---

## 12. Agreement Page

### agreement.js
**Purpose:** Dynamic legal document display (agreement OR privacy policy).

**Data Fields:** `type`, `title`, `content: [{heading, text}]`

**Functions:**
- `onLoad(options)` → reads `type` param, sets title, loads content, sets nav bar title via `wx.setNavigationBarTitle`

**Content:** 10 sections each for agreement and privacy — hardcoded Chinese legal text

### agreement.wxml
**Structure:** Card with `wx:for="{{content}}"` looping sections. Each section: heading + text

**Bindings:** `{{content}}`, `{{item.heading}}`, `{{item.text}}`

### agreement.wxss
**Key Styles:** Card design `20rpx` rounded, `white-space: pre-line` for paragraph breaks, `1.8` line height, `#333` heading, `#666` body.

### agreement.json
```json
{ "navigationBarTitleText": "", "usingComponents": {} }
```
Empty title — set dynamically via JS.

---

## 13. Logs Page

### logs.js
**Purpose:** Default WeChat template page showing app launch history.

**Functions:**
- `onLoad()` → reads `logs` from storage, formats via `util.formatTime`

### logs.wxml
**Structure:** Scroll-view with numbered list of launch timestamps

**Bindings:** `{{logs}}`, `{{index + 1}}`, `{{log.date}}`

### logs.wxss
**Key Styles:** Minimal. `env(safe-area-inset-bottom)` for safe area.

### logs.json
```json
{ "usingComponents": {} }
```
Default template page.

---

## 14. Cross-Page Patterns

### Consistent Design System
- Page background: `#F5F5F5` (nearly universal)
- Card background: `#fff` with `20rpx` border-radius
- Brand yellow: `#FFD100` for buttons, nav bars, stat values
- Text colors: `#333` primary, `#666` secondary, `#999` tertiary, `#CCC` muted
- Subtle shadows: `0 2-4rpx 12-20rpx rgba(0,0,0,0.04-0.06)`
- Emoji icons used extensively (🍜 🍳 📦 📍 🔥 ⭐ 💬 💚 🛒 ✕ ✍️)

### Three-State Pattern
Most list pages follow: loading → empty → data. Uses `wx:if`/`wx:elif`/`wx:else` chain.

### Defensive API Response Handling
```js
const data = Array.isArray(res) ? res : (res?.data || [])
// OR
if (res.code !== 200 || !res.data) return
```

### Event Bubbling Control
`catchtap` (not `bindtap`) used for nested action buttons inside tappable cards:
- favorite: cancel favorite inside card
- my-reviews: delete button inside card

### Navigation Patterns
- `wx.switchTab` — for TabBar pages (index, favorite, profile)
- `wx.navigateTo` — for pushing onto stack
- `wx.redirectTo` — for apply-vendor (prevents back)
- `wx.reLaunch` — for login/logout (clears all stack)
- `wx.navigateBack` — for leaf pages returning to parent

### Auth Handling
Two patterns:
1. **Page-level check:** favorite, my-reviews — check userId + token, modal + redirect to index if not logged in
2. **API wrapper:** `utils/api.js` intercepts 401/403 and auto-redirects to login

### Refresh Strategies
- `onShow` refreshes data (favorite, profile, my-reviews, product-manage, review-list)
- Parent-page method invocation: add-review calls `prevPage.loadVendorDetail()`
- Global flag: `getApp().globalData.needRefreshVendors = true` (product-manage, product-form)

### Relative Time Formatting
Identical `formatTime()` function duplicated in:
- my-reviews.js
- review-list.js

Pattern: <1min 刚刚, <1hr X分钟前, <24hr X小时前, <7days X天前, else M/D

### Inconsistencies / Issues Found

| Issue | Location | Description |
|-------|----------|-------------|
| Hardcoded dev URL | login.js | `http://192.168.1.5:8081` should use `API_BASE_URL` |
| Bypassed API wrapper | edit-phone.js | Uses raw `wx.request`, missing 401/403 handling |
| Dead code | hot-ranking.js | `stars: [1,2,3,4,5]` declared but unused in data |
| Description never shown | product-manage.wxml | `indexOf('') === -1` always false — bug |
| Inconsistent button colors | add-review.js, product-form.js | Uses `#07c160` green vs project's `#FFD100` yellow |
| Inconsistent card radius | add-review.wxss | Uses `10rpx` vs project's `20rpx` standard |
| Inconsistent nav bars | hot-ranking.json vs my-reviews.json | One uses default, other uses custom `#FFD100` |
| Loose equality | hot-ranking.js, product-form.js | `==` used instead of `===` for comparisons |
| Fragile parent coupling | add-review.js | Reaches into `prevPage.loadVendorDetail()` |
| Duplicated formatTime | my-reviews.js, review-list.js | Should be extracted to utils |
| Shadowed hotProducts split | hot-ranking.js | Empty string produces `[""]` array, passes length check |
| Missing getLocation fallback | hot-ranking.js | No fallback if coords missing |
| Phone submit shadow color | apply-vendor.wxss | `rgba(76,175,80,0.3)` green vs `#FFD100` yellow theme |
