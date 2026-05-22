# 大鹅模拟器扩充实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有2.5D实时潜行游戏基础上，融入设计文档的3关故事内容，增加顺序任务系统、新敌人类型、对话气泡UI。

**Architecture:** 将现有单文件 script.js 拆分为3个文件：levels.js（纯数据）、interactions.js（任务系统+气泡）、script.js（游戏引擎）。4关统一使用现有渲染/碰撞系统，任务关通过 E 键互动推进。

**Tech Stack:** ASP.NET Core 10.0 静态文件服务 + Canvas 2D + 原生 JavaScript (ES6)

---

## 文件结构

```
wwwroot/
├── index.html       # Modify: 任务面板 + 气泡容器 + 加载新JS
├── style.css        # Modify: 气泡/任务列表/标题动画样式
├── script.js        # Modify: 精简为引擎核心 (~500行)
├── levels.js        # Create:  4关完整数据定义 (~250行)
└── interactions.js  # Create:  任务系统+互动+气泡 (~250行)
```

---

### Task 1: Create levels.js — 关卡数据定义

**Files:**
- Create: `大鹅模拟器/wwwroot/levels.js`

- [ ] **Step 1: Create levels.js with Level 1 (tutorial, adapted from existing)**

Write the complete file with all 4 levels:

```js
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
    name: '第 1 关：农场初探',
    intro: '提示：先去偷花园里的东西。按 E 可以互动。',
    gameType: 'tutorial',               // 'tutorial' | 'task'
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
      speed: 75,                         // 降低20%
      alertRise: 32, alertFall: 56,      // 降低30%警觉上升
      chaseSpeed: 108,                   // 降低20%
      route: [
        { x: 280, y: 88 }, { x: 440, y: 88 },
        { x: 596, y: 202 }, { x: 716, y: 252 },
        { x: 854, y: 214 }, { x: 854, y: 404 },
        { x: 524, y: 424 }, { x: 250, y: 354 }
      ]
    },
    items: [
      { x: 278, y: 428, emoji: '🔑', name: '花园钥匙' },
      { x: 430, y: 220, emoji: '🥕', name: '胡萝卜' },
      { x: 728, y: 110, emoji: '🧺', name: '野餐篮' },
      { x: 852, y: 430, emoji: '🔔', name: '铜铃' }
    ],
    npcs: [],
    tasks: []
  },

  // ========== 第2关：农场小花招 ==========
  {
    name: '第 2 关：农场小花招',
    intro: '提示：先悄悄把花盆推到猪圈边，让猪吃掉农夫的花。',
    gameType: 'task',
    gooseStart: { x: 80, y: 430 },
    walls: [
      // 猪圈围墙
      { x: 680, y: 60, width: 200, height: 16 },
      { x: 680, y: 60, width: 16, height: 140 },
      { x: 680, y: 184, width: 200, height: 16 },
      // 院子外墙
      { x: 50, y: 320, width: 16, height: 170 },
      { x: 50, y: 474, width: 860, height: 16 },
      { x: 894, y: 320, width: 16, height: 170 },
      // 中央石凳区（农夫座位）
      { x: 350, y: 200, width: 120, height: 50 },
      // 院墙边（耙子靠墙处）
      { x: 160, y: 70, width: 16, height: 140 },
      // 小孩角落矮墙
      { x: 500, y: 340, width: 200, height: 16 }
    ],
    bushes: [
      { x: 50, y: 50, width: 80, height: 56 },    // 鹅初始藏身处（柴堆）
      { x: 760, y: 310, width: 80, height: 56 },
      { x: 280, y: 400, width: 80, height: 56 }
    ],
    enemy: {
      type: ENEMY_TYPES.FARMER,
      start: { x: 410, y: 225 },
      speed: 90,
      alertRise: 72, alertFall: 28,
      chaseSpeed: 130,
      // 农夫巡逻：石凳→猪圈→小孩→院墙→回到石凳
      route: [
        { x: 410, y: 225 }, { x: 410, y: 140 },
        { x: 620, y: 110 }, { x: 750, y: 140 },
        { x: 750, y: 400 }, { x: 600, y: 380 },
        { x: 280, y: 420 }, { x: 200, y: 300 },
        { x: 200, y: 150 }, { x: 410, y: 140 }
      ],
      sitSpot: { x: 410, y: 225 },   // 农夫会在此坐下
      sitDuration: 8,                  // 坐8秒
      patrolDuration: 12              // 巡逻12秒
    },
    items: [],
    npcs: [
      {
        id: 'pig',
        x: 760, y: 130,
        emoji: '🐷',
        label: '猪',
        animPhase: 0
      },
      {
        id: 'kid',
        x: 580, y: 375,
        emoji: '👦',
        label: '小孩'
      },
      {
        id: 'waterCup',
        x: 600, y: 365,
        emoji: '🥤',
        label: '水杯'
      }
    ],
    objects: [
      { id: 'flowerPot', x: 320, y: 260, emoji: '🪴', label: '花盆', pushed: false },
      { id: 'rake', x: 170, y: 120, emoji: '🔧', label: '耙子', triggered: false },
      { id: 'weakWall', x: 150, y: 210, width: 40, height: 16, broken: false }
    ],
    tasks: [
      {
        id: 1,
        desc: '让猪吃到农夫的花',
        type: 'push',                // 鹅推物体到目标区
        targetObjId: 'flowerPot',
        targetZone: { x: 680, y: 60, width: 200, height: 140 },  // 猪圈
        hint: '走到花盆旁按 E 键推花盆，把花盆推到猪圈边',
        onCompleteSpeech: { speaker: 'pig', text: '哼哼哼！🌺', duration: 2.5 },
        onCompleteHint: '猪冲过来吃花了！现在去弄湿小孩的书。'
      },
      {
        id: 2,
        desc: '让小孩的书湿掉',
        type: 'proximity',           // 靠近目标按E触发
        targetObjId: 'waterCup',
        interactRange: 35,
        hint: '溜到小孩身边，靠近水杯按 E 键撞翻它',
        onCompleteSpeech: { speaker: 'kid', text: '呜哇——妈妈！我的书！', duration: 2.5 },
        onCompleteHint: '书湿了！现在去引农夫用耙子刺破墙壁。'
      },
      {
        id: 3,
        desc: '让农夫用耙子刺破墙壁',
        type: 'lure',                // 引导敌人到目标位置
        lureSteps: [
          { type: 'peck', target: 'farmer', hint: '靠近农夫按 E 啄他的裤脚' },
          { type: 'leadTo', target: 'rake', hint: '引农夫走向院墙边的耙子' },
          { type: 'leadTo', target: 'weakWall', hint: '继续引他，让耙子撞上破墙' }
        ],
        hint: '靠近农夫按 E 啄裤脚，然后引他到院墙边用耙子刺破墙壁',
        onCompleteSpeech: { speaker: 'farmer', text: '该死！墙壁破了！', duration: 2.5 },
        onCompleteHint: null
      }
    ]
  },

  // ========== 第3关：女王的宫殿 ==========
  {
    name: '第 3 关：女王的宫殿',
    intro: '提示：趁女王低头整理裙摆时，溜过去把皇冠啄到桌子底下。',
    gameType: 'task',
    gooseStart: { x: 72, y: 140 },
    walls: [
      // 宫殿外墙
      { x: 40, y: 40, width: 880, height: 16 },
      { x: 40, y: 40, width: 16, height: 460 },
      { x: 904, y: 40, width: 16, height: 460 },
      { x: 40, y: 484, width: 880, height: 16 },
      // 石桌
      { x: 580, y: 320, width: 100, height: 60 },
      // 长椅
      { x: 380, y: 160, width: 140, height: 50 },
      // 侍卫巡逻通道边界
      { x: 40, y: 260, width: 200, height: 16 }
    ],
    bushes: [
      { x: 60, y: 100, width: 90, height: 60 },    // 鹅初始藏身处（花坛）
      { x: 780, y: 120, width: 80, height: 56 },
      { x: 500, y: 400, width: 80, height: 56 }
    ],
    // 双敌人：女王（主）+ 侍卫（障碍）
    enemy: {
      type: ENEMY_TYPES.QUEEN,
      start: { x: 450, y: 185 },
      speed: 0,                          // 女王不移动
      alertRise: 80, alertFall: 25,
      chaseSpeed: 0,                     // 女王不追，发现即失败
      route: [],
      // 女王特有：周期性低头
      lookDownInterval: 10,              // 每10秒
      lookDownDuration: 3,              // 低头3秒
      lookDownVision: 60,               // 低头时视野60px
      normalVision: 200                 // 正常视野200px
    },
    secondaryEnemy: {
      id: 'guard',
      type: ENEMY_TYPES.GUARD,
      start: { x: 130, y: 300 },
      speed: 70,
      alertRise: 0, alertFall: 0,       // 侍卫无警觉曲线
      chaseSpeed: 0,                     // 不追，发现即失败
      route: [
        { x: 130, y: 290 }, { x: 220, y: 290 },
        { x: 220, y: 300 }, { x: 130, y: 300 }
      ],
      detectRange: 80,                   // 正面80px发现范围
      detectAngle: Math.PI / 3           // 侍卫视野角度
    },
    items: [],
    npcs: [],
    objects: [
      { id: 'crown', x: 460, y: 155, emoji: '👑', label: '皇冠',
        state: 'onHead',               // 'onHead' | 'underTable' | 'carried' | 'thrown'
        tablePos: { x: 600, y: 310 } },
      { id: 'apple', x: 610, y: 340, emoji: '🍎', label: '红苹果',
        state: 'onTable',              // 'onTable' | 'inSewer' | 'carried'
        sewerPos: { x: 640, y: 380 } },
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
        requiresEnemyState: 'lookingDown',  // 必须女王低头时
        hint: '趁女王低头整理裙摆时，接近皇冠按 E 键啄落',
        onComplete: function(state) {
          const crown = state.objects.find(o => o.id === 'crown');
          crown.state = 'underTable';
          crown.x = crown.tablePos.x;
          crown.y = crown.tablePos.y;
        },
        onCompleteSpeech: { speaker: 'queen', text: '咦？我的皇冠呢？', duration: 2.5 },
        onCompleteHint: '皇冠掉到桌下了！现在把桌上的苹果推进下水道。'
      },
      {
        id: 2,
        desc: '把苹果扔进下水道',
        type: 'push',
        targetObjId: 'apple',
        targetZone: { x: 625, y: 370, width: 50, height: 40 },
        hint: '趁女王找皇冠时，溜到石桌旁把苹果推下下水道',
        onComplete: function(state) {
          const apple = state.objects.find(o => o.id === 'apple');
          apple.state = 'inSewer';
          apple.x = -100; apple.y = -100;  // 消失
        },
        onCompleteSpeech: { speaker: 'queen', text: '什么声音？', duration: 2 },
        onCompleteHint: '苹果没了！现在把桌下的皇冠叼到女王脚边。'
      },
      {
        id: 3,
        desc: '让女王扔掉皇冠',
        type: 'carry',
        carryObjId: 'crown',
        dropTarget: { x: 430, y: 210 },    // 女王脚边
        interactRange: 40,
        hint: '走到桌子旁按 E 叼起皇冠，送到女王脚边按 E 放下',
        onCompleteSpeech: { speaker: 'queen', text: '滚开！该死的鹅！', duration: 2.5 },
        onCompleteHint: null
      }
    ]
  },

  // ========== 第4关：砍树女人的闹剧（最终关） ==========
  {
    name: '第 4 关：砍树女人的闹剧',
    intro: '提示：趁女人举斧砍树时，溜到她身后啄她的手腕，让斧头掉下来。',
    gameType: 'task',
    gooseStart: { x: 60, y: 200 },
    walls: [
      // 院墙
      { x: 300, y: 40, width: 16, height: 320 },
      { x: 300, y: 360, width: 600, height: 16 },
      { x: 884, y: 40, width: 16, height: 320 },
      { x: 300, y: 40, width: 600, height: 16 },
      // 院门（可锁）
      { x: 380, y: 344, width: 60, height: 16 },
      // 老槐树
      { x: 600, y: 100, width: 40, height: 40 }
    ],
    bushes: [
      { x: 60, y: 160, width: 90, height: 60 },   // 鹅初始藏身处（院墙外灌木丛）
      { x: 700, y: 280, width: 80, height: 56 }
    ],
    enemy: {
      type: ENEMY_TYPES.WOODCUTTER,
      start: { x: 560, y: 140 },
      speed: 0,                            // 初始不移动（在砍树）
      alertRise: 65, alertFall: 30,
      chaseSpeed: 120,
      route: [],
      // 女人特有：分阶段AI
      phase: 1,                            // 1=砍树, 2=捡斧头, 3=拍门
      treePos: { x: 620, y: 120 },        // 树的位置（女人面朝这里）
      gatePos: { x: 410, y: 355 }          // 院门位置
    },
    items: [],
    npcs: [
      {
        id: 'neighbors',
        x: 340, y: 280,
        count: 3,                          // 3个邻居
        emoji: '👥',
        label: '邻居们',
        laughing: false
      }
    ],
    objects: [
      { id: 'axe', x: 570, y: 150, emoji: '🪓', label: '斧头', dropped: false },
      { id: 'gate', x: 380, y: 344, width: 60, height: 16, locked: false, label: '院门' },
      { id: 'targetApple', x: 340, y: 390, emoji: '🍎', label: '红苹果', carried: false }
    ],
    tasks: [
      {
        id: 1,
        desc: '让斧头掉落，旁人大笑',
        type: 'proximity',
        targetObjId: 'axe',
        interactRange: 45,
        hint: '趁女人举斧时，从灌木丛溜到她身后按 E 啄手腕',
        onComplete: function(state) {
          const axe = state.objects.find(o => o.id === 'axe');
          axe.dropped = true;
          axe.x = 580; axe.y = 165;       // 斧头掉在地上
        },
        onCompleteSpeech: { speaker: 'neighbors', text: '哈哈哈！斧头掉了！', duration: 3 },
        onCompleteHint: '邻居们大笑！趁女人捡斧头时，去把院门反锁。'
      },
      {
        id: 2,
        desc: '把女人锁在院子外',
        type: 'proximity',
        targetObjId: 'gate',
        interactRange: 40,
        // 需要女人在捡斧头状态（phase 2）
        requiresEnemyPhase: 2,
        hint: '趁她弯腰捡斧头时，溜到院门口按 E 反锁院门',
        onComplete: function(state) {
          const gate = state.objects.find(o => o.id === 'gate');
          gate.locked = true;
        },
        onCompleteSpeech: { speaker: 'woodcutter', text: '该死！门怎么锁了！', duration: 2.5 },
        onCompleteHint: '门锁上了！现在叼起花盆旁的苹果放到她头上。'
      },
      {
        id: 3,
        desc: '把苹果放在她头上',
        type: 'carry',
        carryObjId: 'targetApple',
        dropTarget: { x: 560, y: 125 },  // 女人头顶位置
        interactRange: 40,
        hint: '按 E 叼起苹果，悄悄走到女人身后按 E 放她头顶',
        onCompleteSpeech: { speaker: 'neighbors', text: '苹果在你头上！哈哈哈！', duration: 4 },
        onCompleteHint: null
      }
    ]
  }
];
```

