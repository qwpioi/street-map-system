<template>
  <div class="map">
    <el-container>
      <el-header>
        <NavBar @logout="refreshPage" />
      </el-header>

      <el-main>
        <div class="map-container">
          <div class="map-header">
            <h2>🗺️ 地摊地图</h2>
            <div class="map-actions">
              <el-button type="success" @click="loadNearbyVendors">查找附近摊位</el-button>
              <el-button @click="refreshMap">刷新地图</el-button>
            </div>
          </div>

          <div id="mapContainer" class="map-canvas"></div>

          <div class="position-info">
            <h4>📍 位置信息</h4>
            <p>自动定位：<span class="pos-value">{{ autoPosition ? autoPosition.lat.toFixed(6) + ', ' + autoPosition.lng.toFixed(6) + ' (±' + autoPosition.accuracy + '米)' : '未定位' }}</span></p>
            <p>手动定位：<span class="pos-value">{{ manualPosition ? manualPosition.lat.toFixed(6) + ', ' + manualPosition.lng.toFixed(6) : '未定位' }}</span></p>
            <p v-if="autoPosition && manualPosition">偏差：<span class="pos-value">{{ (calculateDistanceInMeters(autoPosition.lat, autoPosition.lng, manualPosition.lat, manualPosition.lng) / 1000).toFixed(2) }} km</span></p>
            <el-button size="small" @click="copyCoordinates">复制坐标</el-button>
          </div>

          <div class="map-info">
            <el-table :data="vendors" style="width: 100%">
              <el-table-column prop="stallName" label="摊位名称" width="200"></el-table-column>
              <el-table-column prop="address" label="地址" width="300"></el-table-column>
              <el-table-column prop="distance" label="距离" width="100"></el-table-column>
              <el-table-column prop="isOwner" label="是否摊主" width="80" align="center">
                <template #default="{ row }">
                  <span v-if="row.isOwner" style="color: #67C23A;">✅</span>
                  <span v-else style="color: #F56C6C;">❌</span>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="350">
                <template #default="{ row }">
                  <el-button 
                    v-if="row.isOwner" 
                    size="small" 
                    type="warning" 
                    icon="el-icon-edit" 
                    @click="editVendor(row)"
                  >
                    编辑
                  </el-button>
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

      <!-- 底部定位提示栏 -->
      <div class="location-tip-bar">
        <div class="tip-content">
          <span class="tip-icon">📍</span>
          <span class="tip-text">
            <span v-if="isMobile">✅ 手机访问，定位准确</span>
            <span v-else>⚠️ 电脑访问定位可能不准，可拖动地图或点击"手动定位"调整</span>
          </span>
        </div>
        <div class="tip-actions">
          <el-button size="small" type="primary" @click="locateMe">定位我</el-button>
          <el-button size="small" type="warning" @click="enableManualPosition">手动定位</el-button>
        </div>
      </div>

      <!-- 编辑摊位对话框 -->
      <el-dialog
        v-model="editDialogVisible"
        title="编辑摊位"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="摊位名称" required>
            <el-input 
              v-model="editForm.stallName" 
              placeholder="请输入摊位名称" 
            />
          </el-form-item>
          <el-form-item label="地址" required>
            <el-input 
              v-model="editForm.address" 
              placeholder="请输入摊位地址" 
            />
          </el-form-item>
          <el-form-item label="热销产品" required>
            <el-input 
              v-model="editForm.hotProducts" 
              type="textarea" 
              :rows="3"
              placeholder="请输入热销产品，用顿号分隔" 
            />
          </el-form-item>
          <el-form-item label="位置坐标">
            <el-input 
              v-model="editForm.latitude" 
              placeholder="纬度" 
              disabled 
              style="width: 45%; margin-right: 5px;" 
            />
            <el-input 
              v-model="editForm.longitude" 
              placeholder="经度" 
              disabled 
              style="width: 45%;" 
            />
            <div style="margin-top: 5px; font-size: 12px; color: #999;">
              坐标需要在地图上点击选择，或联系管理员修改
            </div>
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit" :loading="saving">保存</el-button>
        </template>
      </el-dialog>
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
      vendorsLoaded: false,
      editDialogVisible: false,
      editForm: {
        stallName: '',
        address: '',
        hotProducts: '',
        latitude: '',
        longitude: ''
      },
      saving: false,
      isManualMode: false,
      isMobile: false,
      autoPosition: null,
      manualPosition: null,
      currentLocation: {
        lat: null,
        lng: null
      }
    }
  },
  async mounted() {
    console.log('🔧 mounted 执行，开始初始化地图...')
    
    // 检测设备类型
    this.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    console.log('📱 设备类型:', this.isMobile ? '手机' : '电脑')
    
    if (!this.isMobile) {
      this.$message.info('电脑端定位可能不准，建议使用手机访问')
    }
    
    try {
      this.map = await initAmap('mapContainer')
      console.log('✅ 地图实例创建成功:', this.map)
      
      // 等待地图完全加载
      this.map.on('complete', () => {
        console.log('✅ 地图加载完成，开始自动定位...')
        this.autoLocate()
      })
      
      this.map.on('error', () => {
        console.error('❌ 地图加载失败')
      })
      
      // 拖动地图结束后更新摊位距离
      this.map.on('dragend', () => {
        const center = this.map.getCenter()
        const lng = center.getLng()
        const lat = center.getLat()
        console.log('🗺️ 地图拖动结束，新中心:', lat, lng)
        
        if (this.vendors && this.vendors.length > 0) {
          this.updateVendorDistances(lat, lng)
          console.log('✅ 摊位距离已更新')
        }
      })
    } catch (error) {
      console.error('地图初始化失败:', error)
      this.$message.error('地图初始化失败，请检查网络或联系管理员')
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
    isMobileDevice() {
      return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    },
    
    refreshPage() {
      this.$forceUpdate()
    },
    
    getOnePosition() {
      const timestamp = Date.now()
      console.log('🔵 getOnePosition: 创建新的 Geolocation 实例（时间戳:', timestamp, ')')
      
      return new Promise((resolve, reject) => {
        if (!AMap || !AMap.Geolocation) {
          console.error('❌ AMap.Geolocation 不可用')
          reject(new Error('AMap.Geolocation 不可用'))
          return
        }
        
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
          convert: true,
          panToLocation: false,
          zoomToAccuracy: false,
          showCircle: false,
          showButton: false,
          noIpLocate: true,
          noGeoLocation: false
        })
        
        geolocation.getCurrentPosition((status, result) => {
          console.log('🔍 高德定位返回:', {
            status: status,
            position: result?.position,
            accuracy: result?.accuracy,
            timestamp: Date.now(),
            address: result?.address
          })
          
          if (status === 'complete') {
            resolve({
              coords: {
                latitude: result.position.lat,
                longitude: result.position.lng,
                accuracy: result.accuracy
              }
            })
          } else {
            console.error('❌ getOnePosition: 高德定位失败', result?.message)
            reject(new Error(result?.message || '定位失败'))
          }
        })
      })
    },
    
    async locateBestPosition(maxAttempts = 3) {
      console.log('🔵 locateBestPosition: 开始多次定位，尝试次数:', maxAttempts)
      const positions = []
      let minAccuracy = Infinity
      let bestPosition = null
      
      for (let i = 0; i < maxAttempts; i++) {
        console.log(`🔵 locateBestPosition: 第${i+1}次定位尝试（等待 3 秒）`)
        
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
        
        try {
          const position = await this.getOnePosition()
          const accuracy = position.coords.accuracy
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          console.log(`✅ locateBestPosition: 第${i+1}次成功 accuracy: ${accuracy} 坐标：${lat}, ${lng}`)
          
          positions.push(position)
          
          if (accuracy < minAccuracy) {
            minAccuracy = accuracy
            bestPosition = position
          }
          
          if (accuracy < 100) {
            console.log('✅ 定位精度良好，停止重试')
            break
          }
          
          if (i < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } catch (error) {
          console.error(`❌ locateBestPosition: 第${i+1}次失败:`, error)
        }
      }
      
      console.log('🔵 locateBestPosition: 成功次数:', positions.length)
      
      if (!bestPosition) {
        console.error('❌ locateBestPosition: 所有尝试均失败')
        throw new Error('所有定位尝试都失败了')
      }
      
      console.log('✅ locateBestPosition: 返回最佳结果 accuracy:', minAccuracy)
      return bestPosition
    },

    async autoLocate() {
      console.log('📍 autoLocate 执行，检查地图实例:', this.map)
      
      if (!this.map) {
        setTimeout(() => this.autoLocate(), 500)
        return
      }
      
      if (!navigator.geolocation) {
        console.warn('浏览器不支持定位，使用郑州作为默认位置')
        this.map.setCenter([113.625368, 34.746378])
        this.map.setZoom(13)
        this.loadVendorsFromApi(34.746378, 113.625368)
        return
      }
      
      try {
        const position = await this.locateBestPosition(3)
        const longitude = position.coords.longitude
        const latitude = position.coords.latitude
        const accuracy = position.coords.accuracy
        
        console.log('📍 自动定位成功（最优）:', latitude, longitude, 'accuracy:', accuracy)
        
        this.map.setCenter([longitude, latitude])
        this.map.setZoom(16)
        
        this.locationMarker = new AMap.Marker({
          position: [longitude, latitude],
          title: `当前位置 (精度:${Math.round(accuracy)}米)`,
          icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
        })
        this.map.add(this.locationMarker)
        
        this.userPosition = { lng: longitude, lat: latitude }
        
        await this.loadVendorsFromApi(latitude, longitude)
        this.vendorsLoaded = true
        
        console.log('✅ 自动定位完成')
      } catch (error) {
        console.error('自动定位失败:', error)
        if (this.map) {
          this.map.setCenter([113.625368, 34.746378])
          this.map.setZoom(13)
        }
        this.$message.warning('定位失败，显示默认位置')
      }
    },

    updateVendorDistances(latitude, longitude) {
      if (!this.vendors || this.vendors.length === 0) {
        console.log('⚠️ 没有摊位可更新距离')
        return
      }

      console.log('📏 更新摊位距离，用户位置:', latitude, longitude)

      this.vendors.forEach(vendor => {
        vendor.distance = this.calculateDistance(
          latitude, longitude,
          vendor.lat, vendor.lng
        )
      })

      console.log('✅ 摊位距离已更新:', this.vendors.length, '个')
    },

    async locateMe() {
      console.log('🔵 locateMe: 开始执行')
      
      if (!this.map) {
        console.error('❌ locateMe: 地图未初始化')
        this.$message.warning('地图尚未初始化')
        return
      }
      
      if (!navigator.geolocation) {
        console.error('❌ locateMe: 浏览器不支持定位')
        this.$message.error('您的浏览器不支持定位功能')
        return
      }
      
      try {
        console.log('🔵 locateMe: 准备调用 locateBestPosition')
        this.$message.info('正在定位中，请稍候...')
        
        const position = await this.locateBestPosition(3)
        const longitude = position.coords.longitude
        const latitude = position.coords.latitude
        const accuracy = position.coords.accuracy
        
        console.log('📍 locateMe: 定位成功', latitude, longitude, 'accuracy:', accuracy)
        console.log('🔵 自动定位坐标:')
        console.log('  纬度:', latitude)
        console.log('  经度:', longitude)
        console.log('  精度:', accuracy, '米')
        
        this.autoPosition = { lat: latitude, lng: longitude, accuracy: Math.round(accuracy) }
        
        if (accuracy > 1000) {
          this.$message.warning({
            message: '定位精度较低，建议使用手机访问或手动调整位置',
            duration: 5000
          })
        } else if (accuracy > 200) {
          this.$message.info({
            message: '定位成功，如有偏差可拖动地图调整',
            duration: 3000
          })
        } else {
          this.$message.success('定位成功')
        }
        
        this.map.setCenter([longitude, latitude])
        this.map.setZoom(16)
        
        if (this.locationMarker) {
          this.locationMarker.setPosition([longitude, latitude])
        } else {
          this.locationMarker = new AMap.Marker({
            position: [longitude, latitude],
            title: `当前位置 (精度:${Math.round(accuracy)}米)`,
            icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
          })
          this.map.add(this.locationMarker)
        }
        
        this.userPosition = { lng: longitude, lat: latitude }
        
        if (!this.vendorsLoaded) {
          await this.loadVendorsFromApi(latitude, longitude)
          this.vendorsLoaded = true
        } else {
          this.updateVendorDistances(latitude, longitude)
        }
      } catch (error) {
        console.error('❌ locateMe: catch 捕获错误', error)
        this.$message.error('定位失败：' + (error.message || '请检查网络连接'))
      }
    },

    async refreshLocation() {
      this.$message.info('正在重新定位，请稍候...')
      
      try {
        localStorage.removeItem('lastPosition')
        
        const position = await this.locateBestPosition(3)
        
        const longitude = position.coords.longitude
        const latitude = position.coords.latitude
        
        this.map.setCenter([longitude, latitude])
        this.map.setZoom(16)
        
        if (this.locationMarker) {
          this.locationMarker.setPosition([longitude, latitude])
        } else {
          this.locationMarker = new AMap.Marker({
            position: [longitude, latitude],
            title: '当前位置',
            icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
          })
          this.map.add(this.locationMarker)
        }
        
        this.userPosition = { lng: longitude, lat: latitude }
        await this.loadVendorsFromApi(latitude, longitude)
        
        this.$message.success('重新定位成功')
      } catch (error) {
        this.$message.error('重新定位失败：' + error.message)
      }
    },

    async enableManualPosition() {
      if (!this.map) {
        this.$message.warning('地图尚未初始化')
        return
      }

      this.$message.info('请在地图上点击你的实际位置')
      this.isManualMode = true

      const clickHandler = (e) => {
        const lng = e.lnglat.getLng()
        const lat = e.lnglat.getLat()
        
        console.log('📍 手动定位坐标:')
        console.log('  纬度:', lat)
        console.log('  经度:', lng)
        console.log('  高德地图查看：https://www.amap.com/?zoom=16&center=' + lng + ',' + lat)
        
        this.manualPosition = { lat, lng }
        
        if (this.locationMarker) {
          this.locationMarker.setPosition([lng, lat])
        } else {
          this.locationMarker = new AMap.Marker({
            position: [lng, lat],
            title: '手动定位位置',
            icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
          })
          this.map.add(this.locationMarker)
        }

        this.map.setCenter([lng, lat])
        this.map.setZoom(16)
        this.userPosition = { lng, lat }

        this.map.off('click', clickHandler)
        this.isManualMode = false

        this.getAddressByPosition(lng, lat)

        this.$message.success('位置已更新，请查看 Console 中的坐标')
      }

      this.map.on('click', clickHandler)
    },

    async getAddressByPosition(lng, lat) {
      try {
        const response = await fetch(
          `https://restapi.amap.com/v3/geocode/regeo?location=${lng},${lat}&key=3dcbfe14ab2f11f3cae0717fb592ae86`
        )
        const data = await response.json()
        
        if (data.status === '1' && data.regeocode) {
          const address = data.regeocode.formatted_address
          console.log('📍 手动定位的详细地址:', address)
          this.$message.info('位置：' + address)
        }
      } catch (error) {
        console.error('逆地理编码失败:', error)
      }
    },

    copyCoordinates() {
      if (!this.userPosition) {
        this.$message.warning('暂无位置信息')
        return
      }
      const text = `纬度：${this.userPosition.lat.toFixed(6)}, 经度：${this.userPosition.lng.toFixed(6)}`
      navigator.clipboard.writeText(text)
      this.$message.success('坐标已复制')
    },

    async loadNearbyVendors() {
      if (this.vendorsLoaded) {
        this.$message.info('摊位已加载')
        return
      }

      try {
        if (navigator.geolocation) {
          const position = await this.locateBestPosition(2)
          const { latitude, longitude } = position.coords
          console.log('📍 查找附近摊位定位:', latitude, longitude, 'accuracy:', position.coords.accuracy)
          await this.loadVendorsFromApi(latitude, longitude)
          this.vendorsLoaded = true
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

    async loadVendorsFromApi(latitude, longitude) {
      console.log('📍 loadVendorsFromApi 执行，检查地图实例:', this.map)
      
      if (!this.map) {
        console.error('❌ 地图实例为 null，无法加载摊位')
        this.$message.error('地图未初始化，请刷新页面')
        return
      }
      
      console.log('📍 加载摊位，用户坐标:', latitude, longitude)
      
      this.currentLocation = { lat: latitude, lng: longitude }
      
      const currentUserId = localStorage.getItem('userId')
      console.log('🆔 当前用户 ID:', currentUserId)
      
      try {
        const response = await vendorApi.getOpenVendors()
        
        if (response.code === 200 && response.data && response.data.length > 0) {
          const validVendors = response.data.filter(v => 
            v.latitude && v.longitude && v.status === 1
          )
          
          console.log('📋 原始摊位数据:', response.data)
          
          this.vendors = validVendors.map(vendor => {
            const distance = this.calculateDistance(
              latitude, longitude,
              vendor.latitude, vendor.longitude
            )
            
            const vendorUserId = vendor.userId
            const isOwner = currentUserId && vendorUserId && vendorUserId.toString() === currentUserId.toString()
            
            console.log('📋 摊位:', vendor.stallName, '| 摊主 ID:', vendorUserId, '| 当前用户:', currentUserId, '| isOwner:', isOwner)
            
            return {
              id: vendor.id,
              userId: vendorUserId,
              lng: parseFloat(vendor.longitude),
              lat: parseFloat(vendor.latitude),
              stallName: vendor.stallName,
              address: vendor.address,
              hotProducts: vendor.hotProducts || '暂无',
              distance: distance,
              isOwner: isOwner
            }
          })
          
          console.log('✅ 处理后的摊位列表:', this.vendors)
          console.log('第一个摊位详情:', {
            stallName: this.vendors[0].stallName,
            userId: this.vendors[0].userId,
            isOwner: this.vendors[0].isOwner
          })
          
          this.addVendorMarkers(this.vendors)
          
          console.log('✅ 加载摊位成功:', this.vendors.length, '个')
          this.$message.success(`加载 ${this.vendors.length} 个真实摊位`)
        } else {
          console.log('没有开摊的摊位，使用模拟数据')
          this.loadMockVendors({ lng: longitude, lat: latitude })
        }
      } catch (error) {
        console.error('加载摊位失败:', error)
        this.$message.error('加载摊位失败，使用模拟数据')
        this.loadMockVendors({ lng: longitude, lat: latitude })
      }
    },

    calculateDistance(lat1, lng1, lat2, lng2) {
      if (!AMap || !AMap.GeometryUtil) {
        console.error('AMap.GeometryUtil 不可用！')
        return '未知'
      }
      
      const distance = AMap.GeometryUtil.distance([lng1, lat1], [lng2, lat2])
      
      console.log(`距离计算：用户 (${lat1},${lng1}) -> 摊位 (${lat2},${lng2}) = ${distance}米`)
      
      return distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(2)}km`
    },
    
    calculateDistanceInMeters(lat1, lng1, lat2, lng2) {
      if (!AMap || !AMap.GeometryUtil) {
        return 0
      }
      return AMap.GeometryUtil.distance([lng1, lat1], [lng2, lat2])
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

    editVendor(vendor) {
      console.log('编辑摊位:', vendor)
      
      this.currentVendorId = vendor.id
      this.editForm = {
        id: vendor.id,
        stallName: vendor.stallName,
        address: vendor.address,
        hotProducts: vendor.hotProducts || '',
        latitude: vendor.lat,
        longitude: vendor.lng
      }
      this.editDialogVisible = true
    },

    async saveEdit() {
      if (!this.editForm.stallName || !this.editForm.address) {
        this.$message.warning('请填写完整信息')
        return
      }
      
      try {
        this.saving = true
        
        const response = await axios.put('http://localhost:8081/api/vendor', {
          id: this.currentVendorId,
          stallName: this.editForm.stallName,
          address: this.editForm.address,
          hotProducts: this.editForm.hotProducts,
          latitude: parseFloat(this.editForm.latitude),
          longitude: parseFloat(this.editForm.longitude)
        })
        
        if (response.data && response.data.code === 200) {
          this.$message.success('摊位信息已更新')
          this.editDialogVisible = false
          
          if (this.currentLocation.lat && this.currentLocation.lng) {
            await this.loadVendorsFromApi(this.currentLocation.lat, this.currentLocation.lng)
          }
        } else {
          this.$message.error('更新失败：' + (response.data?.msg || '未知错误'))
        }
      } catch (error) {
        console.error('更新摊位失败:', error)
        this.$message.error('更新失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.saving = false
      }
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
  height: calc(100vh - 120px) !important;
  min-height: 400px;
  border: 1px solid #ddd;
  position: relative;
}

/* 底部定位提示栏 */
.location-tip-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to right, #f0f9ff, #e0f2fe);
  border-top: 1px solid #bae6fd;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  font-size: 14px;
}

.tip-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.tip-icon {
  font-size: 18px;
}

.tip-text {
  color: #0369a1;
  font-weight: 500;
}

.tip-actions {
  display: flex;
  gap: 10px;
}

.position-info {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  font-size: 13px;
  line-height: 1.8;
}
.position-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}
.position-info p {
  margin: 4px 0;
  color: #666;
}
.position-info .pos-value {
  color: #409EFF;
  font-weight: 500;
}
.map-info {
  margin-top: 20px;
}

/* 响应式设计：手机端调整 */
@media (max-width: 768px) {
  .location-tip-bar {
    flex-direction: column;
    gap: 10px;
    padding: 10px 15px;
  }
  
  .tip-content {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
  
  .tip-actions {
    width: 100%;
    justify-content: center;
  }
  
  .tip-actions .el-button {
    flex: 1;
    max-width: 150px;
  }
}
</style>