/**
 * 底部操作栏组件
 * 固定在底部的操作按钮栏
 */
Component({
  properties: {
    showPhone: {
      type: Boolean,
      value: false
    },
    showFavorite: {
      type: Boolean,
      value: true
    },
    isFavorite: {
      type: Boolean,
      value: false
    },
    phone: {
      type: String,
      value: ''
    }
  },

  methods: {
    onCallPhone() {
      if (!this.data.phone) return
      wx.makePhoneCall({ phoneNumber: this.data.phone })
      this.triggerEvent('callPhone', { phone: this.data.phone })
    },

    onToggleFavorite() {
      this.triggerEvent('toggleFavorite')
    },

    onReview() {
      this.triggerEvent('review')
    },

    onNavigate() {
      this.triggerEvent('navigate')
    }
  }
})
