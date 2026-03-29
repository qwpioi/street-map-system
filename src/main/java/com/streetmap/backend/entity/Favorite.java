package com.streetmap.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 收藏实体类
 * 对应数据库表：favorite
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("favorite")
public class Favorite {

    /**
     * 收藏 ID（主键，自增）
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户 ID
     */
    private Long userId;

    /**
     * 摊位 ID
     */
    private Long vendorId;

    /**
     * 收藏时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}