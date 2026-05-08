package com.streetmap.backend.mapper;

import com.streetmap.backend.entity.Vendor;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

/**
 * 摊主 Mapper 接口
 */
@Mapper
public interface VendorMapper extends BaseMapper<Vendor> {

    /**
     * 查询所有开摊的摊位
     * @return 摊位列表
     */
    @Select("SELECT v.id, v.user_id, v.stall_name, v.description, v.hot_products, " +
            "v.status, v.latitude, v.longitude, v.address, v.last_open_time, " +
            "v.create_time, v.update_time, u.phone " +
            "FROM vendor v LEFT JOIN user u ON v.user_id = u.id " +
            "WHERE v.status = 1")
    List<Vendor> findOpenVendors();

    /**
     * 根据用户 ID 查询摊位
     * @param userId 用户 ID
     * @return 摊位对象
     */
    @Select("SELECT v.id, v.user_id, v.stall_name, v.description, v.hot_products, " +
            "v.status, v.latitude, v.longitude, v.address, v.last_open_time, " +
            "v.create_time, v.update_time, u.phone " +
            "FROM vendor v LEFT JOIN user u ON v.user_id = u.id " +
            "WHERE v.user_id = #{userId}")
    Vendor findByUserId(Long userId);

    /**
     * 查询附近的摊位（根据经纬度范围）
     * @param latitude 纬度
     * @param longitude 经度
     * @param range 范围（度）
     * @return 摊位列表
     */
    @Select("SELECT v.id, v.user_id, v.stall_name, v.description, v.hot_products, " +
            "v.status, v.latitude, v.longitude, v.address, v.last_open_time, " +
            "v.create_time, v.update_time, u.phone " +
            "FROM vendor v LEFT JOIN user u ON v.user_id = u.id " +
            "WHERE v.status = 1 " +
            "AND v.latitude BETWEEN #{latitude} - #{range} AND #{latitude} + #{range} " +
            "AND v.longitude BETWEEN #{longitude} - #{range} AND #{longitude} + #{range}")
    List<Vendor> findNearbyVendors(Double latitude, Double longitude, Double range);
}