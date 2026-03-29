<template>
  <el-menu mode="horizontal" default-active="1" background-color="#409EFF" text-color="#fff" active-text-color="#ffd04b">
    <el-menu-item index="1" @click="$router.push('/')">首页</el-menu-item>
    <el-menu-item index="2" @click="$router.push('/map')">地图</el-menu-item>

    <!-- 登录后显示 -->
    <template v-if="isLoggedIn">
      <el-menu-item index="3" @click="$router.push('/profile')" style="float: right;">
        <el-badge :is-dot="hasUnread">个人中心</el-badge>
      </el-menu-item>
      <el-menu-item index="4" @click="handleLogout" style="float: right;">退出登录</el-menu-item>
    </template>

    <!-- 未登录显示 -->
    <template v-else>
      <el-menu-item index="5" @click="$router.push('/login')" style="float: right;">登录</el-menu-item>
      <el-menu-item index="6" @click="$router.push('/register')" style="float: right;">注册</el-menu-item>
    </template>
  </el-menu>
</template>

<script>
export default {
  name: 'NavBar',
  data() {
    return {
      hasUnread: false
    }
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('user')
    }
  },
  methods: {
    handleLogout() {
      localStorage.removeItem('user')
      this.$message.success('已退出登录')
      this.$router.push('/login')
      // 通知其他组件更新状态
      this.$emit('logout')
    }
  },
  mounted() {
    // 监听存储变化，实现多页面同步
    window.addEventListener('storage', () => {
      this.$forceUpdate()
    })
  },
  beforeUnmount() {
    window.removeEventListener('storage', () => {})
  }
}
</script>