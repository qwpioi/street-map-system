package com.streetmap.backend.util;

/**
 * 地址处理工具类
 */
public class AddressUtil {

    /**
     * 从完整地址中提取详细地址部分（去掉省、市、区/县/镇前缀）
     * <p>
     * 示例：
     * - "河南省郑州市管城区紫荆山路36号" → "紫荆山路36号"
     * - "北京市朝阳区建国路" → "建国路"
     * - "深圳市南山区粤海路XX号" → "粤海路XX号"
     * - "河南省固始县陈淋子镇XX路" → "XX路"
     *
     * @param address 完整地址字符串
     * @return 截取后的详细地址，如果地址为空则返回空字符串
     */
    public static String extractDetailAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return "";
        }

        // 查找最后一个行政区划分隔符（区/县/市/镇）的位置
        int lastIndex = -1;
        String[] markers = {"区", "县", "市", "镇"};
        for (String marker : markers) {
            int idx = address.lastIndexOf(marker);
            if (idx > lastIndex) {
                lastIndex = idx;
            }
        }

        // 如果找到分隔符且后面还有内容，返回截取后的部分
        if (lastIndex >= 0 && lastIndex < address.length() - 1) {
            return address.substring(lastIndex + 1);
        }

        // 如果没找到分隔符，或分隔符后没有内容，返回原地址
        return address;
    }
}
