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
  },

  // ========== 第4关：夜市鹅闹剧 ==========
  {
    name: '第 4 关：夜市鹅闹剧',
    intro: '提示：把夜市搅得热闹一点，但别被摊主当场抓包。',
    gameType: 'task',
    gooseStart: { x: 90, y: 450 },
    walls: [
      { x: 40, y: 40, width: 880, height: 16 },
      { x: 40, y: 40, width: 16, height: 460 },
      { x: 904, y: 40, width: 16, height: 460 },
      { x: 40, y: 484, width: 880, height: 16 },
      { x: 250, y: 120, width: 180, height: 16 },
      { x: 520, y: 120, width: 240, height: 16 },
      { x: 330, y: 260, width: 16, height: 140 },
      { x: 620, y: 250, width: 16, height: 180 }
    ],
    bushes: [
      { x: 70, y: 110, width: 92, height: 62 },
      { x: 430, y: 340, width: 92, height: 62 },
      { x: 780, y: 360, width: 92, height: 62 }
    ],
    enemy: {
      type: ENEMY_TYPES.FARMER,
      start: { x: 470, y: 230 },
      speed: 95,
      alertRise: 78, alertFall: 30,
      chaseSpeed: 138,
      route: [
        { x: 470, y: 230 }, { x: 700, y: 230 },
        { x: 820, y: 330 }, { x: 650, y: 430 },
        { x: 420, y: 430 }, { x: 220, y: 350 },
        { x: 220, y: 210 }, { x: 380, y: 170 }
      ],
      sitSpot: { x: 470, y: 230 },
      sitDuration: 5,
      patrolDuration: 11
    },
    items: [],
    npcs: [
      { id: 'kid', x: 760, y: 420, emoji: '🧒', label: '买糖小孩' },
      { id: 'neighbors', x: 180, y: 90, emoji: '🧑', label: '围观群众' },
      { id: 'waterCup', x: 735, y: 398, emoji: '🥤', label: '巨型果汁' }
    ],
    objects: [
      { id: 'lantern', x: 285, y: 105, emoji: '🏮', label: '夜市灯笼' },
      { id: 'drum', x: 540, y: 300, emoji: '🥁', label: '鼓' },
      { id: 'radio', x: 250, y: 430, emoji: '📻', label: '广场音响' }
    ],
    tasks: [
      {
        id: 1,
        desc: '把夜市灯笼推到主舞台',
        type: 'push',
        targetObjId: 'lantern',
        targetZone: { x: 520, y: 120, width: 240, height: 90 },
        hint: '靠近灯笼按 E，一路推去舞台中心。',
        onCompleteSpeech: { speaker: 'neighbors', text: '哇！鹅导演开灯了！', duration: 2.3 },
        onCompleteHint: '很好！下一步让小孩的饮料“精准失手”。'
      },
      {
        id: 2,
        desc: '让小孩把果汁泼到鼓上',
        type: 'proximity',
        targetObjId: 'waterCup',
        interactRange: 38,
        hint: '溜到小孩旁边，靠近果汁按 E，制造“鼓点特效”。',
        onCompleteSpeech: { speaker: 'kid', text: '哎呀！我的果汁变成打击乐了！', duration: 2.4 },
        onCompleteHint: '最后把音响推到人群边，开始鹅式蹦迪。'
      },
      {
        id: 3,
        desc: '把广场音响推到围观区',
        type: 'push',
        targetObjId: 'radio',
        targetZone: { x: 120, y: 70, width: 150, height: 90 },
        hint: '趁摊主巡逻转身，赶紧把音响推进人群边。',
        onCompleteSpeech: { speaker: 'neighbors', text: '这只鹅会整活！再来一段！', duration: 2.4 },
        onCompleteHint: null
      }
    ]
  },

  // ========== 第5关：湖心岛终极潜行 ==========
  {
    name: '第 5 关：湖心岛终极潜行',
    intro: '提示：偷齐纪念品，再穿过巡逻线回到码头出口。',
    gameType: 'tutorial',
    gooseStart: { x: 86, y: 446 },
    exitZone: { x: 46, y: 392, width: 130, height: 92 },
    walls: [
      { x: 210, y: 60, width: 16, height: 170 },
      { x: 210, y: 290, width: 16, height: 170 },
      { x: 340, y: 150, width: 210, height: 16 },
      { x: 340, y: 150, width: 16, height: 180 },
      { x: 530, y: 150, width: 16, height: 120 },
      { x: 640, y: 80, width: 16, height: 140 },
      { x: 640, y: 290, width: 16, height: 170 },
      { x: 760, y: 290, width: 140, height: 16 }
    ],
    bushes: [
      { x: 84, y: 136, width: 92, height: 62 },
      { x: 390, y: 334, width: 96, height: 62 },
      { x: 694, y: 118, width: 98, height: 62 },
      { x: 808, y: 382, width: 88, height: 62 }
    ],
    enemy: {
      type: ENEMY_TYPES.GARDENER,
      start: { x: 286, y: 92 },
      speed: 86,
      alertRise: 40, alertFall: 54,
      chaseSpeed: 120,
      route: [
        { x: 286, y: 92 }, { x: 440, y: 92 },
        { x: 598, y: 208 }, { x: 716, y: 250 },
        { x: 860, y: 220 }, { x: 860, y: 410 },
        { x: 526, y: 428 }, { x: 256, y: 356 }
      ]
    },
    secondaryEnemy: {
      id: 'guard',
      type: ENEMY_TYPES.GUARD,
      start: { x: 128, y: 286 },
      speed: 76,
      alertRise: 0, alertFall: 0,
      chaseSpeed: 0,
      route: [
        { x: 128, y: 286 }, { x: 228, y: 286 },
        { x: 228, y: 304 }, { x: 128, y: 304 }
      ],
      detectRange: 86,
      detectAngle: Math.PI / 3
    },
    items: [
      { x: 286, y: 430, emoji: '🧭', name: '旧船罗盘' },
      { x: 430, y: 224, emoji: '🗺️', name: '航海地图' },
      { x: 730, y: 112, emoji: '🎣', name: '金鱼竿' },
      { x: 852, y: 430, emoji: '🔦', name: '夜航灯' },
      { x: 598, y: 338, emoji: '📦', name: '神秘补给箱' }
    ],
    npcs: [],
    tasks: []
  },

  // ========== 第6关：博物馆鹅导游 ==========
  {
    name: '第 6 关：博物馆鹅导游',
    intro: '提示：雨天里先想办法让管理员把雨伞扔掉，再继续整活。',
    gameType: 'task',
    gooseStart: { x: 86, y: 440 },
    walls: [
      { x: 40, y: 40, width: 880, height: 16 },
      { x: 40, y: 40, width: 16, height: 460 },
      { x: 904, y: 40, width: 16, height: 460 },
      { x: 40, y: 484, width: 880, height: 16 },
      { x: 260, y: 140, width: 220, height: 16 },
      { x: 560, y: 140, width: 220, height: 16 },
      { x: 360, y: 260, width: 16, height: 170 },
      { x: 610, y: 250, width: 16, height: 170 }
    ],
    bushes: [
      { x: 82, y: 112, width: 88, height: 60 },
      { x: 450, y: 360, width: 88, height: 60 },
      { x: 780, y: 340, width: 88, height: 60 }
    ],
    enemy: {
      type: ENEMY_TYPES.FARMER,
      start: { x: 470, y: 230 },
      speed: 92,
      alertRise: 74, alertFall: 30,
      chaseSpeed: 136,
      route: [
        { x: 470, y: 230 }, { x: 700, y: 230 },
        { x: 830, y: 320 }, { x: 690, y: 430 },
        { x: 430, y: 430 }, { x: 220, y: 340 },
        { x: 220, y: 220 }, { x: 380, y: 170 }
      ],
      sitSpot: { x: 470, y: 230 },
      sitDuration: 6,
      patrolDuration: 10
    },
    items: [],
    npcs: [
      { id: 'kid', x: 770, y: 418, emoji: '🧑‍🎓', label: '参观学生' },
      { id: 'neighbors', x: 170, y: 92, emoji: '🧑', label: '游客' },
      { id: 'waterCup', x: 748, y: 396, emoji: '🧃', label: '果汁盒' }
    ],
    objects: [
      { id: 'banner', x: 290, y: 120, emoji: '🎏', label: '展览旗帜' },
      { id: 'speaker', x: 250, y: 430, emoji: '🔊', label: '讲解音箱' },
      { id: 'camera', x: 545, y: 300, emoji: '📷', label: '拍照机位' }
    ],
    tasks: [
      {
        id: 1,
        desc: '让管理员把雨伞扔掉',
        type: 'proximity',
        targetObjId: 'banner',
        interactRange: 42,
        requiresEnemyState: 'holdingUmbrella',
        hint: '趁管理员撑伞巡逻时靠近展览旗帜按 E，吓得她把雨伞丢开。',
        onComplete: function(state) {
          if (state.enemy) {
            state.enemy._umbrellaDropped = true;
            state.enemy._hasUmbrella = true;
          }
          if (state.level && state.level.enemy) {
            state.level.enemy._umbrellaDropped = true;
          }
        },
        onCompleteSpeech: { speaker: 'farmer', text: '哎呀！我的伞掉哪去了！☔', duration: 2.3 },
        onCompleteHint: '管理员被雨淋得更慢了！下一步把旗帜推到中央展台。'
      },
      {
        id: 2,
        desc: '把展览旗帜推到中央展台',
        type: 'push',
        targetObjId: 'banner',
        targetZone: { x: 560, y: 140, width: 220, height: 80 },
        hint: '靠近旗帜按 E，把它推到主展台。',
        onCompleteSpeech: { speaker: 'neighbors', text: '这导览风格很鹅术！', duration: 2.3 },
        onCompleteHint: '下一步：让学生的果汁制造“互动艺术”。'
      },
      {
        id: 3,
        desc: '让果汁洒在拍照机位旁',
        type: 'proximity',
        targetObjId: 'waterCup',
        interactRange: 36,
        hint: '悄悄靠近果汁盒按 E，制造展厅小事故。',
        onCompleteSpeech: { speaker: 'kid', text: '啊！我把果汁当滤镜用了！', duration: 2.4 },
        onCompleteHint: '最后把音箱推到游客区，开启鹅式讲解。'
      },
      {
        id: 4,
        desc: '把讲解音箱推到游客区',
        type: 'push',
        targetObjId: 'speaker',
        targetZone: { x: 108, y: 70, width: 170, height: 90 },
        hint: '找准管理员转身时机，快速把音箱推过去。',
        onCompleteSpeech: { speaker: 'neighbors', text: '欢迎收听大鹅讲解频道！', duration: 2.4 },
        onCompleteHint: null
      }
    ]
  },

  // ========== 第7关：雨夜码头急行 ==========
  {
    name: '第 7 关：雨夜码头急行',
    intro: '提示：雨夜视线差，正适合潜行收集。拿齐物资立刻回撤。',
    gameType: 'tutorial',
    gooseStart: { x: 88, y: 448 },
    exitZone: { x: 46, y: 392, width: 130, height: 92 },
    walls: [
      { x: 206, y: 66, width: 16, height: 170 },
      { x: 206, y: 292, width: 16, height: 170 },
      { x: 336, y: 156, width: 214, height: 16 },
      { x: 336, y: 156, width: 16, height: 176 },
      { x: 534, y: 156, width: 16, height: 120 },
      { x: 648, y: 84, width: 16, height: 138 },
      { x: 648, y: 292, width: 16, height: 170 },
      { x: 768, y: 292, width: 136, height: 16 }
    ],
    bushes: [
      { x: 84, y: 140, width: 90, height: 62 },
      { x: 394, y: 334, width: 96, height: 62 },
      { x: 700, y: 122, width: 98, height: 62 },
      { x: 812, y: 384, width: 88, height: 62 }
    ],
    enemy: {
      type: ENEMY_TYPES.GARDENER,
      start: { x: 290, y: 96 },
      speed: 90,
      alertRise: 42, alertFall: 52,
      chaseSpeed: 124,
      route: [
        { x: 290, y: 96 }, { x: 444, y: 96 },
        { x: 602, y: 212 }, { x: 722, y: 252 },
        { x: 860, y: 224 }, { x: 860, y: 410 },
        { x: 530, y: 430 }, { x: 262, y: 360 }
      ]
    },
    secondaryEnemy: {
      id: 'guard',
      type: ENEMY_TYPES.GUARD,
      start: { x: 132, y: 288 },
      speed: 80,
      alertRise: 0, alertFall: 0,
      chaseSpeed: 0,
      route: [
        { x: 132, y: 288 }, { x: 236, y: 288 },
        { x: 236, y: 306 }, { x: 132, y: 306 }
      ],
      detectRange: 88,
      detectAngle: Math.PI / 3
    },
    items: [
      { x: 290, y: 432, emoji: '🪝', name: '船钩' },
      { x: 434, y: 228, emoji: '🧰', name: '维修工具箱' },
      { x: 734, y: 116, emoji: '⚓', name: '纪念船锚' },
      { x: 854, y: 432, emoji: '🛟', name: '救生圈' },
      { x: 602, y: 340, emoji: '📻', name: '航道对讲机' },
      { x: 518, y: 188, emoji: '🔋', name: '应急电池' }
    ],
    npcs: [],
    tasks: []
  },

  // ========== 第8关：王冠庆典返场 ==========
  {
    name: '第 8 关：王冠庆典返场',
    intro: '提示：趁园长低头，连做三件庆典整活。',
    gameType: 'task',
    gooseStart: { x: 74, y: 142 },
    walls: [
      { x: 40, y: 40, width: 880, height: 16 },
      { x: 40, y: 40, width: 16, height: 460 },
      { x: 904, y: 40, width: 16, height: 460 },
      { x: 40, y: 484, width: 880, height: 16 },
      { x: 580, y: 320, width: 110, height: 60 },
      { x: 382, y: 160, width: 146, height: 50 },
      { x: 40, y: 260, width: 204, height: 16 }
    ],
    bushes: [
      { x: 62, y: 102, width: 90, height: 60 },
      { x: 782, y: 122, width: 82, height: 56 },
      { x: 506, y: 404, width: 82, height: 56 }
    ],
    enemy: {
      type: ENEMY_TYPES.QUEEN,
      start: { x: 452, y: 186 },
      speed: 0,
      alertRise: 82, alertFall: 25,
      chaseSpeed: 0,
      route: [],
      lookDownInterval: 9,
      lookDownDuration: 3,
      lookDownVision: 62,
      normalVision: 206
    },
    secondaryEnemy: {
      id: 'guard',
      type: ENEMY_TYPES.GUARD,
      start: { x: 132, y: 302 },
      speed: 72,
      alertRise: 0, alertFall: 0,
      chaseSpeed: 0,
      route: [
        { x: 132, y: 292 }, { x: 224, y: 292 },
        { x: 224, y: 304 }, { x: 132, y: 304 }
      ],
      detectRange: 82,
      detectAngle: Math.PI / 3
    },
    items: [],
    npcs: [
      { id: 'kitten', x: 758, y: 362, emoji: '🐱', label: '礼仪猫' },
      { id: 'neighbors', x: 134, y: 90, emoji: '🧑', label: '观礼路人' }
    ],
    objects: [
      { id: 'banner', x: 462, y: 154, emoji: '🎀', label: '庆典绶带' },
      { id: 'cake', x: 614, y: 342, emoji: '🎂', label: '庆典蛋糕' },
      { id: 'confettiBox', x: 258, y: 430, emoji: '🎉', label: '礼花箱' }
    ],
    tasks: [
      {
        id: 1,
        desc: '趁园长低头时啄走庆典绶带',
        type: 'proximity',
        targetObjId: 'banner',
        interactRange: 42,
        requiresEnemyState: 'lookingDown',
        hint: '等待园长低头，再靠近绶带按 E。',
        onCompleteSpeech: { speaker: 'queen', text: '我的庆典造型怎么少了一条？', duration: 2.4 },
        onCompleteHint: '好机会！把蛋糕推去观礼区。'
      },
      {
        id: 2,
        desc: '把庆典蛋糕推到观礼区',
        type: 'push',
        targetObjId: 'cake',
        targetZone: { x: 100, y: 70, width: 180, height: 90 },
        hint: '趁守卫转身，把蛋糕快速推进人群。',
        onCompleteSpeech: { speaker: 'neighbors', text: '这蛋糕是鹅王送的吗？', duration: 2.3 },
        onCompleteHint: '最后去找礼仪猫，触发庆典礼花。'
      },
      {
        id: 3,
        desc: '让礼仪猫点亮礼花箱',
        type: 'proximity',
        targetObjId: 'kitten',
        interactRange: 50,
        hint: '靠近礼仪猫按 E，让它帮你完成收尾。',
        onCompleteSpeech: { speaker: 'kitten', text: '喵！礼花发射！🎉', duration: 2.4 },
        onCompleteHint: null
      }
    ]
  },

  // ========== 第9关：旧城区晨市突围 ==========
  {
    name: '第 9 关：旧城区晨市突围',
    intro: '提示：清晨人少但巡逻更紧，偷齐补给后立刻撤离。',
    gameType: 'tutorial',
    gooseStart: { x: 88, y: 446 },
    exitZone: { x: 44, y: 390, width: 132, height: 94 },
    walls: [
      { x: 208, y: 62, width: 16, height: 172 },
      { x: 208, y: 292, width: 16, height: 168 },
      { x: 338, y: 154, width: 216, height: 16 },
      { x: 338, y: 154, width: 16, height: 178 },
      { x: 536, y: 154, width: 16, height: 122 },
      { x: 650, y: 82, width: 16, height: 140 },
      { x: 650, y: 292, width: 16, height: 170 },
      { x: 770, y: 292, width: 134, height: 16 }
    ],
    bushes: [
      { x: 84, y: 138, width: 90, height: 62 },
      { x: 392, y: 336, width: 96, height: 62 },
      { x: 704, y: 120, width: 98, height: 62 },
      { x: 812, y: 384, width: 88, height: 62 }
    ],
    enemy: {
      type: ENEMY_TYPES.GARDENER,
      start: { x: 292, y: 94 },
      speed: 92,
      alertRise: 44, alertFall: 52,
      chaseSpeed: 126,
      route: [
        { x: 292, y: 94 }, { x: 448, y: 94 },
        { x: 606, y: 210 }, { x: 724, y: 252 },
        { x: 862, y: 224 }, { x: 862, y: 412 },
        { x: 532, y: 430 }, { x: 262, y: 358 }
      ]
    },
    secondaryEnemy: {
      id: 'guard',
      type: ENEMY_TYPES.GUARD,
      start: { x: 134, y: 288 },
      speed: 82,
      alertRise: 0, alertFall: 0,
      chaseSpeed: 0,
      route: [
        { x: 134, y: 288 }, { x: 240, y: 288 },
        { x: 240, y: 306 }, { x: 134, y: 306 }
      ],
      detectRange: 90,
      detectAngle: Math.PI / 3
    },
    items: [
      { x: 294, y: 432, emoji: '🥖', name: '黄油面包' },
      { x: 438, y: 228, emoji: '🥬', name: '新鲜生菜' },
      { x: 736, y: 118, emoji: '🧀', name: '奶酪块' },
      { x: 854, y: 432, emoji: '🍅', name: '红番茄' },
      { x: 604, y: 340, emoji: '🫙', name: '腌菜罐' },
      { x: 522, y: 190, emoji: '🍯', name: '蜂蜜瓶' }
    ],
    npcs: [],
    tasks: []
  },

  // ========== 第10关：终章王城夜宴 ==========
  {
    name: '第 10 关：终章王城夜宴',
    intro: '提示：夜宴开始前完成三件整活，拿下终章舞台。',
    gameType: 'task',
    gooseStart: { x: 74, y: 142 },
    walls: [
      { x: 40, y: 40, width: 880, height: 16 },
      { x: 40, y: 40, width: 16, height: 460 },
      { x: 904, y: 40, width: 16, height: 460 },
      { x: 40, y: 484, width: 880, height: 16 },
      { x: 580, y: 320, width: 114, height: 60 },
      { x: 384, y: 160, width: 148, height: 50 },
      { x: 40, y: 260, width: 206, height: 16 }
    ],
    bushes: [
      { x: 62, y: 102, width: 90, height: 60 },
      { x: 784, y: 122, width: 82, height: 56 },
      { x: 510, y: 404, width: 82, height: 56 }
    ],
    enemy: {
      type: ENEMY_TYPES.QUEEN,
      start: { x: 454, y: 186 },
      speed: 0,
      alertRise: 86, alertFall: 24,
      chaseSpeed: 0,
      route: [],
      lookDownInterval: 8,
      lookDownDuration: 3,
      lookDownVision: 64,
      normalVision: 210
    },
    secondaryEnemy: {
      id: 'guard',
      type: ENEMY_TYPES.GUARD,
      start: { x: 134, y: 302 },
      speed: 74,
      alertRise: 0, alertFall: 0,
      chaseSpeed: 0,
      route: [
        { x: 134, y: 292 }, { x: 228, y: 292 },
        { x: 228, y: 306 }, { x: 134, y: 306 }
      ],
      detectRange: 84,
      detectAngle: Math.PI / 3
    },
    items: [],
    npcs: [
      { id: 'kitten', x: 760, y: 362, emoji: '🐱', label: '侍从猫' },
      { id: 'neighbors', x: 136, y: 90, emoji: '🧑', label: '宾客' },
      { id: 'kid', x: 748, y: 420, emoji: '🧒', label: '小宾客' },
      { id: 'waterCup', x: 728, y: 398, emoji: '🍹', label: '果饮杯' }
    ],
    objects: [
      { id: 'sash', x: 462, y: 154, emoji: '🎗️', label: '礼仪绶带' },
      { id: 'cake', x: 614, y: 342, emoji: '🎂', label: '夜宴蛋糕' },
      { id: 'musicBox', x: 258, y: 430, emoji: '🎵', label: '音乐盒' }
    ],
    tasks: [
      {
        id: 1,
        desc: '趁园长低头时啄走礼仪绶带',
        type: 'proximity',
        targetObjId: 'sash',
        interactRange: 42,
        requiresEnemyState: 'lookingDown',
        hint: '等园长低头，再靠近绶带按 E。',
        onCompleteSpeech: { speaker: 'queen', text: '夜宴礼仪道具去哪了？', duration: 2.3 },
        onCompleteHint: '把蛋糕推去宾客区，气氛拉满。'
      },
      {
        id: 2,
        desc: '把夜宴蛋糕推到宾客区',
        type: 'push',
        targetObjId: 'cake',
        targetZone: { x: 102, y: 70, width: 182, height: 90 },
        hint: '趁守卫巡逻离开，快速把蛋糕推进去。',
        onCompleteSpeech: { speaker: 'neighbors', text: '今晚主厨竟然是大鹅？', duration: 2.3 },
        onCompleteHint: '最后靠近果饮杯按 E，触发终章收尾。'
      },
      {
        id: 3,
        desc: '让小宾客打翻果饮完成谢幕',
        type: 'proximity',
        targetObjId: 'waterCup',
        interactRange: 38,
        hint: '靠近果饮杯按 E，制造夜宴大结局。',
        onCompleteSpeech: { speaker: 'kid', text: '哎呀！但这谢幕好酷！', duration: 2.3 },
        onCompleteHint: null
      }
    ]
  }
];
