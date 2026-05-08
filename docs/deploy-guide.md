# 后端打包部署流程

> 适用于：本地 IDEA 修改代码后，部署到阿里云 ECS（47.94.23.66）

---

## 第 1 步：IDEA 打包

1. 右侧 Maven 面板 → `Lifecycle` → **clean**
2. 再双击 **package**
3. 等待 `BUILD SUCCESS`

> 产出：`D:\study\Java\Data\street-map-backend\target\street-map-backend-0.0.1-SNAPSHOT.jar`

---

## 第 2 步：上传 JAR 到服务器

在 WSL 终端执行：

```bash
scp /mnt/d/study/Java/Data/street-map-backend/target/street-map-backend-0.0.1-SNAPSHOT.jar root@47.94.23.66:/opt/street-map/
```

---

## 第 3 步：SSH 到服务器

```bash
ssh root@47.94.23.66
```

---

## 第 4 步：替换并重启

在服务器上依次执行：

```bash
# 1. 找旧进程 PID
ps aux | grep street-map | grep -v grep

# 2. 杀掉旧进程（替换 PID）
kill <PID>

# 3. 确认已退出
sleep 2
ps aux | grep street-map | grep -v grep   # 应该无输出

# 4. 覆盖旧 JAR
cp /opt/street-map/street-map-backend-0.0.1-SNAPSHOT.jar /opt/street-map-backend.jar

# 5. 启动新服务
nohup /usr/bin/java -Xmx384m -Xms128m -jar /opt/street-map-backend.jar --spring.config.location=file:/opt/street-map/application-prod.yml > /opt/street-map-backend.log 2>&1 &

# 6. 等启动
sleep 8

# 7. 看日志确认成功
tail -30 /opt/street-map-backend.log

# 8. 验证接口
curl http://127.0.0.1:8081/api/vendor/open | head -20
```

---

## 第 5 步：退出

```bash
exit
```

---

## 服务器信息备忘

| 项目 | 值 |
|------|------|
| 公网 IP | 47.94.23.66 |
| JAR 路径 | `/opt/street-map-backend.jar` |
| 新 JAR 上传目录 | `/opt/street-map/` |
| 配置文件 | `/opt/street-map/application-prod.yml` |
| 日志 | `/opt/street-map-backend.log` |
| JVM 参数 | `-Xmx384m -Xms128m` |
| 端口 | 8081 |
