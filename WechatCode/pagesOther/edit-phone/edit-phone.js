const { request } = require('../../utils/api')
const logger = require('../../utils/logger')

Page({
  data: {
    phone: '',
    saving: false
  },

  onLoad(options) {
    this.setData({ phone: options.phone || '' })
  },

  onInputPhone(e) {
    this.setData({ phone: e.detail.value })
  },

  onSave() {
    const { phone } = this.data
    if (!phone) return wx.showToast({ title: '请输入手机号', icon: 'error' })
    if (!/^1[3-9]\d{9}$/.test(phone)) return wx.showToast({ title: '手机号格式不正确', icon: 'error' })

    this.setData({ saving: true })

    request({
      url: '/vendor/phone',
      method: 'PUT',
      data: { phone }
    }).then(res => {
      this.setData({ saving: false })
      if (res.code === 200) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => { wx.navigateBack() }, 1000)
      } else {
        wx.showModal({ title: '失败', content: res.message, showCancel: false })
      }
    }).catch(err => {
      this.setData({ saving: false })
      logger.error('修改手机号失败:', err)
      wx.showToast({ title: '网络错误', icon: 'error' })
    })
  }
})