- [ ] **Step 2: Verify the file has no syntax errors**

Run: `node --check "C:/Users/econi/source/repos/MyFirstGame/大鹅模拟器/wwwroot/levels.js"`

- [ ] **Step 3: Commit**

```bash
git add 大鹅模拟器/wwwroot/levels.js
git commit -m "feat: add levels.js with 4 level definitions"
```

---

### Task 2: Create interactions.js — 任务系统和互动

**Files:**
- Create: `大鹅模拟器/wwwroot/interactions.js`

- [ ] **Step 1: Create interactions.js with task state machine, E-key handling, speech bubbles**

```js
// interactions.js — 任务系统、E键互动、对话气泡
// 依赖: LEVELS (from levels.js)
// 暴露: taskState, speechBubbles, initTaskSystem, updateInteractions,
//        handleInteract, drawSpeechBubbles, drawTaskHud, isTaskLevel

let taskState = null;           // { currentTaskIndex, tasks: [{status, ...}] }
let speechBubbles = [];         // [{ x, y, text, life, speaker }]
let carriedItem = null;         // 鹅当前叼着的物品 (object reference or null)
let pickupCooldown = 0;         // E键冷却

function isTaskLevel() {
  const level = LEVELS[currentLevelIndex];
  return level && level.gameType === 'task';
}

function initTaskSystem() {
  const level = LEVELS[currentLevelIndex];
  if (!level || level.gameType !== 'task') {
    taskState = null;
    carriedItem = null;
    pickupCooldown = 0;
    speechBubbles = [];
    return;
  }

  taskState = {
    currentTaskIndex: 0,
    tasks: level.tasks.map((t, i) => ({
      id: t.id,
      desc: t.desc,
      status: i === 0 ? 'available' : 'locked',
      hint: t.hint
    })),
    lureStep: 0                   // 用于lure类型任务的子步骤
  };
  carriedItem = null;
  pickupCooldown = 0;
  speechBubbles = [];
}

function getCurrentTask() {
  if (!taskState) return null;
  const idx = taskState.currentTaskIndex;
  if (idx >= taskState.tasks.length) return null;
  return LEVELS[currentLevelIndex].tasks[idx];
}

function completeCurrentTask() {
  const level = LEVELS[currentLevelIndex];
  const task = level.tasks[taskState.currentTaskIndex];
  const tsTask = taskState.tasks[taskState.currentTaskIndex];

  tsTask.status = 'completed';

  // 执行 onComplete 回调
  if (task.onComplete) {
    task.onComplete({ objects: level.objects, enemy: enemy, level: level });
  }

  // 触发对话气泡
  if (task.onCompleteSpeech) {
    triggerSpeech(task.onCompleteSpeech);
  }

  // 更新提示
  if (task.onCompleteHint) {
    message = '提示：' + task.onCompleteHint;
  }

  // 推进到下一个任务
  taskState.currentTaskIndex++;
  if (taskState.currentTaskIndex < taskState.tasks.length) {
    taskState.tasks[taskState.currentTaskIndex].status = 'available';
  }

  // 检查是否全部完成
  if (taskState.currentTaskIndex >= taskState.tasks.length) {
    if (currentLevelIndex >= LEVELS.length - 1) {
      gameState = 'won';
      message = '你获得了"终极捣蛋鹅"称号！称霸整个小镇！';
    } else {
      // 短暂延迟后进入下一关
      setTimeout(() => advanceTaskLevel(), 2000);
      message = '全部任务完成！准备进入下一关...';
    }
  }
}

function advanceTaskLevel() {
  advanceLevel();
}

function triggerSpeech(speechDef) {
  // speechDef: { speaker, text, duration }
  let pos = { x: goose.x, y: goose.y - 30 };
  const level = LEVELS[currentLevelIndex];

  // 根据说话者定位
  if (speechDef.speaker === 'farmer') {
    pos = { x: enemy.x, y: enemy.y - 30 };
  } else if (speechDef.speaker === 'queen') {
    pos = { x: enemy.x, y: enemy.y - 30 };
  } else if (speechDef.speaker === 'woodcutter') {
    pos = { x: enemy.x, y: enemy.y - 30 };
  } else if (speechDef.speaker === 'kid') {
    const kid = (level.npcs || []).find(n => n.id === 'kid');
    if (kid) pos = { x: kid.x, y: kid.y - 25 };
  } else if (speechDef.speaker === 'neighbors') {
    const neighbors = (level.npcs || []).find(n => n.id === 'neighbors');
    if (neighbors) pos = { x: neighbors.x, y: neighbors.y - 25 };
  } else if (speechDef.speaker === 'pig') {
    const pig = (level.npcs || []).find(n => n.id === 'pig');
    if (pig) pos = { x: pig.x, y: pig.y - 20 };
  }

  speechBubbles.push({
    x: pos.x,
    y: pos.y,
    text: speechDef.text,
    life: speechDef.duration || 2.5,
    speaker: speechDef.speaker
  });
}

function findNearestInteractable() {
  const level = LEVELS[currentLevelIndex];
  if (!level || level.gameType !== 'task') return null;

  const task = level.tasks[taskState.currentTaskIndex];
  if (!task) return null;

  const goosePos = { x: goose.x, y: goose.y };

  // 检查 objects
  if (level.objects) {
    for (const obj of level.objects) {
      if (task.targetObjId !== obj.id) continue;
      const dist = Math.hypot(goosePos.x - obj.x, goosePos.y - obj.y);
      const range = task.interactRange || 40;
      if (dist <= range) return { type: 'object', target: obj, task: task };
    }
  }

  // 检查 npcs（用于水杯等附着在NPC上的物品）
  if (level.npcs) {
    for (const npc of level.npcs) {
      if (task.targetObjId !== npc.id) continue;
      const dist = Math.hypot(goosePos.x - npc.x, goosePos.y - npc.y);
      const range = task.interactRange || 40;
      if (dist <= range) return { type: 'npc', target: npc, task: task };
    }
  }

  // 特殊：carry 类型 - 检查是否在叼着物品时需要放下
  if (task.type === 'carry' && carriedItem && task.dropTarget) {
    const dist = Math.hypot(goosePos.x - task.dropTarget.x, goosePos.y - task.dropTarget.y);
    if (dist <= 50) return { type: 'drop', target: carriedItem, task: task };
  }

  // 特殊：lure 类型 - 检查是否靠近敌人
  if (task.type === 'lure' && task.lureSteps) {
    const step = task.lureSteps[taskState.lureStep];
    if (step && step.type === 'peck' && step.target === 'farmer') {
      const dist = Math.hypot(goosePos.x - enemy.x, goosePos.y - enemy.y);
      if (dist <= 50) return { type: 'enemy', target: enemy, task: task };
    }
  }

  return null;
}

function handleInteract() {
  if (gameState !== 'playing') return;
  if (pickupCooldown > 0) return;
  if (!isTaskLevel()) return;

  // 如果正叼着物品，先尝试放下
  if (carriedItem && taskState) {
    const task = getCurrentTask();
    if (task && task.type === 'carry' && task.dropTarget) {
      const dist = Math.hypot(goose.x - task.dropTarget.x, goose.y - task.dropTarget.y);
      if (dist <= 50) {
        carriedItem.carried = false;
        carriedItem.x = task.dropTarget.x;
        carriedItem.y = task.dropTarget.y;
        carriedItem = null;
        pickupCooldown = 0.8;
        completeCurrentTask();
        return;
      }
    }
    // 放下物品（取消携带）
    carriedItem.carried = false;
    carriedItem.x = goose.x;
    carriedItem.y = goose.y + 20;
    carriedItem = null;
    pickupCooldown = 0.5;
    return;
  }

  const nearest = findNearestInteractable();
  if (!nearest) return;

  const { type, target, task } = nearest;
  pickupCooldown = 0.6;

  switch (task.type) {
    case 'push':
      // 推物体到目标区域
      if (type === 'object') {
        if (target.pushed !== undefined) {
          target.pushed = true;
        }
        // 将物体向猪圈/下水道方向移动
        if (task.targetZone) {
          target.x = task.targetZone.x + task.targetZone.width / 2;
          target.y = task.targetZone.y + task.targetZone.height / 2;
        }
        completeCurrentTask();
      }
      break;

    case 'proximity':
      // 靠近按E触发
      if (type === 'object' || type === 'npc') {
        // 检查前置条件（如女王低头）
        if (task.requiresEnemyState) {
          const enemyData = LEVELS[currentLevelIndex].enemy;
          if (task.requiresEnemyState === 'lookingDown') {
            if (!enemyData._isLookingDown) return; // 条件不满足，不触发
          }
        }
        if (task.requiresEnemyPhase) {
          const enemyData = LEVELS[currentLevelIndex].enemy;
          if (enemyData._phase !== task.requiresEnemyPhase) return;
        }
        completeCurrentTask();
      }
      break;

    case 'carry':
      // 叼起物品
      if (type === 'object' && !carriedItem) {
        if (target.carried !== undefined) {
          target.carried = true;
        }
        carriedItem = target;
        pickupCooldown = 0.3;
        message = '提示：叼着' + target.label + '，走到目标位置按 E 放下';
      }
      break;

    case 'lure':
      // 引导敌人
      if (task.lureSteps && taskState.lureStep < task.lureSteps.length) {
        const step = task.lureSteps[taskState.lureStep];
        if (step.type === 'peck' && type === 'enemy') {
          // 啄裤脚成功，敌人开始追鹅
          enemy.chaseTimer = 5;
          enemy.state = 'chase';
          taskState.lureStep++;
          message = '提示：' + (task.lureSteps[taskState.lureStep]?.hint || '');
        }
        // lure的leadTo步骤在updateInteractions中检测
      }
      break;
  }
}

function updateInteractions(dt) {
  if (pickupCooldown > 0) pickupCooldown -= dt;

  // 更新对话气泡生命周期
  speechBubbles = speechBubbles.filter(b => {
    b.life -= dt;
    return b.life > 0;
  });

  // 更新叼着的物品位置（跟随鹅）
  if (carriedItem) {
    carriedItem.x = goose.x + Math.cos(goose.facing) * 20;
    carriedItem.y = goose.y + Math.sin(goose.facing) * 10;
  }

  // lure类型任务：检测是否引导到目标
  if (!taskState || gameState !== 'playing') return;
  const task = getCurrentTask();
  if (!task || task.type !== 'lure' || !task.lureSteps) return;

  const step = task.lureSteps[taskState.lureStep];
  if (step && step.type === 'leadTo') {
    const level = LEVELS[currentLevelIndex];
    let targetObj;
    if (step.target === 'rake') {
      targetObj = (level.objects || []).find(o => o.id === 'rake');
    } else if (step.target === 'weakWall') {
      targetObj = (level.objects || []).find(o => o.id === 'weakWall');
    }
    if (targetObj && enemy.state === 'chase') {
      const dist = Math.hypot(enemy.x - targetObj.x, enemy.y - targetObj.y);
      if (dist < 40) {
        // 敌人到达目标位置，触发效果
        if (step.target === 'rake') {
          targetObj.triggered = true;
          taskState.lureStep++;
          message = '提示：' + (task.lureSteps[taskState.lureStep]?.hint || '');
        } else if (step.target === 'weakWall') {
          targetObj.broken = true;
          completeCurrentTask();
        }
      }
    }
  }
}

function drawSpeechBubbles(ctx) {
  for (const bubble of speechBubbles) {
    const alpha = Math.min(1, bubble.life / 0.5);
    const point = projectPoint(bubble.x, bubble.y, 50);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;

    ctx.font = 'bold 16px Microsoft YaHei';
    const metrics = ctx.measureText(bubble.text);
    const padding = 12;
    const bw = metrics.width + padding * 2;
    const bh = 36;

    // 气泡背景
    const bx = point.x - bw / 2;
    const by = point.y - bh;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.stroke();

    // 气泡尖角
    ctx.beginPath();
    ctx.moveTo(point.x - 8, by + bh);
    ctx.lineTo(point.x, by + bh + 10);
    ctx.lineTo(point.x + 8, by + bh);
    ctx.fill();

    // 文字
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bubble.text, point.x, by + bh / 2);

    ctx.globalAlpha = 1;
  }
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `node --check "C:/Users/econi/source/repos/MyFirstGame/大鹅模拟器/wwwroot/interactions.js"`

- [ ] **Step 3: Commit**

```bash
git add 大鹅模拟器/wwwroot/interactions.js
git commit -m "feat: add interactions.js with task system and speech bubbles"
```

---

### Task 3: Refactor script.js — 引擎核心改造

**Files:**
- Modify: `大鹅模拟器/wwwroot/script.js`

This is the largest task. We need to: remove hardcoded level data, add E-key input, integrate with levels.js/interactions.js, handle new enemy types, and adapt the game loop for tutorial vs task levels.

- [ ] **Step 1: Remove level data and add new globals**

Delete lines 12-93 (the `levels` array) and replace with references to the new modules. Update the top of the file:

```js
// script.js — 核心游戏引擎
// 依赖: levels.js (LEVELS), interactions.js (taskState, speechBubbles, ...)

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restart');
const levelText = document.getElementById('level');
const statusText = document.getElementById('status');
const progressText = document.getElementById('progress');
const hintText = document.getElementById('hint');

