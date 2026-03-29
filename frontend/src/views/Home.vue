<template>
  <div class="home">
    <el-container>
      <el-header>
        <el-menu mode="horizontal" default-active="1">
          <el-menu-item index="1">首页</el-menu-item>
          <el-menu-item index="2" @click="$router.push('/map')">地图</el-menu-item>
          <el-menu-item index="3" @click="$router.push('/login')" style="float: right;">登录</el-menu-item>
          <el-menu-item index="4" @click="$router.push('/register')" style="float: right;">注册</el-menu-item>
        </el-menu>
      </el-header>

      <el-main>
        <h1>欢迎来到地摊地图系统</h1>
        <p>发现身边的美食摊位，享受街头美味</p>

        <el-button type="primary" @click="$router.push('/map')" size="large">
          查看地图
        </el-button>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.home {
  min-height: 100vh;
}
.el-header {
  background-color: #409EFF;
  color: white;
}
.el-main {
  text-align: center;
  padding-top: 50px;
}
</style>