import pygame
import sys
import random
from PIL import Image
import os
import traceback

# 初始化Pygame
pygame.init()

# 游戏常量
WINDOW_SIZE = (800, 600)
PIECE_SIZE = 100  # 每个拼图块的大小
GRID_SIZE = 4  # 4x4的网格，共16块拼图
MARGIN = 50  # 边距
DEFAULT_IMAGE_SIZE = (400, 400)  # 默认图片大小
DEFAULT_IMAGE = None  # 将在初始化时创建

# 颜色定义
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (128, 128, 128)
BUTTON_COLOR = (50, 150, 50)  # 按钮颜色
BUTTON_HOVER_COLOR = (70, 170, 70)  # 鼠标悬停时的按钮颜色

# 创建游戏窗口
screen = pygame.display.set_mode(WINDOW_SIZE)
pygame.display.set_caption("拼图游戏")

# 设置默认字体 - 尝试使用系统中文字体
try:
    font_paths = [
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Light.ttc',
        '/System/Library/Fonts/Hiragino Sans GB.ttc'
    ]
    
    for font_path in font_paths:
        try:
            DEFAULT_FONT = pygame.font.Font(font_path, 36)
            LARGE_FONT = pygame.font.Font(font_path, 72)
            break
        except:
            continue
    else:
        # 如果所有中文字体都失败，使用系统默认字体
        DEFAULT_FONT = pygame.font.SysFont('microsoft yahei', 36)
        LARGE_FONT = pygame.font.SysFont('microsoft yahei', 72)
except:
    # 最后的后备方案
    DEFAULT_FONT = pygame.font.Font(None, 36)
    LARGE_FONT = pygame.font.Font(None, 72)

# 在pygame初始化后添加默认图片
def create_default_image():
    # 创建一个简单的默认图片
    surface = pygame.Surface(DEFAULT_IMAGE_SIZE)
    surface.fill(WHITE)
    
    # 绘制一些简单的图形
    colors = [(255,0,0), (0,255,0), (0,0,255), (255,255,0)]
    rects = [
        (0, 0, 200, 200),
        (200, 0, 200, 200),
        (0, 200, 200, 200),
        (200, 200, 200, 200)
    ]
    
    for color, rect in zip(colors, rects):
        pygame.draw.rect(surface, color, rect)
        # 在每个矩形中添加一些圆形
        pygame.draw.circle(surface, WHITE, 
                         (rect[0] + 100, rect[1] + 100), 50)
    
    return pygame.transform.scale(surface, (PIECE_SIZE * GRID_SIZE, PIECE_SIZE * GRID_SIZE))

# 在pygame.init()后添加
from cat_image import cat_image_base64
import base64
import io

# 加载猫咪图片
def load_cat_image():
    try:
        # 解码base64图片数据
        image_data = base64.b64decode(cat_image_base64)
        # 使用PIL打开图片
        pil_image = Image.open(io.BytesIO(image_data))
        # 调整大小
        pil_image = pil_image.resize((PIECE_SIZE * GRID_SIZE, PIECE_SIZE * GRID_SIZE))
        # 转换为Pygame surface
        image_str = pil_image.tobytes()
        pygame_image = pygame.image.fromstring(image_str, pil_image.size, 'RGB')
        return pygame_image
    except Exception as e:
        print(f"加载猫咪图片失败: {str(e)}")
        return create_default_image()

DEFAULT_IMAGE = load_cat_image()

# 添加拼图边缘类型定义
PUZZLE_EDGE_SIZE = 20  # 拼图边缘的大小

