import axios from 'axios'

// 创建 axios 实例（和 favorite.js 一样）
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

// 评价相关 API
export const reviewApi = {
  // 获取摊位评价列表
  getReviewsByVendorId(vendorId) {
    return api.get(`/review/vendor/${vendorId}`)
  },

  // 获取用户评价列表
  getReviewsByUserId(userId) {
    return api.get(`/review/user/${userId}`)
  },

  // 添加评价
  addReview(review) {
    return api.post('/review/add', review)
  },

  // 获取摊位平均评分
  getAverageRating(vendorId) {
    return api.get(`/review/average/${vendorId}`)
  }
}

export default api