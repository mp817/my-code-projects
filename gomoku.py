import pygame
import sys
import random

class Gomoku:
    def __init__(self):
        # 确保pygame最先初始化
        pygame.init()

        # 基础参数初始化（必须在窗口创建前完成）
        self.board_size = 15
        self.grid_size = 40
        self.margin = 40
        self.piece_radius = 18
        self.window_size = self.margin * 2 + self.grid_size * (self.board_size - 1)
        
        # 添加极小化极大算法所需的评分权重
        self.win_score = 10000
        self.four_score = 1000
        self.three_score = 100
        self.two_score = 10

        # 初始化游戏窗口
        self.screen = pygame.display.set_mode((self.window_size + 220, self.window_size))
        pygame.display.set_caption('五子棋')

        # 统一字体加载流程
        self.init_fonts()

        # 初始化棋盘
        self.board = [[' ' for _ in range(self.board_size)] for _ in range(self.board_size)]
        self.player = 'X'  # 玩家使用黑子
        self.ai = 'O'      # AI使用白子
        self.game_over = False
        self.game_started = False
        self.win_probability = 50.0
        self.recommendations = []
        self.game_history = []
        
        # 初始化计分系统
        self.player_score = 0
        self.ai_score = 0
        
        # AI难度设置 - 只有简单和高级两种难度
        self.ai_difficulty = 'easy'  # 默认为简单难度
        self.difficulty_colors = {
            'easy': (50, 200, 50),   # 简单难度为绿色
            'hard': (200, 50, 50)    # 高级难度为红色
        }

    def init_fonts(self):
        # 统一字体加载流程
        try:
            # 尝试使用系统自带的中文字体
            font_paths = [
                '/System/Library/Fonts/PingFang.ttc',
                '/System/Library/Fonts/STHeiti Light.ttc',
                '/System/Library/Fonts/Hiragino Sans GB.ttc',
                '/System/Library/Fonts/AppleGothic.ttf'
            ]
            
            # 初始化所有需要的字体
            self.font = None
            self.score_font = None
            self.game_over_font = None
            self.analysis_font = None
            
            # 尝试加载字体
            for font_path in font_paths:
                try:
                    self.font = pygame.font.Font(font_path, 48)
                    self.score_font = pygame.font.Font(font_path, 36)
                    self.game_over_font = pygame.font.Font(font_path, 74)
                    self.analysis_font = pygame.font.Font(font_path, 20)
                    break
                except Exception as e:
                    print(f"字体文件 {font_path} 加载失败: {e}")
                    continue
            
            # 如果字体加载失败，使用系统字体
            if self.font is None:
                sys_fonts = ['Arial Unicode MS', 'Microsoft YaHei', 'msyh', 'SimHei']
                for font_name in sys_fonts:
                    try:
                        self.font = pygame.font.SysFont(font_name, 48)
                        self.score_font = pygame.font.SysFont(font_name, 36)
                        self.game_over_font = pygame.font.SysFont(font_name, 74)
                        self.analysis_font = pygame.font.SysFont(font_name, 20)
                        break
                    except Exception as e:
                        print(f"系统字体 {font_name} 加载失败: {e}")
            
            # 最终回退方案
            if self.font is None:
                self.font = pygame.font.SysFont('arial', 48)
                self.score_font = pygame.font.SysFont('arial', 36)
                self.game_over_font = pygame.font.SysFont('arial', 74)
                self.analysis_font = pygame.font.SysFont('arial', 20)
        except Exception as e:
            print(f"字体初始化严重错误: {e}")
            # 确保即使出错也有默认字体
            self.font = pygame.font.SysFont('arial', 48)
            self.score_font = pygame.font.SysFont('arial', 36)
            self.game_over_font = pygame.font.SysFont('arial', 74)
            self.analysis_font = pygame.font.SysFont('arial', 20)
        
        # 初始化分析面板数据
        self.recommendations = []
        self.win_probability = 50.0
        self.game_history = []
        
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
                self.score_font = self.analysis_font
                self.game_over_font = self.analysis_font
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
        self.difficulty_colors = {
            'easy': (50, 200, 50),
            'medium': (200, 200, 50),
            'hard': (200, 50, 50)
        }  # 新增：游戏开始标志
        
        # 初始化游戏开始状态
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
        self.game_started = False  # 初始化游戏开始状态
        
    def draw_buttons(self):
        button_width = 220
        button_height = 60
        spacing = 25
        
        # 开始游戏按钮
        start_y = self.window_size//2 - button_height - spacing
        start_x = (self.window_size - button_width) // 2
        
        # 绘制按钮阴影
        pygame.draw.rect(self.screen, (30, 120, 30), 
                        (start_x + 4, start_y + 4, button_width, button_height), 0, 10)
        # 绘制按钮主体
        pygame.draw.rect(self.screen, (60, 180, 60), 
                        (start_x, start_y, button_width, button_height), 0, 10)
        # 绘制按钮边框
        pygame.draw.rect(self.screen, (40, 140, 40), 
                        (start_x, start_y, button_width, button_height), 3, 10)
        # 绘制按钮高光
        pygame.draw.line(self.screen, (100, 220, 100), 
                       (start_x + 5, start_y + 5), (start_x + button_width - 5, start_y + 5), 2)
        
        text = self.font.render("开始游戏", True, (255, 255, 255))
        text_rect = text.get_rect(center=(self.window_size//2, start_y + button_height//2))
        self.screen.blit(text, text_rect)
        
        # 难度选择按钮 - 只有简单和高级两种难度
        diff_y = self.window_size//2 + spacing
        diff_x = (self.window_size - button_width) // 2
        
        # 根据难度选择不同的颜色
        if self.ai_difficulty == 'easy':
            button_color = (60, 180, 60)  # 绿色
            border_color = (40, 140, 40)
            shadow_color = (30, 120, 30)
            highlight_color = (100, 220, 100)
        else:  # hard
            button_color = (180, 60, 60)  # 红色
            border_color = (140, 40, 40)
            shadow_color = (120, 30, 30)
            highlight_color = (220, 100, 100)
        
        # 绘制按钮阴影
        pygame.draw.rect(self.screen, shadow_color, 
                        (diff_x + 4, diff_y + 4, button_width, button_height), 0, 10)
        # 绘制按钮主体
        pygame.draw.rect(self.screen, button_color, 
                        (diff_x, diff_y, button_width, button_height), 0, 10)
        # 绘制按钮边框
        pygame.draw.rect(self.screen, border_color, 
                        (diff_x, diff_y, button_width, button_height), 3, 10)
        # 绘制按钮高光
        pygame.draw.line(self.screen, highlight_color, 
                       (diff_x + 5, diff_y + 5), (diff_x + button_width - 5, diff_y + 5), 2)
        
        text = self.font.render(f"难度: {self.get_difficulty_text()}", True, (255, 255, 255))
        text_rect = text.get_rect(center=(self.window_size//2, diff_y + button_height//2))
        self.screen.blit(text, text_rect)
        
        # 显示计分 - 添加装饰性边框
        score_y = diff_y + button_height + spacing + 10
        score_width = 240
        score_height = 50
        score_x = (self.window_size - score_width) // 2
        
        # 绘制计分板背景
        pygame.draw.rect(self.screen, (220, 179, 92), 
                        (score_x, score_y, score_width, score_height), 0, 8)
        pygame.draw.rect(self.screen, (120, 81, 45), 
                        (score_x, score_y, score_width, score_height), 2, 8)
        
        score_text = f"玩家 {self.player_score} - {self.ai_score} 电脑"
        score_surface = self.score_font.render(score_text, True, (60, 30, 10))
        score_rect = score_surface.get_rect(center=(self.window_size//2, score_y + score_height//2))
        self.screen.blit(score_surface, score_rect)
        
        return {
            'start': (start_x, start_y, button_width, button_height),
            'difficulty': (diff_x, diff_y, button_width, button_height)
        }
        
    def get_difficulty_text(self):
        difficulty_map = {
            'easy': '简单',
            'hard': '高级'
        }
        return difficulty_map[self.ai_difficulty]

    def reset_game(self):
        self.board = [[' ' for _ in range(self.board_size)] for _ in range(self.board_size)]
        self.game_over = False
        self.game_started = True
        self.win_probability = 50.0
        self.recommendations = []
        
        # AI总是先手出子
        center = self.board_size // 2
        # 在中心位置附近随机选择一个位置落子
        ai_x = center + random.randint(-1, 1)
        ai_y = center + random.randint(-1, 1)
        self.board[ai_x][ai_y] = self.ai
        
        # 计算初始局面的推荐落子点
        self.update_recommendations()

    def monte_carlo_search(self, iterations=1000):
        best_move = None
        best_win_rate = -1
        
        # 获取所有合法移动
        legal_moves = [(i, j) for i in range(self.board_size) for j in range(self.board_size) if self.board[i][j] == ' ']
        
        for move in legal_moves:
            wins = 0
            for _ in range(iterations // len(legal_moves)):
                # 模拟游戏进行
                temp_board = [row[:] for row in self.board]
                temp_board[move[0]][move[1]] = self.ai
                
                # 进行随机模拟
                result = self.simulate_game(temp_board)
                if result == 'ai_win':
                    wins += 1
            
            win_rate = (wins / (iterations // len(legal_moves))) * 100
            if win_rate > best_win_rate:
                best_win_rate = win_rate
                best_move = move
        
        # 更新胜率显示
        self.win_probability = best_win_rate
        return best_move
    
    def simulate_game(self, board):
        # 创建临时棋盘副本进行模拟
        temp_board = [row[:] for row in board]
        current_player = self.player
        
        while True:
            # 随机选择合法移动
            legal_moves = [(i, j) for i in range(self.board_size) for j in range(self.board_size) if temp_board[i][j] == ' ']
            if not legal_moves:
                return 'draw'
            
            move = random.choice(legal_moves)
            temp_board[move[0]][move[1]] = current_player
            
            # 检查胜利条件
            if self.check_win(move[0], move[1], current_player, temp_board):
                return 'ai_win' if current_player == self.ai else 'player_win'
            
            current_player = self.player if current_player == self.ai else self.ai
    
    def ai_move(self):
        # 获取所有可用的位置
        available_moves = [(i, j) for i in range(self.board_size) for j in range(self.board_size) if self.board[i][j] == ' ']
        
        if not available_moves:
            return None, None  # 没有可用位置
        
        if self.ai_difficulty == 'hard':
            # 高级模式：使用极小化极大算法，但降低搜索深度为2
            best_score = float('-inf')
            best_move = None
            alpha = float('-inf')
            beta = float('inf')
            
            # 只考虑已有棋子周围的空位，减少搜索空间
            strategic_moves = []
            for i, j in available_moves:
                # 检查周围8个方向是否有棋子
                has_neighbor = False
                for di in [-1, 0, 1]:
                    for dj in [-1, 0, 1]:
                        if di == 0 and dj == 0:
                            continue
                        ni, nj = i + di, j + dj
                        if 0 <= ni < self.board_size and 0 <= nj < self.board_size and self.board[ni][nj] != ' ':
                            has_neighbor = True
                            break
                    if has_neighbor:
                        break
                if has_neighbor:
                    strategic_moves.append((i, j))
            
            # 如果没有找到有邻居的位置，使用所有可用位置
            if not strategic_moves:
                strategic_moves = available_moves
            
            # 限制搜索的位置数量，最多考虑15个位置
            if len(strategic_moves) > 15:
                # 对位置进行初步评估，选择最有潜力的15个位置
                move_scores = [(move, self.evaluate_position(move[0], move[1])) for move in strategic_moves]
                move_scores.sort(key=lambda x: x[1], reverse=True)
                strategic_moves = [move for move, _ in move_scores[:15]]
            
            for move in strategic_moves:
                self.board[move[0]][move[1]] = self.ai
                score = self.minimax(2, False, alpha, beta)  # 深度降低为2
                self.board[move[0]][move[1]] = ' '
                
                if score > best_score:
                    best_score = score
                    best_move = move
                alpha = max(alpha, best_score)
            
            return best_move
        else:
            # 简单难度：使用评估函数
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
                score += self.four_score
            elif consecutive >= 3:
                score += self.three_score
            else:
                score += consecutive * self.two_score
        
        # 评估玩家的威胁 - 提高权重
        self.board[x][y] = self.player
        for dx, dy in directions:
            consecutive = self.count_consecutive(x, y, dx, dy, self.player)
            if consecutive >= 4:
                score += self.four_score * 2  # 双倍权重用于阻挡
            elif consecutive >= 3:
                score += self.three_score * 2
            elif consecutive >= 2:
                score += self.two_score * 2
        
        # 额外策略：优先选择靠近中心的位置
        center = self.board_size // 2
        distance_to_center = abs(x - center) + abs(y - center)
        score += (10 - distance_to_center)
        
        self.board[x][y] = ' '  # 恢复空位
        return score

    def minimax(self, depth, is_maximizing, alpha, beta):
        # 检查是否达到终止条件
        if depth == 0:
            return self.evaluate_board()
        
        # 检查是否有一方已经获胜
        for i in range(self.board_size):
            for j in range(self.board_size):
                if self.board[i][j] != ' ':
                    if self.check_win(i, j, self.board[i][j]):
                        return self.win_score if self.board[i][j] == self.ai else -self.win_score
        
        available_moves = []
        # 只考虑已有棋子周围的空位，减少搜索空间
        for i in range(self.board_size):
            for j in range(self.board_size):
                if self.board[i][j] == ' ':
                    # 检查周围8个方向是否有棋子
                    has_neighbor = False
                    for di in [-1, 0, 1]:
                        for dj in [-1, 0, 1]:
                            if di == 0 and dj == 0:
                                continue
                            ni, nj = i + di, j + dj
                            if 0 <= ni < self.board_size and 0 <= nj < self.board_size and self.board[ni][nj] != ' ':
                                has_neighbor = True
                                break
                        if has_neighbor:
                            break
                    if has_neighbor:
                        available_moves.append((i, j))
        
        # 如果没有可用的位置或者没有邻居的位置，考虑所有空位
        if not available_moves:
            available_moves = [(i, j) for i in range(self.board_size) for j in range(self.board_size) if self.board[i][j] == ' ']
            if not available_moves:
                return 0
        
        if is_maximizing:
            max_eval = float('-inf')
            for move in available_moves:
                self.board[move[0]][move[1]] = self.ai
                eval = self.minimax(depth - 1, False, alpha, beta)
                self.board[move[0]][move[1]] = ' '
                max_eval = max(max_eval, eval)
                alpha = max(alpha, eval)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for move in available_moves:
                self.board[move[0]][move[1]] = self.player
                eval = self.minimax(depth - 1, True, alpha, beta)
                self.board[move[0]][move[1]] = ' '
                min_eval = min(min_eval, eval)
                beta = min(beta, eval)
                if beta <= alpha:
                    break
            return min_eval

    def evaluate_board(self):
        score = 0
        # 评估整个棋盘状态
        for i in range(self.board_size):
            for j in range(self.board_size):
                if self.board[i][j] != ' ':
                    directions = [(1,0), (0,1), (1,1), (1,-1)]
                    for dx, dy in directions:
                        consecutive = self.count_consecutive(i, j, dx, dy, self.board[i][j])
                        if consecutive >= 5:
                            return self.win_score if self.board[i][j] == self.ai else -self.win_score
                        elif consecutive == 4:
                            score += self.four_score if self.board[i][j] == self.ai else -self.four_score * 2
                        elif consecutive == 3:
                            score += self.three_score if self.board[i][j] == self.ai else -self.three_score * 2
                        elif consecutive == 2:
                            score += self.two_score if self.board[i][j] == self.ai else -self.two_score * 2
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
                        
                        # 检查难度按钮 - 只在简单和高级两种难度之间切换
                        if (diff_btn[0] <= mouse_pos[0] <= diff_btn[0] + diff_btn[2] and 
                            diff_btn[1] <= mouse_pos[1] <= diff_btn[1] + diff_btn[3]):
                            if self.ai_difficulty == 'easy':
                                self.ai_difficulty = 'hard'
                            else:
                                self.ai_difficulty = 'easy'
                            continue
                    
                    elif not self.game_over:
                        board_x, board_y = self.get_board_pos(mouse_pos)
                        if self.is_valid_move(board_x, board_y):
                            # 玩家回合
                            self.make_move(board_x, board_y, self.player)
                            self.game_history.append((self.player, board_x, board_y))
                            
                            if self.check_win(board_x, board_y, self.player):
                                self.game_over = True
                                self.player_score += 1
                                self.game_started = False
                                self.draw_board()
                                self.show_game_over("你赢了！")
                                continue
                            
                            # 更新推荐落子点
                            self.update_recommendations()
                            
                            # AI回合
                            ai_x, ai_y = self.ai_move()
                            self.make_move(ai_x, ai_y, self.ai)
                            self.game_history.append((self.ai, ai_x, ai_y))
                            
                            if self.check_win(ai_x, ai_y, self.ai):
                                self.game_over = True
                                self.ai_score += 1
                                self.game_started = False
                                self.draw_board()
                                self.show_game_over("电脑赢了！")
                                continue
                            
                            # 更新推荐落子点
                            self.update_recommendations()
            
            # 更新显示
            if not self.game_started or self.game_over:
                self.screen.fill((240, 200, 150))
                self.draw_buttons()
            else:
                self.draw_board()
            pygame.display.flip()

    def draw_board(self):
        # 清空屏幕并设置背景色
        self.screen.fill((240, 220, 180))  # 更温和的木色调
        
        # 绘制棋盘外边框
        pygame.draw.rect(self.screen, (160, 120, 95),  # 深木色边框
                        (self.margin - 20, self.margin - 20,
                         self.window_size - 2 * self.margin + 40,
                         self.window_size - 2 * self.margin + 40), 0)
        
        # 绘制棋盘内部
        pygame.draw.rect(self.screen, (220, 179, 92),  # 浅木色内部
                        (self.margin - 10, self.margin - 10,
                         self.window_size - 2 * self.margin + 20,
                         self.window_size - 2 * self.margin + 20), 0)
        
        # 绘制网格线
        for i in range(self.board_size):
            # 横线
            pygame.draw.line(self.screen, (120, 81, 45),  # 深棕色线条
                           (self.margin, self.margin + i * self.grid_size),
                           (self.window_size - self.margin, self.margin + i * self.grid_size), 2)
            # 竖线
            pygame.draw.line(self.screen, (120, 81, 45),  # 深棕色线条
                           (self.margin + i * self.grid_size, self.margin),
                           (self.margin + i * self.grid_size, self.window_size - self.margin), 2)
        
        # 绘制天元和星位
        star_points = [(3, 3), (11, 3), (3, 11), (11, 11), (7, 7),  # 天元和四角
                      (3, 7), (11, 7), (7, 3), (7, 11)]  # 边星
        for point in star_points:
            x = self.margin + point[0] * self.grid_size
            y = self.margin + point[1] * self.grid_size
            pygame.draw.circle(self.screen, (120, 81, 45), (x, y), 4)
        
        # 画棋子
        for i in range(self.board_size):
            for j in range(self.board_size):
                pos_x = self.margin + j * self.grid_size
                pos_y = self.margin + i * self.grid_size
                if self.board[i][j] == 'X':
                    # 黑子（使用更多层次的渐变和抗锯齿效果）
                    # 创建一个临时surface用于抗锯齿绘制
                    temp_surface = pygame.Surface((self.piece_radius*2+4, self.piece_radius*2+4), pygame.SRCALPHA)
                    # 绘制多层渐变以实现平滑效果
                    steps = 15  # 增加渐变步数
                    for r in range(self.piece_radius, 0, -1):
                        # 更平滑的颜色过渡
                        ratio = (self.piece_radius - r) / self.piece_radius
                        color_value = int(20 + ratio * 40)
                        pygame.draw.circle(temp_surface, (color_value, color_value, color_value, 255), 
                                         (self.piece_radius+2, self.piece_radius+2), r)
                    
                    # 添加外边缘过渡色，减少锯齿
                    pygame.draw.circle(temp_surface, (30, 30, 30, 255), 
                                     (self.piece_radius+2, self.piece_radius+2), 
                                     self.piece_radius+1)
                    
                    # 添加高光效果（更自然的位置和大小）
                    highlight_pos = (self.piece_radius+2-3, self.piece_radius+2-3)
                    pygame.draw.circle(temp_surface, (80, 80, 80, 255), 
                                     highlight_pos, self.piece_radius // 3)
                    pygame.draw.circle(temp_surface, (120, 120, 120, 255), 
                                     highlight_pos, self.piece_radius // 5)
                    
                    # 将临时surface绘制到主屏幕
                    self.screen.blit(temp_surface, 
                                   (pos_x - self.piece_radius - 2, 
                                    pos_y - self.piece_radius - 2))
                    
                elif self.board[i][j] == 'O':
                    # 白子（使用更多层次的渐变和抗锯齿效果）
                    # 创建一个临时surface用于抗锯齿绘制
                    temp_surface = pygame.Surface((self.piece_radius*2+4, self.piece_radius*2+4), pygame.SRCALPHA)
                    # 绘制多层渐变以实现平滑效果
                    steps = 15  # 增加渐变步数
                    for r in range(self.piece_radius, 0, -1):
                        # 更平滑的颜色过渡
                        ratio = (self.piece_radius - r) / self.piece_radius
                        color_value = int(255 - ratio * 20)
                        pygame.draw.circle(temp_surface, (color_value, color_value, color_value, 255), 
                                         (self.piece_radius+2, self.piece_radius+2), r)
                    
                    # 添加外边缘过渡色，减少锯齿
                    pygame.draw.circle(temp_surface, (220, 220, 220, 255), 
                                     (self.piece_radius+2, self.piece_radius+2), 
                                     self.piece_radius+1)
                    
                    # 添加边框（更细腻）
                    pygame.draw.circle(temp_surface, (200, 200, 200, 255), 
                                     (self.piece_radius+2, self.piece_radius+2), 
                                     self.piece_radius, 1)
                    
                    # 添加高光效果（更自然的位置和大小）
                    highlight_pos = (self.piece_radius+2-3, self.piece_radius+2-3)
                    pygame.draw.circle(temp_surface, (255, 255, 255, 255), 
                                     highlight_pos, self.piece_radius // 3)
                    pygame.draw.circle(temp_surface, (255, 255, 255, 255), 
                                     highlight_pos, self.piece_radius // 5)
                    
                    # 将临时surface绘制到主屏幕
                    self.screen.blit(temp_surface, 
                                   (pos_x - self.piece_radius - 2, 
                                    pos_y - self.piece_radius - 2))
        
        # 绘制分析面板
        self.draw_analysis_panel()
    
    def draw_analysis_panel(self):
        panel_width = 200
        panel_x = self.window_size + 20
        
        # 绘制分析面板背景
        pygame.draw.rect(self.screen, (240, 230, 210), (self.window_size, 0, panel_width, self.window_size))
        pygame.draw.line(self.screen, (160, 120, 95), (self.window_size, 0), (self.window_size, self.window_size), 3)
        
        # 绘制面板标题
        title_height = 50
        pygame.draw.rect(self.screen, (160, 120, 95), (self.window_size, 0, panel_width, title_height))
        pygame.draw.rect(self.screen, (120, 81, 45), (self.window_size, 0, panel_width, title_height), 2)
        
        title_text = self.score_font.render('局势分析', True, (255, 255, 255))
        title_rect = title_text.get_rect(center=(self.window_size + panel_width//2, title_height//2))
        self.screen.blit(title_text, title_rect)
        
        # 显示胜率 - 添加进度条效果
        win_label = self.analysis_font.render('当前胜率:', True, (60, 30, 10))
        self.screen.blit(win_label, (self.window_size + 15, title_height + 20))
        
        # 绘制胜率进度条背景
        progress_width = 170
        progress_height = 24
        progress_x = self.window_size + 15
        progress_y = title_height + 50
        pygame.draw.rect(self.screen, (220, 220, 220), 
                        (progress_x, progress_y, progress_width, progress_height), 0, 5)
        
        # 绘制胜率进度条填充
        fill_width = int(progress_width * (self.win_probability / 100))
        if fill_width > 0:
            pygame.draw.rect(self.screen, (60, 180, 60), 
                            (progress_x, progress_y, fill_width, progress_height), 0, 5)
        
        # 绘制胜率进度条边框
        pygame.draw.rect(self.screen, (120, 120, 120), 
                        (progress_x, progress_y, progress_width, progress_height), 2, 5)
        
        # 显示胜率数值
        win_text = self.analysis_font.render(f'{self.win_probability:.1f}%', True, (60, 30, 10))
        win_rect = win_text.get_rect(center=(progress_x + progress_width//2, progress_y + progress_height//2))
        self.screen.blit(win_text, win_rect)
        
        # 显示推荐落子点
        if self.recommendations:
            rec_y = title_height + 90
            rec_title = self.analysis_font.render('推荐落子:', True, (60, 30, 10))
            self.screen.blit(rec_title, (self.window_size + 15, rec_y))
            
            for i, (move, win_rate) in enumerate(self.recommendations[:2]):
                x, y = move
                # 绘制推荐落子点的背景
                rec_bg_y = rec_y + 30 + i * 60
                pygame.draw.rect(self.screen, (220, 179, 92, 150), 
                                (self.window_size + 15, rec_bg_y, 170, 50), 0, 8)
                pygame.draw.rect(self.screen, (120, 81, 45), 
                                (self.window_size + 15, rec_bg_y, 170, 50), 2, 8)
                
                # 绘制推荐落子点的文本
                pos_text = self.analysis_font.render(f'推荐{i+1}: ({x+1},{y+1})', True, (60, 30, 10))
                self.screen.blit(pos_text, (self.window_size + 25, rec_bg_y + 10))
                
                # 绘制胜率
                prob_text = self.analysis_font.render(f'{win_rate:.1f}%', True, (200, 0, 0))
                self.screen.blit(prob_text, (self.window_size + 25, rec_bg_y + 30))
        
        # 显示游戏历史
        # 计算游戏历史的起始位置，确保在推荐落子点之后
        if self.recommendations and len(self.recommendations) >= 2:
            history_y = rec_y + 30 + 2 * 60 + 20  # 在两个推荐落子点之后加20像素间距
        elif self.recommendations and len(self.recommendations) == 1:
            history_y = rec_y + 30 + 60 + 20  # 在一个推荐落子点之后加20像素间距
        else:
            history_y = rec_y + 30  # 没有推荐落子点时
        
        history_title = self.analysis_font.render('游戏历史:', True, (0, 0, 0))
        self.screen.blit(history_title, (self.window_size + 15, history_y))
        
        for i, move in enumerate(self.game_history[-5:]):
            player, x, y = move
            player_text = '玩家' if player == self.player else 'AI'
            move_text = self.analysis_font.render(f'{player_text}: ({x+1},{y+1})', True, (0, 0, 0))
            self.screen.blit(move_text, (self.window_size + 15, history_y + 30 + i*25))
    
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
    
    def check_win(self, x, y, player, board=None):
        if board is None:
            board = self.board
            
        directions = [(1,0), (0,1), (1,1), (1,-1)]  # 水平、垂直、两个对角线
        for dx, dy in directions:
            count = 1
            
            # 向一个方向计数
            temp_x, temp_y = x + dx, y + dy
            while 0 <= temp_x < self.board_size and 0 <= temp_y < self.board_size and board[temp_x][temp_y] == player:
                count += 1
                temp_x += dx
                temp_y += dy
            
            # 向相反方向计数
            temp_x, temp_y = x - dx, y - dy
            while 0 <= temp_x < self.board_size and 0 <= temp_y < self.board_size and board[temp_x][temp_y] == player:
                count += 1
                temp_x -= dx
                temp_y -= dy
            
            if count >= 5:
                return True
        return False
    
    def show_game_over(self, message):
        # 创建动画效果
        for alpha in range(0, 129, 8):  # 渐变效果
            # 绘制棋盘
            self.draw_board()
            
            # 绘制半透明背景
            s = pygame.Surface((self.window_size, self.window_size), pygame.SRCALPHA)
            s.fill((0, 0, 0, alpha))
            self.screen.blit(s, (0, 0))
            
            pygame.display.flip()
            pygame.time.delay(30)  # 控制动画速度
        
        # 创建消息框背景
        msg_width, msg_height = 400, 200
        msg_x = (self.window_size - msg_width) // 2
        msg_y = (self.window_size - msg_height) // 2
        
        # 绘制消息框阴影
        pygame.draw.rect(self.screen, (30, 30, 30), 
                        (msg_x + 8, msg_y + 8, msg_width, msg_height), 0, 15)
        
        # 绘制消息框背景
        pygame.draw.rect(self.screen, (220, 179, 92), 
                        (msg_x, msg_y, msg_width, msg_height), 0, 15)
        
        # 绘制消息框边框
        pygame.draw.rect(self.screen, (120, 81, 45), 
                        (msg_x, msg_y, msg_width, msg_height), 4, 15)
        
        # 绘制游戏结束消息
        text = self.game_over_font.render(message, True, (60, 30, 10))
        text_rect = text.get_rect(center=(self.window_size//2, self.window_size//2 - 20))
        self.screen.blit(text, text_rect)
        
        # 添加提示信息
        hint = self.score_font.render("点击开始新游戏", True, (60, 30, 10))
        hint_rect = hint.get_rect(center=(self.window_size//2, self.window_size//2 + 40))
        self.screen.blit(hint, hint_rect)
        
        pygame.display.flip()

    def update_recommendations(self):
        # 获取所有可用的位置
        available_moves = [(i, j) for i in range(self.board_size) for j in range(self.board_size) if self.board[i][j] == ' ']
        
        # 如果没有可用位置，直接返回
        if not available_moves:
            return
        
        # 评估每个位置的分数
        move_scores = []
        for move in available_moves:
            score = self.evaluate_position(move[0], move[1])
            win_rate = min(100, max(0, score / 10))  # 将分数转换为0-100的胜率
            move_scores.append((move, score, win_rate))
        
        # 按分数排序，取前两个作为推荐
        move_scores.sort(key=lambda x: x[1], reverse=True)
        self.recommendations = [(move, win_rate) for move, _, win_rate in move_scores[:2]]
        
        # 更新玩家胜率 - 基于最佳位置的评分
        if move_scores:
            best_score = move_scores[0][1]
            # 将最佳分数映射到胜率范围
            self.win_probability = min(95, max(5, 50 + best_score / 20))
        else:
            self.win_probability = 50.0

if __name__ == "__main__":
    game = Gomoku()
    game.play()