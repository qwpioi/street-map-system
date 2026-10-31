const { vendorApi, productApi, reviewApi, favoriteApi, getUserId } = require('../../utils/api')
const logger = require('../../utils/logger')
const app = getApp()
Page({
  data: {
    vendorId: null,
    vendor: null,
    products: [],
    reviews: [],
    averageRating: 0,
    reviewCount: 0,
    isFavorite: false,
    isLoggedIn: false,
    loading: true,
    stars: [1, 2, 3, 4, 5]
  },
  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ vendorId: parseInt(id) })
    this.checkLogin()
    this.loadAllData()
  },
  onShow() {
    this.checkLogin()
    // 刷新收藏状态和评价
    if (this.data.vendorId) {
      this.loadFavoriteStatus()
      this.loadReviews()
    }
  },
  // 检查登录状态
  checkLogin() {
    const userId = getUserId()
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({
      isLoggedIn: !!(userId && userInfo)
    })
  },
  // 加载所有数据
  async loadAllData() {
    wx.showLoading({ title: '加载中...', mask: true })
    try {
      // 并行加载多个数据
      const [vendorRes, productsRes] = await Promise.all([
        vendorApi.getVendorById(this.data.vendorId),
        productApi.getProducts(this.data.vendorId)
      ])
      // 处理摊位信息
      const vendor = vendorRes?.data || vendorRes || null
      if (!vendor) {
        throw new Error('摊位不存在')
      }
      // 处理主打产品数组，把中英文逗号分割的字符串转成数组
      if (vendor.hotProducts) {
        vendor.hotProductsArray = vendor.hotProducts.split(/[,，]/).filter(item => item.trim())
      } else {
        vendor.hotProductsArray = []
      }
      // 处理商品，只保留上架的
      const products = (productsRes?.data || productsRes || [])
        .filter(item => item.status === 1)
      // 加载评价
      await this.loadReviews()
      // 加载收藏状态
      await this.loadFavoriteStatus()
      this.setData({
        vendor,
        products,
        loading: false
      })
      wx.hideLoading()
    } catch (err) {
      logger.error('加载详情失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        success: () => {
          setTimeout(() => wx.navigateBack(), 1500)
        }
      })
    }
  },
  // 加载评价数据
  async loadReviews() {
    try {
      const [ratingRes, countRes, reviewsRes] = await Promise.all([
        reviewApi.getAverageRating(this.data.vendorId),
        reviewApi.getReviewCount(this.data.vendorId),
        reviewApi.getVendorReviews(this.data.vendorId)
      ])
      const averageRating = ratingRes?.data || ratingRes || 0
      const reviewCount = countRes?.data || countRes || 0
      const reviews = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.data || [])
      this.setData({
        averageRating,
        reviewCount,
        reviews
      })
    } catch (err) {
      logger.error('加载评价失败:', err)
      this.setData({
        averageRating: 0,
        reviewCount: 0,
        reviews: []
      })
    }
  },
  // 加载收藏状态
  async loadFavoriteStatus() {
    if (!this.data.isLoggedIn) return
    try {
      const res = await favoriteApi.getFavorites()
      if (res.code === 200 && res.data) {
        const favoriteIds = res.data.map(f => f.vendorId)
        this.setData({
          isFavorite: favoriteIds.includes(this.data.vendorId)
        })
      }
    } catch (err) {
      logger.error('加载收藏状态失败:', err)
    }
  },
  // 切换收藏
  async toggleFavorite() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录再收藏',
        showCancel: false,
        success: () => {
          wx.navigateTo({ url: '/pages/login/login' })
        }
      })
      return
    }
    const isFavorite = this.data.isFavorite
    try {
      wx.showLoading({ title: isFavorite ? '取消收藏中...' : '收藏中...', mask: true })
      if (isFavorite) {
        await favoriteApi.removeFavorite(this.data.vendorId)
        this.setData({ isFavorite: false })
        wx.showToast({ title: '已取消收藏', icon: 'success' })
      } else {
        await favoriteApi.addFavorite(this.data.vendorId)
        this.setData({ isFavorite: true })
        wx.showToast({ title: '收藏成功', icon: 'success' })
      }
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      logger.error('收藏操作失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },
  // 拨打电话
  callPhone() {
    const phone = this.data.vendor?.phone
    if (!phone) {
      wx.showToast({ title: '暂无联系电话', icon: 'none' })
      return
    }
    wx.makePhoneCall({ phoneNumber: phone })
  },
  // 导航
  navigateTo() {
    const vendor = this.data.vendor
    if (!vendor?.latitude || !vendor?.longitude) {
      wx.showToast({ title: '暂无位置信息', icon: 'none' })
      return
    }
    wx.openLocation({
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      name: vendor.stallName,
      address: vendor.address || '',
      scale: 16
    })
  },
  // 发表评价
  addReview() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录再评价',
        showCancel: false,
        success: () => {
          wx.navigateTo({ url: '/pages/login/login' })
        }
      })
      return
    }
    wx.navigateTo({
      url: `/pagesReview/add-review/add-review?vendorId=${this.data.vendorId}&vendorName=${this.data.vendor.stallName}`
    })
  },
  // 查看全部评价
  viewAllReviews() {
    wx.navigateTo({
      url: `/pagesReview/review-list/review-list?vendorId=${this.data.vendorId}&vendorName=${this.data.vendor.stallName}`
    })
  }
})