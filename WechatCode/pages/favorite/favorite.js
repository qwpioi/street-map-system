const { favoriteApi, getUserId } = require('../../utils/api')

Page({
  data: {
    favorites: [],
    loading: false,
    isLoggedIn: false
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    // 每次显示页面时刷新收藏列表
    if (this.data.isLoggedIn) {
      this.loadFavorites()
    }
  },

  /**
   * 检查登录状态
   */
  checkLogin() {
    const userId = getUserId()
    const token = wx.getStorageSync('token')
    
    if (token && userId) {
      this.setData({ 
        isLoggedIn: true
      })
      this.loadFavorites()
    } else {
      this.setData({ 
        isLoggedIn: false
      })
      wx.showModal({
        title: '提示',
        content: '请先登录再查看收藏',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
    }
  },

  /**
   * 加载收藏列表
   */
  loadFavorites() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    favoriteApi.getFavorites()
      .then(res => {
        console.log('✅ 收藏列表响应:', res)
        
        // ✅ 修复：先判断 res.code，再取 res.data
        if (res.code !== 200 || !res.data) {
          this.setData({ favorites: [], loading: false })
          return
        }
        
        const favorites = res.data
        
        // 处理收藏数据，添加距离信息
        const processedFavorites = favorites.map(fav => {
          return {
            id: fav.vendorId,
            stallName: fav.stallName || '未知摊位',
            address: fav.address || '',
            hotProducts: fav.hotProducts || '',
            latitude: parseFloat(fav.latitude) || 0,
            longitude: parseFloat(fav.longitude) || 0,
            favoriteId: fav.favoriteId,
            createTime: fav.createTime
          }
        })
        
        this.setData({ 
          favorites: processedFavorites,
          loading: false
        })
      })
      .catch(err => {
        console.error('❌ 加载收藏失败:', err)
        this.setData({ 
          favorites: [],
          loading: false
        })
      })
  },

  /**
   * 点击收藏项
   */
  onFavoriteItemTap(e) {
    const item = e.currentTarget.dataset.item
    console.log('📍 点击收藏:', item)
    
    // 跳转到地图页并定位到该摊位
    wx.openLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      name: item.stallName,
      address: item.address,
      scale: 16
    })
  },

  /**
   * 取消收藏
   */
  async onCancelFavorite(e) {
    const item = e.currentTarget.dataset.item
    
    wx.showModal({
      title: '确认取消',
      content: `确定要取消收藏"${item.stallName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...', mask: true })
          
          try {
            await favoriteApi.removeFavorite(item.id)
            
            wx.hideLoading()
            wx.showToast({
              title: '已取消收藏',
              icon: 'success'
            })
            
            // 从列表中移除
            const favorites = this.data.favorites.filter(f => f.id !== item.id)
            this.setData({ favorites })
          } catch (err) {
            wx.hideLoading()
            console.error('❌ 取消收藏失败:', err)
          }
        }
      }
    })
  },

  /**
   * 去首页逛逛
   */
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
