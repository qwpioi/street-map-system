const { favoriteApi, vendorApi, reviewApi, productApi, API_BASE_URL, getUserId } = require('../../utils/api')
const QQMapWX = require('../../utils/qqmap-wx-jssdk.min')
const { fixDevLocation } = require('../../utils/util')
const qqmapsdk = new QQMapWX({ key: '3DYBZ-NF2CN-XNYF2-SE3HN-NMFMS-T2BMO' })

const app = getApp()

Page({
  data: {
    address: '',
    vendors: [],
    markers: [],
    latitude: 0,
    longitude: 0,
    isLoggedIn: false,
    userInfo: null,
    favoriteVendorIds: [],
    // 摊位详情
    selectedVendor: null,
    vendorDetailVisible: false,
    averageRating: 0,
    reviewCount: 0,
    recentReviews: [],
    stars: [1, 2, 3, 4, 5],
    vendorProducts: [] // 新增：预先初始化商品列表字段
  },

  onLoad() {
    this.checkLogin()
    this.getLocation()
  },

  /**
   * 加载用户收藏的摊位 ID 列表
   */
  loadFavoriteIds() {
    if (!this.data.isLoggedIn) return
    
    favoriteApi.getFavorites()
      .then(res => {
        // ✅ 修复：先判断 res.code，再取 res.data
        if (res.code !== 200 || !res.data) {
          this.setData({ favoriteVendorIds: [] })
          return
        }
        const favoriteIds = res.data.map(f => f.vendorId)
        console.log('✅ 已收藏的摊位 ID:', favoriteIds)
        this.setData({ favoriteVendorIds: favoriteIds })
        
        // 更新摊位列表的收藏状态
        this.updateVendorFavoriteStatus()
      })
      .catch(err => {
        console.error('❌ 加载收藏 ID 失败:', err)
      })
  },

  /**
   * 更新摊位列表的收藏状态
   */
  updateVendorFavoriteStatus() {
    const vendors = this.data.vendors.map(v => ({
      ...v,
      isFavorite: this.data.favoriteVendorIds.includes(v.id)
    }))
    this.setData({ vendors })
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.setData({ 
        isLoggedIn: true,
        userInfo: userInfo
      })
      app.globalData.userInfo = userInfo
      app.globalData.token = token
      
      // 加载收藏状态
      this.loadFavoriteIds()
    } else {
      this.setData({ 
        isLoggedIn: false,
        userInfo: null,
        favoriteVendorIds: []
      })
    }
  },

  onShow() {
    this.checkLogin()
    
    // 如果从商品管理页返回，自动刷新摊位数据（含商品列表）
    if (getApp().globalData.needRefreshVendors) {
      getApp().globalData.needRefreshVendors = false
      if (this.data.latitude && this.data.longitude) {
        this.loadVendors(this.data.latitude, this.data.longitude)
      }
    }
  },

  getLocation() {
    wx.showLoading({ title: '定位中...', mask: true })

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        let { latitude, longitude } = res
        console.log('✅ 原始定位:', latitude, longitude)

        // 开发者工具 IP 定位偏差检测
        const fixed = fixDevLocation(latitude, longitude)
        latitude = fixed.latitude
        longitude = fixed.longitude
        console.log('✅ 使用定位:', latitude, longitude)

        // 先保存坐标，立即开始加载摊位（不阻塞）
        this.setData({ latitude, longitude })
        this.loadVendors(latitude, longitude)

        // 腾讯地图逆地址解析：坐标 → 中文地址
        qqmapsdk.reverseGeocoder({
          location: { latitude, longitude },
          success: (geoRes) => {
            // formatted_addresses.recommend = "北京市朝阳区望京街道XX小区"
            const recommend = geoRes?.result?.formatted_addresses?.recommend
            const address = geoRes?.result?.address
            this.setData({ address: recommend || address || '' })
            console.log('✅ 地址解析:', recommend || address)
          },
          fail: (err) => {
            console.warn('⚠️ 逆地址解析失败，回退显示:', err)
            this.setData({ address: '定位成功' })
          },
          complete: () => wx.hideLoading()
        })
      },
      fail: (err) => {
        console.error('❌ 定位失败:', err)
        this.setData({ address: '定位失败，请重试' })
        wx.hideLoading()
      }
    })
  },

  /**
   * 点击地址栏 → 重新定位
   */
  onLocationTap() {
    this.getLocation()
  },

  loadVendors(latitude, longitude) {
    vendorApi.getSmartRecommendedVendors(latitude, longitude)
      .then(res => {
        console.log('✅ 智能推荐返回:', res)

        if (res && res.code === 200) {
          const vendors = res.data.map(vendor => {
            const lat = parseFloat(vendor.latitude)
            const lng = parseFloat(vendor.longitude)
            const dist = parseFloat(vendor.distance) || 0
            const distanceText = dist < 1
              ? `${Math.round(dist * 1000)}m`
              : `${dist.toFixed(2)}km`

            return {
              id: vendor.id,
              stallName: vendor.stallName || '未知摊位',
              address: vendor.address || '',
              phone: vendor.phone || '',
              hotProducts: vendor.hotProducts || '',
              products: vendor.products || [],
              distance: dist,
              distanceText: distanceText,
              latitude: lat,
              longitude: lng,
              averageRating: vendor.averageRating || 0,
              reviewCount: vendor.reviewCount || 0,
              isFavorite: this.data.favoriteVendorIds.includes(vendor.id)
            }
          })

          console.log('📊 处理后的摊位数据:', vendors)

          const markers = this.createMarkers(vendors)
          console.log(' 地图标记:', markers)

          this.setData({ vendors, markers })

          if (vendors.length > 0) {
            wx.showToast({
              title: `找到${vendors.length}个摊位`,
              icon: 'success',
              duration: 2000
            })
          } else {
            wx.showToast({
              title: '附近暂无摊位',
              icon: 'none'
            })
          }
        }
      })
      .catch(err => {
        console.error('❌ 加载摊位失败:', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  createMarkers(vendors) {
    return vendors.map((vendor, index) => ({
      id: vendor.id,
      index: index,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      title: vendor.stallName,
      address: vendor.address,        // ✅ 添加
      hotProducts: vendor.hotProducts, // ✅ 添加
      callout: {
        content: vendor.stallName,
        display: 'ALWAYS',
        padding: 10,
        borderRadius: 5,
        bgColor: '#ffffff',
        color: '#333333',
        fontSize: 14,
        textAlign: 'center'
      },
      anchor: {
        x: 0.5,
        y: 1
      }
    }))
  },



  /**
   * 点击摊位卡片 - 显示详情
   */
  async onVendorCardTap(e) {
    const item = e.currentTarget.dataset.item
    console.log('📍 点击摊位卡片:', item)
    
    this.setData({ selectedVendor: item })
    
    // 🔥 处理热销产品（分割成数组）
    const hotProductsArray = item.hotProducts ? item.hotProducts.split(/[,，]/) : []
    
    // 获取评价信息
    try {
      const ratingRes = await reviewApi.getAverageRating(item.id)
      const averageRating = ratingRes?.data || ratingRes || 0

      const countRes = await reviewApi.getReviewCount(item.id)
      const reviewCount = countRes?.data || countRes || 0

      const reviewsRes = await reviewApi.getVendorReviews(item.id)
      const allReviews = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.data || [])
      const recentReviews = allReviews.slice(0, 3)

      // 获取该摊位的完整商品列表
      const productsRes = await productApi.getProducts(item.id)
      const products = productsRes?.data || productsRes || []
      console.log('📦 拿到的商品原始数据:', products)

      this.setData({
        averageRating,
        reviewCount,
        recentReviews,
        hotProductsArray,
        vendorDetailVisible: true,
        ['selectedVendor.products']: products, // 保持旧逻辑兼容
        vendorProducts: products               // 扁平化变量
      })

      console.log('✅ 评价和商品数据加载成功:', { averageRating, reviewCount, recentReviews: recentReviews.length, products: products.length })
    } catch (err) {
      console.error('❌ 加载数据异常详情:', err)
      console.error('❌ 加载评价失败:', err)
      this.setData({
        averageRating: 0,
        reviewCount: 0,
        recentReviews: [],
        hotProductsArray,
        vendorDetailVisible: true
      })
    }
  },

  /**
   * 关闭摊位详情弹窗
   */
  onCloseVendorDetail() {
    this.setData({
      vendorDetailVisible: false,
      selectedVendor: null
    })
  },

  callPhone() {
    const phone = this.data.selectedVendor.phone
    if (!phone) return
    wx.makePhoneCall({ phoneNumber: phone })
  },

  /**
   * 查看完整评价列表
   */
  onViewAllReviews() {
    if (!this.data.selectedVendor) return
    
    wx.navigateTo({
      url: `/pages/review-list/review-list?vendorId=${this.data.selectedVendor.id}&vendorName=${this.data.selectedVendor.stallName}`
    })
  },

  /**
   * 发表评价
   */
  onAddReview() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录再评价',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/login'
          })
        }
      })
      return
    }
    
    if (!this.data.selectedVendor) return
    
    wx.navigateTo({
      url: `/pages/add-review/add-review?vendorId=${this.data.selectedVendor.id}&vendorName=${this.data.selectedVendor.stallName}`
    })
  },

  /**
   * 切换收藏状态
   */
  async onToggleFavorite(e) {
    const item = e.currentTarget.dataset.item
    
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录再收藏',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/login'
          })
        }
      })
      return
    }
    
    const isFavorite = item.isFavorite
    
    try {
      if (isFavorite) {
        // 取消收藏
        await favoriteApi.removeFavorite(item.id)
        
        // 更新本地状态
        const favoriteIds = this.data.favoriteVendorIds.filter(id => id !== item.id)
        this.setData({ favoriteVendorIds: favoriteIds })
        
        // 更新摊位列表显示
        const vendors = this.data.vendors.map(v => 
          v.id === item.id ? { ...v, isFavorite: false } : v
        )
        this.setData({ vendors })
        
        wx.showToast({
          title: '已取消收藏',
          icon: 'success'
        })
      } else {
        // 添加收藏
        await favoriteApi.addFavorite(item.id)
        
        // 更新本地状态
        const favoriteIds = [...this.data.favoriteVendorIds, item.id]
        this.setData({ favoriteVendorIds: favoriteIds })
        
        // 更新摊位列表显示
        const vendors = this.data.vendors.map(v => 
          v.id === item.id ? { ...v, isFavorite: true } : v
        )
        this.setData({ vendors })
        
        wx.showToast({
          title: '收藏成功',
          icon: 'success'
        })
      }
    } catch (err) {
      console.error('❌ 收藏操作失败:', err)
    }
  },

  /**
   * 弹窗内切换收藏状态
   */
  async onToggleFavoriteInModal(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return

    if (!this.data.isLoggedIn) {
      wx.showModal({ title: '提示', content: '请先登录再收藏', showCancel: false })
      return
    }

    const isFavorite = item.isFavorite
    try {
      if (isFavorite) {
        await favoriteApi.removeFavorite(item.id)
        wx.showToast({ title: '已取消收藏', icon: 'success' })
      } else {
        await favoriteApi.addFavorite(item.id)
        wx.showToast({ title: '收藏成功', icon: 'success' })
      }

      this.setData({
        ['selectedVendor.isFavorite']: !isFavorite,
        vendors: this.data.vendors.map(v => v.id === item.id ? { ...v, isFavorite: !isFavorite } : v),
        favoriteVendorIds: isFavorite
          ? this.data.favoriteVendorIds.filter(id => id !== item.id)
          : [...this.data.favoriteVendorIds, item.id]
      })
    } catch (err) {
      console.error('❌ 弹窗收藏操作失败:', err)
    }
  },

  navigateToVendor(e) {
    const item = e.currentTarget.dataset.item
    
    wx.openLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      name: item.stallName,
      address: item.address,
      scale: 16
    })
  },

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(2)}km`
  },

  handleLogin() {
    if (this.data.isLoggedIn) {
      wx.showActionSheet({
        itemList: ['查看个人信息', '退出登录'],
        success: (res) => {
          if (res.tapIndex === 1) {
            this.logout()
          }
        }
      })
    } else {
      wx.navigateTo({
        url: '/pages/login/login'
      })
    }
  },

  logout() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    app.globalData.token = null
    app.globalData.userInfo = null
    
    this.setData({
      isLoggedIn: false,
      userInfo: null
    })
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    })
  },

  goNearby() {
    wx.pageScrollTo({
      scrollTop: 800,
      duration: 300
    })
  },

  goBecomeVendor() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.navigateTo({ url: '/pages/login/login' })
        }
      })
      return
    }

    vendorApi.getMyVendor().then(res => {
      if (res.code === 200 && res.data) {
        wx.navigateTo({ url: '/pages/vendor/vendor' });
      } else {
        wx.navigateTo({ url: '/pages/apply-vendor/apply-vendor' });
      }
    }).catch(err => {
      wx.navigateTo({ url: '/pages/apply-vendor/apply-vendor' });
    })
  },

  goFavorite() {
    wx.switchTab({
      url: '/pages/favorite/favorite'
    })
  },

  goCategories() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  goHotList() {
    const { latitude, longitude } = this.data
    if (!latitude || !longitude) {
      wx.showToast({
        title: '请先获取位置',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: `/pages/hot-ranking/hot-ranking?latitude=${latitude}&longitude=${longitude}`
    })
  },

  goMap() {
    wx.switchTab({
      url: '/pages/map/map'
    })
  },

  goComments() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.navigateTo({ url: '/pages/login/login' })
        }
      })
      return
    }
    wx.navigateTo({
      url: '/pages/my-reviews/my-reviews'
    })
  },

  goAllServices() {
    wx.showToast({
      title: '更多功能开发中',
      icon: 'none'
    })
  },

  // 跳转到摊主详情页（用户视角）
  goToVendorPage(e) {
    const vendorId = e.currentTarget.dataset.vendorId;
    wx.navigateTo({
      url: `/pages/vendor-detail/vendor-detail?id=${vendorId}`
    });
  }
})