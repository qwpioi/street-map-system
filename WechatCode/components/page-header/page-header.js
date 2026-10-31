/**
 * 页面头部组件
 * 统一的黄色渐变头部，包含定位信息和搜索栏
 */
Component({
  properties: {
    address: {
      type: String,
      value: ''
    },
    showSearch: {
      type: Boolean,
      value: true
    }
  },

  methods: {
    onLocationTap() {
      this.triggerEvent('locationTap')
    },

    onSearchTap() {
      this.triggerEvent('searchTap')
    }
  }
})