const keys = new Set();
const world = { x: 24, y: 24, width: 912, height: 492 };

// 从 levels.js 引用关卡数据 — LEVELS 是全局变量
// 移除原有的 levels 数组定义（原第12-93行）

const goose = {
  x: 0, y: 0,
  radius: 16,
  speed: 195,
  facing: 0,
  hidden: false,
  honkCooldown: 0,
  noisyTimer: 0
};

const enemy = {
  x: 0, y: 0,
  radius: 18,
  speed: 94,
  facing: 0,
  routeIndex: 0,
  alert: 0,
  chaseTimer: 0,
  investigateTimer: 0,
  investigatePoint: null,
  state: 'patrol',
  // 农夫/女王/女人特有状态
  _sitTimer: 0,
  _patrolTimer: 0,
  _isSitting: false,
  _lookDownTimer: 0,
  _isLookingDown: false,
  _phase: 1,
  _phaseTimer: 0
};

// 二级敌人（如侍卫）
const secondaryEnemy = {
  active: false,
  x: 0, y: 0,
  radius: 16,
  speed: 0,
  facing: 0,
  routeIndex: 0,
  route: [],
  detectRange: 80,
  detectAngle: Math.PI / 3
};

let currentLevelIndex = 0;
let exitZone = { x: 0, y: 0, width: 0, height: 0 };
let walls = [];
let bushes = [];
let items = [];
let ripples = [];
let message = '';
let gameState = 'playing';
let lastTime = 0;
let sceneTime = 0;

