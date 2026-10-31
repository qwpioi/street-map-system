const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 开发者工具 IP 定位常偏到广州(23.1, 113.2)或香港(22.3, 114.1)，检测到则回退到开发机真实坐标（郑州）
 * @returns {{ latitude: number, longitude: number, fixed: boolean }}
 */
const fixDevLocation = (latitude, longitude) => {
  const DEV_LAT = 34.7576
  const DEV_LNG = 113.6496

  // 检测广州 IP 定位偏差
  const isGuangzhou =
    Math.abs(latitude - 23.13) < 0.5 &&
    Math.abs(longitude - 113.26) < 0.5

  // 检测香港 IP 定位偏差
  const isHongKong =
    Math.abs(latitude - 22.3) < 0.5 &&
    Math.abs(longitude - 114.1) < 0.5

  const isWrongLocation = isGuangzhou || isHongKong

  if (isWrongLocation) {
    const city = isGuangzhou ? '广州' : '香港'
    console.warn(`⚠️ 检测到开发者工具 IP 模拟定位（${city}），回退到郑州`)
    return { latitude: DEV_LAT, longitude: DEV_LNG, fixed: true }
  }
  return { latitude, longitude, fixed: false }
}

/**
 * 计算两点之间的距离，返回带单位的文本
 * @param {number} lat1 纬度1
 * @param {number} lng1 经度1
 * @param {number} lat2 纬度2
 * @param {number} lng2 经度2
 * @returns {string} 如 "500m" 或 "1.23km"
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(2)}km`
}

/**
 * 将时间字符串格式化为相对时间（如 "刚刚"、"5分钟前"、"3天前"）
 * @param {string} timeStr 时间字符串（可被 new Date 解析）
 * @returns {string}
 */
const formatRelativeTime = (timeStr) => {
  if (!timeStr) return ''
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

    return `${date.getMonth() + 1}/${date.getDate()}`
  } catch (e) {
    return timeStr
  }
}

module.exports = {
  formatTime,
  fixDevLocation,
  calculateDistance,
  formatRelativeTime
}
