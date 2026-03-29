<template>
  <div class="map">
    <el-container>
      <el-header>
        <NavBar @logout="refreshPage" />
      </el-header>

      <el-main>
        <div class="map-container">
          <div class="map-header">
            <h2>地摊地图</h2>
            <div class="map-actions">
              <el-button type="primary" @click="locateMe">定位我</el-button>
              <el-button type="success" @click="loadNearbyVendors">查找附近摊位</el-button>
              <el-button @click="refreshMap">刷新地图</el-button>
            </div>
          </div>

          <div id="mapContainer" class="map-canvas"></div>

          <div class="map-info">
            <el-table :data="vendors" style="width: 100%">
              <el-table-column prop="stallName" label="摊位名称" width="200"></el-table-column>
              <el-table-column prop="address" label="地址" width="300"></el-table-column>
              <el-table-column prop="distance" label="距离" width="100"></el-table-column>
              <el-table-column label="操作">
                <template #default="{ row }">
                  <el-button size="small" @click="showVendor(row)">查看详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { initAmap, addMarkers, locateCurrentPosition } from '@/utils/amap.js'
import { vendorApi } from '@/api/vendor.js'
import { favoriteApi } from '@/api/favorite.js'
import { reviewApi } from '@/api/review.js'
import NavBar from '@/components/NavBar.vue'

