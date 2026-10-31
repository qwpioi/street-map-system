/**
 * 营业状态标签组件
 */
Component({
  properties: {
    status: {
      type: Number,
      value: 1 // 1: 营业中, 0: 已收摊
    },
    size: {
      type: String,
      value: 'md' // sm, md
    }
  }
})
