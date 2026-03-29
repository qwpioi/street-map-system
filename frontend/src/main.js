import { createApp } from 'vue'
import App from './App.vue'

// 导入路由
import router from './router'

// 导入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

// 使用路由和 Element Plus
app.use(router)
app.use(ElementPlus)

app.mount('#app')