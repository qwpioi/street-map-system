const { vendorApi, getUserId } = require('../../utils/api');
const logger = require('../../utils/logger');

Page({
  data: {
    isLoggedIn: false,
    userInfo: {}
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const userId = getUserId()
    const userInfo = wx.getStorageSync('userInfo')

    if (userId && userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      })
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: {}
      })
    }
  },

  goLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          this.setData({
            isLoggedIn: false,
            userInfo: {}
          })
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  goFavorite() {
    wx.switchTab({
      url: '/pages/favorite/favorite'
    })
  },

  goVendor() {
    vendorApi.getMyVendor().then(res => {
      if (res.code === 200 && res.data) {
        wx.navigateTo({ url: '/pagesVendor/vendor/vendor' });
      } else {
        wx.showModal({
          title: '提示',
          content: '您还不是摊主，无法使用此功能。',
          showCancel: false
        });
      }
    }).catch(err => {
      logger.error('获取摊位信息失败:', err)
      wx.showModal({
        title: '网络错误',
        content: err.errMsg || '请检查网络或后端服务',
        showCancel: false
      });
    })
  },

  goComments() {
    if (!getUserId()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pagesReview/my-reviews/my-reviews'
    })
  },

  goBecomeVendor() {
    vendorApi.getMyVendor().then(res => {
      if (res.code === 200 && res.data) {
        // ✅ 已经是摊主 -> 去管理页
        wx.navigateTo({ url: '/pagesVendor/vendor/vendor' });
      } else {
        // ❌ 还不是摊主 -> 去申请页
        wx.navigateTo({ url: '/pagesVendor/apply-vendor/apply-vendor' });
      }
    }).catch(err => {
      logger.error('获取摊位信息失败:', err)
      // 网络错误等情况，也引导去申请页或者提示
      wx.navigateTo({ url: '/pagesVendor/apply-vendor/apply-vendor' });
    })
  },

  goSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  goAbout() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
})
