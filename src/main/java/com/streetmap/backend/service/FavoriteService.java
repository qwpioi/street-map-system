package com.streetmap.backend.service;

import com.streetmap.backend.entity.Favorite;
import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;

/**
 * 收藏 Service 接口
 */
public interface FavoriteService extends IService<Favorite> {

    /**
     * 根据用户 ID 查询收藏列表
     * @param userId 用户 ID
     * @return 收藏列表
     */
    List<Favorite> findByUserId(Long userId);

    /**
     * 收藏摊位
     * @param userId 用户 ID
     * @param vendorId 摊位 ID
     * @return 是否成功
     */
    boolean addFavorite(Long userId, Long vendorId);

    /**
     * 取消收藏
     * @param userId 用户 ID
     * @param vendorId 摊位 ID
     * @return 是否成功
     */
    boolean removeFavorite(Long userId, Long vendorId);

    /**
     * 检查是否已收藏
     * @param userId 用户 ID
     * @param vendorId 摊位 ID
     * @return 是否已收藏
     */
    boolean isFavorite(Long userId, Long vendorId);
}