import os
import requests
import time
from bs4 import BeautifulSoup
import re
import urllib.parse

# 创建图片目录（如果不存在）
image_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images')
os.makedirs(image_dir, exist_ok=True)

# 设置请求头，模拟浏览器访问
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

# 要抓取的图片类型
image_types = {
    'recommendations': ['ai-drawing.svg', 'ai-writing.svg', 'ai-analysis.svg', 'ai-voice.svg'],
    'tools': ['deepseek.svg', 'baidu.svg', 'xunfei.svg', 'midjourney.svg', 'claude.svg', 'stable-diffusion.svg', 'chatgpt.svg', 'dalle.svg'],
    'categories': ['category-drawing.svg', 'category-text.svg', 'category-voice.svg', 'category-video.svg', 'category-code.svg', 'category-data.svg']
}

# 已下载的图片映射
downloaded_images = {}

def download_image(url, filename):
    """下载图片并保存到指定路径"""
    try:
        # 确保URL是完整的
        if not url.startswith('http'):
            if url.startswith('//'):
                url = 'https:' + url
            elif url.startswith('/'):
                url = 'https://aigc.cn' + url
            else:
                url = 'https://aigc.cn/' + url
                
        # 发送请求获取图片内容
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            # 保存图片
            save_path = os.path.join(image_dir, filename)
            with open(save_path, 'wb') as f:
                f.write(response.content)
            print(f"成功下载图片: {filename}")
            return True
        else:
            print(f"下载图片失败: {url}, 状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"下载图片出错: {url}, 错误: {str(e)}")
        return False

def scrape_aigc_website():
    """抓取aigc.cn网站上的图片"""
    try:
        # 访问aigc.cn网站
        response = requests.get('https://aigc.cn', headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"访问网站失败，状态码: {response.status_code}")
            return
            
        # 解析HTML内容
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 查找所有图片元素
        img_tags = soup.find_all('img')
        svg_tags = soup.select('svg')
        
        # 处理所有图片标签
        for img in img_tags:
            src = img.get('src')
            if not src:
                continue
                
            # 提取文件名
            filename = os.path.basename(urllib.parse.urlparse(src).path)
            
            # 检查是否是我们需要的图片类型
            for category, filenames in image_types.items():
                for target_filename in filenames:
                    # 如果文件名包含目标关键词或者看起来像是图标
                    if (target_filename.lower() in filename.lower() or 
                        any(keyword in filename.lower() for keyword in ['icon', 'logo', 'ai', 'tool'])):
                        # 下载并保存图片
                        if download_image(src, target_filename):
                            downloaded_images[target_filename] = filename
                        # 避免请求过快
                        time.sleep(0.5)
                        break
        
        # 如果没有找到足够的图片，尝试查找其他可能的图片
        for category, filenames in image_types.items():
            for target_filename in filenames:
                if target_filename not in downloaded_images:
                    # 查找可能的替代图片
                    keyword = target_filename.split('.')[0].replace('-', ' ')
                    for img in img_tags:
                        alt = img.get('alt', '')
                        if keyword.lower() in alt.lower() or category.lower() in alt.lower():
                            src = img.get('src')
                            if src and download_image(src, target_filename):
                                downloaded_images[target_filename] = alt
                            time.sleep(0.5)
                            break
        
        print(f"图片下载完成，共下载 {len(downloaded_images)} 张图片")
        return downloaded_images
    
    except Exception as e:
        print(f"抓取网站出错: {str(e)}")
        return {}

# 执行抓取
if __name__ == "__main__":
    print("开始抓取aigc.cn网站图片...")
    scrape_aigc_website()
    print("抓取完成！")