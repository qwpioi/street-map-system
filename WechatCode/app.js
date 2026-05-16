// app.js
App({
  onLaunch() {
    this.initLogin()
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
    needRefreshVendors: false
  }
})
