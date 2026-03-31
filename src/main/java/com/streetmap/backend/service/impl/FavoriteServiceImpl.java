package com.streetmap.backend.service.impl;

import com.streetmap.backend.entity.Favorite;
import com.streetmap.backend.mapper.FavoriteMapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.streetmap.backend.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 收藏 Service 实现类
 */
@Service
public class FavoriteServiceImpl extends ServiceImpl<FavoriteMapper, Favorite> implements FavoriteService {

    @Autowired
    private FavoriteMapper favoriteMapper;

    @Override
    public List<Favorite> findByUserId(Long userId) {
        return favoriteMapper.findByUserId(userId);
    }

    @Override
    public boolean addFavorite(Long userId, Long vendorId) {
        // 检查是否已收藏
        Favorite exist = favoriteMapper.findByUserIdAndVendorId(userId, vendorId);
        if (exist != null) {
            throw new RuntimeException("已收藏");
        }

        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setVendorId(vendorId);
        favorite.setCreateTime(LocalDateTime.now());

        return save(favorite);
    }

    @Override
    public boolean removeFavorite(Long userId, Long vendorId) {
        return favoriteMapper.deleteByUserIdAndVendorId(userId, vendorId) > 0;
    }

    @Override
    public boolean isFavorite(Long userId, Long vendorId) {
        return favoriteMapper.findByUserIdAndVendorId(userId, vendorId) != null;
    }
}