const { reviewApi, getUserId } = require('../../utils/api')
const logger = require('../../utils/logger')
const { formatRelativeTime } = require('../../utils/util')

Page({
  data: {
    reviews: [],
    loading: false,
    isLoggedIn: false,
    stats: {
      totalCount: 0,
      averageRating: 0
    },
    stars: [1, 2, 3, 4, 5]
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    if (this.data.isLoggedIn) {
      this.loadReviews()
    }
  },

  checkLogin() {
    const userId = getUserId()
    const token = wx.getStorageSync('token')
    const loggedIn = !!(userId && token)
    this.setData({ isLoggedIn: loggedIn })

    if (!loggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/index/index' })
        }
      })
      return
    }

    this.loadReviews()
  },

  loadReviews() {
    this.setData({ loading: true })

    reviewApi.getUserReviews()
      .then(res => {
        const reviews = Array.isArray(res) ? res : (res?.data || [])
        const formattedReviews = reviews.map(review => ({
          id: review.reviewId,
          vendorId: review.vendorId,
          vendorName: review.vendorName || '未知摊位',
          rating: review.rating,
          content: review.content,
          createTime: formatRelativeTime(review.createTime)
        }))

        this.setData({ reviews: formattedReviews, loading: false })
        this.computeStats(formattedReviews)
      })
      .catch(err => {
        console.error('加载我的评价失败:', err)
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  computeStats(reviews) {
    const totalCount = reviews.length
    let averageRating = 0
    if (totalCount > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
      averageRating = parseFloat((sum / totalCount).toFixed(1))
    }
    this.setData({
      'stats.totalCount': totalCount,
      'stats.averageRating': averageRating
    })
  },

  onReviewTap(e) {
    const vendorId = e.currentTarget.dataset.vendorId
    if (!vendorId) {
      wx.showToast({ title: '摊位信息不可用', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pagesOther/vendor-detail/vendor-detail?id=${vendorId}`
    })
  },

  deleteReview(e) {
    const reviewId = e.currentTarget.dataset.reviewId
    wx.showModal({
      title: '提示',
      content: '确定要删除这条评价吗？',
      success: (res) => {
        if (res.confirm) {
          reviewApi.deleteReview(reviewId)
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' })
              const reviews = this.data.reviews.filter(r => r.id !== reviewId)
              this.setData({ reviews })
              this.computeStats(reviews)
            })
            .catch(err => {
              console.error('删除评价失败:', err)
              wx.showToast({ title: '删除失败', icon: 'none' })
            })
        }
      }
    })
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
