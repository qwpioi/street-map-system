// app.js
App({
  onLaunch() {
    this.checkPrivacyAuth()
    this.initLogin()
  },

  /**
   * 检查隐私授权状态
   * 如果需要授权，会在登录页展示隐私弹窗
   */
  checkPrivacyAuth() {
    wx.getPrivacySetting({
      success: res => {
        console.log('隐私授权状态:', res)
        if (res.needAuthorization) {
          // 需要授权，存储状态供登录页使用
          this.globalData.needPrivacyAuth = true
        }
      },
      fail: err => {
        console.error('获取隐私设置失败:', err)
      }
    })
  },

  initLogin() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      console.log('✅ 已登录用户:', userInfo.nickName)
    } else {
      console.log('ℹ️ 未登录，将引导用户登录')
    }
  },

  checkAuth() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return false
    }
    return true
  },

  globalData: {
    userInfo: null,
    token: null,
    needRefreshVendors: false,
    needPrivacyAuth: false
  }
})
