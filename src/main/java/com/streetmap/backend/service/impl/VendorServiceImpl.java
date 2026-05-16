package com.streetmap.backend.service.impl;

import com.streetmap.backend.dto.ApplyVendorDTO;
import com.streetmap.backend.dto.UpdateVendorInfoDTO;
import com.streetmap.backend.dto.VendorDTO;
import com.streetmap.backend.entity.User;
import com.streetmap.backend.entity.Vendor;
import com.streetmap.backend.mapper.UserMapper;
import com.streetmap.backend.mapper.VendorMapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.streetmap.backend.service.ProductService;
import com.streetmap.backend.service.ReviewService;
import com.streetmap.backend.service.VendorService;
import com.streetmap.backend.dto.ProductVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 摊主 Service 实现类
 */
@Service
public class VendorServiceImpl extends ServiceImpl<VendorMapper, Vendor> implements VendorService {

    @Autowired
    private VendorMapper vendorMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    public Vendor findByUserId(Long userId) {
        return vendorMapper.findByUserId(userId);
    }

    @Override
    public List<Vendor> findOpenVendors() {
        return vendorMapper.findOpenVendors();
    }

    @Override
    public List<Vendor> findNearbyVendors(Double latitude, Double longitude, Double range) {
        return vendorMapper.findNearbyVendors(latitude, longitude, range);
    }

    @Override
    public boolean openStall(Long userId, Double latitude, Double longitude, String address) {
        // 查询是否已有摊位
        Vendor vendor = findByUserId(userId);
        if (vendor == null) {
            throw new RuntimeException("请先注册成为摊主");
        }

        // 更新位置和状态
        vendor.setLatitude(java.math.BigDecimal.valueOf(latitude));
        vendor.setLongitude(java.math.BigDecimal.valueOf(longitude));
        vendor.setAddress(address);
        vendor.setStatus(1);
        vendor.setLastOpenTime(LocalDateTime.now());

        return updateById(vendor);
    }

    @Override
    public boolean closeStall(Long userId) {
        Vendor vendor = findByUserId(userId);
        if (vendor == null) {
            throw new RuntimeException("摊位不存在");
        }

        vendor.setStatus(0);
        return updateById(vendor);
    }

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ProductService productService;

    @Override
    public VendorDTO getMyVendor(Long userId) {
        Vendor vendor = findByUserId(userId);
        if (vendor == null) {
            return null;
        }

        VendorDTO dto = new VendorDTO();
        BeanUtils.copyProperties(vendor, dto);

        dto.setAverageRating(reviewService.getAverageRating(vendor.getId()));
        dto.setReviewCount(reviewService.countByVendorId(vendor.getId()));

        List<ProductVO> products = productService.getProductsByVendorId(vendor.getId());
        dto.setProducts(products);

        return dto;
    }

    @Override
    public void updateVendorStatus(Long userId, Integer status, BigDecimal latitude, BigDecimal longitude, String address) {
        Vendor vendor = findByUserId(userId);
        if (vendor == null) {
            throw new RuntimeException("您还没有创建摊位！");
        }

        vendor.setStatus(status);

        // 如果是开摊，且传了新坐标，则更新位置
        if (status == 1 && latitude != null && longitude != null) {
            vendor.setLatitude(latitude);
            vendor.setLongitude(longitude);
            vendor.setLastOpenTime(LocalDateTime.now());

            // 如果前端传入了有效地址则保存
            if (address != null && !address.trim().isEmpty()) {
                vendor.setAddress(address.trim());
            }
        }

        updateById(vendor);
    }

