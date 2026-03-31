import AMapLoader from '@amap/amap-jsapi-loader'


/**
 * 初始化高德地图
 * @param {String} containerId - 地图容器 ID
 * @returns {Promise<Object>} 地图实例
 */
export async function initAmap(containerId) {
  // 每次都重新创建地图实例
  try {
    const AMap = await AMapLoader.load({
      key: '3dcbfe14ab2f11f3cae0717fb592ae86',
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geolocation']
    })
    
    const map = new AMap.Map(containerId, {
      zoom: 15,
      center: [116.397428, 39.90923],
      mapStyle: 'amap://styles/normal'
    })
    
    map.addControl(new AMap.Scale())
    map.addControl(new AMap.ToolBar())
    
    return map
  } catch (error) {
    console.error('地图初始化失败:', error)
    throw error
  }
}

/**
 * 在地图上添加标记点
 * @param {Object} map - 地图实例
 * @param {Array} markers - 标记点数组 [{lng, lat, title}]
 */
export function addMarkers(map, markers) {
  if (!map || !markers || markers.length === 0) {
    console.log('地图或标记点数据为空')
    return
  }

  markers.forEach((marker, index) => {
    // 验证坐标是否有效
    const lng = parseFloat(marker.lng)
    const lat = parseFloat(marker.lat)
    
    if (isNaN(lng) || isNaN(lat)) {
      console.error(`第 ${index} 个标记点坐标无效:`, marker)
      return
    }

    try {
      const markerInstance = new AMap.Marker({
        position: [lng, lat],
        title: marker.title
      })
      map.add(markerInstance)
    } catch (error) {
      console.error(`添加第 ${index} 个标记点失败:`, error)
    }
  })
}

/**
 * 定位到当前位置
 * @param {Object} map - 地图实例
 */
export function locateCurrentPosition(map) {
  if (!map) {
    console.error('地图实例未初始化')
    return
  }

  const geolocation = new AMap.Geolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  })

  geolocation.getCurrentPosition((status, result) => {
    if (status === 'complete') {
      // 正确的获取坐标方式
      const longitude = result.position.lng
      const latitude = result.position.lat
      
      console.log('定位成功:', longitude, latitude)
      
      // 验证坐标是否有效
      if (isNaN(longitude) || isNaN(latitude)) {
        console.error('定位坐标无效')
        return
      }
      
      // 设置地图中心
      map.setCenter([longitude, latitude])
      map.setZoom(16)
      
      // 添加当前位置标记
      try {
        const currentMarker = new AMap.Marker({
          position: [longitude, latitude],
          title: '当前位置'
        })
        map.add(currentMarker)
        console.log('当前位置标记已添加')
      } catch (error) {
        console.error('添加当前位置标记失败:', error)
      }
    } else {
      console.error('定位失败:', result)
    }
  })
}
