import pygame
import sys
import random

# 初始化Pygame
pygame.init()

# 设置默认中文字体
try:
    # 尝试使用系统自带的中文字体
    font_paths = [
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Light.ttc',
        '/System/Library/Fonts/Hiragino Sans GB.ttc'
    ]
    
    for font_path in font_paths:
        try:
            DEFAULT_FONT = pygame.font.Font(font_path, 36)
            break
        except:
            continue
    else:
        # 如果所有字体都失败，使用系统默认字体
        DEFAULT_FONT = pygame.font.SysFont('microsoft yahei', 36)
except:
    # 最后的后备方案
    DEFAULT_FONT = pygame.font.SysFont(None, 36)

# 游戏常量
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
FPS = 60
CAMERA_OFFSET = WINDOW_WIDTH // 3  # 摄像机偏移量

# 颜色定义
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (0, 0, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BROWN = (139, 69, 19)
YELLOW = (255, 255, 0)
SKY_BLUE = (135, 206, 235)

# 玩家属性
PLAYER_WIDTH = 40
PLAYER_HEIGHT = 60
PLAYER_SPEED = 5
JUMP_SPEED = -15
GRAVITY = 0.8

# 平台属性
PLATFORM_WIDTH = 200
PLATFORM_HEIGHT = 20
PLATFORM_GAP = 300  # 平台之间的间距
GROUND_HEIGHT = 40

# 敌人属性
ENEMY_WIDTH = 40
ENEMY_HEIGHT = 40
ENEMY_SPEED = 2

# 金币属性
COIN_SIZE = 20
COIN_VALUE = 10

# 游戏世界属性
WORLD_CHUNK_SIZE = WINDOW_WIDTH * 2  # 每个区块的大小
MAX_CHUNKS = 3  # 最大区块数量

class Player:
    def __init__(self):
        self.width = PLAYER_WIDTH
        self.height = PLAYER_HEIGHT
        self.x = 50
        self.y = WINDOW_HEIGHT - PLAYER_HEIGHT - 40
        self.vel_x = 0
        self.vel_y = 0
        self.on_ground = False
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)
        self.facing_right = True
        self.score = 0
        self.lives = 3

    def move(self, platforms):
        keys = pygame.key.get_pressed()
        
        # 强制向右移动
        self.vel_x = PLAYER_SPEED
        if keys[pygame.K_RIGHT]:
            self.vel_x = PLAYER_SPEED * 1.5  # 加速

        # 跳跃
        if keys[pygame.K_SPACE] and self.on_ground:
            self.vel_y = JUMP_SPEED
            self.on_ground = False

        # 应用重力
        self.vel_y += GRAVITY

        # 更新位置
        self.x += self.vel_x
        self.y += self.vel_y

        # 更新碰撞盒
        self.rect.x = self.x
        self.rect.y = self.y

        # 检查与平台的碰撞
        self.on_ground = False
        for platform in platforms:
            if self.rect.colliderect(platform):
                # 从上方碰撞
                if self.vel_y > 0 and self.rect.bottom > platform.top:
                    self.rect.bottom = platform.top
                    self.y = self.rect.y
                    self.vel_y = 0
                    self.on_ground = True
                # 从下方碰撞
                elif self.vel_y < 0 and self.rect.top < platform.bottom:
                    self.rect.top = platform.bottom
                    self.y = self.rect.y
                    self.vel_y = 0

    def draw(self, screen):
        # 绘制马里奥
        color = RED
        pygame.draw.rect(screen, color, self.rect)
        
        # 绘制帽子
        hat_height = self.height // 4
        hat_rect = pygame.Rect(self.rect.x, self.rect.y, self.width, hat_height)
        pygame.draw.rect(screen, RED, hat_rect)
        
        # 绘制眼睛
        eye_size = 5
        eye_y = self.rect.y + hat_height + 5
        if self.facing_right:
            eye_x = self.rect.x + self.width - 15
        else:
            eye_x = self.rect.x + 10
        pygame.draw.circle(screen, WHITE, (eye_x, eye_y), eye_size)

class Enemy:
    def __init__(self, x, y):
        self.width = ENEMY_WIDTH
        self.height = ENEMY_HEIGHT
        self.x = x
        self.y = y
        self.vel_x = -ENEMY_SPEED  # 初始向左移动
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)
    
    def update(self, platforms):
        # 简单的左右移动
        self.x += self.vel_x
        self.rect.x = self.x
        
        # 检查边界碰撞
        for platform in platforms:
            if self.rect.colliderect(platform):
                self.vel_x *= -1  # 改变方向
                break
        
        # 检查屏幕边界
        if self.rect.left < 0 or self.rect.right > WINDOW_WIDTH:
            self.vel_x *= -1
    
    def draw(self, screen):
        pygame.draw.rect(screen, BROWN, self.rect)
        # 绘制眼睛
        eye_y = self.rect.y + 10
        eye_size = 5
        eye_x1 = self.rect.x + 10
        eye_x2 = self.rect.x + self.width - 15
        pygame.draw.circle(screen, WHITE, (eye_x1, eye_y), eye_size)
        pygame.draw.circle(screen, WHITE, (eye_x2, eye_y), eye_size)

