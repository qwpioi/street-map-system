const { API_BASE_URL } = require('../../utils/config')
const logger = require('../../utils/logger')

Page({
  data: {
    loading: false,
    showPrivacy: false
  },

  onLoad() {
    const token = wx.getStorageSync('token')
    if (token) {
      console.log('✅ 已登录，直接跳转到首页')
      wx.reLaunch({
        url: '/pages/index/index'
      })
    } else {
      // 未登录时检查是否需要显示隐私弹窗
      this.checkPrivacyAuth()
    }
  },

  /**
   * 检查隐私授权状态
   */
  checkPrivacyAuth() {
    wx.getPrivacySetting({
      success: res => {
        console.log('隐私授权状态:', res)
        if (res.needAuthorization) {
          // 需要授权，显示隐私弹窗
          this.setData({ showPrivacy: true })
        }
      },
      fail: err => {
        console.error('获取隐私设置失败:', err)
      }
    })
  },

  /**
   * 同意隐私协议
   */
  onPrivacyAgree() {
    wx.requirePrivacyAuthorize({
      success: () => {
        console.log('✅ 用户同意隐私协议')
        this.setData({ showPrivacy: false })
      },
      fail: err => {
        console.error('隐私授权失败:', err)
      }
    })
  },

  /**
   * 拒绝隐私协议
   */
  onPrivacyReject() {
    this.setData({ showPrivacy: false })
    wx.showToast({
      title: '拒绝隐私协议将无法使用小程序',
      icon: 'none',
      duration: 2000
    })
  },

  wxLogin() {
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('✅ 获取 code 成功:', res.code)
          this.loginToServer(res.code)
        } else {
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          })
          wx.hideLoading()
        }
      },
      fail: (err) => {
        console.error('❌ wx.login 失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
        wx.hideLoading()
      }
    })
  },

  goAgreement() {
    wx.navigateTo({
      url: '/pagesOther/agreement/agreement?type=agreement'
    })
  },

  goPrivacy() {
    wx.navigateTo({
      url: '/pagesOther/agreement/agreement?type=privacy'
    })
  },

  loginToServer(code) {
    wx.showLoading({ title: '登录中...', mask: true })
    
    wx.request({
      url: `${API_BASE_URL}/auth/wechat-login`,
      method: 'POST',
      data: {
        code: code
      },
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading()
        console.log('🔑 登录响应:', res.data)
        
        if (res.data && res.data.code === 200) {
          const { token, user } = res.data.data
          
          // 存储 token 和用户信息
          wx.setStorageSync('token', token)
          wx.setStorageSync('userInfo', user)
          
          // 更新全局状态
          const app = getApp()
          app.globalData.token = token
          app.globalData.userInfo = user
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          // 跳转首页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/index/index'
            })
          }, 1000)
        } else {
          wx.showToast({
            title: res.data.message || '登录失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('❌ 登录请求失败:', err)
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        })
      }
    })
  }
})
