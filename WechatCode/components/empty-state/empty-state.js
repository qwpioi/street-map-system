/**
 * 空状态组件
 */
Component({
  properties: {
    icon: {
      type: String,
      value: '' // emoji 或图片路径
    },
    text: {
      type: String,
      value: '暂无数据'
    },
    desc: {
      type: String,
      value: ''
    },
    buttonText: {
      type: String,
      value: ''
    }
  },

  methods: {
    onAction() {
      this.triggerEvent('action')
    }
  }
})
