package com.streetmap.backend.service.impl;

import com.streetmap.backend.entity.Vendor;
import com.streetmap.backend.mapper.VendorMapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.streetmap.backend.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 摊主 Service 实现类
 */
@Service
public class VendorServiceImpl extends ServiceImpl<VendorMapper, Vendor> implements VendorService {

    @Autowired
    private VendorMapper vendorMapper;

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
}