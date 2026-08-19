/**
 * API 工具模块
 * 封装所有后端接口调用
 */

// 本地开发环境：指向本机后端（微信开发者工具需勾选"不校验合法域名"）
// 上线时改回：'http://47.94.23.66/api'
const API_BASE_URL = 'http://192.168.1.5:8081/api'

/**
 * 获取存储的 token
 */
function getToken() {
  return wx.getStorageSync('token') || ''
}

/**
 * 获取存储的用户信息
 */
function getUserInfo() {
  return wx.getStorageSync('userInfo') || null
}

/**
 * 获取用户 ID
 */
function getUserId() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.id : null
}

/**
 * 封装 request，自动添加 token
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    
    wx.request({
      ...options,
      url: options.url.startsWith('http') ? options.url : `${API_BASE_URL}${options.url}`,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        // 401/403 表示 token 过期或无效，清除登录状态
        if (res.statusCode === 401 || res.statusCode === 403) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          const app = getApp()
          if (app) {
            app.globalData.token = null
            app.globalData.userInfo = null
          }
          wx.showModal({
            title: '登录已过期',
            content: '请重新登录',
            showCancel: false,
            success: () => {
              wx.reLaunch({ url: '/pages/login/login' })
            }
          })
          reject(new Error('token 过期'))
          return
        }
        resolve(res.data)
      },
      fail: (err) => {
        console.error('API 请求失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/**
 * 收藏相关接口
 */
const favoriteApi = {
  /**
   * 获取用户收藏列表
   */
  getFavorites() {
    const userId = getUserId()
    if (!userId) {
      return Promise.reject(new Error('未登录'))
    }
    return request({
      url: `/favorite/user/${userId}`,
      method: 'GET'
    })
  },

  /**
   * 添加收藏
   */
  addFavorite(vendorId) {
    const userId = getUserId()
    if (!userId) {
      return Promise.reject(new Error('未登录'))
    }
    return request({
      url: '/favorite/add',
      method: 'POST',
      data: {
        userId,
        vendorId
      }
    })
  },

  /**
   * 取消收藏
   */
  removeFavorite(vendorId) {
    const userId = getUserId()
    if (!userId) {
      return Promise.reject(new Error('未登录'))
    }
    return request({
      url: '/favorite/remove',
      method: 'DELETE',
      data: {
        userId,
        vendorId
      }
    })
  },

  /**
   * 检查是否已收藏
   */
  checkFavorite(vendorId) {
    const userId = getUserId()
    if (!userId) {
      return Promise.resolve(false)
    }
    return request({
      url: '/favorite/check',
      method: 'GET',
      data: {
        userId,
        vendorId
      }
    })
  }
}

/**
 * 摊位相关接口
 */
const vendorApi = {
  /**
   * 获取开摊摊位列表
   */
  getOpenVendors() {
    return request({
      url: '/vendor/open',
      method: 'GET'
    })
  },

  /**
   * 获取附近摊位（带坐标）
   */
  getNearbyVendors(latitude, longitude) {
    return request({
      url: '/vendor/nearby',
      method: 'GET',
      data: {
        latitude,
        longitude
      }
    })
  },

  /**
   * 获取智能推荐摊位列表（已计算距离并排序）
   */
  getSmartRecommendedVendors(latitude, longitude) {
    return request({
      url: `/vendor/smart-list?latitude=${latitude}&longitude=${longitude}`,
      method: 'GET'
    })
  },

  /**
   * 获取热门排行摊位列表（3KM内按评分降序）
   */
  getHotRankingVendors(latitude, longitude) {
    return request({
      url: `/vendor/hot-ranking?latitude=${latitude}&longitude=${longitude}`,
      method: 'GET'
    })
  },

  /**
   * 获取我的摊位
   */
  getMyVendor() {
    return request({ url: '/vendor/my', method: 'GET' })
  },

  /**
   * 根据ID获取摊位详情
   */
  getVendorById(vendorId) {
    return request({ url: `/vendor/${vendorId}`, method: 'GET' })
  },

  /**
   * 修改摊位状态
   */
  updateVendorStatus(status, latitude, longitude, address) {
    let data = { status }
    if (latitude !== null && longitude !== null) {
      data.latitude = latitude
      data.longitude = longitude
    }
    if (address !== undefined && address !== null) {
      data.address = address
    }
    return request({ url: '/vendor/status', method: 'PUT', data })
  },

  /**
   * 申请成为摊主
   */
  applyVendor(data) {
    return request({ url: '/vendor/apply', method: 'POST', data })
  },

  /**
   * 更新摊位信息（名称、头像、手机号）
   */
  updateVendorInfo(data) {
    return request({ url: '/vendor/info', method: 'PUT', data })
  },

  /**
   * 逆地理编码解析摊位地址（异步调用）
   */
  resolveAddress() {
    return request({ url: '/vendor/resolve-address', method: 'POST' })
  }
}

