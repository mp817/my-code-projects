import pygame
import random
import sys

# 初始化Pygame
pygame.init()

# 游戏常量
WIDTH, HEIGHT = 800, 600
GRID_SIZE = 30
GRID_WIDTH, GRID_HEIGHT = 10, 20
COLORS = [
    (0, 255, 255),   # I型 - 青色
    (255, 165, 0),   # L型 - 橙色
    (0, 0, 255),     # J型 - 蓝色
    (255, 255, 0),   # O型 - 黄色
    (128, 0, 128),   # T型 - 紫色
    (255, 0, 0),     # S型 - 红色
    (0, 255, 0)      # Z型 - 绿色
]

# 3D方块绘制函数
def draw_3d_block(surface, x, y, color):
    # 主方块
    pygame.draw.rect(surface, color, (x+1, y+1, GRID_SIZE-2, GRID_SIZE-2))
    # 3D边框效果
    pygame.draw.line(surface, (color[0]//2, color[1]//2, color[2]//2), 
                    (x, y+GRID_SIZE-1), (x, y), 3)
    pygame.draw.line(surface, (color[0]//2, color[1]//2, color[2]//2),
                    (x, y), (x+GRID_SIZE-1, y), 3)
    pygame.draw.line(surface, (color[0]//1.5, color[1]//1.5, color[2]//1.5),
                    (x+GRID_SIZE-1, y), (x+GRID_SIZE-1, y+GRID_SIZE-1), 3)

class Tetris:
    def __init__(self):
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("3D俄罗斯方块")
        self.clock = pygame.time.Clock()
        self.background = (40, 40, 40)  # 添加背景色
        self.border_color = (100, 100, 100)  # 边界线颜色
        
        # 统一字体加载逻辑
        font_names = [
            "simhei.ttf",  # Windows常见黑体
            "msyh.ttc",    # Windows微软雅黑
            "/System/Library/Fonts/PingFang.ttc",  # macOS苹方
            "/System/Library/Fonts/STHeiti Light.ttc",  # macOS华文细黑
            "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"  # Linux文泉驿
        ]
        
        # 主字体
        self.font = None
        font_loaded = False
        
        # 尝试加载系统字体
        for font_name in font_names:
            try:
                self.font = pygame.font.Font(font_name, 30)
                font_loaded = True
                print(f"成功加载字体: {font_name}")
                break
            except Exception as e:
                continue
        
        # 尝试使用SysFont
        if not font_loaded:
            try:
                self.font = pygame.font.SysFont('Microsoft YaHei', 30)
                font_loaded = True
                print("使用系统字体: Microsoft YaHei")
            except:
                pass
        
        # 最后的后备方案
        if not font_loaded:
            self.font = pygame.font.SysFont('Arial', 30)
            print("警告: 未找到中文字体，将使用英文字体显示")
        
        # 游戏结束画面字体（使用相同字体但不同大小）
        if font_loaded:
            try:
                self.large_font = pygame.font.Font(font_name, 72)
                self.small_font = pygame.font.Font(font_name, 36)
            except:
                self.large_font = pygame.font.SysFont('Arial', 72)
                self.small_font = pygame.font.SysFont('Arial', 36)
        else:
            self.large_font = pygame.font.SysFont('Arial', 72)
            self.small_font = pygame.font.SysFont('Arial', 36)

        # 添加缺失的初始化
        self.grid = [[0] * GRID_WIDTH for _ in range(GRID_HEIGHT)]
        self.shapes = [
            [[1, 1, 1, 1]],                # I
            [[2, 0], [2, 0], [2, 2]],      # L
            [[0, 3], [0, 3], [3, 3]],      # J
            [[4, 4], [4, 4]],              # O
            [[0, 5, 0], [5, 5, 5]],        # T
            [[6, 6, 0], [0, 6, 6]],        # S
            [[0, 7, 7], [7, 7, 0]]         # Z
        ]
        
        # 添加reset_game调用
        self.reset_game()
        self.key_states = {
            pygame.K_LEFT: False,
            pygame.K_RIGHT: False,
            pygame.K_DOWN: False
        }
        self.key_last_pressed_time = {
            pygame.K_LEFT: 0,
            pygame.K_RIGHT: 0,
            pygame.K_DOWN: 0
        }
        self.key_repeat_delay = 150  # 按键重复延迟(毫秒)

    def reset_game(self):
        """补充缺失的重置方法"""
        self.score = 0
        self.fall_speed = 1000
        self.last_fall_time = 0
        self.speed_step = 50
        self.game_over = True
        self.grid = [[0] * GRID_WIDTH for _ in range(GRID_HEIGHT)]
        self.current_piece = self.new_piece()
        self.next_piece = self.new_piece()

    # 补充缺失的new_piece方法
    def new_piece(self):
        index = random.randint(0, len(self.shapes)-1)
        piece = {
            'shape': self.shapes[index],
            'color': COLORS[index],
            'x': GRID_WIDTH//2 - len(self.shapes[index][0])//2,
            'y': 0  # 初始位置调整为0，确保从顶部开始
        }
        
        # 检查新生成的方块是否会立即碰撞，如果是则游戏结束
        if self.check_collision(piece):
            self.game_over = True
        
        return piece

    def lock_piece(self):
        """修复方块锁定逻辑"""
        for y, row in enumerate(self.current_piece['shape']):
            for x, cell in enumerate(row):
                if cell:
                    # 检查是否超出顶部边界
                    if self.current_piece['y'] + y < 0:
                        self.game_over = True
                        return
                    # 确保y坐标在有效范围内
                    if 0 <= self.current_piece['y'] + y < GRID_HEIGHT:
                        self.grid[self.current_piece['y'] + y][self.current_piece['x'] + x] = self.current_piece['color']
        
        # 只在成功锁定后才更新当前方块
        self.current_piece = self.next_piece
        self.next_piece = self.new_piece()
        
        # 修改后的消除行和速度控制逻辑
        lines_cleared = 0
        for y in range(GRID_HEIGHT-1, -1, -1):
            if all(cell != 0 for cell in self.grid[y]):
                del self.grid[y]
                self.grid.insert(0, [0]*GRID_WIDTH)
                lines_cleared += 1
        
        if lines_cleared > 0:
            self.score += lines_cleared * 10
            # 当分数超过当前阈值时加速
            while self.score >= self.speed_step:
                self.fall_speed = max(100, self.fall_speed // 2)  # 最低100ms
                self.speed_step += 50

    def run(self):
        while True:
            current_time = pygame.time.get_ticks()
            self.screen.fill(self.background)
            
            if not self.game_over:
                # 自动下落逻辑
                if current_time - self.last_fall_time > self.fall_speed:
                    if not self.move(0, 1):
                        self.lock_piece()
                    self.last_fall_time = current_time
                
                # 持续移动检测
                for key in [pygame.K_LEFT, pygame.K_RIGHT, pygame.K_DOWN]:
                    if self.key_states[key] and current_time - self.key_last_pressed_time[key] > self.key_repeat_delay:
                        dx, dy = 0, 0
                        if key == pygame.K_LEFT:
                            dx = -1
                        elif key == pygame.K_RIGHT:
                            dx = 1
                        elif key == pygame.K_DOWN:
                            dy = 1
                        
                        self.move(dx, dy)
                        self.key_last_pressed_time[key] = current_time
                
                # 绘制游戏元素
                self.draw_grid()
                self.draw_piece(self.current_piece)
            
            # 游戏结束画面
            if self.game_over:
                self.draw_game_over()
            
            # 绘制UI元素
            self.draw_score()
            button = self.draw_button()
            
            # 事件处理
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                
                # 按键按下事件
                elif event.type == pygame.KEYDOWN:
                    if not self.game_over:
                        if event.key in [pygame.K_LEFT, pygame.K_RIGHT, pygame.K_DOWN]:
                            self.key_states[event.key] = True
                            self.key_last_pressed_time[event.key] = current_time
                            # 立即响应第一次按键
                            dx, dy = 0, 0
                            if event.key == pygame.K_LEFT:
                                dx = -1
                            elif event.key == pygame.K_RIGHT:
                                dx = 1
                            elif event.key == pygame.K_DOWN:
                                dy = 1
                            self.move(dx, dy)
                        elif event.key == pygame.K_UP:
                            self.rotate()
                
                # 按键释放事件
                elif event.type == pygame.KEYUP:
                    if event.key in [pygame.K_LEFT, pygame.K_RIGHT, pygame.K_DOWN]:
                        self.key_states[event.key] = False
                
                # 鼠标点击事件
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if self.game_over:
                        self.reset_game()
                        self.game_over = False
            
            pygame.display.update()
            self.clock.tick(30)

    def check_collision(self, piece):
        """改进碰撞检测"""
        for y, row in enumerate(piece['shape']):
            for x, cell in enumerate(row):
                if cell:
                    px = piece['x'] + x
                    py = piece['y'] + y
                    # 检查边界和已有方块
                    if px < 0 or px >= GRID_WIDTH or py >= GRID_HEIGHT:
                        return True
                    if py >= 0 and self.grid[py][px] != 0:  # 明确检查是否为0
                        return True
        return False

    def move(self, dx, dy=0):
        """方块移动"""
        new_piece = {
            'shape': self.current_piece['shape'],
            'x': self.current_piece['x'] + dx,
            'y': self.current_piece['y'] + dy,
            'color': self.current_piece['color']
        }
        if not self.check_collision(new_piece):
            self.current_piece = new_piece
            return True
        return False

    def rotate(self):
        """修复方块旋转问题"""
        rotated = [list(row) for row in zip(*reversed(self.current_piece['shape']))]
        new_piece = {
            'shape': rotated,
            'x': self.current_piece['x'],
            'y': self.current_piece['y'],
            'color': self.current_piece['color']
        }
        
        # 检查旋转后是否超出边界
        if not self.check_collision(new_piece):
            self.current_piece = new_piece
        else:
            # 尝试调整位置防止卡墙
            offsets = [1, -1, 2, -2]  # 尝试的偏移量
            for offset in offsets:
                new_piece['x'] += offset
                if not self.check_collision(new_piece):
                    self.current_piece = new_piece
                    break

    def draw_grid(self):
        """调整绘制区域确保完全在画面内"""
        grid_left = (WIDTH - GRID_WIDTH * GRID_SIZE) // 2
        grid_top = (HEIGHT - GRID_HEIGHT * GRID_SIZE) // 2  # 居中显示
        
        # 绘制边界线
        border_rect = pygame.Rect(
            grid_left - 2, 
            grid_top - 2,
            GRID_WIDTH * GRID_SIZE + 4,
            GRID_HEIGHT * GRID_SIZE + 4
        )
        pygame.draw.rect(self.screen, self.border_color, border_rect, 2)
        
        # 绘制网格
        for y in range(GRID_HEIGHT):
            for x in range(GRID_WIDTH):
                if self.grid[y][x]:
                    draw_3d_block(self.screen, 
                                x * GRID_SIZE + grid_left,
                                y * GRID_SIZE + grid_top,
                                self.grid[y][x])

    def draw_piece(self, piece):
        """调整当前方块绘制位置"""
        grid_left = (WIDTH - GRID_WIDTH * GRID_SIZE) // 2
        grid_top = (HEIGHT - GRID_HEIGHT * GRID_SIZE) // 2
        
        for y, row in enumerate(piece['shape']):
            for x, cell in enumerate(row):
                if cell:
                    draw_3d_block(self.screen,
                                (piece['x'] + x) * GRID_SIZE + grid_left,
                                (piece['y'] + y) * GRID_SIZE + grid_top,
                                piece['color'])

    def draw_score(self):
        """确保使用self.font渲染文本"""
        score_text = self.font.render(f'分数: {self.score}', True, (255, 255, 255))
        self.screen.blit(score_text, (50, 50))

    def draw_button(self):
        """绘制开始按钮"""
        button_text = "开始游戏" if self.game_over else "游戏中"
        button_color = (100, 255, 100) if self.game_over else (200, 200, 200)
        
        button_rect = pygame.Rect(50, 100, 200, 50)
        pygame.draw.rect(self.screen, button_color, button_rect)
        pygame.draw.rect(self.screen, (255, 255, 255), button_rect, 2)
        
        text = self.font.render(button_text, True, (0, 0, 0))
        text_rect = text.get_rect(center=button_rect.center)
        self.screen.blit(text, text_rect)
        
        return button_rect

    def draw_game_over(self):
        """绘制游戏结束画面"""
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        self.screen.blit(overlay, (0, 0))
        
        text = self.large_font.render("游戏结束", True, (255, 0, 0))
        text_rect = text.get_rect(center=(WIDTH//2, HEIGHT//2 - 50))
        self.screen.blit(text, text_rect)
        
        score_text = self.small_font.render(f"最终分数: {self.score}", True, (255, 255, 255))
        score_rect = score_text.get_rect(center=(WIDTH//2, HEIGHT//2 + 20))
        self.screen.blit(score_text, score_rect)
        
        restart_text = self.small_font.render("点击任意位置重新开始", True, (255, 255, 255))
        restart_rect = restart_text.get_rect(center=(WIDTH//2, HEIGHT//2 + 80))
        self.screen.blit(restart_text, restart_rect)

if __name__ == "__main__":
    game = Tetris()
    game.run()
