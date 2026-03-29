package com.streetmap.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 摊主实体类
 * 对应数据库表：vendor
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("vendor")
public class Vendor {

    /**
     * 摊位 ID（主键，自增）
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 关联用户 ID（外键，唯一）
     */
    private Long userId;

    /**
     * 摊名
     */
    @NotBlank(message = "摊名不能为空")
    @Size(max = 100, message = "摊名最多 100 字")
    private String stallName;

    /**
     * 摊位描述
     */
    private String description;

    /**
     * 热销产品
     */
    private String hotProducts;

    /**
     * 营业状态：0-收摊，1-开摊
     */
    private Integer status = 0;

    /**
     * 纬度
     */
    private BigDecimal latitude;

    /**
     * 经度
     */
    private BigDecimal longitude;

    /**
     * 详细地址
     */
    private String address;

    /**
     * 最后开摊时间
     */
    private LocalDateTime lastOpenTime;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}