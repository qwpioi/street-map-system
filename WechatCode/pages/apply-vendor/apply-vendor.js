const { vendorApi } = require('../../utils/api');
const { fixDevLocation } = require('../../utils/util');

Page({
  data: {
    stallName: '',
    phone: '',
    address: '',
    latitude: null,
    longitude: null,
    hotProducts: '',
    description: '',
    submitting: false
  },

  onInputStallName(e) { this.setData({ stallName: e.detail.value }) },
  onInputProducts(e) { this.setData({ hotProducts: e.detail.value }) },
  onInputDesc(e) { this.setData({ description: e.detail.value }) },
  onInputPhone(e) { this.setData({ phone: e.detail.value }) },

  // 获取定位
  getLocation() {
    wx.showLoading({ title: '定位中' })
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        let { latitude, longitude } = res
        const fixed = fixDevLocation(latitude, longitude)
        latitude = fixed.latitude
        longitude = fixed.longitude
        this.setData({
          latitude,
          longitude,
          address: '已获取当前位置（经纬度：' + latitude.toFixed(4) + ',' + longitude.toFixed(4) + '）'
        })
        wx.hideLoading()
        wx.showToast({ title: '定位成功', icon: 'success' })
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showModal({ title: '定位失败', content: '请授权位置权限', showCancel: false })
      }
    })
  },

  // 提交申请
  onSubmit() {
    const { stallName, phone, address, latitude, longitude, hotProducts, description } = this.data

    if (!stallName) return wx.showToast({ title: '请输入摊位名称', icon: 'error' })
    if (!phone) return wx.showToast({ title: '请输入手机号', icon: 'error' })
    if (!/^1[3-9]\d{9}$/.test(phone)) return wx.showToast({ title: '手机号格式不正确', icon: 'error' })
    if (!latitude) return wx.showToast({ title: '请先点击获取定位', icon: 'error' })

    this.setData({ submitting: true })

    vendorApi.applyVendor({
      stallName,
      phone,
      address: address || '未知地址',
      latitude,
      longitude,
      hotProducts,
      description
    }).then(res => {
      this.setData({ submitting: false })
      if (res.code === 200) {
        wx.showToast({ title: '申请成功！', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/vendor/vendor'
          })
        }, 1500)
      } else {
        wx.showModal({ title: '失败', content: res.message, showCancel: false })
      }
    }).catch(err => {
      this.setData({ submitting: false })
      wx.showToast({ title: '网络错误', icon: 'error' })
    })
  }
})
