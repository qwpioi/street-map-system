const { favoriteApi, vendorApi, reviewApi, productApi, getUserId } = require('../../utils/api')
const logger = require('../../utils/logger')
const { QQ_MAP_KEY } = require('../../utils/config')
const QQMapWX = require('../../utils/qqmap-wx-jssdk.min')
const { fixDevLocation, calculateDistance } = require('../../utils/util')
const qqmapsdk = new QQMapWX({ key: QQ_MAP_KEY })

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
    lastLoadTime: 0, // 记录上次加载时间，用于节流
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
        logger.info('✅ 已收藏的摊位 ID:', favoriteIds)
        this.setData({ favoriteVendorIds: favoriteIds })
        
        // 更新摊位列表的收藏状态
        this.updateVendorFavoriteStatus()
      })
      .catch(err => {
        logger.error('❌ 加载收藏 ID 失败:', err)
      })
  },

  /**
   * 更新摊位列表的收藏状态（优化 setData，使用路径更新）
   */
  updateVendorFavoriteStatus() {
    const updates = {}
    this.data.vendors.forEach((v, index) => {
      const isFavorite = this.data.favoriteVendorIds.includes(v.id)
      if (v.isFavorite !== isFavorite) {
        updates[`vendors[${index}].isFavorite`] = isFavorite
      }
    })
    if (Object.keys(updates).length > 0) {
      this.setData(updates)
    }
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

    // 每次回到首页都刷新推荐列表，保证新增摊位/营业状态变化实时可见
    // （首次进入时坐标为空，由 getLocation 成功回调负责首载，不会重复请求）
    // 添加 30 秒节流，避免频繁切换页面时重复请求
    const { latitude, longitude, lastLoadTime } = this.data
    const now = Date.now()
    if (latitude && longitude && (now - lastLoadTime > 30000)) {
      this.loadVendors(latitude, longitude, { silent: true })
    }
  },

  getLocation() {
    wx.showLoading({ title: '定位中...', mask: true })

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        let { latitude, longitude } = res
        logger.debug('✅ 原始定位:', latitude, longitude)

        // 开发者工具 IP 定位偏差检测
        const fixed = fixDevLocation(latitude, longitude)
        latitude = fixed.latitude
        longitude = fixed.longitude
        logger.debug('✅ 使用定位:', latitude, longitude)

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
            const fullAddress = recommend || address || ''
            // 截取详细地址（去掉省市区前缀）
            const detailAddress = this.extractDetailAddress(fullAddress)
            this.setData({ address: detailAddress })
            logger.debug('✅ 地址解析:', detailAddress)
          },
          fail: (err) => {
            logger.warn('⚠️ 逆地址解析失败，回退显示:', err)
            this.setData({ address: '定位成功' })
          },
          complete: () => wx.hideLoading()
        })
      },
      fail: (err) => {
        logger.error('❌ 定位失败:', err)
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

  /**
   * 加载智能推荐摊位列表
   * @param {Object} options.silent 为 true 时后台静默刷新（不弹 toast，失败仅记日志）
   */
  loadVendors(latitude, longitude, options = {}) {
    const silent = !!options.silent

    // 更新加载时间戳（用于节流）
    this.setData({ lastLoadTime: Date.now() })

    vendorApi.getSmartRecommendedVendors(latitude, longitude)
      .then(res => {
        logger.debug('✅ 智能推荐返回:', res)

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
              status: vendor.status, // 营业状态：1=营业中，0=已收摊
              averageRating: vendor.averageRating || 0,
              reviewCount: vendor.reviewCount || 0,
              isFavorite: this.data.favoriteVendorIds.includes(vendor.id)
            }
          })

          logger.debug('📊 处理后的摊位数据:', vendors)

          const markers = this.createMarkers(vendors)
          logger.debug(' 地图标记:', markers)

          this.setData({ vendors, markers })

          // 仅主动加载（首次进入、手动重定位）时提示，后台静默刷新不打扰用户
          if (!silent) {
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
        }
      })
      .catch(err => {
        logger.error('❌ 加载摊位失败:', err)
        if (!silent) {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
        }
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
    const item = e.detail?.vendor || e.currentTarget.dataset.item
    logger.debug('📍 点击摊位卡片:', item)
    
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
      logger.debug('📦 拿到的商品原始数据:', products)

      this.setData({
        averageRating,
        reviewCount,
        recentReviews,
        hotProductsArray,
        vendorDetailVisible: true,
        ['selectedVendor.products']: products, // 保持旧逻辑兼容
        vendorProducts: products               // 扁平化变量
      })

      logger.info('✅ 评价和商品数据加载成功:', { averageRating, reviewCount, recentReviews: recentReviews.length, products: products.length })
    } catch (err) {
      logger.error('❌ 加载数据异常详情:', err)
      logger.error('❌ 加载评价失败:', err)
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
      url: `/pagesReview/review-list/review-list?vendorId=${this.data.selectedVendor.id}&vendorName=${this.data.selectedVendor.stallName}`
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
      url: `/pagesReview/add-review/add-review?vendorId=${this.data.selectedVendor.id}&vendorName=${this.data.selectedVendor.stallName}`
    })
  },

  /**
   * 切换收藏状态
   */
  async onToggleFavorite(e) {
    const item = e.detail?.vendor || e.currentTarget.dataset.item
    
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
      logger.error('❌ 收藏操作失败:', err)
    }
  },

  /**
   * 弹窗内切换收藏状态
   */
  async onToggleFavoriteInModal(e) {
    const item = e.detail?.vendor || e.currentTarget.dataset.item
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
      logger.error('❌ 弹窗收藏操作失败:', err)
    }
  },

  navigateToVendor(e) {
    const item = e.detail?.vendor || e.currentTarget.dataset.item
    
    wx.openLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      name: item.stallName,
      address: item.address,
      scale: 16
    })
  },

  /**
   * 从完整地址中提取详细地址部分（去掉省、市、区/县/镇前缀）
   */
  extractDetailAddress(address) {
    if (!address || address.trim() === '') {
      return ''
    }

    // 查找最后一个行政区划分隔符（区/县/市/镇）的位置
    let lastIndex = -1
    const markers = ['区', '县', '市', '镇']
    markers.forEach(marker => {
      const idx = address.lastIndexOf(marker)
      if (idx > lastIndex) {
        lastIndex = idx
      }
    })

    // 如果找到分隔符且后面还有内容，返回截取后的部分
    if (lastIndex >= 0 && lastIndex < address.length - 1) {
      return address.substring(lastIndex + 1)
    }

    // 如果没找到分隔符，或分隔符后没有内容，返回原地址
    return address
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
        wx.navigateTo({ url: '/pagesVendor/vendor/vendor' });
      } else {
        wx.navigateTo({ url: '/pagesVendor/apply-vendor/apply-vendor' });
      }
    }).catch(err => {
      wx.navigateTo({ url: '/pagesVendor/apply-vendor/apply-vendor' });
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
      url: `/pagesOther/hot-ranking/hot-ranking?latitude=${latitude}&longitude=${longitude}`
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
      url: '/pagesReview/my-reviews/my-reviews'
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
    const vendor = e.detail?.vendor || {}
    const vendorId = vendor.id || e.currentTarget.dataset.vendorId
    wx.navigateTo({
      url: `/pagesOther/vendor-detail/vendor-detail?id=${vendorId}`
    });
  },

  // 区块标题"更多"点击
  onMoreTap() {
    // 可扩展：跳转到更多推荐页面
  }
})