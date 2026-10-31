/**
 * 统一图标组件
 * 替代所有 emoji，确保跨设备一致性
 */
Component({
  properties: {
    name: {
      type: String,
      value: 'star'
    },
    size: {
      type: String,
      value: 'md' // xs, sm, md, lg, xl
    },
    color: {
      type: String,
      value: '' // 为空时使用默认颜色
    }
  },

  data: {
    sizeMap: {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64
    }
  }
})
