const { API_BASE_URL, getToken } = require('../../utils/api')

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
    const token = getToken()

    wx.request({
      url: `${API_BASE_URL}/vendor/phone`,
      method: 'PUT',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: { phone },
      success: (res) => {
        this.setData({ saving: false })
        if (res.data.code === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => { wx.navigateBack() }, 1000)
        } else {
          wx.showModal({ title: '失败', content: res.data.message, showCancel: false })
        }
      },
      fail: () => {
        this.setData({ saving: false })
        wx.showToast({ title: '网络错误', icon: 'error' })
      }
    })
  }
})