class PuzzlePiece:
    def __init__(self, image, x, y, correct_x, correct_y):
        # 创建带边缘的surface
        self.image = pygame.Surface((PIECE_SIZE + PUZZLE_EDGE_SIZE * 2, PIECE_SIZE + PUZZLE_EDGE_SIZE * 2), pygame.SRCALPHA)
        self.image.fill((0, 0, 0, 0))  # 透明背景
        
        # 绘制拼图边缘
        edge_color = (100, 100, 100)
        pygame.draw.rect(self.image, edge_color, (PUZZLE_EDGE_SIZE, PUZZLE_EDGE_SIZE, PIECE_SIZE, PIECE_SIZE))
        
        # 添加凸起和凹陷
        pygame.draw.circle(self.image, edge_color, (PUZZLE_EDGE_SIZE + PIECE_SIZE//2, PUZZLE_EDGE_SIZE//2), PUZZLE_EDGE_SIZE//2)  # 上凸
        pygame.draw.circle(self.image, edge_color, (PUZZLE_EDGE_SIZE + PIECE_SIZE//2, PUZZLE_EDGE_SIZE * 3//2 + PIECE_SIZE), PUZZLE_EDGE_SIZE//2)  # 下凹
        pygame.draw.circle(self.image, edge_color, (PUZZLE_EDGE_SIZE//2, PUZZLE_EDGE_SIZE + PIECE_SIZE//2), PUZZLE_EDGE_SIZE//2)  # 左凸
        pygame.draw.circle(self.image, edge_color, (PUZZLE_EDGE_SIZE * 3//2 + PIECE_SIZE, PUZZLE_EDGE_SIZE + PIECE_SIZE//2), PUZZLE_EDGE_SIZE//2)  # 右凹
        
        # 将原始图片绘制到中心位置
        self.image.blit(image, (PUZZLE_EDGE_SIZE, PUZZLE_EDGE_SIZE))
        
        self.rect = self.image.get_rect()
        self.rect.x = x - PUZZLE_EDGE_SIZE
        self.rect.y = y - PUZZLE_EDGE_SIZE
        self.correct_x = correct_x - PUZZLE_EDGE_SIZE
        self.correct_y = correct_y - PUZZLE_EDGE_SIZE
        self.angle = 0
        self.dragging = False

    def rotate(self):
        self.angle = (self.angle + 90) % 360
        self.image = pygame.transform.rotate(self.image, 90)

    def is_in_correct_position(self):
        return (abs(self.rect.x - self.correct_x) < 10 and 
                abs(self.rect.y - self.correct_y) < 10 and 
                self.angle % 360 == 0)

class PuzzleGame:
    def __init__(self):
        self.pieces = []
        self.selected_piece = None
        self.game_started = False
        self.preview_image = DEFAULT_IMAGE
        # 添加按钮相关属性
        self.submit_button = pygame.Rect(0, 0, 120, 40)  # 按钮大小
        self.submit_button.bottomright = (WINDOW_SIZE[0] - 20, WINDOW_SIZE[1] - 20)  # 按钮位置
        self.button_hover = False
        self.show_result = False
        self.result_time = 0
        # 添加退出按钮
        self.exit_button = pygame.Rect(0, 0, 120, 40)  # 按钮大小
        self.exit_button.topright = (WINDOW_SIZE[0] - 20, 20)  # 按钮位置在右上角
        self.exit_button_hover = False

    def load_image(self):
        try:
            # 使用pygame内部的文本输入方式替代终端输入
            import os
            
            # 默认图片目录
            default_dir = os.path.expanduser("~")
            
            # 保存当前屏幕状态
            old_screen = screen.copy()
            
            # 显示文件选择提示
            screen.fill(WHITE)
            text = DEFAULT_FONT.render("请输入图片路径", True, BLACK)
            text_rect = text.get_rect(center=(WINDOW_SIZE[0]//2, WINDOW_SIZE[1]//2 - 100))
            screen.blit(text, text_rect)
            
            # 显示默认目录提示
            dir_text = DEFAULT_FONT.render(f"默认目录: {default_dir}", True, BLACK)
            dir_rect = dir_text.get_rect(center=(WINDOW_SIZE[0]//2, WINDOW_SIZE[1]//2 - 50))
            screen.blit(dir_text, dir_rect)
            
            # 创建输入框
            input_box = pygame.Rect(WINDOW_SIZE[0]//4, WINDOW_SIZE[1]//2, WINDOW_SIZE[0]//2, 40)
            color_inactive = pygame.Color('lightskyblue3')
            color_active = pygame.Color('dodgerblue2')
            color = color_active  # 默认激活状态
            active = True
            text_input = ''
            done = False
            
            # 显示确认按钮
            confirm_button = pygame.Rect(WINDOW_SIZE[0]//2 - 60, WINDOW_SIZE[1]//2 + 60, 120, 40)
            
            # 输入循环
            while not done:
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        # 恢复屏幕并退出
                        screen.blit(old_screen, (0, 0))
                        pygame.display.flip()
                        return None
                    
                    if event.type == pygame.MOUSEBUTTONDOWN:
                        # 检查是否点击了确认按钮
                        if confirm_button.collidepoint(event.pos):
                            done = True
                    
                    if event.type == pygame.KEYDOWN:
                        if active:
                            if event.key == pygame.K_RETURN:
                                done = True
                            elif event.key == pygame.K_BACKSPACE:
                                text_input = text_input[:-1]
                            elif event.key == pygame.K_ESCAPE:
                                # 取消并返回
                                screen.blit(old_screen, (0, 0))
                                pygame.display.flip()
                                return None
                            else:
                                # 确保正确处理Unicode字符
                                text_input += event.unicode
                
                # 重新绘制屏幕
                screen.fill(WHITE)
                screen.blit(text, text_rect)
                screen.blit(dir_text, dir_rect)
                
                # 绘制输入框
                pygame.draw.rect(screen, color, input_box, 2)
                # 确保文本能正确显示中文
                try:
                    text_surface = DEFAULT_FONT.render(text_input, True, BLACK)
                    width = max(WINDOW_SIZE[0]//2, text_surface.get_width()+10)
                    input_box.w = width
                    screen.blit(text_surface, (input_box.x+5, input_box.y+5))
                except Exception as e:
                    print(f"渲染文本时出错: {str(e)}")
                
                # 绘制确认按钮
                pygame.draw.rect(screen, BUTTON_COLOR, confirm_button)
                confirm_text = DEFAULT_FONT.render("确认", True, WHITE)
                confirm_rect = confirm_text.get_rect(center=confirm_button.center)
                screen.blit(confirm_text, confirm_rect)
                
                pygame.display.flip()
            
            # 处理输入的文件路径
            file_path = text_input.strip()
            
            # 如果输入为空，使用默认图片
            if not file_path:
                print("未选择图片")
                # 恢复屏幕
                screen.blit(old_screen, (0, 0))
                pygame.display.flip()
                return None
            
            # 检查文件是否存在
            if not os.path.isfile(file_path):
                # 显示错误信息
                error_text = DEFAULT_FONT.render(f"文件不存在: {file_path}", True, (255, 0, 0))
                error_rect = error_text.get_rect(center=(WINDOW_SIZE[0]//2, WINDOW_SIZE[1]//2 + 100))
                screen.blit(error_text, error_rect)
                pygame.display.flip()
                pygame.time.wait(2000)  # 显示2秒错误信息
                
                # 恢复屏幕
                screen.blit(old_screen, (0, 0))
                pygame.display.flip()
                return None
            
            print(f"选择的图片: {file_path}")
            
            try:
                # 使用PIL打开并处理图片
                pil_image = Image.open(file_path)
                # 转换为RGB模式
                if pil_image.mode != 'RGB':
                    pil_image = pil_image.convert('RGB')
                # 调整大小
                pil_image = pil_image.resize((PIECE_SIZE * GRID_SIZE, PIECE_SIZE * GRID_SIZE))
                
                # 转换为Pygame surface
                image_str = pil_image.tobytes()
                pygame_image = pygame.image.fromstring(image_str, pil_image.size, 'RGB')
                
                print(f"图片加载成功，尺寸: {pygame_image.get_width()}x{pygame_image.get_height()}")
                
                # 恢复屏幕
                screen.blit(old_screen, (0, 0))
                pygame.display.flip()
                
                return pygame_image
                
            except Exception as e:
                print(f"图片处理失败: {str(e)}")
                traceback.print_exc()  # 打印详细错误信息
                
                # 显示错误信息
                error_text = DEFAULT_FONT.render(f"图片处理失败: {str(e)}", True, (255, 0, 0))
                error_rect = error_text.get_rect(center=(WINDOW_SIZE[0]//2, WINDOW_SIZE[1]//2 + 100))
                screen.blit(error_text, error_rect)
                pygame.display.flip()
                pygame.time.wait(2000)  # 显示2秒错误信息
                
                # 恢复屏幕
                screen.blit(old_screen, (0, 0))
                pygame.display.flip()
                return None
            
        except Exception as e:
            print(f"选择图片时出错: {str(e)}")
            traceback.print_exc()  # 打印详细错误信息
            return None
        finally:
            # 不需要销毁tkinter窗口，因为我们使用的是pygame的输入方式
            pass

    def create_pieces(self, image):
        if image is None:
            print("没有加载到有效的图片")
            return False

        try:
            print("开始创建拼图块...")
            self.pieces = []
            
            for i in range(GRID_SIZE):
                for j in range(GRID_SIZE):
                    # 创建新的surface
                    piece_surface = pygame.Surface((PIECE_SIZE, PIECE_SIZE))
                    piece_surface.fill(WHITE)
                    
                    # 计算裁剪区域
                    clip_rect = pygame.Rect(j * PIECE_SIZE, i * PIECE_SIZE, 
                                          PIECE_SIZE, PIECE_SIZE)
                    
                    # 复制对应区域的图片
                    piece_surface.blit(image, (0, 0), clip_rect)
                    
                    # 计算位置
                    correct_x = MARGIN + j * PIECE_SIZE
                    correct_y = MARGIN + i * PIECE_SIZE
                    
                    # 随机位置 - 考虑拼图边缘的大小
                    random_x = random.randint(MARGIN, WINDOW_SIZE[0] - PIECE_SIZE - MARGIN - PUZZLE_EDGE_SIZE * 2)
                    random_y = random.randint(MARGIN, WINDOW_SIZE[1] - PIECE_SIZE - MARGIN - PUZZLE_EDGE_SIZE * 2)
                    
                    # 创建拼图块
                    piece = PuzzlePiece(piece_surface, random_x, random_y, 
                                      correct_x, correct_y)
                    self.pieces.append(piece)
            
            if len(self.pieces) == GRID_SIZE * GRID_SIZE:
                self.game_started = True
                print("游戏初始化成功！")
                return True
            else:
                print(f"未能创建所有拼图块，只创建了 {len(self.pieces)} 块")
                return False
                
        except Exception as e:
            print(f"创建拼图块时出错: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def handle_events(self):
        try:
            mouse_pos = pygame.mouse.get_pos()
            self.button_hover = self.submit_button.collidepoint(mouse_pos)
            self.exit_button_hover = self.exit_button.collidepoint(mouse_pos)

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    return False
                
                # 检查退出按钮点击
                if event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1 and self.exit_button_hover:  # 左键点击退出按钮
                        pygame.quit()
                        sys.exit()

                if not self.game_started:
                    if event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_SPACE:
                            # 使用当前预览图片开始游戏
                            success = self.create_pieces(self.preview_image)
                            if success:
                                print("游戏初始化成功！")
                                self.game_started = True
                            else:
                                print("游戏初始化失败！")
                        elif event.key == pygame.K_l:
                            # 加载新图片
                            print("加载新图片...")
                            try:
                                image = self.load_image()
                                if image:
                                    self.preview_image = image  # 更新预览图片
                                    print("图片加载成功！")
                            except Exception as e:
                                print(f"加载图片过程出错: {str(e)}")
                                import traceback
                                traceback.print_exc()
                else:
                    if event.type == pygame.MOUSEBUTTONDOWN:
                        if event.button == 1:  # 左键点击
                            # 检查是否点击了提交按钮
                            if self.button_hover:
                                self.show_result = True
                                self.result_time = pygame.time.get_ticks()
                                return True

                            # 原有的拼图块选择代码
                            for piece in self.pieces:
                                if piece.rect.collidepoint(event.pos):
                                    self.selected_piece = piece
                                    piece.dragging = True
                                    self.pieces.remove(piece)
                                    self.pieces.append(piece)
                                    break
                        elif event.button == 3:  # 右键点击
                            for piece in self.pieces:
                                if piece.rect.collidepoint(event.pos):
                                    piece.rotate()
                                    break  # 找到一个就退出循环
                    
                    elif event.type == pygame.MOUSEBUTTONUP:
                        if event.button == 1 and self.selected_piece:
                            self.selected_piece.dragging = False
                            self.selected_piece = None
                    
                    elif event.type == pygame.MOUSEMOTION:
                        if self.selected_piece and self.selected_piece.dragging:
                            self.selected_piece.rect.x = event.pos[0] - PIECE_SIZE // 2
                            self.selected_piece.rect.y = event.pos[1] - PIECE_SIZE // 2
            
            return True
        except Exception as e:
            print(f"事件处理出错: {str(e)}")
            import traceback
            traceback.print_exc()
            return True  # 返回True以继续游戏

    def check_win(self):
        if not self.game_started:
            return False
        return all(piece.is_in_correct_position() for piece in self.pieces)

    def draw(self):
        screen.fill(WHITE)
        
        # 绘制退出按钮（在所有情况下都显示）
        button_color = BUTTON_HOVER_COLOR if self.exit_button_hover else BUTTON_COLOR
        pygame.draw.rect(screen, button_color, self.exit_button)
        pygame.draw.rect(screen, BLACK, self.exit_button, 2)  # 按钮边框
        exit_text = DEFAULT_FONT.render("退出", True, WHITE)
        exit_text_rect = exit_text.get_rect(center=self.exit_button.center)
        screen.blit(exit_text, exit_text_rect)
        
        if not self.game_started:
            # 绘制预览图片
            preview_rect = self.preview_image.get_rect()
            preview_rect.center = (WINDOW_SIZE[0]//2, WINDOW_SIZE[1]//2 - 50)  # 稍微向上移动
            screen.blit(self.preview_image, preview_rect)
            
            # 绘制提示文本
            text = DEFAULT_FONT.render("Press SPACE to start with this image", True, BLACK)
            text_rect = text.get_rect(center=(WINDOW_SIZE[0]//2, WINDOW_SIZE[1]//2 + 150))  # 在图片下方
            screen.blit(text, text_rect)
            
            # 添加额外提示
            text2 = DEFAULT_FONT.render("or press L to load your own image", True, BLACK)
            text_rect2 = text.get_rect(center=(WINDOW_SIZE[0]//2, WINDOW_SIZE[1]//2 + 200))
            screen.blit(text2, text_rect2)
        else:
            # 绘制网格
            for i in range(GRID_SIZE + 1):
                pygame.draw.line(screen, GRAY, 
                               (MARGIN + i * PIECE_SIZE, MARGIN),
                               (MARGIN + i * PIECE_SIZE, MARGIN + GRID_SIZE * PIECE_SIZE))
                pygame.draw.line(screen, GRAY,
                               (MARGIN, MARGIN + i * PIECE_SIZE),
                               (MARGIN + GRID_SIZE * PIECE_SIZE, MARGIN + i * PIECE_SIZE))
            
            # 绘制所有拼图块
            for piece in self.pieces:
                screen.blit(piece.image, piece.rect)
            
            # 绘制提交按钮
            button_color = BUTTON_HOVER_COLOR if self.button_hover else BUTTON_COLOR
            pygame.draw.rect(screen, button_color, self.submit_button)
            pygame.draw.rect(screen, BLACK, self.submit_button, 2)  # 按钮边框
            
            # 绘制按钮文字
            button_text = DEFAULT_FONT.render("Submit", True, WHITE)
            text_rect = button_text.get_rect(center=self.submit_button.center)
            screen.blit(button_text, text_rect)
            
            # 显示验证结果
            if self.show_result:
                current_time = pygame.time.get_ticks()
                if current_time - self.result_time < 2000:  # 显示2秒
                    if self.check_win():
                        result_text = LARGE_FONT.render("Correct!", True, (0, 255, 0))
                    else:
                        result_text = LARGE_FONT.render("Try Again!", True, (255, 0, 0))
                    result_rect = result_text.get_rect(center=(WINDOW_SIZE[0]//2, WINDOW_SIZE[1]//2))
                    screen.blit(result_text, result_rect)
                else:
                    self.show_result = False
        
        pygame.display.flip()

def main():
    try:
        pygame.init()
        game = PuzzleGame()
        clock = pygame.time.Clock()
        
        running = True
        while running:
            try:
                # 处理事件
                running = game.handle_events()
                
                # 绘制游戏
                try:
                    game.draw()
                except Exception as e:
                    print(f"绘制游戏出错: {str(e)}")
                    import traceback
                    traceback.print_exc()
                
                # 控制帧率
                try:
                    clock.tick(60)
                except Exception as e:
                    print(f"帧率控制出错: {str(e)}")
                
            except Exception as e:
                print(f"游戏主循环出错: {str(e)}")
                import traceback
                traceback.print_exc()
                # 不立即退出，给出错误提示
                text = DEFAULT_FONT.render("Error occurred! Check console for details.", True, (255, 0, 0))
                text_rect = text.get_rect(center=(WINDOW_SIZE[0]//2, WINDOW_SIZE[1]//2))
                screen.blit(text, text_rect)
                pygame.display.flip()
                pygame.time.wait(2000)  # 等待2秒
                running = False
        
        pygame.quit()
    except Exception as e:
        print(f"主函数出错: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        try:
            pygame.quit()
        except:
            pass
        input("按回车键退出...")  # 让窗口不会立即关闭

if __name__ == "__main__":
    main()
