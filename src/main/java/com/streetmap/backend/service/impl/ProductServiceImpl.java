package com.streetmap.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.streetmap.backend.dto.ProductVO;
import com.streetmap.backend.entity.Product;
import com.streetmap.backend.entity.Vendor;
import com.streetmap.backend.mapper.ProductMapper;
import com.streetmap.backend.mapper.VendorMapper;
import com.streetmap.backend.service.ProductService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 商品 Service 实现类
 */
@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private VendorMapper vendorMapper;

    @Override
    public List<ProductVO> getProductsByVendorId(Long vendorId) {
        List<Product> products = productMapper.selectByVendorId(vendorId);
        return products.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public ProductVO addProduct(Long vendorId, ProductVO productVO) {
        Vendor vendor = vendorMapper.selectById(vendorId);
        if (vendor == null) {
            throw new RuntimeException("摊位不存在");
        }

        Product product = new Product();
        BeanUtils.copyProperties(productVO, product);
        product.setVendorId(vendorId);
        product.setStatus(1);
        product.setSortOrder(0);

        productMapper.insert(product);
        return convertToVO(product);
    }

    @Override
    public ProductVO updateProduct(ProductVO productVO) {
        Product product = productMapper.selectById(productVO.getId());
        if (product == null) {
            throw new RuntimeException("商品不存在");
        }

        BeanUtils.copyProperties(productVO, product, "id", "vendorId", "createTime", "updateTime");
        productMapper.updateById(product);

        return convertToVO(product);
    }

    @Override
    public boolean deleteProduct(Long productId, Long userId) {
        Product product = productMapper.selectById(productId);
        if (product == null) {
            throw new RuntimeException("商品不存在");
        }

        Vendor vendor = vendorMapper.selectById(product.getVendorId());
        if (vendor == null || !vendor.getUserId().equals(userId)) {
            throw new RuntimeException("无权限删除此商品");
        }

        return productMapper.deleteById(productId) > 0;
    }

    private ProductVO convertToVO(Product product) {
        ProductVO vo = new ProductVO();
        BeanUtils.copyProperties(product, vo);
        return vo;
    }
}
