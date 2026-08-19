# Vendor Edit WXML — Detailed File Observation

## Project: WechatCode (地摊地图微信小程序)
## File: pages/vendor-edit/vendor-edit.wxml
## Concepts: frontend, wechat, page, vendor-edit

---

### Purpose
Template file defining the vendor edit form UI. Three main sections: avatar image picker/preview, text input fields (stall name + phone), and action buttons (save/cancel). Uses a clean form-group card layout.

### Page Structure (Top to Bottom)
```
.container
├── .form-group (avatar section)
│   ├── .label "摊位头像"
│   ├── wx:if="{{!avatar}}" → .image-picker
│   │   ├── .picker-icon "📷"
│   │   └── .picker-text "点击上传头像"
│   └── wx:else → .image-preview
│       ├── <image> .preview-img (avatar preview)
│       └── .remove-btn "✕" (catchtap)
├── .form-group (stall name)
│   ├── .label "摊位名称 *"
│   └── <input> .input (maxlength=20)
├── .form-group (phone)
│   ├── .label "联系电话"
│   └── <input> .input (type=number, maxlength=11)
└── .actions
    ├── <button> .btn-submit "保存/保存中..."
    └── <button> .btn-cancel "取消"
```

### Data Bindings (WXML expressions)
| Expression | Source Data | Location |
|-----------|-------------|----------|
| `{{avatar}}` (wx:if) | `data.avatar` | Root of avatar form-group — controls picker vs preview |
| `{{avatar}}` (src) | `data.avatar` | `<image>` preview-img source |
| `{{stallName}}` | `data.stallName` | stall name `<input>` value |
| `{{phone}}` | `data.phone` | phone `<input>` value |
| `{{saving}}` | `data.saving` | submit button loading + disabled state |
| `{{saving ? '保存中...' : '保存'}}` | `data.saving` | submit button text (ternary) |

### Event Handlers (WXML → JS)
| Handler | Element | Event Type | Description |
|---------|---------|------------|-------------|
| `onChooseAvatar` | .form-group (avatar) | `bindtap` | Tap anywhere in avatar section to pick image |
| `onRemoveAvatar` | .remove-btn | `catchtap` | Tap ✕ to remove avatar (bubbles prevented!) |
| `onInputName` | stall name `<input>` | `bindinput` | Updates stallName on each keystroke |
| `onInputPhone` | phone `<input>` | `bindinput` | Updates phone on each keystroke |
| `onSave` | .btn-submit | `bindtap` | Validates and saves form data |
| `onCancel` | .btn-cancel | `bindtap` | Navigates back |

### Conditional Rendering (wx:if)
| Condition | Element | Purpose |
|-----------|---------|---------|
| `{{!avatar}}` | .image-picker | Show upload placeholder when no avatar set |
| `wx:else` (implies `{{avatar}}`) | .image-preview | Show image preview when avatar URL exists |

### Input Specifications
| Field | Type | Maxlength | Placeholder | Required |
|-------|------|-----------|-------------|----------|
| stallName | text (default) | 20 | "请输入摊位名称" | Yes (*) |
| phone | number | 11 | "请输入手机号" | No |

### Button States
| State | loading | disabled | Text |
|-------|---------|----------|------|
| Normal | false | false | "保存" |
| Saving | true | true | "保存中..." |

### Notable WXML Patterns
1. **Event bubbling prevention**: `catchtap` on `.remove-btn` prevents tap from propagating to parent `.form-group` which has `bindtap="onChooseAvatar"`. This is critical — without `catchtap`, tapping ✕ would trigger the image picker AND remove the avatar.
2. **Avatar section is fully tappable**: The entire `.form-group` (including label) is the tap target for choosing an image, not just the picker/preview area. This is generous UX.
3. **No form wrapper**: WeChat mini-programs don't use `<form>` elements; each input is individually bound via `bindinput`.
4. **Emoji icons**: Uses 📷 for camera icon and ✕ for remove — no icon library needed.
5. **Input type="number"**: Phone field uses numeric keyboard for better UX on mobile.
6. **Button loading state**: `<button>` has built-in `loading` attribute that shows a spinner — used for save button.
7. **No label-input association**: No `for`/`id` linking between labels and inputs (WeChat doesn't require this).
8. **Required indicator**: "摊位名称 *" uses asterisk text in label — purely visual, no HTML5 validation.
