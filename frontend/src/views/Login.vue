<template>
  <div class="login">
    <el-card class="login-form" style="width: 400px;">
      <h2 style="text-align: center; margin-bottom: 30px;">用户登录</h2>

      <el-form :model="form" :rules="rules" ref="loginForm">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width: 100%;">
            登录
          </el-button>
        </el-form-item>

        <div style="text-align: center;">
          <span>还没有账号？</span>
          <el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少6位', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    handleLogin() {
      // 这里后续会调用后端 API
      console.log('登录信息:', this.form)
      this.$message.success('登录功能待实现')
    }
  }
}
</script>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}
.login-form {
  padding: 30px;
}
</style>