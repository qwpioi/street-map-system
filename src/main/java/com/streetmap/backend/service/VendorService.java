package com.streetmap.backend.service;

import com.streetmap.backend.entity.Vendor;
import com.streetmap.backend.dto.ApplyVendorDTO;
import com.streetmap.backend.dto.UpdateVendorInfoDTO;
import com.streetmap.backend.dto.VendorDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import java.math.BigDecimal;
import java.util.List;

/**
 * 摊主 Service 接口
 */
public interface VendorService extends IService<Vendor> {

    /**
     * 根据用户 ID 查询摊位
     * @param userId 用户 ID
     * @return 摊位对象
     */
    Vendor findByUserId(Long userId);

    /**
     * 查询所有开摊的摊位
     * @return 摊位列表
     */
    List<Vendor> findOpenVendors();

    /**
     * 查询附近的摊位
     * @param latitude 纬度
     * @param longitude 经度
     * @param range 范围（度）
     * @return 摊位列表
     */
    List<Vendor> findNearbyVendors(Double latitude, Double longitude, Double range);

    /**
     * 开摊
     * @param userId 用户 ID
     * @param latitude 纬度
     * @param longitude 经度
     * @param address 地址
     * @return 是否成功
     */
    boolean openStall(Long userId, Double latitude, Double longitude, String address);

    /**
     * 收摊
     * @param userId 用户 ID
     * @return 是否成功
     */
    boolean closeStall(Long userId);

    /**
     * 获取当前用户的摊位信息
     */
    VendorDTO getMyVendor(Long userId);

    /**
     * 修改摊位状态 (status: 1=开摊, 0=收摊)
     */
    void updateVendorStatus(Long userId, Integer status, BigDecimal latitude, BigDecimal longitude, String address);

    /**
     * 申请成为摊主
     */
    void applyVendor(Long userId, ApplyVendorDTO dto);

    /**
     * 更新摊主手机号（同步到 user 表）
     * @param userId 用户ID
     * @param phone 新手机号
     */
    void updatePhone(Long userId, String phone);

    /**
     * 更新摊位信息（名称、头像、手机号）
     * @param userId 用户ID
     * @param dto 更新信息
     */
    void updateVendorInfo(Long userId, UpdateVendorInfoDTO dto);

    /**
     * 获取智能推荐的摊位列表（距离优先 + 质量筛选）
     * @param userLat 用户纬度
     * @param userLng 用户经度
     * @param rangeKm 搜索范围（公里）
     * @return 排序后的摊位列表
     */
    List<VendorDTO> getSmartRecommendedVendors(double userLat, double userLng, double rangeKm);

    /**
     * 获取热门排行摊位列表（3KM内按评分降序）
     * @param userLat 用户纬度
     * @param userLng 用户经度
     * @return 按评分降序排列的摊位列表
     */
    List<VendorDTO> getHotRankingVendors(double userLat, double userLng);

    /**
     * 逆地理编码解析地址（异步调用，不阻塞主流程）
     * @param userId 用户ID
     * @return 解析后的地址，失败返回 null
     */
    String resolveAddress(Long userId);
}
