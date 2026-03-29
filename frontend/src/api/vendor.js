import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:8081/api', // 后端 API 地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加认证 token
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

// 摊主相关 API
export const vendorApi = {
  // 获取附近摊位
  getNearbyVendors(latitude, longitude, range = 0.1) {
    return api.get(`/vendor/nearby`, {
      params: {
        latitude,
        longitude,
        range
      }
    })
  },

  // 根据用户 ID 获取摊位
  getVendorByUserId(userId) {
    return api.get(`/vendor/user/${userId}`)
  },

  // 开摊
  openStall(userId, latitude, longitude, address) {
    return api.post('/vendor/open', null, {
      params: {
        userId,
        latitude,
        longitude,
        address
      }
    })
  },

  // 收摊
  closeStall(userId) {
    return api.post('/vendor/close', null, {
      params: {
        userId
      }
    })
  }
}

export default api