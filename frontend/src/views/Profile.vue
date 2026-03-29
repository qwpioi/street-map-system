<template>
  <div class="profile">
    <el-container>
      <el-header>
        <NavBar @logout="refreshPage" />
      </el-header>

      <el-main>
        <el-card class="profile-card">
          <h2 style="margin-bottom: 20px;">个人中心</h2>

          <!-- 基本信息 -->
          <el-descriptions title="基本信息" :column="1" border style="margin-bottom: 30px;">
            <el-descriptions-item label="用户名">{{ user.username }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ user.phone || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ user.email || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ genderText(user.gender) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 摊主管理 -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 15px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">🏪</span> 摊主管理
            </h3>

            <!-- 已是摊主：显示摊位信息 -->
            <el-card v-if="isVendor" shadow="hover" class="vendor-card">
              <div class="vendor-content">
                <div class="vendor-info">
                  <div class="vendor-name">{{ vendorInfo.stallName || '暂无摊位' }}</div>
                  <div class="vendor-detail" v-if="vendorInfo.address">
                    <span class="icon">📍</span> {{ vendorInfo.address }}
                  </div>
                  <div class="vendor-detail" v-if="vendorInfo.hotProducts">
                    <span class="icon">🔥</span> 热销：{{ vendorInfo.hotProducts }}
                  </div>
                </div>
                <div class="vendor-actions">
                  <el-tag
                    :type="vendorInfo.status === 1 ? 'success' : 'info'"
                    size="large"
                    class="status-tag">
                    {{ vendorInfo.status === 1 ? '🟢 营业中' : '🔴 已收摊' }}
                  </el-tag>
                  <div class="action-buttons">
                    <el-button
                      v-if="vendorInfo.status === 0"
                      type="success"
                      size="large"
                      @click="openStall"
                      class="action-btn">
                      🚀 开摊
                    </el-button>
                    <el-button
                      v-else
                      type="warning"
                      size="large"
                      @click="closeStall"
                      class="action-btn">
                      🌙 收摊
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- 不是摊主：显示入驻按钮 -->
            <el-card v-else shadow="hover" class="vendor-empty-card">
              <div class="vendor-empty-content">
                <div class="vendor-empty-text">
                  <span style="font-size: 48px;">🎪</span>
                  <p style="margin-top: 15px; font-size: 16px; color: #606266;">
                    您还没有摊位，立即入驻开启您的创业之路！
                  </p>
                </div>
                <el-button
                  type="primary"
                  size="large"
                  @click="showRegisterDialog"
                  class="register-btn">
                  🚀 立即入驻
                </el-button>
              </div>
            </el-card>
          </div>

          <!-- 我的收藏 -->
          <div>
            <h3 style="margin-bottom: 15px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">❤️</span> 我的收藏
            </h3>
            <el-table :data="favorites" style="width: 100%" v-loading="favoritesLoading">
              <el-table-column prop="stallName" label="摊位名称" width="200"></el-table-column>
              <el-table-column prop="address" label="地址" width="300"></el-table-column>
              <el-table-column prop="hotProducts" label="热销产品" width="250"></el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button size="small" type="primary" @click="viewVendor(row)">
                    查看
                  </el-button>
                  <el-button size="small" type="danger" @click="removeFavorite(row.vendorId)">
                    取消收藏
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="favorites.length === 0 && !favoritesLoading" description="还没有收藏的摊位哦~"></el-empty>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'
import { favoriteApi } from '@/api/favorite.js'
import axios from 'axios'

export default {
  name: 'Profile',
  components: {
    NavBar
  },
  data() {
    return {
      user: {
        username: '',
        phone: '',
        email: '',
        gender: 0
      },
      favorites: [],
      favoritesLoading: false,
      isVendor: false,
      vendorInfo: {
        id: null,
        stallName: '',
        address: '',
        hotProducts: '',
        status: 0
      },
      // 注册摊主表单
      registerForm: {
        stallName: '',
        description: '',
        hotProducts: ''
      },
      registerFormVisible: false
    }
  },
  async mounted() {
    this.loadUserInfo()
    this.loadFavorites()
    this.loadVendorInfo()
  },
  methods: {
    refreshPage() {
      this.$forceUpdate()
    },

    loadUserInfo() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        this.user = JSON.parse(userStr)
      }
    },

    async loadFavorites() {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        this.$message.warning('请先登录')
        this.$router.push('/login')
        return
      }

      this.favoritesLoading = true
      try {
        const res = await favoriteApi.getUserFavorites(userId)

        if (res.code === 200) {
          const favoriteList = res.data || []

          const favoritesWithVendor = await Promise.all(
            favoriteList.map(async (fav) => {
              try {
                const vendorRes = await axios.get(`http://localhost:8081/api/vendor/${fav.vendorId}`)
                if (vendorRes.data.code === 200) {
                  return {
                    ...fav,
                    stallName: vendorRes.data.data.stallName,
                    address: vendorRes.data.data.address,
                    hotProducts: vendorRes.data.data.hotProducts
                  }
                }
              } catch (error) {
                console.error('加载摊位信息失败:', fav.vendorId, error)
              }
              return {
                ...fav,
                stallName: '未知摊位',
                address: '',
                hotProducts: ''
              }
            })
          )

          this.favorites = favoritesWithVendor
        } else {
          this.$message.error('加载收藏失败')
        }
      } catch (error) {
        console.error('加载收藏失败:', error)
        this.$message.error('加载收藏失败')
      } finally {
        this.favoritesLoading = false
      }
    },

    async loadVendorInfo() {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        return
      }

      try {
        const res = await axios.get(`http://localhost:8081/api/vendor/user/${userId}`)
        if (res.data.code === 200 && res.data.data) {
          this.isVendor = true
          this.vendorInfo = res.data.data
          console.log('摊位信息:', this.vendorInfo)
        } else {
          this.isVendor = false
        }
      } catch (error) {
        console.error('加载摊位信息失败:', error)
        this.isVendor = false
      }
    },

    // 显示注册摊主对话框
    showRegisterDialog() {
      this.registerForm = {
        stallName: '',
        description: '',
        hotProducts: ''
      }

      this.$alert(`
        <div style="padding: 10px 0;">
          <div style="margin-bottom: 15px;">
            <strong>摊位名称：</strong>
            <input
              id="stall-name"
              type="text"
              placeholder="例如：老王烧烤、李姐麻辣烫"
              style="width: 100%; margin-top: 5px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
            />
          </div>
          <div style="margin-bottom: 15px;">
            <strong>摊位描述：</strong>
            <textarea
              id="stall-description"
              placeholder="介绍一下您的摊位..."
              rows="3"
              style="width: 100%; margin-top: 5px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
            ></textarea>
          </div>
          <div>
            <strong>热销产品：</strong>
            <input
              id="hot-products"
              type="text"
              placeholder="例如：羊肉串、烤鸡翅、麻辣烫"
              style="width: 100%; margin-top: 5px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
            />
          </div>
        </div>
      `, '申请成为摊主', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '提交申请',
        cancelButtonText: '取消',
        showCancelButton: true,
        closeOnClickModal: false,
        callback: async (action) => {
          if (action === 'confirm') {
            await this.registerVendor()
          }
        }
      })
    },

    // 注册摊主
    async registerVendor() {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        this.$message.warning('请先登录')
        return
      }

      const stallName = document.getElementById('stall-name')?.value?.trim()
      const description = document.getElementById('stall-description')?.value?.trim() || ''
      const hotProducts = document.getElementById('hot-products')?.value?.trim() || ''

      // 验证必填项
      if (!stallName) {
        this.$message.warning('请填写摊位名称')
        return
      }

      try {
        const vendor = {
          userId: parseInt(userId),
          stallName: stallName,
          description: description,
          hotProducts: hotProducts,
          status: 0  // 默认收摊状态
        }

        console.log('注册摊主:', vendor)

        const res = await axios.post('http://localhost:8081/api/vendor/register', vendor)

        if (res.data.code === 200) {
          this.$message.success('恭喜您成为摊主！现在可以开摊啦！🎉')
          // 重新加载摊位信息
          this.loadVendorInfo()
        } else {
          this.$message.error(res.data.message || '注册失败')
        }
      } catch (error) {
        console.error('注册摊主失败:', error)
        this.$message.error('注册失败，请重试')
      }
    },

    viewVendor(vendor) {
      this.$router.push('/map')
    },

    async removeFavorite(vendorId) {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        this.$message.warning('请先登录')
        return
      }

      try {
        const res = await favoriteApi.removeFavorite(userId, vendorId)
        if (res.code === 200) {
          this.$message.success('已取消收藏')
          this.loadFavorites()
        } else {
          this.$message.error('取消收藏失败')
        }
      } catch (error) {
        console.error('取消收藏失败:', error)
        this.$message.error('取消收藏失败')
      }
    },

    async openStall() {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        this.$message.warning('请先登录')
        return
      }

      if (!navigator.geolocation) {
        this.$message.error('浏览器不支持地理定位')
        return
      }

      this.$message.info('正在获取您的位置...')

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          try {
            const res = await axios.post('http://localhost:8081/api/vendor/open', null, {
              params: {
                userId: parseInt(userId),
                latitude,
                longitude,
                address: '当前位置'
              }
            })

            if (res.data.code === 200) {
              this.$message.success('开摊成功！祝您生意兴隆！🎉')
              this.loadVendorInfo()
            } else {
              this.$message.error(res.data.message || '开摊失败')
            }
          } catch (error) {
            console.error('开摊失败:', error)
            this.$message.error('开摊失败，请重试')
          }
        },
        (error) => {
          console.error('获取位置失败:', error)
          this.$message.error('获取位置失败，请检查浏览器权限')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    },

    async closeStall() {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        this.$message.warning('请先登录')
        return
      }

      try {
        const res = await axios.post('http://localhost:8081/api/vendor/close', null, {
          params: {
            userId: parseInt(userId)
          }
        })

        if (res.data.code === 200) {
          this.$message.success('收摊成功！辛苦了一天，早点休息！🌙')
          this.loadVendorInfo()
        } else {
          this.$message.error(res.data.message || '收摊失败')
        }
      } catch (error) {
        console.error('收摊失败:', error)
        this.$message.error('收摊失败，请重试')
      }
    },

    genderText(gender) {
      if (gender === 1) return '男'
      if (gender === 2) return '女'
      return '未知'
    }
  }
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.el-header {
  background-color: #409EFF;
  color: white;
  padding: 0;
}

.el-main {
  padding: 20px;
}

.profile-card {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px;
}

/* 摊主管理卡片样式 */
.vendor-card {
  border-radius: 8px;
}

.vendor-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 5px;
}

.vendor-info {
  flex: 1;
}

.vendor-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.vendor-detail {
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.vendor-detail .icon {
  margin-right: 6px;
}

.vendor-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.status-tag {
  font-size: 14px;
  padding: 8px 16px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-btn {
  min-width: 100px;
}

/* 未入驻空状态样式 */
.vendor-empty-card {
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.vendor-empty-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 20px;
}

.vendor-empty-text {
  display: flex;
  align-items: center;
  gap: 20px;
}

.vendor-empty-text p {
  margin: 0;
  color: white;
  font-weight: 500;
}

.register-btn {
  background-color: white;
  color: #667eea;
  border: none;
  font-weight: bold;
}

.register-btn:hover {
  background-color: #f0f0f0;
}

/* 收藏列表样式 */
.el-table {
  border-radius: 4px;
  overflow: hidden;
}
</style>