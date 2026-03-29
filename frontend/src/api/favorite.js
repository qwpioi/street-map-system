import request from '@/utils/request'

export const favoriteApi = {
  // 收藏摊位
  addFavorite(userId, vendorId) {
    return request.post('/api/favorite/add', null, {
      params: { userId, vendorId }
    })
  },
  
  // 取消收藏
  removeFavorite(userId, vendorId) {
    return request.delete('/api/favorite/remove', {
      params: { userId, vendorId }
    })
  },
  
  // 检查是否已收藏
  checkFavorite(userId, vendorId) {
    return request.get('/api/favorite/check', {
      params: { userId, vendorId }
    })
  },
  
  // 获取用户收藏列表
  getUserFavorites(userId) {
    return request.get(`/api/favorite/user/${userId}`)
  }
}