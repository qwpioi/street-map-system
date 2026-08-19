const { reviewApi, productApi, favoriteApi, API_BASE_URL, getUserId } = require('../../utils/api')
const { fixDevLocation } = require('../../utils/util')

Page({
  data: {
    latitude: 0,
    longitude: 0,
    markers: [],
    vendors: [],
    selectedVendor: null,

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
    // 如果从商品管理页返回，自动刷新摊位数据（含商品列表）
    if (getApp().globalData.needRefreshVendors) {
      getApp().globalData.needRefreshVendors = false
      const { latitude, longitude } = this.data
      if (latitude && longitude) {
        this.loadVendors(latitude, longitude)
      }
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
    const token = wx.getStorageSync('token')

    wx.request({
      url: `${API_BASE_URL}/vendor/open`,
      method: 'GET',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          const vendors = res.data.data
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
              distance: this.calculateDistance(
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
      },
      fail: (err) => {
        console.error('❌ 加载摊位失败:', err)
      }
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
        createTime: this.formatTime(item.createTime)
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
    const vendorId = e.currentTarget.dataset.vendorId
    wx.navigateTo({
      url: `/pages/vendor-detail/vendor-detail?id=${vendorId}`
    })
  },

  async onToggleFavoriteInModal(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return

    const token = wx.getStorageSync('token')
    if (!token) {
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
      url: `/pages/review-list/review-list?vendorId=${this.data.selectedVendor.id}&vendorName=${this.data.selectedVendor.stallName}`
    })
  },

  onAddReview() {
    if (!this.data.selectedVendor) return

    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录再评价',
        showCancel: false,
        success: () => { wx.navigateTo({ url: '/pages/login/login' }) }
      })
      return
    }

    wx.navigateTo({
      url: `/pages/add-review/add-review?vendorId=${this.data.selectedVendor.id}&vendorName=${this.data.selectedVendor.stallName}`
    })
  },

  navigateToVendor(e) {
    const item = e.currentTarget.dataset.item || this.data.selectedVendor
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
  },

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(2)}km`
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    try {
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

      return `${date.getMonth() + 1}/${date.getDate()}`
    } catch (e) {
      return timeStr
    }
  }
})
