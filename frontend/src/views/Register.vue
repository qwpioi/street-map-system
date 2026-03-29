<template>
  <div class="register">
    <el-container>
      <el-header>
        <NavBar />
      </el-header>

      <el-main>
        <el-card class="register-form" style="width: 400px;">
          <h2 style="text-align: center; margin-bottom: 30px;">用户注册</h2>

          <el-form :model="form" :rules="rules" ref="registerForm">
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                placeholder="用户名"
                prefix-icon="User"
              />
            </el-form-item>

            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                type="email"
                placeholder="邮箱"
                prefix-icon="Message"
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

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="确认密码"
                prefix-icon="Lock"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleRegister" style="width: 100%;">
                注册
              </el-button>
            </el-form-item>

            <div style="text-align: center;">
              <span>已有账号？</span>
              <el-link type="primary" @click="$router.push('/login')">立即登录</el-link>
            </div>
          </el-form>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'
import axios from 'axios'

export default {
  name: 'Register',
  components: {
    NavBar
  },
  data() {
    const validatePass = (rule, value, callback) => {
      if (value !== this.form.password) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };

    return {
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 15, message: '用户名长度为 3-15 位', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validatePass, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    async handleRegister() {
      try {
        // 移除 confirmPassword 再发送
        const { confirmPassword, ...registerData } = this.form

        const response = await axios.post('http://localhost:8081/api/user/register', registerData)

        if (response.data.code === 200) {
          this.$message.success('注册成功，请登录')
          // 跳转到登录页
          this.$router.push('/login')
        } else {
          this.$message.error(response.data.message || '注册失败')
        }
      } catch (error) {
        console.error('注册失败:', error)
        this.$message.error(error.response?.data?.message || '注册失败')
      }
    }
  }
}
</script>

<style scoped>
.register {
  min-height: 100vh;
}
.el-header {
  background-color: #409EFF;
  color: white;
  padding: 0;
}
.el-main {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}
.register-form {
  padding: 30px;
}
</style>