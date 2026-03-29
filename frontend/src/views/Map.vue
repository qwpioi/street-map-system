<template>
  <div class="map">
    <el-container>
      <el-header>
        <el-menu mode="horizontal" default-active="2">
          <el-menu-item index="1" @click="$router.push('/')">首页</el-menu-item>
          <el-menu-item index="2">地图</el-menu-item>
          <el-menu-item index="3" @click="$router.push('/login')" style="float: right;">登录</el-menu-item>
          <el-menu-item index="4" @click="$router.push('/register')" style="float: right;">注册</el-menu-item>
        </el-menu>
      </el-header>
      
      <el-main>
        <div class="map-container">
          <h2>地摊地图</h2>
          <p>地图功能待实现（集成高德地图）</p>
          
          <div style="margin: 20px 0;">
            <el-button type="primary" @click="loadMap">加载地图</el-button>
            <el-button type="success" @click="findNearby">查找附近摊位</el-button>
          </div>
          
          <div id="mapContainer" style="width: 100%; height: 500px; border: 1px solid #ddd;"></div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'Map',
  methods: {
    loadMap() {
      this.$message.info('地图加载功能待实现')
    },
    findNearby() {
      this.$message.info('查找附近摊位功能待实现')
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
  text-align: center;
}
</style>