export default {
  name: 'Map',
  components: {
    NavBar
  },
  data() {
    return {
      map: null,
      vendors: [],
      isFavorited: false,
      currentVendorId: null,
      averageRating: 0,
      reviews: [],
      mockVendors: [
        { 
          id: 10,
          lng: 113.625368, 
          lat: 34.746378, 
          stallName: '老王烧烤', 
          address: '郑州市金水区文化路 123 号', 
          hotProducts: '羊肉串、烤鸡翅', 
          distance: '50m' 
        },
        { 
          id: 11,
          lng: 113.626368, 
          lat: 34.747378, 
          stallName: '李姐麻辣烫', 
          address: '郑州市金水区花园路 456 号', 
          hotProducts: '麻辣烫、酸辣粉', 
          distance: '120m' 
        },
        { 
          id: 12,
          lng: 113.627368, 
          lat: 34.745378, 
          stallName: '张师傅煎饼果子', 
          address: '郑州市金水区农业路 789 号', 
          hotProducts: '煎饼果子、豆浆', 
          distance: '200m' 
        }
      ]
    }
  },
  async mounted() {
    try {
      this.map = await initAmap('mapContainer')
      this.loadMockVendors()
    } catch (error) {
      console.error('地图初始化失败:', error)
      this.$message.error('地图初始化失败，请检查网络或联系管理员')
    }
  },
  methods: {
    refreshPage() {
      this.$forceUpdate()
    },
    async locateMe() {
      if (!this.map) {
        this.$message.warning('地图尚未初始化')
        return
      }
      locateCurrentPosition(this.map)
    },

    async loadNearbyVendors() {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords

              try {
                const response = await vendorApi.getNearbyVendors(latitude, longitude, 0.1)

                if (response.code === 200) {
                  const vendors = response.data || []

                  this.map.clearMap()

                  if (vendors.length > 0) {
                    addMarkers(this.map, vendors.map(vendor => ({
                      lng: parseFloat(vendor.longitude),
                      lat: parseFloat(vendor.latitude),
                      title: vendor.stallName
                    })))
                  }

                  this.vendors = vendors.map(vendor => ({
                    ...vendor,
                    distance: '未知距离'
                  }))

                  this.$message.success(`附近找到 ${vendors.length} 个摊位`)
                } else {
                  this.$message.error(response.message || '获取摊位失败')
                  this.loadMockVendors()
                }
              } catch (apiError) {
                console.error('API 调用失败:', apiError)
                this.$message.error('获取摊位数据失败，使用模拟数据')
                this.loadMockVendors()
              }
            },
            (error) => {
              console.error('获取位置失败:', error)
              this.$message.error('获取当前位置失败，使用模拟数据')
              this.loadMockVendors()
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          )
        } else {
          this.$message.warning('浏览器不支持地理定位，使用模拟数据')
          this.loadMockVendors()
        }
      } catch (error) {
        console.error('获取摊位失败:', error)
        this.$message.error('获取摊位失败，使用模拟数据')
        this.loadMockVendors()
      }
    },

    loadMockVendors() {
      if (!this.map) {
        console.error('地图实例未初始化')
        return
      }

      console.log('开始加载模拟摊位数据:', this.mockVendors)
      
      this.map.clearMap()
      
      const validMarkers = this.mockVendors.filter(vendor => {
        const isValid = !isNaN(parseFloat(vendor.lng)) && !isNaN(parseFloat(vendor.lat))
        if (!isValid) {
          console.error('无效的摊位坐标:', vendor)
        }
        return isValid
      })
      
      console.log('有效的标记点:', validMarkers)
      
      addMarkers(this.map, validMarkers.map(vendor => ({
        lng: parseFloat(vendor.lng),
        lat: parseFloat(vendor.lat),
        title: vendor.stallName
      })))
      
      this.vendors = this.mockVendors
      
      this.$message.success('模拟摊位加载完成')
    },

    refreshMap() {
      this.loadNearbyVendors()
    },

    async showVendor(vendor) {
      this.currentVendorId = vendor.id
      const userId = localStorage.getItem('userId')
      
      // 检查收藏状态
      if (userId) {
        try {
          const res = await favoriteApi.checkFavorite(userId, vendor.id)
          this.isFavorited = res.data
        } catch (error) {
          console.error('检查收藏状态失败:', error)
          this.isFavorited = false
        }
      } else {
        this.isFavorited = false
      }
      
      // 获取平均评分
      try {
        const ratingRes = await reviewApi.getAverageRating(vendor.id)
        if (ratingRes.code === 200) {
          this.averageRating = ratingRes.data || 0
        }
      } catch (error) {
        console.error('获取评分失败:', error)
        this.averageRating = 0
      }

      const favoriteText = this.isFavorited ? '❤️ 已收藏' : '🤍 收藏'
      const favoriteType = this.isFavorited ? 'danger' : 'primary'
      const stars = this.averageRating > 0 ? '⭐'.repeat(Math.round(this.averageRating)) : '暂无评分'

      this.$alert(`
        <div><strong>摊位名称：</strong>${vendor.stallName}</div>
        <div><strong>地址：</strong>${vendor.address}</div>
        <div><strong>热销产品：</strong>${vendor.hotProducts}</div>
        <div><strong>距离：</strong>${vendor.distance}</div>
        <div><strong>评分：</strong>${stars} (${this.averageRating.toFixed(1)}分)</div>
        <div style="margin-top: 15px;">
          <el-button 
            type="${favoriteType}" 
            size="small"
            onclick="window.toggleFavoriteClick()">
            ${favoriteText}
          </el-button>
          <el-button type="success" size="small" style="margin-left: 10px;" onclick="window.showReviewDialog()">
            📝 评价
          </el-button>
          <el-button type="info" size="small" style="margin-left: 10px;" onclick="window.showReviewsList()">
            💬 查看评价 (${this.reviews.length})
          </el-button>
        </div>
      `, '摊位详情', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭',
        closeOnClickModal: true
      })
      
      window.toggleFavoriteClick = () => this.toggleFavorite(vendor.id)
      window.showReviewDialog = () => this.showReviewDialog(vendor)
      window.showReviewsList = () => this.showReviewsList(vendor)
    },

    async toggleFavorite(vendorId) {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        this.$message.warning('请先登录')
        this.$router.push('/login')
        return
      }
      
      try {
        if (this.isFavorited) {
          const res = await favoriteApi.removeFavorite(userId, vendorId)
          if (res.code === 200) {
            this.$message.success('已取消收藏')
            this.isFavorited = false
          }
        } else {
          const res = await favoriteApi.addFavorite(userId, vendorId)
          if (res.code === 200) {
            this.$message.success('收藏成功')
            this.isFavorited = true
          }
        }
      } catch (error) {
        console.error('收藏操作失败:', error)
        this.$message.error('操作失败，请重试')
      }
    },

    showReviewDialog(vendor) {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        this.$message.warning('请先登录')
        this.$router.push('/login')
        return
      }
      
      let currentRating = 5
      
      this.$alert(`
        <div style="padding: 10px 0;">
          <div style="margin-bottom: 15px;">
            <strong>评分：</strong>
            <div style="display: inline-block;">
              <span style="cursor: pointer; font-size: 24px;" onclick="window.setRating(1)">⭐</span>
              <span style="cursor: pointer; font-size: 24px;" onclick="window.setRating(2)">⭐</span>
              <span style="cursor: pointer; font-size: 24px;" onclick="window.setRating(3)">⭐</span>
              <span style="cursor: pointer; font-size: 24px;" onclick="window.setRating(4)">⭐</span>
              <span style="cursor: pointer; font-size: 24px;" onclick="window.setRating(5)">⭐</span>
            </div>
            <span id="rating-text" style="margin-left: 10px; color: #409EFF;">5 星</span>
          </div>
          <div>
            <strong>评价内容：</strong>
            <textarea 
              id="review-content"
              placeholder="写下您的评价..."
              rows="4"
              style="width: 100%; margin-top: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </textarea>
          </div>
        </div>
      `, '发表评价', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '提交评价',
        cancelButtonText: '取消',
        showCancelButton: true,
        closeOnClickModal: false,
        callback: async (action) => {
          // 不等待这个 promise，直接处理
          if (action === 'confirm') {
            try {
              const content = document.getElementById('review-content')?.value || ''
              await this.submitReview(vendor.id, currentRating, content)
            } catch (e) {
              console.error('评价提交错误:', e)
            }
          }
          // 忽略 cancel 错误
        }
      })
      
      window.setRating = (rating) => {
        currentRating = rating
        document.getElementById('rating-text').innerText = rating + '星'
      }
    },

    async submitReview(vendorId, rating, content) {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        this.$message.warning('请先登录')
        return
      }
      
      try {
        const review = {
          userId: parseInt(userId),
          vendorId: vendorId,
          rating: rating,
          content: content
        }
        
        console.log('提交评价:', review)
        
        const res = await reviewApi.addReview(review)
        if (res.code === 200) {
          this.$message.success('评价提交成功！')
          // 重新加载评分
          const ratingRes = await reviewApi.getAverageRating(vendorId)
          if (ratingRes.code === 200) {
            this.averageRating = ratingRes.data || 0
          }
          // 重新打开弹窗更新显示
          const vendorObj = this.vendors.find(v => v.id === vendorId)
          if (vendorObj) {
            setTimeout(() => this.showVendor(vendorObj), 500)
          }
        } else {
          this.$message.error(res.message || '评价提交失败')
        }
      } catch (error) {
        console.error('提交评价失败:', error)
        this.$message.error('提交评价失败，请重试')
      }
    },

    async showReviewsList(vendor) {
      try {
        const res = await reviewApi.getReviewsByVendorId(vendor.id)
        if (res.code === 200) {
          this.reviews = res.data || []
          
          if (this.reviews.length === 0) {
            this.$alert('暂无评价，快来成为第一个评价的人吧！', '评价列表', {
              confirmButtonText: '关闭'
            })
            return
          }
          
          const reviewsHtml = this.reviews.map(r => {
            const userStars = '⭐'.repeat(r.rating)
            const time = r.createTime ? new Date(r.createTime).toLocaleString('zh-CN') : '未知时间'
            return `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span>${userStars}</span>
                  <span style="color: #999; font-size: 12px;">${time}</span>
                </div>
                <div style="color: #666;">${r.content || '暂无内容'}</div>
              </div>
            `
          }).join('')
          
          this.$alert(`
            <div style="max-height: 300px; overflow-y: auto;">
              ${reviewsHtml}
            </div>
          `, `${vendor.stallName} - 评价列表`, {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '关闭'
          })
        } else {
          this.$message.error('加载评价失败')
        }
      } catch (error) {
        console.error('加载评价失败:', error)
        this.$message.error('加载评价失败')
      }
    }
  }
}
</script>

<style scoped>
.map {
  min-height: 100vh;
}
.el-header {
  background-color: #409EFF;
  color: white;
}
.map-container {
  height: calc(100vh - 60px);
}
.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f5f5;
}
.map-actions {
  display: flex;
  gap: 10px;
}
.map-canvas {
  width: 100%;
  height: 60vh !important;
  min-height: 400px;
  border: 1px solid #ddd;
  position: relative;
}
.map-info {
  margin-top: 20px;
}
</style>