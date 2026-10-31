/**
 * 摊位卡片组件
 * 首页、收藏、排行榜复用
 */
Component({
  properties: {
    vendor: {
      type: Object,
      value: {}
    },
    showDistance: {
      type: Boolean,
      value: true
    },
    showFavorite: {
      type: Boolean,
      value: true
    },
    showRank: {
      type: Boolean,
      value: false
    },
    layout: {
      type: String,
      value: 'horizontal' // horizontal, vertical
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { vendor: this.data.vendor })
    },

    onFavorite(e) {
      // 阻止冒泡，避免触发卡片点击
      e.stopPropagation && e.stopPropagation()
      this.triggerEvent('favorite', { vendor: this.data.vendor })
    },

    onNavigate(e) {
      e.stopPropagation && e.stopPropagation()
      this.triggerEvent('navigate', { vendor: this.data.vendor })
    }
  }
})
