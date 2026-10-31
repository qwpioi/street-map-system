const { vendorApi, uploadApi, API_BASE_URL } = require('../../utils/api')
const logger = require('../../utils/logger')

Page({
  data: {
    stallName: '',
    phone: '',
    avatar: '',
    saving: false
  },

  onLoad(options) {
    const safeDecode = (str) => {
      if (!str) return ''
      try { return decodeURIComponent(str) } catch (e) { return str }
    }
    this.setData({
      stallName: safeDecode(options.stallName),
      phone: safeDecode(options.phone),
      avatar: safeDecode(options.avatar || '')
    })
  },

  onChooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFilePaths[0]
        wx.showLoading({ title: '上传中...' })
        uploadApi.uploadImage(filePath)
          .then(uploadRes => {
            wx.hideLoading()
            // uploadRes = { code: 200, data: "url路径", message: null }
            const url = uploadRes?.data || uploadRes || ''
            if (url) {
              this.setData({ avatar: url })
              wx.showToast({ title: '上传成功', icon: 'success' })
            } else {
              wx.showToast({ title: '上传失败', icon: 'none' })
            }
          })
          .catch(err => {
            wx.hideLoading()
            logger.error('上传失败:', err)
            wx.showToast({ title: '上传失败', icon: 'none' })
          })
      }
    })
  },

  onRemoveAvatar(e) {
    this.setData({ avatar: '' })
  },

  onCancel() {
    wx.navigateBack()
  },

  onInputName(e) {
    this.setData({ stallName: e.detail.value })
  },

  onInputPhone(e) {
    this.setData({ phone: e.detail.value })
  },

  onSave() {
    const { stallName, phone, avatar } = this.data

    if (!stallName.trim()) {
      wx.showToast({ title: '请输入摊位名称', icon: 'none' })
      return
    }

    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    vendorApi.updateVendorInfo({
      stallName: stallName.trim(),
      phone: phone.trim(),
      avatar: avatar
    })
      .then(res => {
        this.setData({ saving: false })
        if (res.code === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => { wx.navigateBack() }, 1000)
        } else {
          wx.showModal({ title: '保存失败', content: res.message || '请重试', showCancel: false })
        }
      })
      .catch(err => {
        this.setData({ saving: false })
        logger.error('保存失败:', err)
        wx.showToast({ title: '网络错误', icon: 'none' })
      })
  }
})