/**
 * 用户相关接口
 */
const userApi = {
  /**
   * 微信登录
   */
  wechatLogin(code) {
    return request({
      url: '/auth/wechat-login',
      method: 'POST',
      data: { code }
    })
  }
}

/**
 * 评价相关接口
 */
const reviewApi = {
  /**
   * 【新】获取摊位评价列表（含用户名和头像）
   */
  getVendorReviews(vendorId) {
    return request({
      url: `/review/vendor/${vendorId}/list`,
      method: 'GET'
    })
  },

  /**
   * 【新】获取评价数量
   */
  getReviewCount(vendorId) {
    return request({
      url: `/review/count/${vendorId}`,
      method: 'GET'
    })
  },

  /**
   * 获取用户评价列表
   */
  getUserReviews() {
    const userId = getUserId()
    if (!userId) {
      return Promise.reject(new Error('未登录'))
    }
    return request({
      url: `/review/user/my-reviews`,
      method: 'GET'
    })
  },

  /**
   * 添加评价
   */
  addReview(vendorId, rating, content) {
    const userId = getUserId()
    if (!userId) {
      return Promise.reject(new Error('未登录'))
    }
    return request({
      url: '/review/add',
      method: 'POST',
      data: {
        userId,
        vendorId,
        rating,
        content
      }
    })
  },

  /**
   * 获取平均评分
   */
  getAverageRating(vendorId) {
    return request({
      url: `/review/average/${vendorId}`,
      method: 'GET'
    })
  },

  /**
   * 删除评价
   */
  deleteReview(reviewId) {
    return request({
      url: `/review/${reviewId}`,
      method: 'DELETE'
    })
  }
}

/**
 * 商品相关接口
 */
const productApi = {
  /**
   * 获取摊位商品列表
   */
  getProducts(vendorId) {
    return request({
      url: `/product/vendor/${vendorId}`,
      method: 'GET'
    })
  },

  /**
   * 添加商品
   */
  addProduct(product) {
    return request({
      url: '/product/add',
      method: 'POST',
      data: product
    })
  },

  /**
   * 更新商品
   */
  updateProduct(product) {
    return request({
      url: '/product/update',
      method: 'PUT',
      data: product
    })
  },

  /**
   * 删除商品
   */
  deleteProduct(productId) {
    return request({
      url: `/product/${productId}`,
      method: 'DELETE'
    })
  }
}

/**
 * 文件上传相关接口
 */
const uploadApi = {
  /**
   * 上传图片到后端
   */
  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      const token = getToken()
      wx.uploadFile({
        url: `${API_BASE_URL}/upload/image`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data)
          } else {
            wx.showToast({ title: data.message || '上传失败', icon: 'none' })
            reject(data)
          }
        },
        fail: (err) => {
          wx.showToast({ title: '上传失败', icon: 'none' })
          reject(err)
        }
      })
    })
  }
}

module.exports = {
  API_BASE_URL,
  getToken,
  getUserInfo,
  getUserId,
  request,
  favoriteApi,
  vendorApi,
  userApi,
  reviewApi,
  productApi,
  uploadApi
}
