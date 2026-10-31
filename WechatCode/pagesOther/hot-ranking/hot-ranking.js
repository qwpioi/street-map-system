const { vendorApi } = require('../../utils/api')
const logger = require('../../utils/logger')

Page({
  data: {
    vendors: [],
    loading: true,
    latitude: 0,
    longitude: 0,
    stars: [1, 2, 3, 4, 5]
  },

  onLoad(options) {
    const { latitude, longitude } = options
    if (latitude && longitude) {
      this.setData({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      })
      this.loadHotRanking(parseFloat(latitude), parseFloat(longitude))
    } else {
      this.setData({ loading: false })
    }
  },

  loadHotRanking(latitude, longitude) {
    vendorApi.getHotRankingVendors(latitude, longitude)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || [])
        const vendors = list.map((vendor, index) => {
          const dist = parseFloat(vendor.distance) || 0
          return {
            ...vendor,
            rank: index + 1,
            distanceText: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(2)}km`,
            hotProductsArray: vendor.hotProducts ? vendor.hotProducts.split(/[,，]/) : []
          }
        })

        this.setData({ vendors, loading: false })
      })
      .catch(err => {
        logger.error('加载热门排行失败:', err)
        this.setData({ loading: false })
      })
  },

  onVendorTap(e) {
    const vendor = e.detail?.vendor || e.currentTarget.dataset.vendor
    wx.navigateTo({
      url: `/pagesOther/vendor-detail/vendor-detail?id=${vendor.id}`
    })
  }
})
