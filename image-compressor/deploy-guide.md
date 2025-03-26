# 图片压缩工具阿里云部署指南

本指南将帮助你将图片压缩工具部署到阿里云服务器上，使其成为一个可通过互联网访问的网站。

## 前提条件

1. 一个阿里云账号
2. 购买的阿里云ECS服务器实例
3. 一个已注册的域名（可选，但推荐）

## 步骤一：准备阿里云ECS服务器

### 1. 购买ECS实例

1. 登录[阿里云控制台](https://home.console.aliyun.com/)
2. 在产品与服务中找到并点击「云服务器ECS」
3. 点击「创建实例」
4. 选择配置：
   - 地域：选择离目标用户较近的地域
   - 实例规格：推荐至少2核4GB内存
   - 镜像：推荐选择CentOS 7.x 或 Ubuntu 20.04
   - 存储：系统盘至少40GB
   - 带宽：按需选择，建议至少1Mbps
5. 完成订单并支付

### 2. 设置安全组

1. 在ECS控制台中，找到「网络与安全」>「安全组」
2. 为你的实例创建或修改安全组规则，开放以下端口：
   - 22端口 (SSH)
   - 80端口 (HTTP)
   - 443端口 (HTTPS)

## 步骤二：连接到服务器并配置环境

### 1. 通过SSH连接到服务器

```bash
ssh root@your_server_ip
```

### 2. 更新系统并安装必要软件

对于CentOS：

```bash
yum update -y
yum install -y nginx git
```

对于Ubuntu：

```bash
apt update
apt upgrade -y
apt install -y nginx git
```

### 3. 启动并设置Nginx自动启动

```bash
systemctl start nginx
systemctl enable nginx
```

## 步骤三：部署图片压缩工具

### 1. 创建网站目录

```bash
mkdir -p /var/www/image-compressor
```

### 2. 上传项目文件

方法一：使用Git（如果项目在Git仓库中）

```bash
cd /var/www/
git clone your_repository_url image-compressor
```

方法二：使用SCP从本地上传

在本地终端执行：

```bash
scp -r /path/to/local/image-compressor/* root@your_server_ip:/var/www/image-compressor/
```

### 3. 配置Nginx服务器

创建Nginx配置文件：

```bash
vi /etc/nginx/conf.d/image-compressor.conf
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your_domain.com;  # 如果有域名，填写你的域名；如果没有，可以使用服务器IP

    root /var/www/image-compressor;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # 添加缓存控制，提高性能
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 4. 检查Nginx配置并重启

```bash
nginx -t
systemctl restart nginx
```

## 步骤四：配置域名（可选但推荐）

### 1. 在阿里云购买域名

1. 访问[阿里云域名注册页面](https://wanwang.aliyun.com/domain/)
2. 搜索并购买你想要的域名

### 2. 配置DNS解析

1. 在阿里云控制台中，找到「域名」服务
2. 选择你的域名，点击「解析」
3. 添加记录：
   - 记录类型：A
   - 主机记录：@（或www，取决于你想用的子域名）
   - 记录值：你的服务器IP地址
   - TTL：10分钟（默认即可）

## 步骤五：配置HTTPS（可选但推荐）

### 1. 安装Certbot（用于获取Let's Encrypt免费SSL证书）

对于CentOS：

```bash
yum install -y epel-release
yum install -y certbot python3-certbot-nginx
```

对于Ubuntu：

```bash
apt install -y certbot python3-certbot-nginx
```

### 2. 获取并安装SSL证书

```bash
certbot --nginx -d your_domain.com -d www.your_domain.com
```

按照提示完成配置。Certbot会自动修改Nginx配置以支持HTTPS。

### 3. 设置自动续期

Let's Encrypt证书有效期为90天，需要定期续期。添加自动续期任务：

```bash
echo "0 0,12 * * * root python3 -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
```

## 步骤六：测试部署

1. 在浏览器中访问你的域名或服务器IP
2. 确认图片压缩工具能正常加载和使用
3. 测试上传、压缩和下载功能

## 故障排除

### 网站无法访问

1. 检查Nginx是否正在运行：`systemctl status nginx`
2. 检查安全组设置是否正确开放了80和443端口
3. 检查Nginx配置文件是否有语法错误：`nginx -t`
4. 查看Nginx错误日志：`cat /var/log/nginx/error.log`

### 图片上传或压缩功能不工作

1. 检查浏览器控制台是否有JavaScript错误
2. 确认Nginx配置中的文件权限设置正确
3. 检查服务器磁盘空间是否充足：`df -h`

## 维护建议

1. 定期更新服务器系统：`yum update -y` 或 `apt update && apt upgrade -y`
2. 监控服务器资源使用情况：`top`, `htop` 或使用阿里云监控服务
3. 定期备份网站文件
4. 设置日志轮转，防止日志文件过大

## 性能优化建议

1. 启用Nginx的Gzip压缩：

```nginx
gzip on;
gzip_comp_level 5;
gzip_min_length 256;
gzip_proxied any;
gzip_vary on;
gzip_types
  application/javascript
  application/json
  application/x-javascript
  text/css
  text/javascript
  text/plain
  text/xml;
```

2. 配置浏览器缓存（已在Nginx配置中添加）
3. 考虑使用CDN加速静态资源

## 结论

按照本指南完成部署后，你的图片压缩工具将作为一个网站在互联网上可用，用户可以通过你的域名或服务器IP地址访问并使用该工具。

如需进一步的帮助或有任何问题，请参考阿里云官方文档或联系阿里云客服。