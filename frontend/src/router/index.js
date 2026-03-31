import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
// const Home = () => import('../views/Home.vue')  // 已废弃，首页改为地图页
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const Map = () => import('../views/Map.vue')
const Profile = () => import('../views/Profile.vue')

const routes = [
  { 
    path: '/', 
    name: 'Home', 
    component: Map,  // 首页直接显示地图
    meta: { requiresAuth: true }  // 需要登录
  },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/map', name: 'Map', component: Map },
  { path: '/profile', name: 'Profile', component: Profile }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router