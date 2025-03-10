import base64
import io
from PIL import Image
import pygame

# 使用简单的函数生成图片数据而不是base64
def generate_cat_image():
    # 创建一个简单的彩色图片
    img = Image.new('RGB', (400, 400), color=(255, 255, 255))
    
    # 绘制一些简单的形状来模拟猫的图像
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    
    # 画猫的头部 - 圆形
    draw.ellipse((100, 50, 300, 250), fill=(200, 180, 150))
    
    # 画猫的耳朵 - 三角形
    draw.polygon([(100, 100), (50, 20), (150, 50)], fill=(200, 180, 150))
    draw.polygon([(300, 100), (350, 20), (250, 50)], fill=(200, 180, 150))
    
    # 画猫的眼睛 - 椭圆
    draw.ellipse((150, 100, 180, 130), fill=(0, 200, 0))
    draw.ellipse((220, 100, 250, 130), fill=(0, 200, 0))
    
    # 画猫的鼻子 - 小三角形
    draw.polygon([(190, 150), (210, 150), (200, 170)], fill=(255, 100, 100))
    
    # 画猫的嘴 - 曲线
    draw.arc((170, 150, 230, 190), 0, 180, fill=(100, 100, 100), width=2)
    
    # 画猫的胡须 - 线条
    for i in range(3):
        # 左边胡须
        draw.line((170, 160 + i*10, 100, 150 + i*15), fill=(0, 0, 0), width=2)
        # 右边胡须
        draw.line((230, 160 + i*10, 300, 150 + i*15), fill=(0, 0, 0), width=2)
    
    # 画猫的身体 - 椭圆
    draw.ellipse((150, 230, 250, 350), fill=(200, 180, 150))
    
    # 返回图片对象
    return img

# 生成猫咪图片的函数，替代base64编码
def get_cat_image():
    try:
        # 生成图片
        pil_image = generate_cat_image()
        # 转换为Pygame surface
        image_str = pil_image.tobytes()
        pygame_image = pygame.image.fromstring(image_str, pil_image.size, 'RGB')
        return pygame_image
    except Exception as e:
        print(f"生成猫咪图片失败: {str(e)}")
        return None