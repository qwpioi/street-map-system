# Vendor Edit JS — Detailed File Observation

## Project: WechatCode (地摊地图微信小程序)
## File: pages/vendor-edit/vendor-edit.js
## Concepts: frontend, wechat, page, vendor-edit

---

### Purpose
Page controller for the "编辑摊位信息" (Edit Vendor Info) page. Handles three editable fields — stall name, phone number, and stall avatar image. Receives initial values via URL parameters from the vendor page, manages image upload via `uploadApi`, validates inputs, and saves changes via `vendorApi.updateVendorInfo()`.

### Page Lifecycle
- **onLoad(options)** → Decodes and sets initial `stallName`, `phone`, `avatar` from URL query parameters using `decodeURIComponent()`

### Data Bindings (Page.data)
| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `stallName` | string | `''` | Stall name input value, bound to `<input>` |
| `phone` | string | `''` | Phone number input value, bound to `<input>` |
| `avatar` | string | `''` | Avatar image URL, controls image picker vs preview |
| `saving` | boolean | `false` | Loading state for save button (disables button, shows "保存中...") |

### Function Definitions (7 functions)

| Function | Type | Description |
|----------|------|-------------|
| `onLoad(options)` | lifecycle | Entry point: decodes URL params and populates form fields |
| `onChooseAvatar()` | async | Opens image chooser (album/camera), uploads via `uploadApi.uploadImage()`, sets `avatar` to returned URL on success |
| `onRemoveAvatar(e)` | sync | Clears `avatar` to empty string (removes preview) |
| `onCancel()` | navigation | Calls `wx.navigateBack()` to return to previous page |
| `onInputName(e)` | input handler | Updates `stallName` from input `e.detail.value` |
| `onInputPhone(e)` | input handler | Updates `phone` from input `e.detail.value` |
| `onSave()` | async | Validates inputs (name required, phone regex `^1[3-9]\d{9}$`), calls `vendorApi.updateVendorInfo()`, shows toast on success, navigates back after 1s delay |

### URL Parameter Decoding
```javascript
const safeDecode = (str) => {
  if (!str) return ''
  try { return decodeURIComponent(str) } catch (e) { return str }
}
```
This inner function handles URL-encoded parameters safely, falling back to raw string on decode failure. Applied to all three URL params: `stallName`, `phone`, `avatar`.

### Image Upload Flow
1. `wx.chooseImage()` → count:1, compressed, album+camera
2. Shows `wx.showLoading({ title: '上传中...' })`
3. `uploadApi.uploadImage(filePath)` → returns `{ code: 200, data: "url", message: null }`
4. Extracts URL: `uploadRes?.data || uploadRes || ''`
5. On success: `setData({ avatar: url })` + success toast
6. On failure: error toast
7. Always: `wx.hideLoading()`

### Input Validation (in onSave)
| Field | Rule | Error Message |
|-------|------|---------------|
| `stallName` | Must not be empty/whitespace | "请输入摊位名称" |
| `phone` | Optional; if provided must match `/^1[3-9]\d{9}$/` (Chinese mobile) | "手机号格式不正确" |

### API Calls
| API | Module | Used In | Purpose |
|-----|--------|---------|---------|
| `uploadApi.uploadImage(filePath)` | upload | `onChooseAvatar()` | Upload avatar image, returns URL |
| `vendorApi.updateVendorInfo({ stallName, phone, avatar })` | vendor | `onSave()` | Persist changes to backend |

### Imports
```javascript
const { vendorApi, uploadApi, API_BASE_URL } = require('../../utils/api')
```
- `vendorApi` — used for `updateVendorInfo()`
- `uploadApi` — used for `uploadImage()`
- `API_BASE_URL` — imported but **unused** in this file

### Error Handling Patterns
1. **Upload failure**: `.catch()` logs error to console, shows toast "上传失败"
2. **Save failure**: Two branches:
   - `res.code !== 200` → `wx.showModal` with API error message
   - `.catch()` network error → toast "网络错误"
3. **Avatar URL extraction**: Defensive `uploadRes?.data || uploadRes || ''` handles multiple response formats

### Navigation Flows
| From | To | Method | Trigger |
|------|-----|--------|---------|
| vendor page → vendor-edit | (arrives here) | `wx.navigateTo` with stallName/phone/avatar params | — |
| vendor-edit → previous page | `wx.navigateBack()` | `onCancel()` | Tap "取消" button |
| vendor-edit → previous page | `wx.navigateBack()` (after 1s delay) | `onSave()` success | Tap "保存" button |

### Notable Patterns
1. **Safe URL decode**: `safeDecode()` inner function with try/catch prevents decode errors from crashing the page
2. **Defensive upload response**: Handles both `{ code: 200, data: "url" }` and raw URL string responses
3. **Trim on save**: `stallName.trim()` and `phone.trim()` applied before API call but NOT before validation (name empty check uses untrimmed value but `.trim()` is applied in the API payload)
4. **Phone regex**: Chinese mobile format `1[3-9]XXXXXXXXX` — 11 digits starting with 1, second digit 3-9
5. **saving state management**: Set to `true` before API call, set to `false` in both `.then()` and `.catch()` — prevents double-submission
6. **Delayed navigation**: `setTimeout(() => wx.navigateBack(), 1000)` after success toast so user sees confirmation before leaving
7. **Remove avatar uses event param**: `onRemoveAvatar(e)` accepts event parameter but doesn't use it
