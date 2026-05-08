package com.streetmap.backend.service.impl;

import com.streetmap.backend.dto.ApplyVendorDTO;
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
import java.time.LocalDateTime;
import java.util.List;

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
    public void updateVendorStatus(Long userId, Integer status, BigDecimal latitude, BigDecimal longitude) {
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
}