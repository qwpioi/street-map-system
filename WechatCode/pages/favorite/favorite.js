const { favoriteApi, vendorApi, reviewApi, productApi, getUserId } = require('../../utils/api')

Page({
  data: {
    favorites: [],
    loading: false,
    isLoggedIn: false,

    // 摊位详情弹窗
    selectedVendor: null,
    vendorDetailVisible: false,
    averageRating: 0,
    reviewCount: 0,
    recentReviews: [],
    stars: [1, 2, 3, 4, 5],
    vendorProducts: []
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    // 每次显示页面时刷新收藏列表
    if (this.data.isLoggedIn) {
      this.loadFavorites()
    }

    // 如果弹窗已打开且已选中摊位，从评价页返回时自动刷新详情
    if (this.data.vendorDetailVisible && this.data.selectedVendor) {
      this.onFavoriteItemTap({ currentTarget: { dataset: { item: this.data.selectedVendor } } })
    }
  },

  /**
   * 检查登录状态
   */
  checkLogin() {
    const userId = getUserId()
    const token = wx.getStorageSync('token')
    
    if (token && userId) {
      this.setData({ 
        isLoggedIn: true
      })
      this.loadFavorites()
    } else {
      this.setData({ 
        isLoggedIn: false
      })
      wx.showModal({
        title: '提示',
        content: '请先登录再查看收藏',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
    }
  },

  /**
   * 加载收藏列表
   */
  loadFavorites() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    favoriteApi.getFavorites()
      .then(res => {
        console.log('✅ 收藏列表响应:', res)
        
        // ✅ 修复：先判断 res.code，再取 res.data
        if (res.code !== 200 || !res.data) {
          this.setData({ favorites: [], loading: false })
          return
        }
        
        const favorites = res.data
        
        // 处理收藏数据，添加距离信息
        const processedFavorites = favorites.map(fav => {
          return {
            id: fav.vendorId,
            stallName: fav.stallName || '未知摊位',
            address: fav.address || '',
            hotProducts: fav.hotProducts || '',
            latitude: parseFloat(fav.latitude) || 0,
            longitude: parseFloat(fav.longitude) || 0,
            favoriteId: fav.favoriteId,
            createTime: fav.createTime
          }
        })
        
        this.setData({ 
          favorites: processedFavorites,
          loading: false
        })
      })
      .catch(err => {
        console.error('❌ 加载收藏失败:', err)
        this.setData({ 
          favorites: [],
          loading: false
        })
      })
  },

  /**
   * 点击收藏项 — 打开详情弹窗
   */
  async onFavoriteItemTap(e) {
    const item = e.currentTarget.dataset.item
    console.log('📍 点击收藏:', item)

    // 先用基础数据展示弹窗
    this.setData({ selectedVendor: item })

    try {
      // 获取完整摊位详情（含 phone、distance 等）
      const vendorRes = await vendorApi.getVendorById(item.id)
      const vendorDetail = vendorRes?.data || vendorRes || {}

      // 合并完整数据到 selectedVendor
      const mergedVendor = {
        ...item,
        phone: vendorDetail.phone || '',
        distance: vendorDetail.distance || '',
        address: vendorDetail.address || item.address || '',
        isFavorite: true // 收藏页打开的必定已收藏
      }

      // 获取评价信息
      const ratingRes = await reviewApi.getAverageRating(item.id)
      const averageRating = ratingRes?.data || ratingRes || 0

      const countRes = await reviewApi.getReviewCount(item.id)
      const reviewCount = countRes?.data || countRes || 0

      const reviewsRes = await reviewApi.getVendorReviews(item.id)
      const allReviews = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.data || [])
      const recentReviews = allReviews.slice(0, 3).map(r => ({
        ...r,
        createTime: this.formatTime(r.createTime)
      }))

      // 获取商品列表
      const productsRes = await productApi.getProducts(item.id)
      const products = productsRes?.data || productsRes || []

      this.setData({
        selectedVendor: mergedVendor,
        averageRating,
        reviewCount,
        recentReviews,
        vendorProducts: products,
        vendorDetailVisible: true
      })
    } catch (err) {
      console.error('❌ 加载摊位详情失败:', err)
      // 降级：用基础数据打开弹窗
      this.setData({
        vendorDetailVisible: true
      })
    }
  },

  /**
   * 取消收藏
   */
  async onCancelFavorite(e) {
    const item = e.currentTarget.dataset.item
    
    wx.showModal({
      title: '确认取消',
      content: `确定要取消收藏"${item.stallName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...', mask: true })
          
          try {
            await favoriteApi.removeFavorite(item.id)
            
            wx.hideLoading()
            wx.showToast({
              title: '已取消收藏',
              icon: 'success'
            })
            
            // 从列表中移除
            const favorites = this.data.favorites.filter(f => f.id !== item.id)
            this.setData({ favorites })
          } catch (err) {
            wx.hideLoading()
            console.error('❌ 取消收藏失败:', err)
          }
        }
      }
    })
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
    const phone = this.data.selectedVendor.phone
    if (!phone) return
    wx.makePhoneCall({ phoneNumber: phone })
  },

  async onToggleFavoriteInModal(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return

    const isFavorite = item.isFavorite
    try {
      if (isFavorite) {
        await favoriteApi.removeFavorite(item.id)
        wx.showToast({ title: '已取消收藏', icon: 'success' })
        // 从收藏列表中移除
        const favorites = this.data.favorites.filter(f => f.id !== item.id)
        this.setData({
          favorites,
          ['selectedVendor.isFavorite']: false
        })
        // 取消收藏后关闭弹窗
        this.onCloseVendorDetail()
      } else {
        await favoriteApi.addFavorite(item.id)
        wx.showToast({ title: '收藏成功', icon: 'success' })
        this.setData({
          ['selectedVendor.isFavorite']: true
        })
      }
    } catch (err) {
      console.error('❌ 弹窗收藏操作失败:', err)
    }
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

  onViewAllReviews() {
    if (!this.data.selectedVendor) return
    wx.navigateTo({
      url: `/pages/review-list/review-list?vendorId=${this.data.selectedVendor.id}&vendorName=${this.data.selectedVendor.stallName}`
    })
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
  },

  /**
   * 去首页逛逛
   */
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
