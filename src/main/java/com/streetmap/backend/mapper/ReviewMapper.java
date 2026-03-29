package com.streetmap.backend.mapper;

import com.streetmap.backend.entity.Review;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

/**
 * 评价 Mapper 接口
 */
@Mapper
public interface ReviewMapper extends BaseMapper<Review> {

    /**
     * 根据摊位 ID 查询评价列表
     * @param vendorId 摊位 ID
     * @return 评价列表
     */
    @Select("SELECT * FROM review WHERE vendor_id = #{vendorId} ORDER BY create_time DESC")
    List<Review> findByVendorId(Long vendorId);

    /**
     * 根据用户 ID 查询评价列表
     * @param userId 用户 ID
     * @return 评价列表
     */
    @Select("SELECT * FROM review WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<Review> findByUserId(Long userId);

    /**
     * 计算摊位平均评分
     * @param vendorId 摊位 ID
     * @return 平均分
     */
    @Select("SELECT AVG(rating) FROM review WHERE vendor_id = #{vendorId}")
    Double getAverageRating(Long vendorId);
}