<template>
  <div class="profile">
    <el-container>
      <el-header>
        <el-menu mode="horizontal" default-active="5">
          <el-menu-item index="1" @click="$router.push('/')">首页</el-menu-item>
          <el-menu-item index="2" @click="$router.push('/map')">地图</el-menu-item>
          <el-menu-item index="5">个人中心</el-menu-item>
          <el-menu-item index="3" @click="$router.push('/login')" style="float: right;">登录</el-menu-item>
          <el-menu-item index="4" @click="$router.push('/register')" style="float: right;">注册</el-menu-item>
        </el-menu>
      </el-header>
      
      <el-main>
        <div class="profile-container">
          <h2>个人中心</h2>
          <p>个人中心功能待实现</p>
          
          <el-card style="max-width: 600px; margin: 20px auto;">
            <div slot="header">
              <span>用户信息</span>
            </div>
            
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户名">游客</el-descriptions-item>
              <el-descriptions-item label="邮箱">-</el-descriptions-item>
              <el-descriptions-item label="注册时间">-</el-descriptions-item>
            </el-descriptions>
            
            <div style="margin-top: 20px;">
              <el-button type="primary">编辑资料</el-button>
              <el-button type="danger">退出登录</el-button>
            </div>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'Profile'
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