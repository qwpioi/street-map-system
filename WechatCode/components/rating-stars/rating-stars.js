/**
 * 评分星星组件
 * 支持只读和可交互两种模式
 */
Component({
  properties: {
    rating: {
      type: Number,
      value: 0
    },
    max: {
      type: Number,
      value: 5
    },
    size: {
      type: String,
      value: 'md' // sm, md, lg
    },
    readonly: {
      type: Boolean,
      value: true
    },
    showText: {
      type: Boolean,
      value: false
    }
  },

  data: {
    sizeMap: {
      sm: 24,
      md: 32,
      lg: 40
    }
  },

  methods: {
    onStarTap(e) {
      if (this.data.readonly) return
      
      const star = e.currentTarget.dataset.star
      this.triggerEvent('change', { rating: star })
    }
  }
})
