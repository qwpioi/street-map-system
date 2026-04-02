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
              <el-table-column label="操作" width="250">
                <template #default="{ row }">
                  <el-button 
                    size="small" 
                    type="primary" 
                    icon="el-icon-location" 
                    @click="locateVendor(row)"
                  >
                    定位
                  </el-button>
                  <el-button 
                    size="small" 
                    @click="showVendor(row)"
                  >
                    查看详情
                  </el-button>
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
  beforeUnmount() {
    if (this.map) {
      this.clearVendorMarkers()
      if (this.locationMarker) {
        this.map.remove(this.locationMarker)
      }
      this.map.destroy()
      this.map = null
    }
  },
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
      mockVendors: [],
      userPosition: null,
      vendorMarkers: [],
      locationMarker: null,
      vendorsLoaded: false
    }
  },
  async mounted() {
    try {
      this.map = await initAmap('mapContainer')
      const center = this.map.getCenter()
      this.userPosition = { lng: center.lng, lat: center.lat }
      await this.loadVendorsFromApi(center.lng, center.lat)
    } catch (error) {
      console.error('地图初始化失败:', error)
      this.$message.error('地图初始化失败，请检查网络或联系管理员')
      this.loadMockVendors({ lng: center.lng, lat: center.lat })
    }
  },
  watch: {
    // 监听路由变化
    $route(to, from) {
      if (to.path === '/' || to.path === '/map') {
        // 进入地图页时重新调整地图
        setTimeout(() => {
          if (this.map) {
            this.map.resize()
          }
        }, 100)
      }
    }
  },
  activated() {
    // 路由返回时重新调整地图尺寸
    if (this.map) {
      setTimeout(() => {
        this.map.resize()
      }, 100)
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
      
      if (!navigator.geolocation) {
        this.$message.error('您的浏览器不支持定位功能')
        return
      }
      
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const longitude = position.coords.longitude
            const latitude = position.coords.latitude
            const accuracy = position.coords.accuracy
            
            console.log('定位成功:', latitude, longitude)
            console.log('精度:', accuracy, '米')
            
            this.map.setCenter([longitude, latitude])
            this.map.setZoom(16)
            
            if (this.locationMarker) {
              this.locationMarker.setPosition([longitude, latitude])
            } else {
              this.locationMarker = new AMap.Marker({
                position: [longitude, latitude],
                title: '当前位置 (精度:' + Math.round(accuracy) + '米)',
                icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
              })
              this.map.add(this.locationMarker)
            }
            
            this.userPosition = { lng: longitude, lat: latitude }
            
            if (!this.vendorsLoaded) {
              await this.loadVendorsFromApi(longitude, latitude)
              this.vendorsLoaded = true
            } else {
              this.updateVendorDistances(longitude, latitude)
            }
            
            this.$message.success('定位成功！精度：' + Math.round(accuracy) + '米')
          },
          (error) => {
            console.error('定位失败:', error)
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                this.$message.error('定位权限被拒绝，请在浏览器设置中开启')
                break
              case error.POSITION_UNAVAILABLE:
                this.$message.error('位置信息不可用')
                break
              case error.TIMEOUT:
                this.$message.warning('定位超时，请检查网络连接')
                break
              default:
                this.$message.error('定位失败：' + error.message)
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        )
      } catch (error) {
        console.error('定位错误:', error)
        this.$message.error('定位失败：' + error.message)
      }
    },

    async loadNearbyVendors() {
      if (this.vendorsLoaded) {
        this.$message.info('摊位已加载')
        return
      }

      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              await this.loadVendorsFromApi(longitude, latitude)
              this.vendorsLoaded = true
            },
            (error) => {
              console.error('获取位置失败:', error)
              const center = this.map.getCenter()
              this.loadVendorsFromApi(center.lng, center.lat)
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          )
        } else {
          this.$message.warning('浏览器不支持地理定位')
          const center = this.map.getCenter()
          this.loadVendorsFromApi(center.lng, center.lat)
        }
      } catch (error) {
        console.error('获取摊位失败:', error)
        const center = this.map.getCenter()
        this.loadMockVendors({ lng: center.lng, lat: center.lat })
      }
    },

    async loadVendorsFromApi(lng, lat) {
      try {
        const response = await vendorApi.getOpenVendors()
        
        if (response.code === 200 && response.data && response.data.length > 0) {
          const validVendors = response.data.filter(v => 
            v.latitude && v.longitude && v.status === 1
          )
          
          this.vendors = validVendors.map(vendor => ({
            id: vendor.id,
            lng: parseFloat(vendor.longitude),
            lat: parseFloat(vendor.latitude),
            stallName: vendor.stallName,
            address: vendor.address,
            hotProducts: vendor.hotProducts || '暂无',
            distance: this.calculateDistance(lat, lng, vendor.latitude, vendor.longitude)
          }))
          
          this.addVendorMarkers(this.vendors)
          
          console.log('加载摊位成功:', this.vendors.length, '个')
          this.$message.success(`加载 ${this.vendors.length} 个真实摊位`)
        } else {
          console.log('没有开摊的摊位，使用模拟数据')
          this.loadMockVendors({ lng, lat })
        }
      } catch (error) {
        console.error('加载摊位失败:', error)
        this.$message.error('加载摊位失败，使用模拟数据')
        this.loadMockVendors({ lng, lat })
      }
    },

    calculateDistance(lat1, lng1, lat2, lng2) {
      const distance = AMap.GeometryUtil.distance([lng1, lat1], [lng2, lat2])
      return distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(2)}km`
    },

    loadMockVendors(userCenter = null) {
      if (this.vendorsLoaded) {
        return
      }

      if (!this.map) {
        console.error('地图实例未初始化')
        return
      }
      
      const center = userCenter || this.map.getCenter()
      const userLng = center.lng
      const userLat = center.lat
      
      this.userPosition = { lng: userLng, lat: userLat }
      
      const offset = 0.0045
      
      this.mockVendors = [
        {
          id: 10,
          lng: userLng + offset * 0.3,
          lat: userLat + offset * 0.4,
          stallName: '老王烧烤',
          address: '附近摊位 1',
          hotProducts: '羊肉串、烤鸡翅',
          distance: '计算中...'
        },
        {
          id: 11,
          lng: userLng - offset * 0.5,
          lat: userLat + offset * 0.3,
          stallName: '李姐麻辣烫',
          address: '附近摊位 2',
          hotProducts: '麻辣烫、酸辣粉',
          distance: '计算中...'
        },
        {
          id: 12,
          lng: userLng + offset * 0.2,
          lat: userLat - offset * 0.6,
          stallName: '张师傅煎饼果子',
          address: '附近摊位 3',
          hotProducts: '煎饼果子、豆浆',
          distance: '计算中...'
        }
      ]
      
      this.mockVendors.forEach(vendor => {
        const distance = AMap.GeometryUtil.distance(
          [userLng, userLat],
          [vendor.lng, vendor.lat]
        )
        vendor.distance = distance < 1000 
          ? `${Math.round(distance)}m` 
          : `${(distance/1000).toFixed(2)}km`
      })
      
      this.clearVendorMarkers()
      
      this.addVendorMarkers(this.mockVendors)
      
      this.vendors = this.mockVendors
      
      this.$message.success(`已生成 ${this.mockVendors.length} 个模拟摊位`)
    },

    clearVendorMarkers() {
      this.vendorMarkers.forEach(marker => {
        this.map.remove(marker)
      })
      this.vendorMarkers = []
    },

    updateVendorDistances(lng, lat) {
      this.vendors.forEach(vendor => {
        const distance = AMap.GeometryUtil.distance(
          [lng, lat],
          [vendor.lng, vendor.lat]
        )
        vendor.distance = distance < 1000 
          ? `${Math.round(distance)}m` 
          : `${(distance/1000).toFixed(2)}km`
      })
    },

    addVendorMarkers(vendors) {
      if (!this.map || !vendors || vendors.length === 0) {
        return
      }
      
      this.vendorMarkers.forEach(marker => this.map.remove(marker))
      this.vendorMarkers = []
      
      const colors = [
        { bg: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)', name: '红色' },
        { bg: 'linear-gradient(135deg, #51cf66, #37b24d)', name: '绿色' },
        { bg: 'linear-gradient(135deg, #339af0, #228be6)', name: '蓝色' },
        { bg: 'linear-gradient(135deg, #ffa94d, #ff922b)', name: '橙色' },
        { bg: 'linear-gradient(135deg, #da77f2, #be4bdb)', name: '紫色' }
      ]
      
      vendors.forEach((vendor, index) => {
        const color = colors[index % colors.length]
        
        const markerContent = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          ">
            <div style="
              width: 45px;
              height: 45px;
              background: ${color.bg};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 22px;
              border: 3px solid white;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
              transition: transform 0.2s;
            ">
              <i class="fas fa-utensils"></i>
            </div>
            <div style="
              background: white;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 13px;
              font-weight: bold;
              white-space: nowrap;
              margin-top: -8px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              border: 1px solid #e0e0e0;
              max-width: 120px;
              overflow: hidden;
              text-overflow: ellipsis;
            ">${vendor.stallName}</div>
          </div>
        `
        
        const marker = new AMap.Marker({
          position: [vendor.lng, vendor.lat],
          content: markerContent,
          offset: new AMap.Pixel(-22, -50),
          extData: vendor,
          zIndex: 100
        })
        
        marker.on('click', (e) => {
          console.log('点击摊位:', e.target.getExtData())
          this.showVendorOnMap(e.target.getExtData())
        })
        
        marker.on('mouseover', () => {
          marker.setOffset(new AMap.Pixel(-22, -55))
        })
        
        marker.on('mouseout', () => {
          marker.setOffset(new AMap.Pixel(-22, -50))
        })
        
        this.map.add(marker)
        this.vendorMarkers.push(marker)
      })
      
      console.log('✅ 摊位标记已添加:', vendors.length, '个')
    },

    showVendorOnMap(vendor) {
      const stars = this.averageRating > 0 ? '⭐'.repeat(Math.round(this.averageRating)) : '⭐⭐⭐⭐'
      
      const content = `
        <div style="
          padding: 12px;
          min-width: 220px;
          max-width: 280px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        ">
          <h3 style="
            margin: 0 0 10px 0;
            color: #333;
            font-size: 18px;
            border-bottom: 2px solid #ff6b6b;
            padding-bottom: 8px;
          ">${vendor.stallName}</h3>
          
          <div style="margin: 8px 0; line-height: 1.8;">
            <div style="color: #666; background: rgba(255,255,255,0.9); padding: 4px;">
              <i class="fas fa-map-marker-alt" style="width: 20px; color: #ff6b6b;"></i>
              <strong>地址：</strong>${vendor.address || '暂无'}
            </div>
            <div style="color: #666; margin-top: 6px; background: rgba(255,255,255,0.9); padding: 4px;">
              <i class="fas fa-utensils" style="width: 20px; color: #ff6b6b;"></i>
              <strong>热销：</strong>${vendor.hotProducts || '暂无'}
            </div>
            <div style="color: #666; margin-top: 6px; background: rgba(255,255,255,0.9); padding: 4px;">
              <i class="fas fa-ruler-horizontal" style="width: 20px; color: #ff6b6b;"></i>
              <strong>距离：</strong><span style="color: #37b24d; font-weight: bold;">${vendor.distance}</span>
            </div>
            <div style="color: #666; margin-top: 6px; background: rgba(255,255,255,0.9); padding: 4px;">
              <i class="fas fa-star" style="width: 20px; color: #ff6b6b;"></i>
              <strong>评分：</strong>${stars}
            </div>
          </div>
          
          <div style="
            margin-top: 12px;
            display: flex;
            gap: 10px;
            border-top: 1px solid #eee;
            padding-top: 10px;
          ">
            <button id="locate-btn" style="
              padding: 6px 16px;
              background: #339af0;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ">📍 导航到这里</button>
            <button id="close-info-btn" style="
              padding: 6px 16px;
              background: #ff6b6b;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ">关闭</button>
          </div>
        </div>
      `
      
      const infoWindow = new AMap.InfoWindow({
        content: content,
        offset: new AMap.Pixel(0, -10),
        isCustom: true
      })
      
      infoWindow.open(this.map, [vendor.lng, vendor.lat])
      
      setTimeout(() => {
        const locateBtn = document.getElementById('locate-btn')
        if (locateBtn) {
          locateBtn.addEventListener('click', () => {
            this.map.setCenter([vendor.lng, vendor.lat])
            this.map.setZoom(17)
            infoWindow.close()
            this.$message.success(`正在导航到：${vendor.stallName}`)
          })
        }
        
        const closeBtn = document.getElementById('close-info-btn')
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            infoWindow.close()
            console.log('信息窗口已关闭')
          })
        }
      }, 100)
    },

    refreshMap() {
      this.loadNearbyVendors()
    },

    locateVendor(vendor) {
      if (!this.map) {
        this.$message.warning('地图尚未初始化')
        return
      }
      
      if (!vendor.lng || !vendor.lat) {
        this.$message.error('该摊位位置信息不完整')
        return
      }
      
      this.map.setCenter([vendor.lng, vendor.lat])
      this.map.setZoom(17)
      
      const targetMarker = this.vendorMarkers.find(m => {
        const extData = m.getExtData()
        return extData && extData.id === vendor.id
      })
      
      if (targetMarker) {
        targetMarker.setAnimation('AMAP_ANIMATION_BOUNCE')
        
        setTimeout(() => {
          targetMarker.setAnimation(null)
        }, 2000)
      }
      
      this.$message.success(`已定位到：${vendor.stallName}`)
      
      console.log('定位到摊位:', vendor.stallName, vendor.lng, vendor.lat)
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