# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
这是**地摊地图系统**的后端服务，为微信小程序提供API支持。用户可以查看附近摊位、收藏摊位、评价摊位；摊主可以管理摊位信息、更新营业状态、发布商品。

## 技术栈
- 框架：Spring Boot 3.5.13
- Java版本：21
- 构建工具：Maven
- ORM框架：MyBatis-Plus 3.5.5
- 安全框架：Spring Security + JWT
- 数据库：MySQL 8.0+
- 工具库：Hutool 5.8.23

## 常用命令
```bash
# 项目构建
mvn clean install

# 启动项目
mvn spring-boot:run

# 运行测试
mvn test

# 运行单个测试类
mvn test -Dtest=StreetMapBackendApplicationTests

# 打包
mvn package
```

## 代码架构
采用标准的Spring Boot三层架构：
```
com.streetmap.backend/
├── common/          # 公共组件（返回结果封装、异常处理等）
├── config/          # 配置类（Security配置、Web配置等）
├── controller/      # 控制器层（API接口定义）
├── dto/             # 数据传输对象（请求/响应封装）
├── entity/          # 实体类（与数据库表对应）
├── filter/          # 过滤器（JWT认证过滤器）
├── mapper/          # 数据访问层（MyBatis-Plus Mapper接口）
├── service/         # 业务逻辑层
│   └── impl/        # 业务实现类
└── util/            # 工具类（JWT工具、微信工具等）
```

### 核心模块
1. **用户模块**：微信登录、用户信息管理
2. **摊主模块**：摊位申请、信息管理、营业状态更新、位置上报
3. **商品模块**：商品增删改查、上下架管理
4. **收藏模块**：用户收藏/取消收藏摊位、收藏列表查询
5. **评价模块**：用户评分评价、评价列表查询
6. **地图模块**：附近摊位查询、摊位位置检索

## 重要配置说明
### 配置文件
- 实际配置文件：`src/main/resources/application.yml`
- 模板文件：`src/main/resources/application.yml.template`（供参考）
- 敏感配置（JWT密钥、微信密钥）建议通过环境变量传入

### 核心配置项
```yaml
server.port: 8081                          # 服务端口
spring.datasource:                         # MySQL数据库配置
jwt.secret: ${JWT_SECRET}                  # JWT签名密钥（环境变量）
jwt.expiration: 86400000                   # JWT过期时间（24小时）
wechat.appid: wx6fb55954dff3e5e7           # 微信小程序AppID
wechat.secret: ${WECHAT_APP_SECRET}        # 微信小程序密钥（环境变量）
```

### 文件上传
- 最大文件大小：5MB
- 存储路径：`uploads/images/`（相对于项目根目录）
- 上传接口：`POST /api/upload/image`

### 数据库
- 数据库名：`street_map`
- 初始化脚本：`docs/database.sql`
- 完整数据导出：`docs/database_full.sql`
- 测试数据：`vendor_test_data.sql`
- 核心表：user(用户)、vendor(摊主)、product(商品)、favorite(收藏)、review(评价)
- MyBatis-Plus已配置逻辑删除（字段`deleted`，1表示删除，0表示正常）
- 所有表均配置了`create_time`和`update_time`自动填充

## API接口规范
- 所有接口统一前缀：`/api/`
- 返回结果统一封装为`Result`类，成功返回`Result.success(data)`，失败返回`Result.error(message)`
- 需要认证的接口需在请求头携带`Authorization: Bearer <token>`

### 接口分组
| 前缀 | 模块 | 说明 |
|------|------|------|
| `/api/auth/*` | 认证模块 | 微信登录等 |
| `/api/user/*` | 用户模块 | 用户信息管理 |
| `/api/vendor/*` | 摊主模块 | 摊位申请、管理、附近查询 |
| `/api/product/*` | 商品模块 | 商品增删改查、上下架 |
| `/api/review/*` | 评价模块 | 发表评价、查询评价列表 |
| `/api/favorite/*` | 收藏模块 | 收藏/取消收藏、收藏列表 |
| `/api/upload/*` | 上传模块 | 图片上传 |

## 开发注意事项
1. **用户与摊主关系**：普通用户和摊主是一对一关系（通过`vendor.user_id`关联），用户可通过申请成为摊主
2. **坐标体系**：位置信息使用WGS84坐标（纬度latitude/经度longitude）
3. **微信登录**：小程序端调用`wx.login`获取code，后端调用微信接口换取openid，与本地用户关联
4. **摊位营业状态**：`vendor.status`字段控制营业中/已收摊，开摊时需上报经纬度位置
5. **商品状态**：`product.status`字段控制上架/下架

## 部署信息
- 部署服务器：阿里云 ECS（47.94.23.66）
- JAR路径：`/opt/street-map-backend.jar`
- 生产配置：`/opt/street-map/application-prod.yml`
- JVM参数：`-Xmx384m -Xms128m`
- 日志文件：`/opt/street-map-backend.log`
- 启动脚本：`start-backend.bat`（本地Windows开发）
