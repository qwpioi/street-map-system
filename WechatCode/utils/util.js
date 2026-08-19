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
 * 开发者工具 IP 定位常偏到广州(23.1, 113.2)，检测到则回退到开发机真实坐标（郑州）
 * @returns {{ latitude: number, longitude: number, fixed: boolean }}
 */
const fixDevLocation = (latitude, longitude) => {
  const DEV_LAT = 34.7576
  const DEV_LNG = 113.6496
  const isWrongLocation =
    Math.abs(latitude - 23.13) < 0.5 &&
    Math.abs(longitude - 113.26) < 0.5

  if (isWrongLocation) {
    console.warn('⚠️ 检测到开发者工具 IP 模拟定位（广州），回退到郑州')
    return { latitude: DEV_LAT, longitude: DEV_LNG, fixed: true }
  }
  return { latitude, longitude, fixed: false }
}

module.exports = {
  formatTime,
  fixDevLocation
}
