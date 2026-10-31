// 引入你项目已经封装好的接口
const { vendorApi } = require('../../utils/api.js')
const logger = require('../../utils/logger')
const { fixDevLocation } = require('../../utils/util')

Page({
  data: {
    // 摊位信息，从接口获取
    vendor: null,
    // 加载状态
    loading: false,
    // 地址是否正在解析中
    resolvingAddress: false,
    // 解析后的地址
    resolvedAddress: ''
  },

  onLoad() {
    this.getMyVendor()
  },

  onShow() {
    // 从商品管理页返回时刷新数据
    this.getMyVendor()
  },

  // 判断地址是否像真实地点（含省/市/区/路/街/号等关键词）
  isValidAddress(addr) {
    if (!addr) return false
    return /[省市区县镇村路街号巷弄栋幢座单元楼]/.test(addr)
  },

  // 异步解析地址（不阻塞页面）
  async resolveAddressAsync() {
    if (this.data.resolvingAddress) return
    this.setData({ resolvingAddress: true, displayAddress: '位置解析中...' })
    try {
      const res = await vendorApi.resolveAddress()
      if (res.code === 200 && res.data) {
        const addr = res.data
        this.setData({
          'vendor.address': addr,
          displayAddress: addr,
          resolvedAddress: addr,
          resolvingAddress: false
        })
      } else {
        // 解析失败，回退到经纬度显示
        const v = this.data.vendor
        this.setData({
          resolvingAddress: false,
          displayAddress: (v.latitude && v.longitude)
            ? `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}`
            : '位置未设置'
        })
      }
    } catch (err) {
      logger.error('地址解析失败', err)
      const v = this.data.vendor
      this.setData({
        resolvingAddress: false,
        displayAddress: (v.latitude && v.longitude)
          ? `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}`
          : '位置未设置'
      })
    }
  },

  // ✅ 对接你项目的【获取我的摊位】接口，和你现有逻辑一致
  async getMyVendor() {
    if (this.data.loading) return
    this.setData({ loading: true })
    wx.showLoading({ title: '加载中' })

    try {
      const res = await vendorApi.getMyVendor()
      if (res.code === 200 && res.data) {
        const vendor = res.data
        this.setData({
          vendor: vendor,
          displayAddress: vendor.address || ''
        })
        // 如果地址无效，后台异步解析
        if (!this.isValidAddress(vendor.address)) {
          this.resolveAddressAsync()
        }
      } else {
        this.setData({ vendor: null })
      }
    } catch (err) {
      logger.error('获取摊位信息失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ vendor: null })
    } finally {
      this.setData({ loading: false })
      wx.hideLoading()
    }
  },

  // ✅ 对接你项目的【切换营业状态】接口，包含开摊获取定位逻辑，和你现有逻辑一致
  async changeStatus(e) {
    const newStatus = e.detail.value ? 1 : 0
    let lat = null
    let lng = null

    // 开摊时先获取实时定位
    if (newStatus === 1) {
      wx.showLoading({ title: '获取位置中' })
      try {
        const location = await new Promise((resolve, reject) => {
          wx.getLocation({
            type: 'gcj02',
            success: resolve,
            fail: reject
          })
        })
        const fixed = fixDevLocation(location.latitude, location.longitude)
        lat = fixed.latitude
        lng = fixed.longitude
        wx.hideLoading()
      } catch (err) {
        wx.hideLoading()
        wx.showModal({
          title: '定位失败',
          content: '开摊需要获取你的实时位置，请授权定位权限',
          showCancel: false
        })
        // 把开关拨回关闭状态
        this.setData({
          'vendor.status': 0
        })
        return
      }
    }

    // 提交状态到后端（后端会自动逆地理编码补充地址）
    wx.showLoading({ title: newStatus === 1 ? '开摊中' : '收摊中' })
    try {
      const res = await vendorApi.updateVendorStatus(newStatus, lat, lng, this.data.vendor?.address)
      wx.hideLoading()
      if (res.code === 200) {
        wx.showToast({
          title: newStatus === 1 ? '已开始营业' : '已收摊',
          icon: 'success'
        })
        // 更新本地状态
        this.setData({
          'vendor.status': newStatus
        })
        // 开摊后异步解析新位置地址
        if (newStatus === 1) {
          this.resolveAddressAsync()
        }
      } else {
        wx.showToast({ title: res.message || '操作失败', icon: 'none' })
        // 操作失败，把开关拨回原状态
        this.setData({
          'vendor.status': newStatus === 1 ? 0 : 1
        })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '操作失败', icon: 'none' })
      this.setData({
        'vendor.status': newStatus === 1 ? 0 : 1
      })
    }
  },

  // ✅ 跳转到商品管理页，带vendorId参数，和你现有逻辑一致
  goGoodsManage() {
    wx.navigateTo({
      url: `/pages/product-manage/product-manage?vendorId=${this.data.vendor.id}`
    })
  },

  // ✅ 跳转到申请摊主页，和你现有逻辑一致
  goApply() {
    wx.navigateTo({
      url: '/pagesVendor/apply-vendor/apply-vendor'
    })
  },

  goEditPhone() {
    wx.navigateTo({
      url: `/pages/edit-phone/edit-phone?phone=${this.data.vendor.phone || ''}`
    })
  },

  goEditInfo() {
    const v = this.data.vendor
    wx.navigateTo({
      url: `/pages/vendor-edit/vendor-edit?stallName=${encodeURIComponent(v.stallName || '')}&phone=${encodeURIComponent(v.phone || '')}&avatar=${encodeURIComponent(v.avatar || '')}`
    })
  }
})