    @Override
    public void applyVendor(Long userId, ApplyVendorDTO dto) {
        long count = vendorMapper.selectCount(new QueryWrapper<Vendor>().eq("user_id", userId));
        if (count > 0) {
            throw new RuntimeException("您已经拥有摊位，无需重复申请！");
        }

        // 手机号校验
        if (dto.getPhone() == null || dto.getPhone().trim().isEmpty()) {
            throw new RuntimeException("请填写手机号！");
        }
        if (!dto.getPhone().matches("^1[3-9]\\d{9}$")) {
            throw new RuntimeException("手机号格式不正确！");
        }

        Vendor vendor = new Vendor();
        BeanUtils.copyProperties(dto, vendor);
        vendor.setUserId(userId);
        vendor.setStatus(0);

        vendorMapper.insert(vendor);

        // 把手机号同步更新到 user 表
        userMapper.update(null, new UpdateWrapper<User>()
                .set("phone", dto.getPhone())
                .eq("id", userId));
    }

    @Override
    public void updatePhone(Long userId, String phone) {
        // 确认用户有摊位
        Vendor vendor = findByUserId(userId);
        if (vendor == null) {
            throw new RuntimeException("您还没有摊位！");
        }
        // 更新到 user 表
        userMapper.update(null, new UpdateWrapper<User>()
                .set("phone", phone)
                .eq("id", userId));
    }