// ... (keep renderer and utility functions after this)
```

- [ ] **Step 2: Update `loadLevel` to use LEVELS array and handle new enemy types**

Replace the `loadLevel` function (approximately lines 144-173):

```js
function loadLevel(index) {
  currentLevelIndex = index;
  const level = LEVELS[index];

  exitZone = level.exitZone ? cloneRect(level.exitZone) : { x: 0, y: 0, width: 0, height: 0 };
  walls = (level.walls || []).map(cloneRect);
  bushes = (level.bushes || []).map(cloneRect);
  items = (level.items || []).map(item => ({ ...item, collected: false }));

  goose.x = level.gooseStart.x;
  goose.y = level.gooseStart.y;
  goose.facing = 0;
  goose.hidden = false;
  goose.honkCooldown = 0;
  goose.noisyTimer = 0;

  // 主敌人初始化
  const ed = level.enemy;
  enemy.x = ed.start.x;
  enemy.y = ed.start.y;
  enemy.speed = ed.speed;
  enemy.alertRise = ed.alertRise;
  enemy.alertFall = ed.alertFall;
  enemy.chaseSpeed = ed.chaseSpeed || 136;
  enemy.route = ed.route || [];
  enemy.routeIndex = enemy.route.length > 1 ? 1 : 0;
  enemy.facing = 0;
  enemy.alert = 0;
  enemy.chaseTimer = 0;
  enemy.investigateTimer = 0;
  enemy.investigatePoint = null;
  enemy.state = 'patrol';
  // 重置特有状态
  enemy._sitTimer = 0;
  enemy._patrolTimer = 0;
  enemy._isSitting = false;
  enemy._lookDownTimer = ed.lookDownInterval || 0;
  enemy._isLookingDown = false;
  enemy._phase = 1;
  enemy._phaseTimer = 0;
  // 存储关卡敌人参数以便update中使用
  enemy._type = ed.type;
  enemy._sitSpot = ed.sitSpot || null;
  enemy._sitDuration = ed.sitDuration || 0;
  enemy._patrolDuration = ed.patrolDuration || 0;
  enemy._lookDownInterval = ed.lookDownInterval || 0;
  enemy._lookDownDuration = ed.lookDownDuration || 0;
  enemy._lookDownVision = ed.lookDownVision || 60;
  enemy._normalVision = ed.normalVision || 200;
  enemy._treePos = ed.treePos || null;
  enemy._gatePos = ed.gatePos || null;

  // 二级敌人初始化（侍卫）
  const sed = level.secondaryEnemy;
  if (sed) {
    secondaryEnemy.active = true;
    secondaryEnemy.x = sed.start.x;
    secondaryEnemy.y = sed.start.y;
    secondaryEnemy.speed = sed.speed;
    secondaryEnemy.facing = 0;
    secondaryEnemy.routeIndex = 1;
    secondaryEnemy.route = sed.route || [];
    secondaryEnemy.detectRange = sed.detectRange || 80;
    secondaryEnemy.detectAngle = sed.detectAngle || Math.PI / 3;
  } else {
    secondaryEnemy.active = false;
  }

  ripples = [];
  message = level.intro;

  // 初始化任务系统（interactions.js）
  if (typeof initTaskSystem === 'function') {
    initTaskSystem();
  }
}
```

- [ ] **Step 3: Update `canEnemySeeGoose` to handle new enemy types**

Replace the `canGardenerSeeGoose` function (approximately lines 302-324):

```js
function canEnemySeeGoose(enemyData, enemyDef) {
  const toGoose = { x: goose.x - enemyData.x, y: goose.y - enemyData.y };
  const dist = Math.hypot(toGoose.x, toGoose.y);

  // 女王低头时视野大幅缩小
  let effectiveRange;
  if (enemyDef && enemyDef.type === ENEMY_TYPES.QUEEN && enemyData._isLookingDown) {
    effectiveRange = enemyData._lookDownVision;
  } else {
    effectiveRange = goose.hidden && goose.noisyTimer <= 0 ? 92 : (enemyDef.normalVision || 238);
  }

  if (dist > effectiveRange) return false;

  const targetAngle = Math.atan2(toGoose.y, toGoose.x);
  const fov = goose.hidden && goose.noisyTimer <= 0 ? Math.PI / 4 : Math.PI * 0.72;
  if (angleDifference(targetAngle, enemyData.facing) > fov / 2) return false;

  for (const wall of walls) {
    if (lineIntersectsRect(
      { x: enemyData.x, y: enemyData.y },
      { x: goose.x, y: goose.y },
      wall
    )) return false;
  }

  return true;
}

