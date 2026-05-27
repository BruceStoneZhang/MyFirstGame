// levels.js — 关卡数据定义
// 全局变量: LEVELS (数组), ENEMY_TYPES (枚举)

const ENEMY_TYPES = {
  GARDENER: 'gardener',
  FARMER: 'farmer',
  QUEEN: 'queen',
  GUARD: 'guard',
  WOODCUTTER: 'woodcutter'
};

const LEVELS = [
  // ========== 第1关：农场初探（教学关） ==========
  {
    name: '第 1 关：农场初探（鹅见鹅爱）',
    intro: '提示：先去顺点花园宝贝。按 E 互动，动作要像没事鹅一样。',
    gameType: 'tutorial',
    gooseStart: { x: 94, y: 438 },
    exitZone: { x: 36, y: 380, width: 120, height: 110 },
    walls: [
      { x: 188, y: 58, width: 16, height: 160 },
      { x: 188, y: 296, width: 16, height: 166 },
      { x: 330, y: 138, width: 220, height: 18 },
      { x: 330, y: 138, width: 18, height: 160 },
      { x: 532, y: 138, width: 18, height: 110 },
      { x: 648, y: 76, width: 18, height: 140 },
      { x: 648, y: 286, width: 18, height: 176 },
      { x: 770, y: 286, width: 110, height: 18 }
    ],
    bushes: [
      { x: 80, y: 128, width: 84, height: 62 },
      { x: 382, y: 322, width: 94, height: 56 },
      { x: 700, y: 118, width: 96, height: 62 },
      { x: 808, y: 380, width: 84, height: 62 }
    ],
    enemy: {
      type: ENEMY_TYPES.GARDENER,
      start: { x: 280, y: 88 },
      speed: 75,
      alertRise: 32, alertFall: 56,
      chaseSpeed: 108,
      route: [
        { x: 280, y: 88 }, { x: 440, y: 88 },
        { x: 596, y: 202 }, { x: 716, y: 252 },
        { x: 854, y: 214 }, { x: 854, y: 404 },
        { x: 524, y: 424 }, { x: 250, y: 354 }
      ]
    },
    items: [
      { x: 278, y: 428, emoji: '🔑', name: '万能钥匙（其实也就一把）' },
      { x: 430, y: 220, emoji: '🥕', name: '巨甜胡萝卜' },
      { x: 728, y: 110, emoji: '🧺', name: '神秘野餐篮' },
      { x: 852, y: 430, emoji: '🔔', name: '吵醒全村的铜铃' }
    ],
    npcs: [],
    tasks: []
  },

  // ========== 第2关：农场小花招 ==========
  {
    name: '第 2 关：农场整活现场',
    intro: '提示：先把花盆推到猪圈边，借猪之口完成花艺重构。',
    gameType: 'task',
    gooseStart: { x: 80, y: 430 },
    walls: [
      { x: 680, y: 60, width: 200, height: 16 },
      { x: 680, y: 60, width: 16, height: 140 },
      { x: 680, y: 184, width: 200, height: 16 },
      { x: 50, y: 320, width: 16, height: 170 },
      { x: 50, y: 474, width: 860, height: 16 },
      { x: 894, y: 320, width: 16, height: 170 },
      { x: 350, y: 200, width: 120, height: 50 },
      { x: 160, y: 70, width: 16, height: 140 },
      { x: 500, y: 340, width: 200, height: 16 }
    ],
    bushes: [
      { x: 50, y: 50, width: 80, height: 56 },
      { x: 760, y: 310, width: 80, height: 56 },
      { x: 280, y: 400, width: 80, height: 56 }
    ],
    enemy: {
      type: ENEMY_TYPES.FARMER,
      start: { x: 410, y: 225 },
      speed: 90,
      alertRise: 72, alertFall: 28,
      chaseSpeed: 130,
      route: [
        { x: 410, y: 225 }, { x: 410, y: 140 },
        { x: 620, y: 110 }, { x: 750, y: 140 },
        { x: 750, y: 400 }, { x: 600, y: 380 },
        { x: 280, y: 420 }, { x: 200, y: 300 },
        { x: 200, y: 150 }, { x: 410, y: 140 }
      ],
      sitSpot: { x: 410, y: 225 },
      sitDuration: 8,
      patrolDuration: 12
    },
    items: [],
    npcs: [
      { id: 'pig', x: 760, y: 130, emoji: '🐷', label: '猪', animPhase: 0 },
      { id: 'kid', x: 580, y: 375, emoji: '👦', label: '小孩' },
      { id: 'waterCup', x: 600, y: 365, emoji: '🥤', label: '水杯' }
    ],
    objects: [
      { id: 'flowerPot', x: 320, y: 260, emoji: '🪴', label: '花盆', pushed: false }
    ],
    tasks: [
      {
        id: 1,
        desc: '让猪吃到农夫的花',
        type: 'push',
        targetObjId: 'flowerPot',
        targetZone: { x: 680, y: 60, width: 200, height: 140 },
        hint: '走到花盆旁按 E 键推花盆，给猪送上今日鲜花自助餐',
        onCompleteSpeech: { speaker: 'pig', text: '哼哼！这花比饲料香多了！🌺', duration: 2.5 },
        onCompleteHint: '猪已光盘！现在去制造“课本泡水事故”。'
      },
      {
        id: 2,
        desc: '让小孩的书湿掉',
        type: 'proximity',
        targetObjId: 'waterCup',
        interactRange: 35,
        hint: '溜到小孩身边，靠近水杯按 E 键，完成精准泼水',
        onCompleteSpeech: { speaker: 'kid', text: '啊——我的书变成水系教材了！', duration: 2.5 },
        onCompleteHint: null
      }
    ]
  },

  // ========== 第3关：游乐场大翻车 ==========
  {
    name: '第 3 关：游乐场大翻车',
    intro: '提示：趁园长分心，溜进游乐场中心把皇冠啄下，顺便别吓到小猫咪。',
    gameType: 'task',
    gooseStart: { x: 72, y: 140 },
    walls: [
      { x: 40, y: 40, width: 880, height: 16 },
      { x: 40, y: 40, width: 16, height: 460 },
      { x: 904, y: 40, width: 16, height: 460 },
      { x: 40, y: 484, width: 880, height: 16 },
      { x: 580, y: 320, width: 100, height: 60 },
      { x: 380, y: 160, width: 140, height: 50 },
      { x: 40, y: 260, width: 200, height: 16 }
    ],
    bushes: [
      { x: 60, y: 100, width: 90, height: 60 },
      { x: 780, y: 120, width: 80, height: 56 },
      { x: 500, y: 400, width: 80, height: 56 }
    ],
    enemy: {
      type: ENEMY_TYPES.QUEEN,
      start: { x: 450, y: 185 },
      speed: 0,
      alertRise: 80, alertFall: 25,
      chaseSpeed: 0,
      route: [],
      lookDownInterval: 10,
      lookDownDuration: 3,
      lookDownVision: 60,
      normalVision: 200
    },
    secondaryEnemy: {
      id: 'guard',
      type: ENEMY_TYPES.GUARD,
      start: { x: 130, y: 300 },
      speed: 70,
      alertRise: 0, alertFall: 0,
      chaseSpeed: 0,
      route: [
        { x: 130, y: 290 }, { x: 220, y: 290 },
        { x: 220, y: 300 }, { x: 130, y: 300 }
      ],
      detectRange: 80,
      detectAngle: Math.PI / 3
    },
    items: [],
    npcs: [
      { id: 'kitten', x: 760, y: 360, emoji: '🐱', label: '小猫咪' }
    ],
    objects: [
      { id: 'crown', x: 460, y: 155, emoji: '👑', label: '皇冠',
        state: 'onHead', tablePos: { x: 600, y: 310 } },
      { id: 'apple', x: 610, y: 340, emoji: '🍎', label: '红苹果',
        state: 'onTable', sewerPos: { x: 640, y: 380 } },
      { id: 'sewer', x: 630, y: 375, width: 40, height: 30, label: '下水道' },
      { id: 'table', x: 580, y: 320, width: 100, height: 60, label: '石桌' }
    ],
    tasks: [
      {
        id: 1,
        desc: '把皇冠啄到桌子底下',
        type: 'proximity',
        targetObjId: 'crown',
        interactRange: 40,
        requiresEnemyState: 'lookingDown',
        hint: '趁园长低头整理演出服时，接近皇冠按 E 键轻轻一啄',
        onComplete: function(state) {
          const crown = state.objects.find(o => o.id === 'crown');
          crown.state = 'underTable';
          crown.x = crown.tablePos.x;
          crown.y = crown.tablePos.y;
        },
        onCompleteSpeech: { speaker: 'queen', text: '咦？我的皇冠刚才还在头上！', duration: 2.5 },
        onCompleteHint: '皇冠已“隐身”到桌下！现在把桌上的苹果推进下水道。'
      },
      {
        id: 2,
        desc: '把苹果扔进下水道',
        type: 'push',
        targetObjId: 'apple',
        targetZone: { x: 625, y: 370, width: 50, height: 40 },
        hint: '趁园长找皇冠时，溜到小吃摊旁把苹果推进排水口',
        onComplete: function(state) {
          const apple = state.objects.find(o => o.id === 'apple');
          apple.state = 'inSewer';
          apple.x = -100; apple.y = -100;
        },
        onCompleteSpeech: { speaker: 'queen', text: '等等，我的苹果也离宫出走了？', duration: 2 },
        onCompleteHint: '小猫咪开始巡场了！靠近它按 E，让它把园长衣服变闪亮。'
      },
      {
        id: 3,
        desc: '让小猫咪把园长衣服变成发光款',
        type: 'proximity',
        targetObjId: 'kitten',
        interactRange: 48,
        hint: '追上乱跑的小猫咪，靠近它按 E 触发“喵光改造”',
        onComplete: function(state) {
          if (state.enemy) {
            state.enemy._glowOutfit = true;
          }
          if (state.level && state.level.enemy) {
            state.level.enemy._glowOutfit = true;
          }
        },
        onCompleteSpeech: { speaker: 'kitten', text: '喵呜！发光套装已激活✨', duration: 2.5 },
        onCompleteHint: null
      }
    ]
  }
];
