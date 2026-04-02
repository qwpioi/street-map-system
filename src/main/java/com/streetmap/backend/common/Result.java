package com.streetmap.backend.common;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 统一返回结果类
 */
@Data
@NoArgsConstructor
// 注意：暂时移除@AllArgsConstructor，手动实现全参构造
public class Result<T> {

    /**
     * 状态码：200 成功，其他失败
     */
    private Integer code;

    /**
     * 消息
     */
    private String message;

    /**
     * 数据
     */
    private T data;

    // 手动实现全参构造函数
    public Result(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 成功返回
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    /**
     * 成功返回（无数据）
     */
    public static Result<Void> success() {
        return new Result<>(200, "success", null);
    }

    /**
     * 失败返回
     */
    public static Result<Void> error(String message) {
        return new Result<>(500, message, null);
    }

    /**
     * 失败返回（带状态码）
     */
    public static Result<Void> error(Integer code, String message) {
        return new Result<>(code, message, null);
    }
}