<template>
  <div class="profile">
    <el-container>
      <el-header>
        <NavBar @logout="refreshPage" />
      </el-header>

      <el-main>
        <el-card class="profile-card">
          <h2 style="margin-bottom: 20px;">个人中心</h2>
          
          <!-- 用户信息 -->
          <el-descriptions title="基本信息" :column="1" border>
            <el-descriptions-item label="用户名">{{ user.username }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ user.phone || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ user.email || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ genderText(user.gender) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 我的收藏 -->
          <div style="margin-top: 30px;">
            <h3 style="margin-bottom: 15px;">❤️ 我的收藏</h3>
            <el-table :data="favorites" style="width: 100%" v-loading="favoritesLoading">
              <el-table-column prop="stallName" label="摊位名称" width="200"></el-table-column>
              <el-table-column prop="address" label="地址" width="300"></el-table-column>
              <el-table-column prop="hotProducts" label="热销产品" width="250"></el-table-column>
              <el-table-column label="操作" width="150">
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
import { vendorApi } from '@/api/vendor.js'
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
      favoritesLoading: false
    }
  },
  async mounted() {
    this.loadUserInfo()
    this.loadFavorites()
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
        // 先获取收藏列表（返回的是 Favorite 对象，包含 vendorId）
        const res = await favoriteApi.getUserFavorites(userId)
        console.log('收藏列表原始数据:', res)
        
        if (res.code === 200) {
          const favoriteList = res.data || []
          
          // 逐个查询摊位信息
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
          console.log('收藏列表:', this.favorites)
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
}
.el-header {
  background-color: #409EFF;
  color: white;
  padding: 0;
}
.el-main {
  background-color: #f5f5f5;
  padding: 20px;
}
.profile-card {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
</style>