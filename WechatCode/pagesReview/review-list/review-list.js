const { reviewApi, getUserId } = require('../../utils/api')
const logger = require('../../utils/logger')
const { formatRelativeTime } = require('../../utils/util')

Page({
  data: {
    reviews: [],
    averageRating: 0,
    vendorId: null,
    vendorName: '',
    loading: false,
    showModal: false,
    stars: [1, 2, 3, 4, 5],
    currentUserId: null,

    // 拖动相关
    touchStartY: 0,
    touchMoveY: 0,
    touchThreshold: 100
  },

  onLoad(options) {
    logger.debug('📍 评价页参数:', options)

    const uid = getUserId()
    this.setData({ currentUserId: uid ? String(uid) : null })

    if (options.vendorId) {
      this.setData({
        vendorId: options.vendorId,
        vendorName: options.vendorName || '该摊位'
      })
    }

    // 自动显示弹窗
    this.showReviewModal()
  },

  onShow() {
    // 从发表评价页返回时刷新列表
    if (this.data.showModal) {
      this.loadReviews()
    }
  },

  // 显示弹窗
  showReviewModal() {
    this.setData({ showModal: true })
    // 延迟加载数据，等待动画完成
    setTimeout(() => {
      this.loadReviews()
    }, 300)
  },

  // 关闭弹窗
  closeModal() {
    this.setData({ showModal: false })
    // 延迟返回，等待动画完成
    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      })
    }, 300)
  },

  // 加载评价
  loadReviews() {
    this.setData({ loading: true })

    reviewApi.getVendorReviews(this.data.vendorId)
      .then(res => {
        const reviews = Array.isArray(res) ? res : (res?.data || [])
        const formattedReviews = reviews.map(review => ({
          id: review.reviewId,
          userId: review.userId != null ? String(review.userId) : null,
          userName: review.userName || '匿名用户',
          rating: review.rating,
          content: review.content,
          createTime: formatRelativeTime(review.createTime)
        }))

        this.setData({ reviews: formattedReviews })

        return reviewApi.getAverageRating(this.data.vendorId)
      })
      .then(average => {
        this.setData({
          averageRating: average || 0,
          loading: false
        })
      })
      .catch(err => {
        logger.error('❌ 加载评价失败:', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  // 跳转到添加评价页
  goToAddReview() {
    wx.navigateTo({
      url: `/pagesReview/add-review/add-review?vendorId=${this.data.vendorId}&vendorName=${this.data.vendorName}`
    })
  },

  // 删除评价
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
              // 从列表中移除
              const reviews = this.data.reviews.filter(r => r.id !== reviewId)
              this.setData({ reviews })
            })
            .catch(err => {
              logger.error('删除评价失败:', err)
              wx.showToast({ title: '删除失败', icon: 'none' })
            })
        }
      }
    })
  },

  // 拖动相关函数
  onDragStart(e) {
    this.setData({
      touchStartY: e.touches[0].clientY
    })
  },

  onDragMove(e) {
    this.setData({
      touchMoveY: e.touches[0].clientY
    })
  },

  onDragEnd() {
    const deltaY = this.data.touchMoveY - this.data.touchStartY
    
    // 向下滑动超过阈值，关闭弹窗
    if (deltaY > this.data.touchThreshold) {
      this.closeModal()
    }
  }
})
