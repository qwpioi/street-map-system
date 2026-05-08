package com.streetmap.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.streetmap.backend.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

/**
 * 商品 Mapper 接口
 */
@Mapper
public interface ProductMapper extends BaseMapper<Product> {

    /**
     * 查询摊位的上架商品列表
     */
    @Select("SELECT * FROM product WHERE vendor_id = #{vendorId} AND status = 1 ORDER BY sort_order, id")
    List<Product> selectByVendorId(Long vendorId);
}
