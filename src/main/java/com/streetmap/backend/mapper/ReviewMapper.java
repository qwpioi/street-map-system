package com.streetmap.backend.mapper;

import com.streetmap.backend.dto.ReviewWithUserDTO;
import com.streetmap.backend.entity.Review;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;
import java.util.Map;

/**
 * 评价 Mapper 接口
 */
@Mapper
public interface ReviewMapper extends BaseMapper<Review> {

    /**
     * 批量获取摊位平均评分
     * @param vendorIds 摊位 ID 列表
     * @return 摊位ID -> 平均分 Map
     */
    @Select("<script>" +
            "SELECT vendor_id, AVG(rating) as avg_rating FROM review " +
            "WHERE deleted = 0 AND vendor_id IN " +
            "<foreach collection='vendorIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " GROUP BY vendor_id" +
            "</script>")
    List<Map<String, Object>> getAverageRatingsBatch(@Param("vendorIds") List<Long> vendorIds);

    /**
     * 根据摊位 ID 查询评价列表
     * @param vendorId 摊位 ID
     * @return 评价列表
     */
    @Select("SELECT * FROM review WHERE vendor_id = #{vendorId} AND deleted = 0 ORDER BY create_time DESC")
    List<Review> findByVendorId(Long vendorId);

    /**
     * 根据用户 ID 查询评价列表
     * @param userId 用户 ID
     * @return 评价列表
     */
    @Select("SELECT * FROM review WHERE user_id = #{userId} AND deleted = 0 ORDER BY create_time DESC")
    List<Review> findByUserId(Long userId);

    /**
     * 计算摊位平均评分
     * @param vendorId 摊位 ID
     * @return 平均分
     */
    @Select("SELECT AVG(rating) FROM review WHERE vendor_id = #{vendorId} AND deleted = 0")
    Double getAverageRating(Long vendorId);

    /**
     * 根据摊位 ID 查询评价列表（关联用户信息）
     * @param vendorId 摊位 ID
     * @return 评价列表（含用户信息）
     */
    @Select("SELECT r.id as reviewId, r.user_id as userId, r.vendor_id as vendorId, " +
            "r.rating, r.content, r.create_time as createTime, " +
            "u.username as userName, u.avatar as userAvatar " +
            "FROM review r " +
            "LEFT JOIN user u ON r.user_id = u.id " +
            "WHERE r.vendor_id = #{vendorId} AND r.deleted = 0 " +
            "ORDER BY r.create_time DESC")
    List<ReviewWithUserDTO> findByVendorIdWithUser(Long vendorId);

    /**
     * 根据用户 ID 查询评价列表（关联摊位信息）
     * @param userId 用户 ID
     * @return 评价列表（含摊位信息）
     */
    @Select("SELECT r.id as reviewId, r.user_id as userId, r.vendor_id as vendorId, " +
            "r.rating, r.content, r.create_time as createTime, " +
            "v.stall_name as vendorName " +
            "FROM review r " +
            "LEFT JOIN vendor v ON r.vendor_id = v.id " +
            "WHERE r.user_id = #{userId} AND r.deleted = 0 " +
            "ORDER BY r.create_time DESC")
    List<ReviewWithUserDTO> findByUserIdWithVendor(Long userId);

    /**
     * 统计摊位评价数量
     * @param vendorId 摊位 ID
     * @return 评价数量
     */
    @Select("SELECT COUNT(*) FROM review WHERE vendor_id = #{vendorId} AND deleted = 0")
    Long countByVendorId(Long vendorId);

    /**
     * 根据评价 ID 查询评价（关联用户 ID）
     * @param reviewId 评价 ID
     * @return 评价对象
     */
    @Select("SELECT * FROM review WHERE id = #{reviewId} AND deleted = 0")
    Review findByIdWithUser(Long reviewId);
}