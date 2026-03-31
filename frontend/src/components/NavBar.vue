<template>
  <el-menu 
    :default-active="activeIndex" 
    mode="horizontal" 
    background-color="#409EFF" 
    text-color="#fff" 
    active-text-color="#ffd04b"
    router
  >
    <el-menu-item index="/" @click="$router.push('/')">首页</el-menu-item>
    <el-menu-item index="/map" @click="$router.push('/map')">地图</el-menu-item>
    <el-menu-item index="/profile" @click="$router.push('/profile')" style="float: right; display: flex; align-items: center; gap: 8px;">
      <el-avatar :size="30" :icon="User" />
      <span>{{ username }}</span>
    </el-menu-item>
    <el-menu-item index="/logout" @click="handleLogout" style="float: right;">退出登录</el-menu-item>
  </el-menu>
</template>

<script>
import { User } from '@element-plus/icons-vue'

export default {
  name: 'NavBar',
  components: {
    User
  },
  data() {
    return {
      activeIndex: this.$route.path,
      username: ''
    }
  },
  watch: {
    $route(to) {
      this.activeIndex = to.path  // 路由变化时更新高亮
    }
  },
  methods: {
    handleLogout() {
      localStorage.removeItem('user')
      localStorage.removeItem('userId')
      localStorage.removeItem('token')
      this.$message.success('退出成功')
      this.$router.push('/login')
    },
    updateUsername() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        this.username = user.username || ''
      } else {
        this.username = ''
      }
    }
  },
  mounted() {
    this.updateUsername()
    window.addEventListener('storage', () => {
      this.updateUsername()
      this.$forceUpdate()
    })
  }
}
</script>

<style scoped>
.el-menu {
  border-bottom: none;
}
</style>