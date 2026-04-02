package com.streetmap.backend.util;

/**
 * 地理位置工具类
 */
public class GeoUtils {
    
    /**
     * 计算两点之间的距离（单位：公里）
     * @param lat1 点1纬度
     * @param lng1 点1经度
     * @param lat2 点2纬度
     * @param lng2 点2经度
     * @return 距离（公里）
     */
    public static double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371; // 地球半径（公里）
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    /**
     * 将距离（公里）转换为经纬度差值的近似值
     * @param km 距离（公里）
     * @return 经纬度差值（度）
     */
    public static double kmToLatLonDegrees(double km) {
        return km / 111.0; // 1度约等于111公里
    }
}