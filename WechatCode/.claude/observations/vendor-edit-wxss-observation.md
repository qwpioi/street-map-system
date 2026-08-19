# Vendor Edit WXSS — Detailed File Observation

## Project: WechatCode (地摊地图微信小程序)
## File: pages/vendor-edit/vendor-edit.wxss
## Concepts: frontend, wechat, page, vendor-edit

---

### Purpose
Stylesheet for the vendor edit page. 124 lines defining a clean, card-based form layout with image picker/preview, input fields, and action buttons. Follows the project-wide design system (gray background, white cards, rounded corners).

### Design System Compliance
| Property | Value | Matches Global? |
|----------|-------|-----------------|
| Page background | `#f5f5f5` | ✅ Yes |
| Card background | `#fff` | ✅ Yes |
| Card border-radius | `12rpx` | ⚠️ Close (global uses `20rpx` for cards, `12rpx` for form groups) |
| Card shadow | none | ❌ No shadow (unlike index page cards) |
| Primary color | `#07C160` (green) | ❌ Different from global accent `#FFD100` / `#FF6633` |
| Text color | `#333` | ✅ Yes |
| Muted text | `#999` | ✅ Yes |
| Input background | `#f9f9f9` | ✅ Consistent light gray |

### CSS Sections (in order)
| Section | Lines | Key Classes | Purpose |
|---------|-------|-------------|---------|
| Page base | 1-3 | `page` | Background color |
| Container | 5-12 | `.container` | Layout reset, padding, box-sizing |
| Form group | 14-19 | `.form-group` | White card with padding + margin |
| Label | 21-27 | `.label` | Bold label text |
| Input | 29-38 | `.input` | Text input styling |
| Actions | 40-45 | `.actions` | Button group (column flex) |
| Submit button | 47-58 | `.btn-submit`, `.btn-submit::after` | Green primary button |
| Cancel button | 60-72 | `.btn-cancel`, `.btn-cancel::after` | White outlined button |
| Image picker | 74-94 | `.image-picker`, `.picker-icon`, `.picker-text` | Dashed border upload area |
| Image preview | 96-123 | `.image-preview`, `.preview-img`, `.remove-btn` | Avatar preview with remove overlay |

### CSS Property Details

#### page
```css
background-color: #f5f5f5;
```
Single property — matches global background.

#### .container
```css
padding: 30rpx 20rpx;
height: auto;
display: block;
align-items: initial;
justify-content: initial;
box-sizing: border-box;
```
**Notable**: Explicitly resets flex properties (`align-items: initial`, `justify-content: initial`, `display: block`). This suggests the page may inherit flex layout from a parent or global style and needs to override it to block layout.

#### .form-group
```css
background-color: #fff;
border-radius: 12rpx;
padding: 24rpx;
margin-bottom: 20rpx;
```
White cards with `12rpx` radius (smaller than the 20rpx used on index page cards). No box-shadow.

#### .label
```css
display: block;
font-size: 28rpx;
color: #333;
font-weight: bold;
margin-bottom: 16rpx;
```
Bold labels, 28rpx font.

#### .input
```css
width: 100%;
height: 88rpx;
line-height: 88rpx;
font-size: 28rpx;
padding: 0 20rpx;
background-color: #f9f9f9;
border-radius: 8rpx;
box-sizing: border-box;
```
Fixed height 88rpx with centered text. Light gray background with small 8rpx radius.

#### .actions
```css
margin-top: 40rpx;
display: flex;
flex-direction: column;
gap: 20rpx;
```
Vertical button stack with 20rpx gap. Uses `gap` property (modern flexbox).

#### .btn-submit
```css
width: 100%;
background-color: #07C160;  /* WeChat green */
color: #fff;
border-radius: 30rpx;       /* Pill shape */
font-size: 30rpx;
padding: 24rpx;
```
**Notable**: Uses `#07C160` (WeChat brand green) instead of the project's `#FFD100`/`#FF6633` accent palette. Pill-shaped with `30rpx` radius. `::after { border: none }` removes WeChat's default button border.

#### .btn-cancel
```css
width: 100%;
background-color: #fff;
color: #999;
border: 2rpx solid #ddd;
border-radius: 30rpx;
font-size: 30rpx;
padding: 24rpx;
```
White with light gray border, muted text. Same pill shape as submit.

#### .image-picker (dashed upload area)
```css
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
height: 200rpx;
border: 2rpx dashed #ddd;
border-radius: 12rpx;
background: #fafafa;
```
Centered flex layout, 200rpx tall, dashed border, near-white background.

#### .image-preview
```css
position: relative;
width: 200rpx;
height: 200rpx;
border-radius: 12rpx;
overflow: hidden;
```
Same dimensions as picker for visual consistency. `overflow: hidden` clips the image to rounded corners.

#### .preview-img
```css
width: 100%;
height: 100%;
```
Fills the preview container. Combined with `mode="aspectFill"` in WXML, image is cropped to fill.

#### .remove-btn
```css
position: absolute;
top: 0;
right: 0;
width: 44rpx;
height: 44rpx;
background: rgba(0, 0, 0, 0.6);
color: #fff;
font-size: 24rpx;
display: flex;
align-items: center;
justify-content: center;
border-radius: 0 12rpx 0 12rpx;
```
**Notable**: Top-right corner overlay with semi-transparent black background. Asymmetric border-radius `0 12rpx 0 12rpx` creates a triangular tab effect matching the parent's top-right corner.

### Color Palette Summary
| Color | Usage | Hex |
|-------|-------|-----|
| Page background | `page` | `#f5f5f5` |
| Card background | `.form-group` | `#fff` |
| Input background | `.input` | `#f9f9f9` |
| Picker background | `.image-picker` | `#fafafa` |
| Primary button | `.btn-submit` | `#07C160` (WeChat green) |
| Label text | `.label` | `#333` |
| Muted text | `.btn-cancel`, `.picker-text` | `#999` |
| Border | `.image-picker`, `.btn-cancel` | `#ddd` |
| Overlay | `.remove-btn` | `rgba(0,0,0,0.6)` |

### Notable CSS Patterns
1. **Container layout reset**: Explicitly sets `display: block` and resets flex alignment — suggests global styles may apply flex layout to containers
2. **No shadows**: Unlike index page cards which use `box-shadow`, form cards here have no shadow — cleaner/simpler aesthetic
3. **Pill buttons**: Both buttons use `border-radius: 30rpx` for a pill shape, contrasting with the sharper `12rpx` cards
4. **Fixed input height**: 88rpx with `line-height: 88rpx` for vertical centering — not using `flex` centering
5. **WeChat green accent**: `#07C160` is WeChat's brand color — used here instead of the project's yellow/orange palette, possibly to differentiate the "edit form" context
6. **Asymmetric border-radius**: `.remove-btn` uses `0 12rpx 0 12rpx` to create a corner tab effect
7. **No responsive breakpoints**: Fixed rpx values throughout — scales uniformly across devices
8. **Button border reset**: Both `.btn-submit::after` and `.btn-cancel::after` set `border: none` to remove WeChat's default button outline