// 替换原有 canGardenerSeeGoose 调用
function canGardenerSeeGoose() {
  const level = LEVELS[currentLevelIndex];
  return canEnemySeeGoose(enemy, level.enemy);
}

// 二级敌人（侍卫）视野检测
function canGuardSeeGoose() {
  if (!secondaryEnemy.active) return false;

  const toGoose = { x: goose.x - secondaryEnemy.x, y: goose.y - secondaryEnemy.y };
  const dist = Math.hypot(toGoose.x, toGoose.y);

  if (dist > secondaryEnemy.detectRange) return false;

  const targetAngle = Math.atan2(toGoose.y, toGoose.x);
  if (angleDifference(targetAngle, secondaryEnemy.facing) > secondaryEnemy.detectAngle / 2) return false;

  for (const wall of walls) {
    if (lineIntersectsRect(
      { x: secondaryEnemy.x, y: secondaryEnemy.y },
      { x: goose.x, y: goose.y },
      wall
    )) return false;
  }

  return true;
}
```

- [ ] **Step 4: Update `advanceLevel` to handle task-based level progression**

Replace the existing `advanceLevel` function:

```js
function advanceLevel() {
  if (currentLevelIndex >= LEVELS.length - 1) {
    gameState = 'won';
    message = '终极捣蛋鹅！你称霸了整个小镇！';
    return;
  }

  loadLevel(currentLevelIndex + 1);
  message = '提示：' + LEVELS[currentLevelIndex].intro.replace('提示：', '');
}
```

- [ ] **Step 5: Update `updateGardener` to handle farmer sit/patrol cycle and queen look-down cycle**

Insert new enemy type behaviors at the start of `updateGardener` (after the existing `const seesGoose = canGardenerSeeGoose()` line, approximately line 378):

```js
function updateGardener(dt) {
  const level = LEVELS[currentLevelIndex];
  const ed = level.enemy;

  // === 农夫特有：坐/巡逻交替 ===
  if (ed.type === ENEMY_TYPES.FARMER) {
    if (enemy._isSitting) {
      enemy._sitTimer -= dt;
      enemy.speed = 0;  // 坐着不动
      if (enemy._sitTimer <= 0) {
        enemy._isSitting = false;
        enemy._patrolTimer = ed.patrolDuration;
        enemy.speed = ed.speed;
        enemy.routeIndex = 0;  // 重新开始巡逻
      }
    } else {
      enemy._patrolTimer -= dt;
      if (enemy._patrolTimer <= 0) {
        enemy._isSitting = true;
        enemy._sitTimer = ed.sitDuration;
        enemy.x = ed.sitSpot.x;
        enemy.y = ed.sitSpot.y;
      }
    }
  }

  // === 女王特有：周期性低头 ===
  if (ed.type === ENEMY_TYPES.QUEEN) {
    enemy._lookDownTimer -= dt;
    if (enemy._isLookingDown) {
      if (enemy._lookDownTimer <= 0) {
        enemy._isLookingDown = false;
        enemy._lookDownTimer = ed.lookDownInterval;
        ed._isLookingDown = false;
      }
    } else {
      if (enemy._lookDownTimer <= 0) {
        enemy._isLookingDown = true;
        enemy._lookDownTimer = ed.lookDownDuration;
        ed._isLookingDown = true;
      }
    }
    // 女王不移动
    enemy.x = ed.start.x;
    enemy.y = ed.start.y;
    // 低头时朝向随机偏转
    if (enemy._isLookingDown) {
      enemy.facing = Math.PI / 2;  // 朝下（低头）
    } else {
      enemy.facing = Math.atan2(
        goose.y - enemy.y,
        goose.x - enemy.x
      );  // 看着鹅的方向
    }
  }

  // === 砍树女人特有：分阶段AI ===
  if (ed.type === ENEMY_TYPES.WOODCUTTER) {
    if (enemy._phase === 1) {
      // 砍树中：面向树，视野窄
      if (enemy._treePos) {
        enemy.facing = Math.atan2(
          enemy._treePos.y - enemy.y,
          enemy._treePos.x - enemy.x
        );
      }
      enemy.x = ed.start.x;
      enemy.y = ed.start.y;
      enemy.speed = 0;

      // 任务1完成后进入阶段2
      const axe = (level.objects || []).find(o => o.id === 'axe');
      if (axe && axe.dropped) {
        enemy._phase = 2;
        enemy._phaseTimer = 4;  // 捡斧头需要4秒
        message = '提示：女人弯腰去捡斧头了！';
      }
    } else if (enemy._phase === 2) {
      // 捡斧头中：移动到斧头位置
      const axe = (level.objects || []).find(o => o.id === 'axe');
      if (axe) {
        const dx = axe.x - enemy.x;
        const dy = axe.y - enemy.y;
        const len = Math.hypot(dx, dy) || 1;
        enemy.speed = 60;
        enemy.x += (dx / len) * enemy.speed * dt;
        enemy.y += (dy / len) * enemy.speed * dt;
        enemy.facing = Math.atan2(dy, dx);
      }
      enemy._phaseTimer -= dt;
      if (enemy._phaseTimer <= 0) {
        // 斧头捡起，进入阶段3
        const axe2 = (level.objects || []).find(o => o.id === 'axe');
        if (axe2) { axe2.dropped = false; axe2.x = ed.start.x + 10; axe2.y = ed.start.y; }
        enemy._phase = 3;
        // 检查门是否被锁
        const gate = (level.objects || []).find(o => o.id === 'gate');
        if (gate && gate.locked) {
          enemy._gatePos && (enemy.x = enemy._gatePos.x);
          enemy._gatePos && (enemy.y = enemy._gatePos.y);
          enemy.speed = 0;
          message = '提示：女人发现门被锁了，气得拍门！';
        }
      }
    } else if (enemy._phase === 3) {
      // 拍门/暴躁中
      if (enemy._gatePos) {
        enemy.x = enemy._gatePos.x;
        enemy.y = enemy._gatePos.y;
      }
      enemy.speed = 0;
      enemy.facing = Math.PI / 2;  // 面朝门
    }
    // 存储当前阶段供 interactions.js 查询
    ed._phase = enemy._phase;
  }

  const seesGoose = canGardenerSeeGoose();
  const alertRise = goose.hidden ? (ed.alertRise * 0.55) : ed.alertRise;
  const alertFall = goose.hidden ? (ed.alertFall * 1.5) : ed.alertFall;

  enemy.alert = clamp(enemy.alert + (seesGoose ? alertRise : -alertFall) * dt, 0, 100);

  // 女王和阶段1女人发现鹅直接失败（不追）
  if (enemy.alert >= 100 && (ed.type === ENEMY_TYPES.QUEEN || ed.type === ENEMY_TYPES.GUARD)) {
    gameState = 'lost';
    return;
  }

  if (enemy.alert >= 100 && enemy.chaseTimer <= 0) {
    enemy.chaseTimer = 4.2;
  }

  if (enemy.chaseTimer > 0) {
    enemy.chaseTimer -= dt;
    enemy.state = 'chase';
  } else if (enemy.investigateTimer > 0 && enemy.investigatePoint) {
    enemy.investigateTimer -= dt;
    enemy.state = 'investigate';
  } else {
    enemy.state = 'patrol';
  }

  let target;
  let speed = enemy.speed;

  if (enemy.state === 'chase') {
    target = goose;
    speed = ed.chaseSpeed || 136;
  } else if (enemy.state === 'investigate' && enemy.investigatePoint) {
    target = enemy.investigatePoint;
    speed = 108;
    if (distance(enemy, target) < 12) {
      enemy.investigateTimer = 0;
      enemy.investigatePoint = null;
      enemy.state = 'patrol';
    }
  } else {
    const route = ed.route || [];
    target = route[enemy.routeIndex] || { x: enemy.x, y: enemy.y };
    if (distance(enemy, target) < 10 && route.length > 0) {
      enemy.routeIndex = (enemy.routeIndex + 1) % route.length;
      target = route[enemy.routeIndex];
    }
  }

  // 农夫坐着时不移动
  if (!(ed.type === ENEMY_TYPES.FARMER && enemy._isSitting)) {
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    const velocityX = (dx / len) * speed;
    const velocityY = (dy / len) * speed;
    enemy.facing = Math.atan2(velocityY, velocityX);
    moveEntity(enemy, velocityX, velocityY, dt);
  }

  if (distance(goose, enemy) < goose.radius + enemy.radius + 4) {
    gameState = 'lost';
  }
}
```

- [ ] **Step 6: Add secondary enemy update function and call it from game loop**

Add after `updateGardener`:

```js
function updateSecondaryEnemy(dt) {
  if (!secondaryEnemy.active) return;

  const sed = LEVELS[currentLevelIndex].secondaryEnemy;
  if (!sed) return;

  // 沿路线巡逻
  const route = sed.route || [];
  if (route.length === 0) return;

  const target = route[secondaryEnemy.routeIndex] || { x: secondaryEnemy.x, y: secondaryEnemy.y };
  const dx = target.x - secondaryEnemy.x;
  const dy = target.y - secondaryEnemy.y;
  const len = Math.hypot(dx, dy) || 1;

  if (len < 10) {
    secondaryEnemy.routeIndex = (secondaryEnemy.routeIndex + 1) % route.length;
  }

  secondaryEnemy.x += (dx / len) * secondaryEnemy.speed * dt;
  secondaryEnemy.y += (dy / len) * secondaryEnemy.speed * dt;
  secondaryEnemy.facing = Math.atan2(dy, dx);

  // 检测侍卫是否发现鹅
  if (canGuardSeeGoose()) {
    gameState = 'lost';
  }
}
```

- [ ] **Step 7: Update the game loop in `frame()` to call new update functions and draw speech bubbles**

In the `frame` function, update the playing section (approximately lines 832-836):

```js
if (gameState === 'playing') {
  updateGoose(dt);
  updateGardener(dt);
  updateSecondaryEnemy(dt);
  if (typeof updateInteractions === 'function') {
    updateInteractions(dt);
  }
  updateRipples(dt);
}
```

- [ ] **Step 8: Add E-key handler and update HUD for task levels**

At the end of the input section (after the Space handler, approximately line 849):

```js
// E key for interaction
if (event.key === 'e' || event.key === 'E') {
  event.preventDefault();
  if (typeof handleInteract === 'function') {
    handleInteract();
  }
  return;
}
```

Update `updateHud` to handle task-based levels. Replace the existing function:

```js
function updateHud() {
  const level = LEVELS[currentLevelIndex];

  levelText.textContent = '关卡：' + level.name;

  // 任务关 vs 教学关 HUD
  if (level.gameType === 'task' && taskState) {
    const collectedCount = 0;  // 任务关不计数物品
    progressText.innerHTML = level.tasks.map((t, i) => {
      const ts = taskState.tasks[i];
      let icon = '🔒';
      if (ts.status === 'completed') icon = '✅';
      else if (ts.status === 'available') icon = '▶️';
      return icon + ' ' + t.desc;
    }).join('<br>');
  } else {
    const collectedCount = items.filter(item => item.collected).length;
    progressText.textContent = '战利品：' + collectedCount + ' / ' + items.length;
  }

  if (gameState === 'won') {
    statusText.textContent = '状态：全部关卡完成';
    hintText.textContent = '终极捣蛋鹅！你称霸了小镇。再来一局吧。';
    return;
  }

  if (gameState === 'lost') {
    statusText.textContent = '状态：被抓住了';
    hintText.textContent = '按"重新开始"，这次多利用草丛和时机。';
    return;
  }

  if (enemy.state === 'chase') {
    statusText.textContent = '状态：快跑！';
  } else if (enemy.alert > 50) {
    statusText.textContent = '状态：引起了怀疑';
  } else if (goose.hidden) {
    statusText.textContent = '状态：藏在草丛中';
  } else if (carriedItem) {
    statusText.textContent = '状态：叼着' + (carriedItem.label || '物品');
  } else {
    statusText.textContent = '状态：潜行中';
  }

  hintText.textContent = message;
}
```

- [ ] **Step 9: Add speech bubble and NPC rendering to draw()**

Add after `drawActors()` call in the `draw` function:

```js
function draw() {
  drawGround();
  drawWalls();
  drawBushes();
  drawNPCs();
  drawObjects();
  drawActors();
  if (typeof drawSpeechBubbles === 'function') {
    drawSpeechBubbles(ctx);
  }
  drawOverlay();
}
```

Add new draw functions:

```js
function drawNPCs() {
  const level = LEVELS[currentLevelIndex];
  if (!level.npcs) return;

  for (const npc of level.npcs) {
    const point = projectPoint(npc.x, npc.y, 22);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '28px Segoe UI Emoji, Microsoft YaHei';
    ctx.fillText(npc.emoji, point.x, point.y);

    // 标签
    ctx.font = '13px Microsoft YaHei';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(npc.label, point.x, point.y + 24);
  }
}

