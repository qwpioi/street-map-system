/**
 * 区块标题组件
 * 统一的区块标题，支持副标题和"查看更多"按钮
 */
Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    subtitle: {
      type: String,
      value: ''
    },
    moreText: {
      type: String,
      value: ''
    },
    icon: {
      type: String,
      value: ''
    }
  },

  methods: {
    onMoreTap() {
      this.triggerEvent('more')
    }
  }
})
