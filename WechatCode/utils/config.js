/**
 * 全局配置文件
 * 统一管理所有 API 地址、密钥等配置
 */

// 环境配置
const ENV = {
  // 开发环境
  development: {
    API_BASE_URL: 'https://api.ditan.asia/api',
    QQ_MAP_KEY: '3DYBZ-NF2CN-XNYF2-SE3HN-NMFMS-T2BMO'
  },
  // 生产环境
  production: {
    API_BASE_URL: 'https://api.ditan.asia/api',
    QQ_MAP_KEY: '3DYBZ-NF2CN-XNYF2-SE3HN-NMFMS-T2BMO'
  }
}

// 当前环境（可通过微信开发者工具的条件编译切换）
// 开发时设置为 'development'，发布时设置为 'production'
const CURRENT_ENV = 'production'

// 导出配置
module.exports = {
  API_BASE_URL: ENV[CURRENT_ENV].API_BASE_URL,
  QQ_MAP_KEY: ENV[CURRENT_ENV].QQ_MAP_KEY,
  ENV: CURRENT_ENV
}