function drawObjects() {
  const level = LEVELS[currentLevelIndex];
  if (!level.objects) return;

  for (const obj of level.objects) {
    // 已消失的物品不画（如掉入下水道的苹果）
    if (obj.x < 0 || obj.y < 0) continue;
    // 被叼着的物品由 drawActors 处理
    if (obj.carried) continue;

    const bob = 24 + Math.sin(sceneTime * 2.4 + obj.x * 0.025 + obj.y * 0.018) * 3;
    const point = projectPoint(obj.x, obj.y, bob);

    // 特殊渲染：皇冠状态
    if (obj.id === 'crown' && obj.state === 'underTable') {
      // 在桌子下，渲染稍暗
      ctx.globalAlpha = 0.6;
    }

    // 特殊渲染：门
    if (obj.id === 'gate') {
      ctx.fillStyle = obj.locked ? '#8b4513' : '#d4a574';
      ctx.fillRect(point.x - 20, point.y - 8, 40, 16);
      if (obj.locked) {
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 14px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', point.x, point.y);
      }
      ctx.globalAlpha = 1;
      continue;
    }

    if (obj.emoji) {
      ctx.font = '24px Segoe UI Emoji, Microsoft YaHei';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.emoji, point.x, point.y);

      // 标签
      if (obj.label && obj.id !== 'crown') {
        ctx.font = '11px Microsoft YaHei';
        ctx.fillText(obj.label, point.x, point.y + 20);
      }
    }

    ctx.globalAlpha = 1;
  }
}
```

- [ ] **Step 10: Verify no syntax errors**

Run: `node --check "C:/Users/econi/source/repos/MyFirstGame/大鹅模拟器/wwwroot/script.js"`

- [ ] **Step 11: Commit**

```bash
git add 大鹅模拟器/wwwroot/script.js
git commit -m "refactor: integrate levels.js and interactions.js, add new enemy types"
```

---

### Task 4: Update index.html — UI改造

**Files:**
- Modify: `大鹅模拟器/wwwroot/index.html`

- [ ] **Step 1: Update HTML to load new JS files and improve HUD**

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>捣蛋大鹅</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div class="level-title" id="levelTitle"></div>
  <div class="layout">
    <section class="panel">
      <h1>捣蛋大鹅</h1>
      <div class="view-badge">2.5D 斜视角 · 按 E 互动</div>
      <p>目标：完成关卡任务，不被目标人物发现！</p>
      <ul>
        <li>移动：WASD / 方向键</li>
        <li>鸣叫：空格（吸引注意力）</li>
        <li>互动：E 键（推/啄/叼/放）</li>
        <li>躲进草丛可以降低被发现的概率</li>
      </ul>
      <div class="hud">
        <div id="level">关卡：第 1 关</div>
        <div id="status">状态：潜行中</div>
        <div id="progress">战利品：0 / 4</div>
        <div id="tasks"></div>
        <div id="hint">提示：先去偷花园里的东西。</div>
      </div>
      <div id="carryIndicator" class="carry-indicator hidden">🫴 叼着物品</div>
      <button id="restart">重新开始</button>
    </section>
    <section class="game-shell">
      <canvas id="game" width="960" height="540"></canvas>
    </section>
  </div>
  <script src="/levels.js"></script>
  <script src="/interactions.js"></script>
  <script src="/script.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add 大鹅模拟器/wwwroot/index.html
git commit -m "feat: update index.html with new JS files and task HUD"
```

