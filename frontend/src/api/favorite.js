import axios from 'axios'

// 创建 axios 实例（和 vendor.js 一样）
const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API 请求错误:', error)
    return Promise.reject(error)
  }
)

// 收藏相关 API
export const favoriteApi = {
  // 收藏摊位
  addFavorite(userId, vendorId) {
    return api.post('/favorite/add', null, {
      params: { userId, vendorId }
    })
  },
  
  // 取消收藏
  removeFavorite(userId, vendorId) {
    return api.delete('/favorite/remove', {
      params: { userId, vendorId }
    })
  },
  
  // 检查是否已收藏
  checkFavorite(userId, vendorId) {
    return api.get('/favorite/check', {
      params: { userId, vendorId }
    })
  },
  
  // 获取用户收藏列表
  getUserFavorites(userId) {
    return api.get(`/favorite/user/${userId}`)
  }
}

export default api