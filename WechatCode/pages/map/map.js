const { vendorApi, reviewApi, productApi, favoriteApi, getUserId } = require('../../utils/api')
const logger = require('../../utils/logger')
const { fixDevLocation, calculateDistance, formatRelativeTime } = require('../../utils/util')

Page({
  data: {
    latitude: 0,
    longitude: 0,
    markers: [],
    vendors: [],
    selectedVendor: null,
    lastLoadTime: 0, // 记录上次加载时间，用于节流
    isLoggedIn: false, // 登录状态，用于 vendor-modal 组件

    // 摊位详情弹窗
    vendorDetailVisible: false,
    hotProductsArray: [],
    averageRating: 0,
    reviewCount: 0,
    recentReviews: [],
    stars: [1, 2, 3, 4, 5],
    vendorProducts: []
  },

  onLoad() {
    this.getLocation()
  },

  onShow() {
    // 每次回到地图页都刷新摊位数据，保证开摊/收摊等状态变化实时反映到标记
    // （首次进入时坐标为空，由 getLocation 成功回调负责首载，不会重复请求）
    // 添加 30 秒节流，避免频繁切换页面时重复请求
    const { latitude, longitude, lastLoadTime } = this.data
    const now = Date.now()
    if (latitude && longitude && (now - lastLoadTime > 30000)) {
      this.loadVendors(latitude, longitude)
    }

    // 如果详情页已打开且已选中摊位，从评价页返回时自动刷新详情
    if (this.data.vendorDetailVisible && this.data.selectedVendor) {
      this.onMarkerTap({ detail: { markerId: this.data.selectedVendor.id } })
    }
  },

  getLocation() {
    wx.showLoading({ title: '定位中...', mask: true })

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        let { latitude, longitude } = res
        console.log('✅ 原始定位:', latitude, longitude)

        const fixed = fixDevLocation(latitude, longitude)
        latitude = fixed.latitude
        longitude = fixed.longitude
        console.log('✅ 使用定位:', latitude, longitude)

        this.setData({ latitude, longitude })
        this.loadVendors(latitude, longitude)
        wx.hideLoading()
      },
      fail: (err) => {
        console.error('定位失败:', err)
        wx.hideLoading()
      }
    })
  },

  loadVendors(latitude, longitude) {
    // 更新加载时间戳（用于节流）
    this.setData({ lastLoadTime: Date.now() })
    
    vendorApi.getOpenVendors()
      .then(res => {
        if (res && res.code === 200) {
          const vendors = res.data
            .filter(v => v.latitude && v.longitude && v.status === 1)
            .map(vendor => ({
              id: vendor.id,
              stallName: vendor.stallName || '未知摊位',
              address: vendor.address || '',
              phone: vendor.phone || '',
              hotProducts: vendor.hotProducts || '',
              products: vendor.products || [],
              latitude: parseFloat(vendor.latitude),
              longitude: parseFloat(vendor.longitude),
              distance: calculateDistance(
                latitude, longitude,
                parseFloat(vendor.latitude),
                parseFloat(vendor.longitude)
              )
            }))

          const markers = this.createMarkers(vendors)

          console.log('🗺️ 摊位数量:', vendors.length)
          console.log('🗺️ 第一个摊位:', vendors[0])
          console.log('🗺️ markers 数量:', markers.length)
          console.log('🗺️ 第一个 marker:', markers[0])

          this.setData({ vendors, markers })
        }
      })
      .catch(err => {
        console.error('❌ 加载摊位失败:', err)
      })
  },

  createMarkers(vendors) {
    return vendors.map((vendor, index) => ({
      id: vendor.id,
      index: index,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      title: vendor.stallName,
      width: 30,
      height: 30,
      callout: {
        content: vendor.stallName,
        display: 'ALWAYS',
        padding: 10,
        borderRadius: 5,
        bgColor: '#ffffff',
        color: '#333333'
      }
    }))
  },

  async onMarkerTap(e) {
    const markerId = e.detail.markerId
    const vendor = this.data.vendors.find(v => v.id === markerId)
    if (!vendor) return

    this.setData({ selectedVendor: vendor })

    // 处理热销产品（分割成数组）
    const hotProductsArray = vendor.hotProducts ? vendor.hotProducts.split(/[,，]/) : []

    // 加载评价信息和商品列表
    try {
      const ratingRes = await reviewApi.getAverageRating(vendor.id)
      const averageRating = ratingRes?.data || ratingRes || 0

      const countRes = await reviewApi.getReviewCount(vendor.id)
      const reviewCount = countRes?.data || countRes || 0

      const reviewsRes = await reviewApi.getVendorReviews(vendor.id)
      const allReviews = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.data || [])
      const recentReviews = allReviews.slice(0, 3).map(item => ({
        ...item,
        createTime: formatRelativeTime(item.createTime)
      }))

      const productsRes = await productApi.getProducts(vendor.id)
      const products = productsRes?.data || productsRes || []

      this.setData({
        averageRating,
        reviewCount,
        recentReviews,
        hotProductsArray,
        vendorDetailVisible: true,
        ['selectedVendor.products']: products,
        vendorProducts: products
      })

      console.log('✅ 评价数据加载成功:', { averageRating, reviewCount, recentReviews: recentReviews.length })
    } catch (err) {
      console.error('❌ 加载评价失败:', err)
      this.setData({
        averageRating: 0,
        reviewCount: 0,
        recentReviews: [],
        hotProductsArray,
        vendorDetailVisible: true
      })
    }
  },

  onCloseVendorDetail() {
    this.setData({
      vendorDetailVisible: false,
      selectedVendor: null
    })
  },

  goToVendorPage(e) {
    // 兼容 vendor-modal 组件的事件格式
    const vendor = e.detail?.vendor || e.currentTarget?.dataset?.vendor || {}
    const vendorId = vendor.id || e.currentTarget?.dataset?.vendorId
    if (!vendorId) return
    wx.navigateTo({
      url: `/pagesOther/vendor-detail/vendor-detail?id=${vendorId}`
    })
  },

  async onToggleFavoriteInModal(e) {
    // 兼容 vendor-modal 组件的事件格式
    const item = e.detail?.vendor || e.currentTarget?.dataset?.item
    if (!item || !item.id) return

    if (!getUserId()) {
      wx.showModal({ title: '提示', content: '请先登录再收藏', showCancel: false })
      return
    }

    const isFavorite = item.isFavorite
    try {
      if (isFavorite) {
        await favoriteApi.removeFavorite(item.id)
        wx.showToast({ title: '已取消收藏', icon: 'success' })
      } else {
        await favoriteApi.addFavorite(item.id)
        wx.showToast({ title: '收藏成功', icon: 'success' })
      }

      this.setData({
        ['selectedVendor.isFavorite']: !isFavorite,
        vendors: this.data.vendors.map(v => v.id === item.id ? { ...v, isFavorite: !isFavorite } : v)
      })
    } catch (err) {
      console.error('❌ 弹窗收藏操作失败:', err)
    }
  },

  onViewAllReviews() {
    if (!this.data.selectedVendor) return

    wx.navigateTo({
      url: `/pagesReview/review-list/review-list?vendorId=${this.data.selectedVendor.id}&vendorName=${this.data.selectedVendor.stallName}`
    })
  },

  onAddReview() {
    if (!this.data.selectedVendor) return

    if (!getUserId()) {
      wx.showModal({
        title: '提示',
        content: '请先登录再评价',
        showCancel: false,
        success: () => { wx.navigateTo({ url: '/pages/login/login' }) }
      })
      return
    }

    wx.navigateTo({
      url: `/pagesReview/add-review/add-review?vendorId=${this.data.selectedVendor.id}&vendorName=${this.data.selectedVendor.stallName}`
    })
  },

  navigateToVendor(e) {
    // 兼容 vendor-modal 组件的事件格式
    const item = e.detail?.vendor || e.currentTarget?.dataset?.item || this.data.selectedVendor
    wx.openLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      name: item.stallName,
      address: item.address,
      scale: 16
    })
  },

  callPhone() {
    const phone = this.data.selectedVendor.phone;
    if (!phone) return;
    wx.makePhoneCall({ phoneNumber: phone });
  },

  relocate() {
    this.getLocation()
  }
})
