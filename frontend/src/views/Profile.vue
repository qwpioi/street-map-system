<template>
  <div class="profile">
    <el-container>
      <el-header>
        <NavBar @logout="refreshPage" />
      </el-header>

      <el-main>
        <div class="profile-container">
          <h2>个人中心</h2>

          <el-card v-if="user" style="max-width: 600px; margin: 20px auto;">
            <div slot="header">
              <span>用户信息</span>
            </div>

            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户名">{{ user.username }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ user.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ user.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ user.createTime || '-' }}</el-descriptions-item>
            </el-descriptions>

            <div style="margin-top: 20px; text-align: center;">
              <el-button type="danger" @click="handleLogout">退出登录</el-button>
            </div>
          </el-card>

          <el-alert v-else title="请先登录" type="warning" :closable="false" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>


<script>
import NavBar from '@/components/NavBar.vue'

export default {
  name: 'Profile',
  components: {
    NavBar
  },
  computed: {
    user() {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    }
  },
  methods: {
    refreshPage() {
      this.$forceUpdate()
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
}
.profile-container {
  text-align: center;
}
</style>