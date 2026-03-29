package com.streetmap.backend.service;

import com.streetmap.backend.entity.Vendor;
import com.baomidou.mybatisplus.extension.service.IService;
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
}