---

### Task 5: Update style.css — 新UI样式

**Files:**
- Modify: `大鹅模拟器/wwwroot/style.css`

- [ ] **Step 1: Add styles for speech bubbles, task list, level title, carry indicator**

Append to the existing CSS:

```css
/* === 关卡标题动画 === */
.level-title {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  text-align: center;
  padding: 32px 0;
  font-size: 36px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 100;
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.level-title.show {
  opacity: 1;
  transform: translateY(0);
}

/* === 任务列表 === */
#tasks {
  line-height: 1.8;
  font-size: 14px;
}

#tasks .task-completed {
  color: #7ecf6a;
  text-decoration: line-through;
  opacity: 0.7;
}

#tasks .task-available {
  color: #ffee58;
  font-weight: 700;
}

#tasks .task-locked {
  color: #666;
}

/* === 叼着物品提示 === */
.carry-indicator {
  padding: 8px 14px;
  margin-top: 8px;
  background: rgba(255, 238, 88, 0.15);
  border: 1px solid rgba(255, 238, 88, 0.35);
  border-radius: 8px;
  font-weight: 700;
  color: #ffee58;
  font-size: 14px;
}

.carry-indicator.hidden {
  display: none;
}

/* === Canvas 内对话气泡（由JS绘制，此处为备用） === */
.game-shell {
  position: relative;
}
```

