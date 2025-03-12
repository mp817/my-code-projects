import pygame
import sys
import random

class Gomoku:
    def __init__(self):
        pygame.init()
        self.board_size = 15
        self.grid_size = 40
        self.margin = 40
        self.piece_radius = 18
        
        # 计算窗口大小
        self.window_size = self.margin * 2 + self.grid_size * (self.board_size - 1)
        self.screen = pygame.display.set_mode((self.window_size, self.window_size))
        pygame.display.set_caption('五子棋')
        
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
                    self.font = pygame.font.Font(font_path, 48)
                    self.score_font = pygame.font.Font(font_path, 36)
                    self.game_over_font = pygame.font.Font(font_path, 74)
                    break
                except:
                    continue
            else:
                # 如果所有字体都失败，使用系统默认中文字体
                self.font = pygame.font.SysFont('microsoft yahei', 48)
                self.score_font = pygame.font.SysFont('microsoft yahei', 36)
                self.game_over_font = pygame.font.SysFont('microsoft yahei', 74)
        except Exception as e:
            # 最后的后备方案
            self.font = pygame.font.SysFont('arial', 48)
            self.score_font = pygame.font.SysFont('arial', 36)
            self.game_over_font = pygame.font.SysFont('arial', 74)
        
        # 初始化棋盘
        self.board = [[' ' for _ in range(self.board_size)] for _ in range(self.board_size)]
        self.player = 'X'
        self.ai = 'O'
        self.game_over = False
        self.game_started = False
        
        # 初始化计分系统
        self.player_score = 0
        self.ai_score = 0
        
        # AI难度设置 - 直接设置为高级模式
        self.ai_difficulty = 'hard'
        self.difficulty_colors = {
            'easy': (50, 200, 50),
            'medium': (200, 200, 50),
            'hard': (200, 50, 50)
        }  # 新增：游戏开始标志
        
    def draw_buttons(self):
        button_width = 200
        button_height = 50
        spacing = 20
        
        # 开始游戏按钮
        start_y = self.window_size//2 - button_height - spacing
        start_x = (self.window_size - button_width) // 2
        pygame.draw.rect(self.screen, (50, 200, 50), (start_x, start_y, button_width, button_height))
        text = self.font.render("开始游戏", True, (255, 255, 255))
        text_rect = text.get_rect(center=(self.window_size//2, start_y + button_height//2))
        self.screen.blit(text, text_rect)
        
        # 难度选择按钮
        diff_y = self.window_size//2 + spacing
        diff_x = (self.window_size - button_width) // 2
        pygame.draw.rect(self.screen, self.difficulty_colors[self.ai_difficulty], 
                        (diff_x, diff_y, button_width, button_height))
        text = self.font.render(f"难度: {self.get_difficulty_text()}", True, (255, 255, 255))
        text_rect = text.get_rect(center=(self.window_size//2, diff_y + button_height//2))
        self.screen.blit(text, text_rect)
        
        # 显示计分
        score_text = f"玩家 {self.player_score} - {self.ai_score} 电脑"
        score_surface = self.score_font.render(score_text, True, (0, 0, 0))
        score_rect = score_surface.get_rect(center=(self.window_size//2, diff_y + button_height + spacing + 30))
        self.screen.blit(score_surface, score_rect)
        
        return {
            'start': (start_x, start_y, button_width, button_height),
            'difficulty': (diff_x, diff_y, button_width, button_height)
        }
        
    def get_difficulty_text(self):
        difficulty_map = {
            'easy': '初级',
            'medium': '中级',
            'hard': '高级'
        }
        return difficulty_map[self.ai_difficulty]

    def reset_game(self):
        self.board = [[' ' for _ in range(self.board_size)] for _ in range(self.board_size)]
        self.game_over = False
        self.game_started = True

    def ai_move(self):
        # 获取所有可用的位置
        available_moves = [(i, j) for i in range(self.board_size) for j in range(self.board_size) if self.board[i][j] == ' ']
        
        if self.ai_difficulty == 'easy':
            # 简单难度：随机选择一个可用位置
            return random.choice(available_moves)
        
        # 评估每个位置的分数
        best_score = float('-inf')
        best_move = None
        
        for move in available_moves:
            score = self.evaluate_position(move[0], move[1])
            if score > best_score:
                best_score = score
                best_move = move
        
        return best_move
    
    def evaluate_position(self, x, y):
        score = 0
        directions = [(1,0), (0,1), (1,1), (1,-1)]  # 水平、垂直、两个对角线
        
        # 评估AI的得分
        self.board[x][y] = self.ai
        for dx, dy in directions:
            consecutive = self.count_consecutive(x, y, dx, dy, self.ai)
            if consecutive >= 4:
                score += 1000  # 如果能形成四子连珠，给予极高分数
            elif consecutive >= 3:
                score += 100   # 三子连珠
            else:
                score += consecutive * 10
        
        # 评估玩家的威胁
        self.board[x][y] = self.player
        for dx, dy in directions:
            consecutive = self.count_consecutive(x, y, dx, dy, self.player)
            if consecutive >= 4:
                score += 800  # 优先阻止玩家形成四子连珠
            elif consecutive >= 3:
                score += 80   # 阻止玩家形成三子连珠
            else:
                score += consecutive * 8
        
        # 额外策略：优先选择靠近中心的位置
        center = self.board_size // 2
        distance_to_center = abs(x - center) + abs(y - center)
        score += (10 - distance_to_center) * 2
        
        self.board[x][y] = ' '  # 恢复空位
        return score
    
    def count_consecutive(self, x, y, dx, dy, player):
        count = 1
        # 向一个方向计数
        temp_x, temp_y = x + dx, y + dy
        while 0 <= temp_x < self.board_size and 0 <= temp_y < self.board_size and self.board[temp_x][temp_y] == player:
            count += 1
            temp_x += dx
            temp_y += dy
        
        # 向相反方向计数
        temp_x, temp_y = x - dx, y - dy
        while 0 <= temp_x < self.board_size and 0 <= temp_y < self.board_size and self.board[temp_x][temp_y] == player:
            count += 1
            temp_x -= dx
            temp_y -= dy
        
        return count
    
    def play(self):
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                
                if event.type == pygame.MOUSEBUTTONDOWN:
                    mouse_pos = pygame.mouse.get_pos()
                    
                    if not self.game_started or self.game_over:
                        buttons = self.draw_buttons()
                        start_btn = buttons['start']
                        diff_btn = buttons['difficulty']
                        
                        # 检查开始按钮
                        if (start_btn[0] <= mouse_pos[0] <= start_btn[0] + start_btn[2] and 
                            start_btn[1] <= mouse_pos[1] <= start_btn[1] + start_btn[3]):
                            self.reset_game()
                            continue
                        
                        # 检查难度按钮
                        if (diff_btn[0] <= mouse_pos[0] <= diff_btn[0] + diff_btn[2] and 
                            diff_btn[1] <= mouse_pos[1] <= diff_btn[1] + diff_btn[3]):
                            if self.ai_difficulty == 'easy':
                                self.ai_difficulty = 'medium'
                            elif self.ai_difficulty == 'medium':
                                self.ai_difficulty = 'hard'
                            else:
                                self.ai_difficulty = 'easy'
                            continue
                    
                    elif not self.game_over:
                        board_x, board_y = self.get_board_pos(mouse_pos)
                        if self.is_valid_move(board_x, board_y):
                            # 玩家回合
                            self.make_move(board_x, board_y, self.player)
                            if self.check_win(board_x, board_y, self.player):
                                self.game_over = True
                                self.player_score += 1
                                self.draw_board()
                                self.show_game_over("你赢了！")
                                continue
                            
                            # AI回合
                            ai_x, ai_y = self.ai_move()
                            self.make_move(ai_x, ai_y, self.ai)
                            if self.check_win(ai_x, ai_y, self.ai):
                                self.game_over = True
                                self.ai_score += 1
                                self.draw_board()
                                self.show_game_over("电脑赢了！")
                                continue
            
            # 更新显示
            if not self.game_started or self.game_over:
                self.screen.fill((240, 200, 150))
                self.draw_buttons()
            else:
                self.draw_board()
            pygame.display.flip()  # 添加显示更新

    def draw_board(self):
        self.screen.fill((240, 200, 150))  # 棋盘底色
        
        # 画网格线
        for i in range(self.board_size):
            # 横线
            pygame.draw.line(self.screen, (0, 0, 0),
                           (self.margin, self.margin + i * self.grid_size),
                           (self.window_size - self.margin, self.margin + i * self.grid_size), 2)
            # 竖线
            pygame.draw.line(self.screen, (0, 0, 0),
                           (self.margin + i * self.grid_size, self.margin),
                           (self.margin + i * self.grid_size, self.window_size - self.margin), 2)
        
        # 画棋子
        for i in range(self.board_size):
            for j in range(self.board_size):
                pos_x = self.margin + j * self.grid_size
                pos_y = self.margin + i * self.grid_size
                if self.board[i][j] == 'X':
                    # 黑子
                    pygame.draw.circle(self.screen, (0, 0, 0), (pos_x, pos_y), self.piece_radius)
                    # 添加高光效果
                    pygame.draw.circle(self.screen, (64, 64, 64), 
                                    (pos_x - 3, pos_y - 3), self.piece_radius // 3)
                elif self.board[i][j] == 'O':
                    # 白子
                    pygame.draw.circle(self.screen, (255, 255, 255), (pos_x, pos_y), self.piece_radius)
                    # 添加边框
                    pygame.draw.circle(self.screen, (192, 192, 192), (pos_x, pos_y), self.piece_radius, 1)
                    # 添加高光效果
                    pygame.draw.circle(self.screen, (255, 255, 255), 
                                    (pos_x - 3, pos_y - 3), self.piece_radius // 3)
    
    def get_board_pos(self, mouse_pos):
        x = round((mouse_pos[1] - self.margin) / self.grid_size)
        y = round((mouse_pos[0] - self.margin) / self.grid_size)
        return x, y
    
    def is_valid_move(self, x, y):
        if x < 0 or x >= self.board_size or y < 0 or y >= self.board_size:
            return False
        return self.board[x][y] == ' '
    
    def make_move(self, x, y, player):
        self.board[x][y] = player
    
    def check_win(self, x, y, player):
        directions = [(1,0), (0,1), (1,1), (1,-1)]  # 水平、垂直、两个对角线
        for dx, dy in directions:
            if self.count_consecutive(x, y, dx, dy, player) >= 5:
                return True
        return False
    
    def show_game_over(self, message):
        text = self.game_over_font.render(message, True, (200, 0, 0))
        text_rect = text.get_rect(center=(self.window_size//2, self.window_size//2))
        self.screen.blit(text, text_rect)
        pygame.display.flip()
        pygame.time.wait(50)

if __name__ == "__main__":
    game = Gomoku()
    game.play()