    @Override
    public void updateVendorInfo(Long userId, UpdateVendorInfoDTO dto) {
        Vendor vendor = findByUserId(userId);
        if (vendor == null) {
            throw new RuntimeException("您还没有摊位！");
        }

        // 更新摊位名称
        if (dto.getStallName() != null && !dto.getStallName().trim().isEmpty()) {
            vendor.setStallName(dto.getStallName().trim());
        }

        // 更新摊位头像
        if (dto.getAvatar() != null && !dto.getAvatar().trim().isEmpty()) {
            vendor.setAvatar(dto.getAvatar().trim());
        }

        updateById(vendor);

        // 更新手机号到 user 表
        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            if (!dto.getPhone().matches("^1[3-9]\\d{9}$")) {
                throw new RuntimeException("手机号格式不正确！");
            }
            userMapper.update(null, new UpdateWrapper<User>()
                    .set("phone", dto.getPhone())
                    .eq("id", userId));
        }
    }

    @Override
    public List<VendorDTO> getSmartRecommendedVendors(double userLat, double userLng, double rangeKm) {
        // 1. 获取候选集：范围内所有开摊的摊位
        // 将 km 转换为度数（近似：1度 ≈ 111km）
        double rangeDegrees = rangeKm / 111.0;
        List<Vendor> vendors = findNearbyVendors(userLat, userLng, rangeDegrees);

        if (vendors.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. 批量查分：获取所有摊位的平均评分
        List<Long> vendorIds = vendors.stream()
                .map(Vendor::getId)
                .collect(Collectors.toList());
        Map<Long, Double> ratingMap = reviewService.getAverageRatingsBatch(vendorIds);

        // 3. 计算距离并组装 DTO
        List<VendorDTO> dtoList = new ArrayList<>();
        for (Vendor vendor : vendors) {
            VendorDTO dto = new VendorDTO();
            BeanUtils.copyProperties(vendor, dto);

            // 计算距离（km）- Haversine 公式
            double distance = calculateDistance(userLat, userLng,
                    vendor.getLatitude().doubleValue(),
                    vendor.getLongitude().doubleValue());
            dto.setDistance(Math.round(distance * 100.0) / 100.0); // 保留2位小数

            // 获取评分
            Double score = ratingMap.get(vendor.getId());
            dto.setScore(score != null ? Math.round(score * 10.0) / 10.0 : 0.0);
            dto.setAverageRating(dto.getScore());

            dtoList.add(dto);
        }

        // 4. 混合排序：优先展示 score >= 4.5 的摊位，同等级内按 distance 升序
        List<VendorDTO> highRating = dtoList.stream()
                .filter(d -> d.getScore() >= 4.5)
                .sorted(Comparator.comparing(VendorDTO::getDistance))
                .collect(Collectors.toList());

        List<VendorDTO> normalRating = dtoList.stream()
                .filter(d -> d.getScore() < 4.5)
                .sorted(Comparator.comparing(VendorDTO::getDistance))
                .collect(Collectors.toList());

        // 合并结果：高评分在前，同等级按距离排序
        List<VendorDTO> sortedList = new ArrayList<>();
        sortedList.addAll(highRating);
        sortedList.addAll(normalRating);

        // 5. 截断：返回前 20 个结果
        return sortedList.stream().limit(20).collect(Collectors.toList());
    }

    @Override
    public List<VendorDTO> getHotRankingVendors(double userLat, double userLng) {
        final double rangeKm = 3.0;
        double rangeDegrees = rangeKm / 111.0;

        List<Vendor> vendors = findNearbyVendors(userLat, userLng, rangeDegrees);

        if (vendors.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> vendorIds = vendors.stream()
                .map(Vendor::getId)
                .collect(Collectors.toList());
        Map<Long, Double> ratingMap = reviewService.getAverageRatingsBatch(vendorIds);

        List<VendorDTO> dtoList = new ArrayList<>();
        for (Vendor vendor : vendors) {
            VendorDTO dto = new VendorDTO();
            BeanUtils.copyProperties(vendor, dto);

            double distance = calculateDistance(userLat, userLng,
                    vendor.getLatitude().doubleValue(),
                    vendor.getLongitude().doubleValue());
            dto.setDistance(Math.round(distance * 100.0) / 100.0);

            Double score = ratingMap.get(vendor.getId());
            dto.setScore(score != null ? Math.round(score * 10.0) / 10.0 : 0.0);
            dto.setAverageRating(dto.getScore());

            dtoList.add(dto);
        }

        // 纯评分降序（不按距离），同分按ID保证稳定顺序
        List<VendorDTO> sortedList = dtoList.stream()
                .sorted(Comparator.comparing(VendorDTO::getScore).reversed()
                        .thenComparing(VendorDTO::getId))
                .collect(Collectors.toList());

        return sortedList.stream().limit(20).collect(Collectors.toList());
    }

    @Override
    public String resolveAddress(Long userId) {
        Vendor vendor = findByUserId(userId);
        if (vendor == null) return null;
        if (vendor.getLatitude() == null || vendor.getLongitude() == null) return null;

        String addr = vendor.getAddress();
        // 如果已有有效地址（含地点关键词），直接返回
        if (isValidAddress(addr)) return addr;

        // 逆地理编码
        String resolved = reverseGeocode(
                vendor.getLatitude().doubleValue(),
                vendor.getLongitude().doubleValue());
        if (resolved != null && !resolved.isEmpty()) {
            vendor.setAddress(resolved);
            updateById(vendor);
        }
        return resolved;
    }

    /**
     * Haversine 公式计算两点之间的距离（km）
     */
    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0; // 地球半径（km）

        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * 判断地址是否像一个真实的地点描述（包含省/市/区/路/街/号等关键词）
     * 排除纯坐标文本、占位文本、"已获取当前位置"等非地址字符串
     */
    private boolean isValidAddress(String addr) {
        if (addr == null || addr.trim().isEmpty()) return false;
        // 必须包含至少一个地点指示性汉字
        return addr.matches(".*[省市区县镇村路街号巷弄栋幢座单元楼].*");
    }

    /**
     * 逆地理编码：将经纬度转换为中文地址
     * 使用 OpenStreetMap Nominatim 免费 API
     */
    private String reverseGeocode(double latitude, double longitude) {
        try {
            String url = String.format(
                    "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f&zoom=18&addressdetails=1",
                    latitude, longitude);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept-Language", "zh-CN,zh;q=0.9")
                    .header("User-Agent", "StreetMapBackend/1.0")
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(response.body());
                if (root.has("display_name")) {
                    String displayName = root.get("display_name").asText();
                    // 取前 50 字，避免地址过长
                    return displayName.length() > 50 ? displayName.substring(0, 50) : displayName;
                }
            }
        } catch (Exception e) {
            // 逆地理编码失败时静默处理，不影响主流程
        }
        return null;
    }
}
