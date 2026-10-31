/**
 * 摊位详情弹窗组件
 * 消除 index/map/favorite 三个页面中的重复弹窗代码
 */
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    vendor: {
      type: Object,
      value: {}
    },
    products: {
      type: Array,
      value: []
    },
    reviews: {
      type: Array,
      value: []
    },
    isLoggedIn: {
      type: Boolean,
      value: false
    },
    averageRating: {
      type: Number,
      value: 0
    },
    reviewCount: {
      type: Number,
      value: 0
    }
  },

  data: {
    stars: [1, 2, 3, 4, 5]
  },

  methods: {
    // 关闭弹窗
    onClose() {
      this.triggerEvent('close')
    },

    // 点击遮罩关闭
    onMaskTap() {
      this.triggerEvent('close')
    },

    // 导航前往
    onNavigate(e) {
      const vendor = this.data.vendor
      this.triggerEvent('navigate', { vendor })
    },

    // 拨打电话
    onCallPhone() {
      const phone = this.data.vendor.phone
      if (!phone) return
      wx.makePhoneCall({ phoneNumber: phone })
    },

    // 切换收藏
    onToggleFavorite() {
      const vendor = this.data.vendor
      this.triggerEvent('toggleFavorite', { vendor })
    },

    // 发表评价
    onReview() {
      const vendor = this.data.vendor
      this.triggerEvent('review', { vendor })
    },

    // 查看全部评价
    onViewAllReviews() {
      const vendor = this.data.vendor
      this.triggerEvent('viewAllReviews', { vendor })
    },

    // 跳转到摊位详情页
    onViewVendor() {
      const vendor = this.data.vendor
      this.triggerEvent('viewVendor', { vendor })
    }
  }
})
