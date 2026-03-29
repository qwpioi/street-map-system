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
      mockVendors: [
        { 
          id: 1, 
          lng: 113.625368, 
          lat: 34.746378, 
          stallName: '老王烧烤', 
          address: '郑州市金水区文化路 123 号', 
          hotProducts: '羊肉串、烤鸡翅', 
          distance: '50m' 
        },
        { 
          id: 2, 
          lng: 113.626368, 
          lat: 34.747378, 
          stallName: '李姐麻辣烫', 
          address: '郑州市金水区花园路 456 号', 
          hotProducts: '麻辣烫、酸辣粉', 
          distance: '120m' 
        },
        { 
          id: 3, 
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
        // 获取用户当前位置
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords

              // 调用后端 API 获取附近摊位
              try {
                const response = await vendorApi.getNearbyVendors(latitude, longitude, 0.1)

                if (response.code === 200) {
                  const vendors = response.data || []

                  // 清除现有标记
                  this.map.clearMap()

                  // 添加摊位标记
                  if (vendors.length > 0) {
                    addMarkers(this.map, vendors.map(vendor => ({
                      lng: parseFloat(vendor.longitude),
                      lat: parseFloat(vendor.latitude),
                      title: vendor.stallName
                    })))
                  }

                  // 更新列表
                  this.vendors = vendors.map(vendor => ({
                    ...vendor,
                    distance: '未知距离' // 实际计算距离需要更复杂的算法
                  }))

                  this.$message.success(`附近找到 ${vendors.length} 个摊位`)
                } else {
                  this.$message.error(response.message || '获取摊位失败')
                  // 如果 API 调用失败，使用模拟数据
                  this.loadMockVendors()
                }
              } catch (apiError) {
                console.error('API 调用失败:', apiError)
                this.$message.error('获取摊位数据失败，使用模拟数据')
                // API 调用失败时，使用模拟数据
                this.loadMockVendors()
              }
            },
            (error) => {
              console.error('获取位置失败:', error)
              this.$message.error('获取当前位置失败，使用模拟数据')
              // 位置获取失败时，使用模拟数据
              this.loadMockVendors()
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          )
        } else {
          // 浏览器不支持地理定位，使用模拟数据
          this.$message.warning('浏览器不支持地理定位，使用模拟数据')
          this.loadMockVendors()
        }
      } catch (error) {
        console.error('获取摊位失败:', error)
        this.$message.error('获取摊位失败，使用模拟数据')
        // 捕获所有错误，使用模拟数据
        this.loadMockVendors()
      }
    },

    loadMockVendors() {
      if (!this.map) {
        console.error('地图实例未初始化')
        return
      }

      console.log('开始加载模拟摊位数据:', this.mockVendors)
      
      // 清除现有标记
      this.map.clearMap()
      
      // 验证数据
      const validMarkers = this.mockVendors.filter(vendor => {
        const isValid = !isNaN(parseFloat(vendor.lng)) && !isNaN(parseFloat(vendor.lat))
        if (!isValid) {
          console.error('无效的摊位坐标:', vendor)
        }
        return isValid
      })
      
      console.log('有效的标记点:', validMarkers)
      
      // 添加模拟摊位标记
      addMarkers(this.map, validMarkers.map(vendor => ({
        lng: parseFloat(vendor.lng),
        lat: parseFloat(vendor.lat),
        title: vendor.stallName
      })))
      
      // 更新列表
      this.vendors = this.mockVendors
      
      this.$message.success('模拟摊位加载完成')
    },

    refreshMap() {
      this.loadNearbyVendors()
    },

    async showVendor(vendor) {
      this.currentVendorId = vendor.id
      const userId = localStorage.getItem('userId')
      
      // 检查是否已收藏
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

      this.$alert(`
        <div><strong>摊位名称：</strong>${vendor.stallName}</div>
        <div><strong>地址：</strong>${vendor.address}</div>
        <div><strong>热销产品：</strong>${vendor.hotProducts}</div>
        <div><strong>距离：</strong>${vendor.distance}</div>
        <div style="margin-top: 15px;">
          <el-button 
            type="${this.isFavorited ? 'danger' : 'primary'}" 
            size="small"
            onclick="window.toggleFavoriteClick()">
            ${this.isFavorited ? '❤️ 已收藏' : '🤍 收藏'}
          </el-button>
          <el-button type="success" size="small" style="margin-left: 10px;" onclick="window.showReviewClick()">
            📝 评价
          </el-button>
        </div>
      `, '摊位详情', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭',
        closeOnClickModal: true
      })
      
      // 绑定全局函数供弹窗按钮调用
      window.toggleFavoriteClick = () => this.toggleFavorite(vendor.id)
      window.showReviewClick = () => this.showReviewDialog(vendor)
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
          // 取消收藏
          const res = await favoriteApi.removeFavorite(userId, vendorId)
          if (res.code === 200) {
            this.$message.success('已取消收藏')
            this.isFavorited = false
          }
        } else {
          // 添加收藏
          const res = await favoriteApi.addFavorite(userId, vendorId)
          if (res.code === 200) {
            this.$message.success('收藏成功')
            this.isFavorited = true
          }
        }
        // 关闭当前弹窗，重新打开更新状态
        this.$alert('操作成功', '提示', {
          confirmButtonText: '确定',
          callback: () => {
            const vendor = this.vendors.find(v => v.id === vendorId)
            if (vendor) {
              this.showVendor(vendor)
            }
          }
        })
      } catch (error) {
        console.error('收藏操作失败:', error)
        this.$message.error('操作失败，请重试')
      }
    },

    showReviewDialog(vendor) {
      // 关闭当前的 alert
      this.$alert('评价功能开发中...', '提示', {
        confirmButtonText: '确定'
      })
      // TODO: 后续实现评价弹窗
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