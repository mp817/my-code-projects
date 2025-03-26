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
        
        # 使用浅灰色作为拼图底色
        bg_color = (245, 245, 245)  # 更浅的灰色
        edge_color = (200, 200, 200)  # 更浅的灰色边缘
        pygame.draw.rect(self.image, bg_color, (PUZZLE_EDGE_SIZE, PUZZLE_EDGE_SIZE, PIECE_SIZE, PIECE_SIZE))
        
        # 添加更小的凸起和凹陷
        circle_size = PUZZLE_EDGE_SIZE // 10  # 大幅减小圆点大小
        pygame.draw.circle(self.image, edge_color, (PUZZLE_EDGE_SIZE + PIECE_SIZE//2, PUZZLE_EDGE_SIZE//2), circle_size)  # 上凸
        pygame.draw.circle(self.image, edge_color, (PUZZLE_EDGE_SIZE + PIECE_SIZE//2, PUZZLE_EDGE_SIZE * 3//2 + PIECE_SIZE), circle_size)  # 下凹
        pygame.draw.circle(self.image, edge_color, (PUZZLE_EDGE_SIZE//2, PUZZLE_EDGE_SIZE + PIECE_SIZE//2), circle_size)  # 左凸
        pygame.draw.circle(self.image, edge_color, (PUZZLE_EDGE_SIZE * 3//2 + PIECE_SIZE, PUZZLE_EDGE_SIZE + PIECE_SIZE//2), circle_size)  # 右凹
        
        # 将原始图片绘制到中心位置
        self.image.blit(image, (PUZZLE_EDGE_SIZE, PUZZLE_EDGE_SIZE))
        
        self.rect = self.image.get_rect()
        self.rect.x = x - PUZZLE_EDGE_SIZE
        self.rect.y = y - PUZZLE_EDGE_SIZE
        self.correct_x = correct_x - PUZZLE_EDGE_SIZE
        self.correct_y = correct_y - PUZZLE_EDGE_SIZE
        self.angle = 0
        self.dragging = False
        self.connected = False  # 标记是否已与其他拼图块正确连接
        self.connected_pieces = []  # 存储已连接的拼图块

    def rotate(self):
        if not self.connected:  # 如果已连接，则不允许旋转
            self.angle = (self.angle + 90) % 360
            self.image = pygame.transform.rotate(self.image, 90)

    def is_in_correct_position(self):
        return (abs(self.rect.x - self.correct_x) < 10 and 
                abs(self.rect.y - self.correct_y) < 10 and 
                self.angle % 360 == 0)

    def connect_with(self, other_piece):
        if not self.connected:
            self.connected = True
            self.connected_pieces.append(other_piece)
            # 将拼图块变为绿色以标识正确连接
            surface = self.image.copy()
            overlay = pygame.Surface(surface.get_size(), pygame.SRCALPHA)
            overlay.fill((0, 255, 0, 64))  # 半透明的绿色
            surface.blit(overlay, (0, 0))
            self.image = surface
            # 同步移动所有连接的拼图块
            for piece in self.connected_pieces:
                piece.rect.x = self.rect.x + (piece.correct_x - self.correct_x)
                piece.rect.y = self.rect.y + (piece.correct_y - self.correct_y)

class PuzzleGame:
    def __init__(self):
        self.pieces = []
        self.selected_piece = None
        self.game_started = False
        self.preview_image = DEFAULT_IMAGE
        self.submit_button = pygame.Rect(0, 0, 120, 40)
        self.submit_button.bottomright = (WINDOW_SIZE[0] - 20, WINDOW_SIZE[1] - 20)
        self.button_hover = False
        self.show_result = False
        self.result_time = 0
        self.exit_button = pygame.Rect(0, 0, 120, 40)
        self.exit_button.topright = (WINDOW_SIZE[0] - 20, 20)
        self.exit_button_hover = False

    def check_adjacent_pieces(self):
        # 检查所有拼图块的相邻位置
        for piece in self.pieces:
            if piece.is_in_correct_position() and not piece.connected:
                # 获取当前拼图块的网格位置
                grid_x = (piece.correct_x + PUZZLE_EDGE_SIZE - MARGIN) // PIECE_SIZE
                grid_y = (piece.correct_y + PUZZLE_EDGE_SIZE - MARGIN) // PIECE_SIZE
                
                # 检查四个方向的相邻拼图块
                for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
                    adj_x = grid_x + dx
                    adj_y = grid_y + dy
                    
                    if 0 <= adj_x < GRID_SIZE and 0 <= adj_y < GRID_SIZE:
                        # 查找相邻位置的拼图块
                        for other_piece in self.pieces:
                            if other_piece.is_in_correct_position() and not other_piece.connected:
                                other_grid_x = (other_piece.correct_x + PUZZLE_EDGE_SIZE - MARGIN) // PIECE_SIZE
                                other_grid_y = (other_piece.correct_y + PUZZLE_EDGE_SIZE - MARGIN) // PIECE_SIZE
                                
                                if other_grid_x == adj_x and other_grid_y == adj_y:
                                    # 连接两个拼图块
                                    piece.connect_with(other_piece)
                                    other_piece.connect_with(piece)
                                    
                                    # 传递连接状态 - 将other_piece的连接块也添加到piece的连接列表中
                                    for connected_piece in other_piece.connected_pieces:
                                        if connected_piece != piece and connected_piece not in piece.connected_pieces:
                                            piece.connected_pieces.append(connected_piece)
                                            connected_piece.connected_pieces.append(piece)
                                    
                                    # 将piece的连接块也添加到other_piece的连接列表中
                                    for connected_piece in piece.connected_pieces:
                                        if connected_piece != other_piece and connected_piece not in other_piece.connected_pieces:
                                            other_piece.connected_pieces.append(connected_piece)
                                            connected_piece.connected_pieces.append(other_piece)
                                    break

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
                        return False  # 确保在退出前返回False停止游戏循环
                        return False  # 确保在退出前返回False停止游戏循环

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
                            # 检查相邻拼图块
                            self.check_adjacent_pieces()
            
                    elif event.type == pygame.MOUSEMOTION:
                        if self.selected_piece and self.selected_piece.dragging:
                            # 保存旧位置
                            old_x = self.selected_piece.rect.x
                            old_y = self.selected_piece.rect.y
                            # 更新选中拼图块的位置
                            self.selected_piece.rect.x = event.pos[0] - PIECE_SIZE // 2
                            self.selected_piece.rect.y = event.pos[1] - PIECE_SIZE // 2
                            # 计算位移
                            dx = self.selected_piece.rect.x - old_x
                            dy = self.selected_piece.rect.y - old_y
                            # 同步移动所有连接的拼图块
                            if self.selected_piece.connected:
                                for piece in self.selected_piece.connected_pieces:
                                    piece.rect.x += dx
                                    piece.rect.y += dy
            
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
                
                # 检查相邻拼图块（每帧都检查，确保及时连接）
                game.check_adjacent_pieces()
                
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
