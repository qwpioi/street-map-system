package com.streetmap.backend.mapper;

import com.streetmap.backend.dto.FavoriteWithVendorDTO;
import com.streetmap.backend.entity.Favorite;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Select;
import java.util.List;

/**
 * 收藏 Mapper 接口
 */
@Mapper
public interface FavoriteMapper extends BaseMapper<Favorite> {

    /**
     * 根据用户 ID 查询收藏列表
     * @param userId 用户 ID
     * @return 收藏列表
     */
    @Select("SELECT * FROM favorite WHERE user_id = #{userId}")
    List<Favorite> findByUserId(Long userId);

    /**
     * 检查是否已收藏
     * @param userId 用户 ID
     * @param vendorId 摊位 ID
     * @return 收藏记录
     */
    @Select("SELECT * FROM favorite WHERE user_id = #{userId} AND vendor_id = #{vendorId}")
    Favorite findByUserIdAndVendorId(Long userId, Long vendorId);

    /**
     * 删除收藏
     * @param userId 用户 ID
     * @param vendorId 摊位 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM favorite WHERE user_id = #{userId} AND vendor_id = #{vendorId}")
    int deleteByUserIdAndVendorId(Long userId, Long vendorId);

    /**
     * 根据用户 ID 查询收藏列表（带摊位信息）
     * @param userId 用户 ID
     * @return 收藏列表（带摊位信息）
     */
    @Select("SELECT f.id as favoriteId, f.user_id as userId, f.create_time as createTime, " +
            "v.id as vendorId, v.stall_name as stallName, v.address, v.hot_products as hotProducts, " +
            "v.latitude, v.longitude " +
            "FROM favorite f " +
            "LEFT JOIN vendor v ON f.vendor_id = v.id " +
            "WHERE f.user_id = #{userId}")
    List<FavoriteWithVendorDTO> findByUserIdWithVendor(Long userId);
}