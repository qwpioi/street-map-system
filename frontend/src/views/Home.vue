<template>
  <div class="home">
    <el-container>
      <el-header>
        <NavBar @logout="refreshPage" />
      </el-header>

      <el-main>
        <div v-if="isLoggedIn" class="welcome">
          <h1>欢迎回来，{{ username }}！</h1>
          <p>快去查看附近的摊位吧</p>
          <el-button type="primary" @click="$router.push('/map')" size="large">
            查看地图
          </el-button>
        </div>
        <div v-else class="welcome">
          <h1>欢迎来到地摊地图系统</h1>
          <p>发现身边的美食摊位，享受街头美味</p>
          <el-button type="primary" @click="$router.push('/map')" size="large">
            查看地图
          </el-button>
          <el-button @click="$router.push('/login')" size="large">
            登录
          </el-button>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'

export default {
  name: 'Home',
  components: {
    NavBar
  },
  data() {
    return {
      hasUnread: false
    }
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('user')
    },
    username() {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).username : ''
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
.home {
  min-height: 100vh;
}
.el-header {
  background-color: #409EFF;
  color: white;
  padding: 0;
}
.el-main {
  text-align: center;
  padding-top: 50px;
}
.welcome h1 {
  color: #409EFF;
  margin-bottom: 20px;
}
</style>