class Coin:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.size = COIN_SIZE
        self.rect = pygame.Rect(self.x, self.y, self.size, self.size)
        self.collected = False
    
    def draw(self, screen):
        if not self.collected:
            pygame.draw.circle(screen, YELLOW, (self.x + self.size//2, self.y + self.size//2), self.size//2)

class Platform:
    def __init__(self, x, y, width, height, platform_type="normal"):
        self.rect = pygame.Rect(x, y, width, height)
        self.type = platform_type
    
    def draw(self, screen):
        if self.type == "ground":
            pygame.draw.rect(screen, BROWN, self.rect)
        else:
            pygame.draw.rect(screen, GREEN, self.rect)

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption('超级马里奥')
        self.clock = pygame.time.Clock()
        self.player = Player()
        self.camera_x = 0
        self.platforms = []
        self.enemies = []
        self.coins = []
        self.chunks = {}  # 存储游戏区块
        self.current_chunk = 0
        
        # 初始化第一个区块
        self.generate_chunk(0)
        
        self.running = True
        self.game_over = False
        self.font = DEFAULT_FONT
        
    def generate_chunk(self, chunk_index):
        chunk_start_x = chunk_index * WORLD_CHUNK_SIZE
        
        # 生成地面
        ground = Platform(chunk_start_x, WINDOW_HEIGHT - GROUND_HEIGHT, 
                         WORLD_CHUNK_SIZE, GROUND_HEIGHT, "ground")
        platforms = [ground]
        
        # 生成随机平台
        last_x = chunk_start_x
        while last_x < chunk_start_x + WORLD_CHUNK_SIZE - PLATFORM_WIDTH:
            x = last_x + random.randint(PLATFORM_WIDTH, PLATFORM_GAP)
            y = random.randint(WINDOW_HEIGHT//2, WINDOW_HEIGHT - GROUND_HEIGHT - 100)
            platform = Platform(x, y, PLATFORM_WIDTH, PLATFORM_HEIGHT, "normal")
            platforms.append(platform)
            last_x = x
            
            # 在平台上添加金币
            for i in range(3):
                coin_x = x + PLATFORM_WIDTH//4 + i * (PLATFORM_WIDTH//4)
                coin_y = y - COIN_SIZE - 10
                self.coins.append(Coin(coin_x, coin_y))
        
        # 添加敌人
        for platform in platforms[1:]:
            if random.random() < 0.5:
                enemy_x = platform.rect.centerx
                enemy_y = platform.rect.top - ENEMY_HEIGHT
                self.enemies.append(Enemy(enemy_x, enemy_y))
        
        self.chunks[chunk_index] = platforms
        self.platforms = [p for chunk in self.chunks.values() for p in chunk]
        self.platform_rects = [p.rect for p in self.platforms]

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                pygame.quit()
                sys.exit()
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r and self.game_over:
                    self.reset_game()

    def draw(self):
        self.screen.fill(SKY_BLUE)
        
        # 应用摄像机偏移
        camera_offset = int(self.camera_x)
        
        # 绘制平台
        for platform in self.platforms:
            draw_rect = platform.rect.copy()
            draw_rect.x -= camera_offset
            if -PLATFORM_WIDTH <= draw_rect.x <= WINDOW_WIDTH:
                pygame.draw.rect(self.screen, BROWN if platform.type == "ground" else GREEN, draw_rect)
        
        # 绘制金币
        for coin in self.coins:
            if not coin.collected:
                coin_x = coin.x - camera_offset
                if -COIN_SIZE <= coin_x <= WINDOW_WIDTH:
                    pygame.draw.circle(self.screen, YELLOW, 
                                     (int(coin_x + COIN_SIZE//2), int(coin.y + COIN_SIZE//2)), 
                                     COIN_SIZE//2)
        
        # 绘制敌人
        for enemy in self.enemies:
            draw_rect = enemy.rect.copy()
            draw_rect.x -= camera_offset
            if -ENEMY_WIDTH <= draw_rect.x <= WINDOW_WIDTH:
                pygame.draw.rect(self.screen, BROWN, draw_rect)
                # 绘制眼睛
                eye_y = draw_rect.y + 10
                eye_size = 5
                eye_x1 = draw_rect.x + 10
                eye_x2 = draw_rect.x + ENEMY_WIDTH - 15
                pygame.draw.circle(self.screen, WHITE, (int(eye_x1), eye_y), eye_size)
                pygame.draw.circle(self.screen, WHITE, (int(eye_x2), eye_y), eye_size)
        
        # 绘制玩家（始终在屏幕中间偏左位置）
        player_screen_x = self.player.x - camera_offset
        player_rect = pygame.Rect(player_screen_x, self.player.y, PLAYER_WIDTH, PLAYER_HEIGHT)
        pygame.draw.rect(self.screen, RED, player_rect)
        
        # 绘制帽子
        hat_height = PLAYER_HEIGHT // 4
        hat_rect = pygame.Rect(player_screen_x, self.player.y, PLAYER_WIDTH, hat_height)
        pygame.draw.rect(self.screen, RED, hat_rect)
        
        # 绘制眼睛
        eye_size = 5
        eye_y = self.player.y + hat_height + 5
        eye_x = player_screen_x + PLAYER_WIDTH - 15
        pygame.draw.circle(self.screen, WHITE, (int(eye_x), eye_y), eye_size)
        
        # 显示分数和生命
        score_text = self.font.render(f'分数: {self.player.score}', True, BLACK)
        lives_text = self.font.render(f'生命: {self.player.lives}', True, BLACK)
        self.screen.blit(score_text, (10, 10))
        self.screen.blit(lives_text, (10, 50))
        
        # 游戏结束显示
        if self.game_over:
            # 创建半透明的黑色遮罩
            overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
            overlay.fill((0, 0, 0))
            overlay.set_alpha(128)
            self.screen.blit(overlay, (0, 0))
            
            # 渲染游戏结束文本
            game_over_text = self.font.render('游戏结束! 按R键重新开始', True, WHITE)
            text_rect = game_over_text.get_rect(center=(WINDOW_WIDTH//2, WINDOW_HEIGHT//2))
            self.screen.blit(game_over_text, text_rect)
            
            # 渲染最终分数
            final_score_text = self.font.render(f'最终分数: {self.player.score}', True, WHITE)
            score_rect = final_score_text.get_rect(center=(WINDOW_WIDTH//2, WINDOW_HEIGHT//2 + 50))
            self.screen.blit(final_score_text, score_rect)
        
        pygame.display.flip()

    def update(self):
        if self.game_over:
            return
            
        # 更新玩家
        self.player.move(self.platform_rects)
        
        # 更新摄像机位置
        self.camera_x = self.player.x - CAMERA_OFFSET
        
        # 检查是否需要生成新区块
        current_chunk = int(self.player.x // WORLD_CHUNK_SIZE)
        if current_chunk > self.current_chunk:
            self.generate_chunk(current_chunk + 1)
            # 删除旧区块
            old_chunk = current_chunk - MAX_CHUNKS
            if old_chunk in self.chunks:
                # 获取旧区块的边界
                old_chunk_start = old_chunk * WORLD_CHUNK_SIZE
                old_chunk_end = (old_chunk + 1) * WORLD_CHUNK_SIZE
                
                # 删除旧区块的平台
                del self.chunks[old_chunk]
                
                # 更新平台列表
                self.platforms = [p for chunk in self.chunks.values() for p in chunk]
                self.platform_rects = [p.rect for p in self.platforms]
                
                # 删除旧区块中的敌人
                self.enemies = [e for e in self.enemies if not (old_chunk_start <= e.x < old_chunk_end)]
                
                # 删除旧区块中的金币
                self.coins = [c for c in self.coins if not (old_chunk_start <= c.x < old_chunk_end)]
            
            self.current_chunk = current_chunk
        
        # 更新敌人
        for enemy in self.enemies:
            enemy.update(self.platform_rects)
            
            # 检查与玩家的碰撞
            if self.player.rect.colliderect(enemy.rect):
                # 从上方踩踏敌人
                if self.player.vel_y > 0 and self.player.rect.bottom < enemy.rect.centery:
                    self.enemies.remove(enemy)
                    self.player.vel_y = JUMP_SPEED / 2  # 小跳
                    self.player.score += 100
                else:
                    # 被敌人碰到
                    self.player.lives -= 1
                    if self.player.lives <= 0:
                        self.game_over = True
                    else:
                        # 重置玩家位置到当前区块的起始位置
                        self.player.x = current_chunk * WORLD_CHUNK_SIZE + 50
                        self.player.y = WINDOW_HEIGHT - PLAYER_HEIGHT - 40
                        self.player.rect.x = self.player.x
                        self.player.rect.y = self.player.y
        
        # 检查金币收集
        for coin in self.coins:
            if not coin.collected and self.player.rect.colliderect(coin.rect):
                coin.collected = True
                self.player.score += COIN_VALUE
        
        # 检查玩家是否掉出屏幕
        if self.player.rect.top > WINDOW_HEIGHT:
            self.player.lives -= 1
            if self.player.lives <= 0:
                self.game_over = True
            else:
                # 重置玩家位置到当前区块的起始位置
                self.player.x = current_chunk * WORLD_CHUNK_SIZE + 50
                self.player.y = WINDOW_HEIGHT - PLAYER_HEIGHT - 40
                self.player.rect.x = self.player.x
                self.player.rect.y = self.player.y
    
    def reset_game(self):
        self.player = Player()
        self.enemies = [
            Enemy(300, WINDOW_HEIGHT - 80),
            Enemy(500, 160)
        ]
        self.coins = [
            Coin(150, 250),
            Coin(350, 350),
            Coin(550, 150),
            Coin(650, WINDOW_HEIGHT - 80)
        ]
        self.game_over = False

    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.draw()
            self.clock.tick(FPS)

        pygame.quit()
        sys.exit()

if __name__ == '__main__':
    game = Game()
    game.run()