- [ ] **Step 2: Commit**

```bash
git add 大鹅模拟器/wwwroot/style.css
git commit -m "feat: add styles for task list, level title, carry indicator"
```

---

### Task 6: Integration test and fix issues

**Files:**
- All of the above

- [ ] **Step 1: Build and run the project**

```bash
cd "C:/Users/econi/source/repos/MyFirstGame/大鹅模拟器"
dotnet build
```

Expected: Build succeeded.

- [ ] **Step 2: Start the dev server**

```bash
dotnet run --urls "http://localhost:5000" &
```

- [ ] **Step 3: Manual test checklist**

Open http://localhost:5000 in browser and verify:

1. **Level 1 (Tutorial):** Page loads, canvas renders. WASD moves goose. Space honks. Can collect 4 items and reach pond exit. Level 2 loads after.
2. **Level 2 (Farm):** Task list shows 3 tasks with first one available. Walk near flower pot and press E — task 1 completes, pig speech bubble appears. Walk near water cup and press E — task 2 completes, kid speech bubble appears. Walk near farmer and press E — farmer chases goose. Lead farmer to rake, then to wall — task 3 completes.
3. **Level 3 (Palace):** Queen periodically looks down (visible in her facing direction). Guard patrols at entrance. Press E near crown while queen looks down — task 1 completes. Press E near apple — task 2 completes. Press E to pick up crown from under table, carry to queen, press E to drop — task 3 completes.
4. **Level 4 (Final):** Woman faces tree. Approach from behind, press E — task 1 completes, neighbors laugh. Go to gate, press E — task 2 completes. Pick up apple, move behind woman, press E — task 3 completes. Winning screen shows "终极捣蛋鹅".
5. **Failure:** Being caught shows "任务失败" overlay. Restart button resets all tasks.
6. **Speech bubbles:** All NPC speech bubbles appear and fade correctly.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes from manual testing"
```
