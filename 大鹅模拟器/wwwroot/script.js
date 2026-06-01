// script.js — 核心游戏引擎
// 依赖: levels.js (LEVELS, ENEMY_TYPES), interactions.js (taskState, etc.)

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const pageBody = document.body;
const gameShell = document.querySelector('.game-shell');
const restartButton = document.getElementById('restart');
const levelText = document.getElementById('level');
const statusText = document.getElementById('status');
const progressText = document.getElementById('progress');
const hintText = document.getElementById('hint');
const outfitSelect = document.getElementById('outfitSelect');
const hatSelect = document.getElementById('hatSelect');
const weaponSelect = document.getElementById('weaponSelect');

const keys = new Set();
const world = { x: 24, y: 24, width: 912, height: 492 };

const goose = {
  x: 0, y: 0,
  radius: 16,
  speed: 195,
  facing: 0,
  hidden: false,
  honkCooldown: 0,
  noisyTimer: 0,
  pickupGraceTimer: 0
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
    alertRise: 72,
    alertFall: 28,
    chaseSpeed: 136,
    route: [],
    _sitTimer: 0,
    _patrolTimer: 0,
    _isSitting: false,
    _lookDownTimer: 0,
    _isLookingDown: false,
    _phase: 1,
    _phaseTimer: 0,
    _type: null,
    _sitSpot: null,
    _sitDuration: 0,
    _patrolDuration: 0,
    _lookDownInterval: 0,
    _lookDownDuration: 0,
    _lookDownVision: 60,
    _normalVision: 200,
    _treePos: null,
    _gatePos: null,
    _glowOutfit: false,
    _defeated: false,
    _defeatFxTimer: 0,
    _hasUmbrella: false,
    _umbrellaDropped: false
};

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
let npcs = [];
let ripples = [];
let message = '';
let gameState = 'playing';
let lastTime = 0;
let sceneTime = 0;
let crownRewardUnlocked = false;
let gooseWearingCrown = false;
let focusMode = false;

const GOOSE_SKIN_KEY = 'goose-skin-v1';
const OUTFIT_OPTIONS = ['cool', 'sailor', 'armor', 'king'];
const HAT_OPTIONS = ['straw', 'beanie', 'wizard'];
const WEAPON_OPTIONS = ['umbrella', 'woodSword', 'hammer'];
const gooseSkin = {
    outfit: 'cool',
    hat: 'straw',
    weapon: 'umbrella'
};

const renderer = {
    groundScale: 0.58,
    skewX: -0.22,
    heightScale: 0.88,
    offsetY: 92
};

function isRainyLevel() {
    return currentLevelIndex >= 5;
}

function hasUmbrellaEquipped() {
    return gooseSkin.weapon === 'umbrella';
}

function cloneRect(rect) {
    return { ...rect };
}

async function toggleFocusMode() {
    focusMode = !focusMode;
    pageBody.classList.toggle('focus-mode', focusMode);

    if (!gameShell) {
        return;
    }

    if (focusMode) {
        if (document.fullscreenElement !== gameShell) {
            try {
                await gameShell.requestFullscreen();
            } catch {
                // ignore fullscreen failure and keep focus mode
            }
        }
        return;
    }

    if (document.fullscreenElement === gameShell) {
        try {
            await document.exitFullscreen();
        } catch {
            // ignore exit failure
        }
    }
}

function loadGooseSkin() {
    try {
        const raw = localStorage.getItem(GOOSE_SKIN_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            if (typeof parsed.outfit === 'string' && OUTFIT_OPTIONS.includes(parsed.outfit)) {
                gooseSkin.outfit = parsed.outfit;
            }
            if (typeof parsed.hat === 'string' && HAT_OPTIONS.includes(parsed.hat)) {
                gooseSkin.hat = parsed.hat;
            }
            if (typeof parsed.weapon === 'string' && WEAPON_OPTIONS.includes(parsed.weapon)) {
                gooseSkin.weapon = parsed.weapon;
            }
        }
    } catch {
        // ignore invalid localStorage payload
    }
}

function saveGooseSkin() {
    localStorage.setItem(GOOSE_SKIN_KEY, JSON.stringify(gooseSkin));
}

function syncGooseSkinUI() {
    if (outfitSelect) {
        outfitSelect.value = gooseSkin.outfit;
    }
    if (hatSelect) {
        hatSelect.value = gooseSkin.hat;
    }
    if (weaponSelect) {
        weaponSelect.value = gooseSkin.weapon;
    }
}

function loadLevel(index) {
  currentLevelIndex = index;
  const level = LEVELS[index];

    exitZone = level.exitZone ? cloneRect(level.exitZone) : { x: 0, y: 0, width: 0, height: 0 };
    walls = (level.walls || []).map(cloneRect);
    bushes = (level.bushes || []).map(cloneRect);
    // Deep clone items
    items = (level.items || []).map(item => ({ ...item, collected: false }));
    // Deep clone npcs for runtime animation/state
    npcs = (level.npcs || []).map(npc => ({ ...npc }));
    level._npcs = npcs;

    // Deep clone objects (for task levels) to avoid mutating LEVELS data
    if (level.objects) {
        // Store a reference that interactions.js can use
        level._objects = level.objects.map(o => ({ ...o }));
    }

    goose.x = level.gooseStart.x;
    goose.y = level.gooseStart.y;
    goose.facing = 0;
    goose.hidden = false;
    goose.honkCooldown = 0;
    goose.noisyTimer = 0;
    goose.pickupGraceTimer = 0;

    // Main enemy
    const ed = level.enemy;
    enemy.x = ed.start.x;
    enemy.y = ed.start.y;
    enemy.speed = ed.speed;
    enemy.alertRise = ed.alertRise;
    enemy.alertFall = ed.alertFall;
    enemy.chaseSpeed = ed.chaseSpeed || 136;
    enemy.route = (ed.route || []).map(p => ({ ...p }));
    enemy.routeIndex = enemy.route.length > 1 ? 1 : 0;
    enemy.facing = 0;
    enemy.alert = 0;
    enemy.chaseTimer = 0;
    enemy.investigateTimer = 0;
    enemy.investigatePoint = null;
    enemy.state = 'patrol';
    enemy._sitTimer = 0;
    enemy._patrolTimer = 0;
    enemy._isSitting = false;
    enemy._lookDownTimer = ed.lookDownInterval || 0;
    enemy._isLookingDown = false;
    enemy._phase = ed.phase || 1;
    enemy._phaseTimer = 0;
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
    enemy._glowOutfit = ed._glowOutfit || false;
    enemy._defeated = false;
    enemy._defeatFxTimer = 0;
    enemy._hasUmbrella = isRainyLevel() && [ENEMY_TYPES.GARDENER, ENEMY_TYPES.FARMER, ENEMY_TYPES.WOODCUTTER].includes(ed.type);
    enemy._umbrellaDropped = false;

    // Sync enemy state back to level.enemy for interactions.js precondition checks
    ed._isLookingDown = false;
    ed._phase = enemy._phase;
    ed._glowOutfit = enemy._glowOutfit;
    ed._umbrellaDropped = enemy._umbrellaDropped;

    // Secondary enemy
    const sed = level.secondaryEnemy;
    if (sed) {
        secondaryEnemy.active = true;
        secondaryEnemy.x = sed.start.x;
        secondaryEnemy.y = sed.start.y;
        secondaryEnemy.speed = sed.speed;
        secondaryEnemy.facing = 0;
        secondaryEnemy.routeIndex = 1;
        secondaryEnemy.route = (sed.route || []).map(p => ({ ...p }));
        secondaryEnemy.detectRange = sed.detectRange || 80;
        secondaryEnemy.detectAngle = sed.detectAngle || Math.PI / 3;
    } else {
        secondaryEnemy.active = false;
    }

    ripples = [];
    message = level.intro;
    if (isRainyLevel()) {
        message += ' 雨天里打着雨伞更不容易被发现。';
    }

    if (typeof initTaskSystem === 'function') {
        initTaskSystem();
    }
}

function resetGame() {
  gameState = 'playing';
  lastTime = 0;
  sceneTime = 0;
  crownRewardUnlocked = false;
  gooseWearingCrown = false;
  loadLevel(0);
  updateHud();
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDifference(a, b) {
    let diff = a - b;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff);
}

function circleOverlapsRect(entity, rect) {
    const nearestX = clamp(entity.x, rect.x, rect.x + rect.width);
    const nearestY = clamp(entity.y, rect.y, rect.y + rect.height);
    const dx = entity.x - nearestX;
    const dy = entity.y - nearestY;
    return dx * dx + dy * dy < entity.radius * entity.radius;
}

function resolveCollisions(entity) {
    entity.x = clamp(entity.x, world.x + entity.radius, world.x + world.width - entity.radius);
    entity.y = clamp(entity.y, world.y + entity.radius, world.y + world.height - entity.radius);

    for (const rect of walls) {
        if (!circleOverlapsRect(entity, rect)) {
            continue;
        }

        const nearestX = clamp(entity.x, rect.x, rect.x + rect.width);
        const nearestY = clamp(entity.y, rect.y, rect.y + rect.height);
        let dx = entity.x - nearestX;
        let dy = entity.y - nearestY;
        const length = Math.hypot(dx, dy) || 0.0001;

        if (dx === 0 && dy === 0) {
            const left = Math.abs(entity.x - rect.x);
            const right = Math.abs(entity.x - (rect.x + rect.width));
            const top = Math.abs(entity.y - rect.y);
            const bottom = Math.abs(entity.y - (rect.y + rect.height));
            const minEdge = Math.min(left, right, top, bottom);

            if (minEdge === left) dx = -1;
            else if (minEdge === right) dx = 1;
            else if (minEdge === top) dy = -1;
            else dy = 1;
        }

        entity.x = nearestX + (dx / length) * (entity.radius + 0.5);
        entity.y = nearestY + (dy / length) * (entity.radius + 0.5);
    }
}

function moveEntity(entity, velocityX, velocityY, dt) {
    entity.x += velocityX * dt;
    resolveCollisions(entity);
    entity.y += velocityY * dt;
    resolveCollisions(entity);
}

function pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function lineIntersectsRect(start, end, rect) {
    if (pointInRect(start, rect) || pointInRect(end, rect)) {
        return true;
    }

    const edges = [
        [{ x: rect.x, y: rect.y }, { x: rect.x + rect.width, y: rect.y }],
        [{ x: rect.x + rect.width, y: rect.y }, { x: rect.x + rect.width, y: rect.y + rect.height }],
        [{ x: rect.x + rect.width, y: rect.y + rect.height }, { x: rect.x, y: rect.y + rect.height }],
        [{ x: rect.x, y: rect.y + rect.height }, { x: rect.x, y: rect.y }]
    ];

    return edges.some(([a, b]) => segmentsIntersect(start, end, a, b));
}

function segmentsIntersect(a, b, c, d) {
    const denominator = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    if (denominator === 0) {
        return false;
    }

    const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / denominator;
    const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / denominator;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function isHidden() {
    return bushes.some(bush => circleOverlapsRect(goose, bush));
}

function allLootCollected() {
    return items.every(item => item.collected);
}

function triggerHonk() {
    if (gameState !== 'playing' || goose.honkCooldown > 0) {
        return;
    }

    goose.honkCooldown = 1.4;
    goose.noisyTimer = 1.1;
    ripples.push({ x: goose.x, y: goose.y, radius: 10, life: 0.7 });

    if (distance(goose, enemy) < 320) {
        enemy.investigatePoint = { x: goose.x, y: goose.y };
        enemy.investigateTimer = 2.8;
        if (enemy.chaseTimer <= 0) {
            enemy.state = 'investigate';
        }
    }
}

function canEnemySeeGoose(enemyData, enemyDef) {
    const toGoose = { x: goose.x - enemyData.x, y: goose.y - enemyData.y };
    const dist = Math.hypot(toGoose.x, toGoose.y);

    let effectiveRange;
    if (enemyDef && enemyDef.type === ENEMY_TYPES.QUEEN && enemyData._isLookingDown) {
        effectiveRange = enemyData._lookDownVision;
    } else {
        effectiveRange = goose.hidden && goose.noisyTimer <= 0 ? 92 : (enemyDef.normalVision || 238);
    }

    if (isRainyLevel()) {
        effectiveRange *= hasUmbrellaEquipped() ? 0.76 : 1.08;
        if (enemyData._hasUmbrella && enemyData._umbrellaDropped) {
            effectiveRange *= 0.8;
        }
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

function canGardenerSeeGoose() {
    const level = LEVELS[currentLevelIndex];
    return canEnemySeeGoose(enemy, level.enemy);
}

function canGuardSeeGoose() {
    if (!secondaryEnemy.active) return false;

    const toGoose = { x: goose.x - secondaryEnemy.x, y: goose.y - secondaryEnemy.y };
    const dist = Math.hypot(toGoose.x, toGoose.y);
    const detectRange = isRainyLevel()
        ? secondaryEnemy.detectRange * (hasUmbrellaEquipped() ? 0.76 : 1.08)
        : secondaryEnemy.detectRange;

    if (dist > detectRange) return false;

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

function advanceLevel() {
    if (currentLevelIndex >= LEVELS.length - 1) {
        crownRewardUnlocked = true;
        gooseWearingCrown = true;
        gameState = 'playing';
        loadLevel(2);
        message = '提示：终章完成！你戴着皇冠回到第 3 关巡游。';
        return;
    }

    loadLevel(currentLevelIndex + 1);
    message = '提示：' + LEVELS[currentLevelIndex].intro.replace('提示：', '');
}

function updateGoose(dt) {
    const left = keys.has('arrowleft') || keys.has('a');
    const right = keys.has('arrowright') || keys.has('d');
    const up = keys.has('arrowup') || keys.has('w');
    const down = keys.has('arrowdown') || keys.has('s');

    let velocityX = (right ? 1 : 0) - (left ? 1 : 0);
    let velocityY = (down ? 1 : 0) - (up ? 1 : 0);

    if (velocityX !== 0 || velocityY !== 0) {
        const length = Math.hypot(velocityX, velocityY);
        const moveSpeed = isRainyLevel() && !hasUmbrellaEquipped() ? goose.speed * 0.8 : goose.speed;
        velocityX = (velocityX / length) * moveSpeed;
        velocityY = (velocityY / length) * moveSpeed;
        goose.facing = Math.atan2(velocityY, velocityX);
    }

    moveEntity(goose, velocityX, velocityY, dt);
    goose.hidden = isHidden();
    goose.honkCooldown = Math.max(0, goose.honkCooldown - dt);
    goose.noisyTimer = Math.max(0, goose.noisyTimer - dt);
    goose.pickupGraceTimer = Math.max(0, goose.pickupGraceTimer - dt);

    for (const item of items) {
        if (item.collected) {
            continue;
        }

        if (distance(goose, item) <= goose.radius + 16) {
          item.collected = true;
          goose.pickupGraceTimer = 1.2;
          message = '提示：已偷到 ' + item.name + '。';
        }
    }

    if (allLootCollected()) {
        message = '提示：战利品齐了，赶紧回池塘出口！';
        if (exitZone && exitZone.width > 0 && exitZone.height > 0 && circleOverlapsRect(goose, exitZone)) {
            advanceLevel();
        }
    }
}

function updateGardener(dt) {
    const level = LEVELS[currentLevelIndex];
    const ed = level.enemy;

    if (enemy._defeated) {
        enemy.alert = 0;
        enemy.chaseTimer = 0;
        enemy.investigateTimer = 0;
        enemy.investigatePoint = null;
        enemy.state = 'defeated';
        enemy._defeatFxTimer = Math.max(0, enemy._defeatFxTimer - dt);
        return;
    }

    if (ed.type === ENEMY_TYPES.QUEEN || ed.type === ENEMY_TYPES.GUARD) {
        enemy._defeated = false;
    }

    // === Farmer: sit/patrol cycle ===
    if (ed.type === ENEMY_TYPES.FARMER) {
        if (enemy._isSitting) {
            enemy._sitTimer -= dt;
            enemy.speed = 0;
            enemy.x = ed.sitSpot.x;
            enemy.y = ed.sitSpot.y;
            if (enemy._sitTimer <= 0) {
                enemy._isSitting = false;
                enemy._patrolTimer = ed.patrolDuration;
                enemy.speed = ed.speed;
                enemy.routeIndex = 0;
            }
        } else {
            enemy._patrolTimer -= dt;
            if (enemy._patrolTimer <= 0) {
                enemy._isSitting = true;
                enemy._sitTimer = ed.sitDuration;
            }
        }
    }

    // === Queen: periodic look-down cycle ===
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
        enemy.x = ed.start.x;
        enemy.y = ed.start.y;
        enemy.facing = enemy._isLookingDown ? Math.PI / 2 : Math.atan2(goose.y - enemy.y, goose.x - enemy.x);
    }

    // === Woodcutter: phase-based AI ===
    if (ed.type === ENEMY_TYPES.WOODCUTTER) {
        if (enemy._phase === 1) {
            if (enemy._treePos) {
                enemy.facing = Math.atan2(enemy._treePos.y - enemy.y, enemy._treePos.x - enemy.x);
            }
            enemy.x = ed.start.x;
            enemy.y = ed.start.y;
            enemy.speed = 0;
            // Check if axe was dropped (by Task 1 completion)
            const levelObjs = level._objects || level.objects || [];
            const axe = levelObjs.find(o => o.id === 'axe');
            if (axe && axe.dropped) {
                enemy._phase = 2;
                enemy._phaseTimer = 4;
                ed._phase = 2;
                message = '提示：女人弯腰去捡斧头了！';
            }
        } else if (enemy._phase === 2) {
            const levelObjs2 = level._objects || level.objects || [];
            const axe = levelObjs2.find(o => o.id === 'axe');
            if (axe) {
                const dx = axe.x - enemy.x;
                const dy = axe.y - enemy.y;
                const len = Math.hypot(dx, dy) || 1;
                const moveSpeed = 60;
                enemy.x += (dx / len) * moveSpeed * dt;
                enemy.y += (dy / len) * moveSpeed * dt;
                enemy.facing = Math.atan2(dy, dx);
                enemy.speed = 0;
            }
            enemy._phaseTimer -= dt;
            if (enemy._phaseTimer <= 0) {
                const levelObjs3 = level._objects || level.objects || [];
                const axe2 = levelObjs3.find(o => o.id === 'axe');
                if (axe2) { axe2.dropped = false; axe2.x = ed.start.x + 10; axe2.y = ed.start.y; }
                enemy._phase = 3;
                ed._phase = 3;
                const gate = levelObjs3.find(o => o.id === 'gate');
                if (gate && gate.locked) {
                    enemy.x = ed.gatePos.x;
                    enemy.y = ed.gatePos.y;
                    enemy.speed = 0;
                    message = '提示：女人发现门被锁了，气得拍门！';
                }
            }
        } else if (enemy._phase === 3) {
            if (enemy._gatePos) {
                enemy.x = enemy._gatePos.x;
                enemy.y = enemy._gatePos.y;
            }
            enemy.speed = 0;
            enemy.facing = Math.PI / 2;
        }
        ed._phase = enemy._phase;
    }

    // Standard vision/alert logic (unchanged from original)
    const seesGoose = canGardenerSeeGoose();
    const alertRise = goose.hidden ? (ed.alertRise * 0.55) : ed.alertRise;
    const alertFall = goose.hidden ? (ed.alertFall * 1.5) : ed.alertFall;

    enemy.alert = clamp(enemy.alert + (seesGoose ? alertRise : -alertFall) * dt, 0, 100);

    // Queen: instant fail on full alert（女王人形免疫）
    if (!gooseWearingCrown && enemy.alert >= 100 && (ed.type === ENEMY_TYPES.QUEEN || ed.type === ENEMY_TYPES.GUARD)) {
        gameState = 'lost';
        return;
    }

    // Gardener/farmer/woodcutter: chase on full alert
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
        const route = enemy.route;
        target = route[enemy.routeIndex] || { x: enemy.x, y: enemy.y };
        if (route.length > 0 && distance(enemy, target) < 10) {
            enemy.routeIndex = (enemy.routeIndex + 1) % route.length;
            target = route[enemy.routeIndex] || target;
        }
    }

    if (isRainyLevel() && enemy._hasUmbrella && enemy._umbrellaDropped) {
        speed *= 0.82;
    }

    // Don't move if farmer is sitting or queen or phase 1/3 woodcutter
    const shouldMove = !(
        (ed.type === ENEMY_TYPES.FARMER && enemy._isSitting) ||
        (ed.type === ENEMY_TYPES.QUEEN) ||
        (ed.type === ENEMY_TYPES.WOODCUTTER && (enemy._phase === 1 || enemy._phase === 3))
    );

    if (shouldMove) {
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const len = Math.hypot(dx, dy) || 1;
        enemy.facing = Math.atan2(dy, dx);
        moveEntity(enemy, (dx / len) * speed, (dy / len) * speed, dt);
    }

      const inCatchRange = distance(goose, enemy) < goose.radius + enemy.radius + 4;
      if (!gooseWearingCrown && inCatchRange) {
        const hasWeapon = typeof gooseSkin !== 'undefined' && gooseSkin && !!gooseSkin.weapon;
        const canMeleeCounter = hasWeapon && (
            ed.type === ENEMY_TYPES.GARDENER ||
            ed.type === ENEMY_TYPES.FARMER ||
            ed.type === ENEMY_TYPES.WOODCUTTER
        );

        if (canMeleeCounter) {
            message = '提示：近身压制中！按 E 使用武器反击。';
        } else if (goose.pickupGraceTimer <= 0) {
            gameState = 'lost';
        }
      }
    }

function updateSecondaryEnemy(dt) {
    if (!secondaryEnemy.active) return;

    const sed = LEVELS[currentLevelIndex].secondaryEnemy;
    if (!sed) return;

    const route = secondaryEnemy.route;
    if (route.length === 0) return;

    const target = route[secondaryEnemy.routeIndex] || { x: secondaryEnemy.x, y: secondaryEnemy.y };
    const dx = target.x - secondaryEnemy.x;
    const dy = target.y - secondaryEnemy.y;
    const len = Math.hypot(dx, dy) || 1;

    if (len < 10 && route.length > 0) {
        secondaryEnemy.routeIndex = (secondaryEnemy.routeIndex + 1) % route.length;
    }

    secondaryEnemy.x += (dx / len) * secondaryEnemy.speed * dt;
    secondaryEnemy.y += (dy / len) * secondaryEnemy.speed * dt;
    secondaryEnemy.facing = Math.atan2(dy, dx);

    if (!gooseWearingCrown && canGuardSeeGoose()) {
        gameState = 'lost';
    }
}

function updateRipples(dt) {
  ripples = ripples.filter(ripple => {
    ripple.radius += 140 * dt;
    ripple.life -= dt;
    return ripple.life > 0;
  });
}

function updateHud() {
    const level = LEVELS[currentLevelIndex];

    levelText.textContent = '关卡：' + level.name;

    if (level.gameType === 'task' && typeof taskState !== 'undefined' && taskState) {
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
        hintText.textContent = '最终奖励：👑 皇冠！终极捣蛋鹅，恭喜通关。';
        return;
    }

    if (gameState === 'lost') {
        statusText.textContent = '状态：被抓住了';
        hintText.textContent = '按"重新开始"，这次多利用草丛和时机。';
        return;
    }

    if (crownRewardUnlocked && !gooseWearingCrown) {
        statusText.textContent = '状态：奖励已解锁';
        hintText.textContent = '提示：按 E 由大鹅自己拿皇冠，后续关卡由你手动推进。';
        return;
    }

    if (enemy._defeated) {
      statusText.textContent = '状态：园丁已被击退';
    } else if (goose.pickupGraceTimer > 0) {
      statusText.textContent = '状态：偷到手，短暂无敌';
    } else if (enemy.state === 'chase') {
      statusText.textContent = '状态：快跑！';
    } else if (enemy.alert > 50) {
        statusText.textContent = '状态：引起了怀疑';
    } else if (goose.hidden) {
        statusText.textContent = '状态：藏在草丛中';
    } else if (typeof carriedItem !== 'undefined' && carriedItem) {
        statusText.textContent = '状态：叼着' + (carriedItem.label || '物品');
    } else if (gooseWearingCrown) {
        statusText.textContent = '状态：女王形态（不可被抓）';
    } else if (isRainyLevel() && hasUmbrellaEquipped()) {
        statusText.textContent = '状态：雨中撑伞潜行';
    } else if (isRainyLevel()) {
        statusText.textContent = '状态：淋雨潜行';
    } else {
        statusText.textContent = '状态：潜行中';
    }

    hintText.textContent = message;
}

function projectPoint(x, y, z = 0) {
    return {
        x: x + (y - canvas.height * 0.5) * renderer.skewX,
        y: y * renderer.groundScale - z * renderer.heightScale + renderer.offsetY
    };
}

function drawPolygon(points, fillStyle, strokeStyle = null, lineWidth = 1) {
    if (points.length === 0) {
        return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }

    if (strokeStyle) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
}

function drawGroundEllipse(x, y, radiusX, radiusY, fillStyle, alpha = 1) {
    const center = projectPoint(x, y, 0);
    ctx.fillStyle = fillStyle;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, radiusX, radiusY * renderer.groundScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawShadow(x, y, radiusX, radiusY, alpha = 0.24) {
    drawGroundEllipse(x, y, radiusX, radiusY, '#050a07', alpha);
}

function drawRainOverlay() {
    if (!isRainyLevel()) {
        return;
    }

    ctx.save();
    ctx.fillStyle = 'rgba(26, 38, 58, 0.16)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(190, 220, 255, 0.38)';
    ctx.lineWidth = 1.4;

    for (let i = -4; i < 34; i += 1) {
        const offsetX = (sceneTime * 220 + i * 53) % (canvas.width + 80);
        const offsetY = (sceneTime * 460 + i * 97) % (canvas.height + 120);
        const x = offsetX - 40;
        const y = offsetY - 120;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 14, y + 28);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 260, y - 180);
        ctx.lineTo(x + 246, y - 152);
        ctx.stroke();
    }

    ctx.restore();
}

function drawPrism(rect, height, colors) {
    const northWest = projectPoint(rect.x, rect.y, 0);
    const northEast = projectPoint(rect.x + rect.width, rect.y, 0);
    const southEast = projectPoint(rect.x + rect.width, rect.y + rect.height, 0);
    const southWest = projectPoint(rect.x, rect.y + rect.height, 0);

    const topNorthWest = projectPoint(rect.x, rect.y, height);
    const topNorthEast = projectPoint(rect.x + rect.width, rect.y, height);
    const topSouthEast = projectPoint(rect.x + rect.width, rect.y + rect.height, height);
    const topSouthWest = projectPoint(rect.x, rect.y + rect.height, height);

    drawPolygon([southWest, southEast, topSouthEast, topSouthWest], colors.front);
    drawPolygon([northEast, southEast, topSouthEast, topNorthEast], colors.side);
    drawPolygon([topNorthWest, topNorthEast, topSouthEast, topSouthWest], colors.top, colors.outline ?? 'rgba(10, 18, 14, 0.15)');
}

function drawExitZone() {
    if (!exitZone || exitZone.width === 0) return;

    drawPrism(exitZone, 10, {
        top: currentLevelIndex === 0 ? '#5fb6ff' : '#4a9be0',
        front: currentLevelIndex === 0 ? '#2f7fc0' : '#286eaf',
        side: currentLevelIndex === 0 ? '#418fca' : '#347fbe',
        outline: 'rgba(227, 247, 255, 0.35)'
    });

    const centerX = exitZone.x + exitZone.width / 2;
    const centerY = exitZone.y + exitZone.height / 2;
    const water = projectPoint(centerX, centerY, 12);
    const shimmer = 0.92 + Math.sin(sceneTime * 3.2) * 0.08;

    ctx.fillStyle = 'rgba(226, 245, 255, ' + (0.2 * shimmer) + ')';
    ctx.beginPath();
    ctx.ellipse(water.x, water.y, exitZone.width * 0.34, exitZone.height * renderer.groundScale * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d9f4ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px Microsoft YaHei';
    ctx.fillText('池塘出口', water.x, water.y - 2);
}

function drawGround() {
    const rainyLevel = isRainyLevel();
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, rainyLevel ? '#5c7088' : (currentLevelIndex === 0 ? '#9fd3ff' : '#a7c9ff'));
    skyGradient.addColorStop(0.42, rainyLevel ? '#8aa0b8' : (currentLevelIndex === 0 ? '#d7efff' : '#dae8ff'));
    skyGradient.addColorStop(0.43, rainyLevel ? '#5b8a54' : (currentLevelIndex === 0 ? '#7dcf67' : '#84c45d'));
    skyGradient.addColorStop(1, rainyLevel ? '#355234' : (currentLevelIndex === 0 ? '#4b8a3d' : '#537f39'));
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const groundPoints = [
        projectPoint(world.x, world.y, 0),
        projectPoint(world.x + world.width, world.y, 0),
        projectPoint(world.x + world.width, world.y + world.height, 0),
        projectPoint(world.x, world.y + world.height, 0)
    ];

    drawPolygon(
        groundPoints,
        currentLevelIndex === 0 ? '#7dcf67' : '#84c45d',
        'rgba(14, 36, 18, 0.22)',
        2
    );

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = world.x; x <= world.x + world.width; x += 120) {
        const from = projectPoint(x, world.y, 0);
        const to = projectPoint(x, world.y + world.height, 0);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }

    for (let y = world.y; y <= world.y + world.height; y += 96) {
        const from = projectPoint(world.x, y, 0);
        const to = projectPoint(world.x + world.width, y, 0);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }

    const patchColor = isRainyLevel() ? '#5d8f57' : (currentLevelIndex === 0 ? '#67b459' : '#6da14d');
    for (let i = 0; i < 28; i += 1) {
        const x = world.x + ((i * 137 + currentLevelIndex * 37) % world.width);
        const y = world.y + ((i * 79 + currentLevelIndex * 63) % world.height);
        drawGroundEllipse(x, y, 28, 20, patchColor, 0.35);
    }

    drawExitZone();
    drawRainOverlay();
}

function drawWalls() {
    for (const wall of walls) {
        drawPrism(wall, 28, {
            top: currentLevelIndex === 0 ? '#d8c695' : '#d0b682',
            front: currentLevelIndex === 0 ? '#a78557' : '#98764f',
            side: currentLevelIndex === 0 ? '#bc9b6c' : '#ad885a',
            outline: 'rgba(70, 50, 25, 0.18)'
        });
    }
}

function drawBushes() {
    for (const bush of bushes) {
        const hiddenBush = goose.hidden && circleOverlapsRect(goose, bush);
        drawPrism(bush, 22, {
            top: hiddenBush ? 'rgba(36, 110, 45, 0.95)' : 'rgba(53, 146, 62, 0.92)',
            front: hiddenBush ? 'rgba(25, 88, 34, 0.98)' : 'rgba(38, 112, 46, 0.92)',
            side: hiddenBush ? 'rgba(29, 96, 38, 0.98)' : 'rgba(44, 124, 50, 0.92)',
            outline: 'rgba(10, 30, 12, 0.18)'
        });

        const crown = projectPoint(bush.x + bush.width / 2, bush.y + bush.height / 2, 30);
        ctx.fillStyle = hiddenBush ? 'rgba(78, 175, 88, 0.9)' : 'rgba(100, 194, 102, 0.82)';
        ctx.beginPath();
        ctx.ellipse(crown.x, crown.y, bush.width * 0.32, bush.height * renderer.groundScale * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawItem(item) {
    drawShadow(item.x, item.y, 15, 10, 0.16);

    const bob = 24 + Math.sin(sceneTime * 2.4 + item.x * 0.025 + item.y * 0.018) * 4;
    const point = projectPoint(item.x, item.y, bob);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '26px Segoe UI Emoji, Microsoft YaHei';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(point.x, point.y + 10, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(item.emoji, point.x, point.y);
}

function drawItems() {
    for (const item of items) {
        if (!item.collected) {
            drawItem(item);
        }
    }
}

function drawVisionCone() {
    const range = enemy.state === 'chase' ? 210 : 190;
    const halfFov = Math.PI * 0.36;
    const points = [projectPoint(enemy.x, enemy.y, 4)];

    for (let i = 0; i <= 20; i += 1) {
        const angle = enemy.facing - halfFov + (i / 20) * halfFov * 2;
        points.push(projectPoint(enemy.x + Math.cos(angle) * range, enemy.y + Math.sin(angle) * range, 2));
    }

    ctx.fillStyle = enemy.state === 'chase' ? 'rgba(255, 82, 82, 0.16)' : 'rgba(255, 245, 173, 0.12)';
    drawPolygon(points, ctx.fillStyle);
}

function drawGardener() {
  if (!enemy._defeated) {
    drawVisionCone();
  }

  drawShadow(enemy.x, enemy.y, 22, 12, 0.24);

  const directionX = Math.cos(enemy.facing);
  const directionY = Math.sin(enemy.facing);
  const body = projectPoint(enemy.x, enemy.y, 22);
  const head = projectPoint(enemy.x + directionX * 8, enemy.y + directionY * 5, 48);
  const leftFoot = projectPoint(enemy.x - 9, enemy.y + 6, 0);
  const rightFoot = projectPoint(enemy.x + 9, enemy.y + 6, 0);

  if (enemy._glowOutfit) {
    const glow = projectPoint(enemy.x, enemy.y, 30);
    ctx.strokeStyle = 'rgba(255, 242, 122, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(glow.x, glow.y, 34, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = '#20325f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(body.x - 6, body.y + 10);
  ctx.lineTo(leftFoot.x, leftFoot.y);
  ctx.moveTo(body.x + 6, body.y + 10);
  ctx.lineTo(rightFoot.x, rightFoot.y);
  ctx.stroke();

  ctx.fillStyle = enemy._defeated ? '#7e8a99' : (enemy._glowOutfit ? '#ffd84f' : '#3357b2');
  ctx.beginPath();
  ctx.ellipse(body.x, body.y, 20, enemy._defeated ? 12 : 24, enemy._defeated ? 0.25 : 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f3d6b0';
  ctx.beginPath();
  ctx.arc(head.x, enemy._defeated ? head.y + 8 : head.y, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = enemy._glowOutfit ? '#fff8c8' : '#1d2c66';
  ctx.fillRect(body.x - 16, body.y + 14, 32, 8);

  if (isRainyLevel() && enemy._hasUmbrella && !enemy._umbrellaDropped && !enemy._defeated) {
    const umbrellaTop = projectPoint(enemy.x - directionX * 1.5, enemy.y - directionY * 1.5, 72);
    const umbrellaBottom = projectPoint(enemy.x - directionX * 4, enemy.y - directionY * 4, 18);
    ctx.strokeStyle = '#6d4a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(umbrellaTop.x, umbrellaTop.y);
    ctx.lineTo(umbrellaBottom.x, umbrellaBottom.y);
    ctx.stroke();

    ctx.fillStyle = '#4b6fd1';
    ctx.beginPath();
    ctx.arc(umbrellaTop.x, umbrellaTop.y + 2, 16, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  if (enemy._defeated && enemy._defeatFxTimer > 0) {
    ctx.font = '18px Microsoft YaHei';
    ctx.fillStyle = '#ffe082';
    ctx.textAlign = 'center';
    ctx.fillText('💫', head.x, head.y - 18);
  }

  if (isRainyLevel() && enemy._hasUmbrella && !enemy._umbrellaDropped && !enemy._defeated) {
    const umbrellaTop = projectPoint(enemy.x - directionX * 1.5, enemy.y - directionY * 1.5, 72);
    const umbrellaBottom = projectPoint(enemy.x - directionX * 4, enemy.y - directionY * 4, 18);
    ctx.strokeStyle = '#6d4a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(umbrellaTop.x, umbrellaTop.y);
    ctx.lineTo(umbrellaBottom.x, umbrellaBottom.y);
    ctx.stroke();

    ctx.fillStyle = '#4b6fd1';
    ctx.beginPath();
    ctx.arc(umbrellaTop.x, umbrellaTop.y + 2, 16, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(24, 20, 180, 14);
  ctx.fillStyle = '#ffee58';
  ctx.fillRect(24, 20, 180 * (enemy.alert / 100), 14);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeRect(24, 20, 180, 14);
}

function drawGoose() {
    for (const ripple of ripples) {
        const ripplePoint = projectPoint(ripple.x, ripple.y, 2);
        ctx.strokeStyle = 'rgba(255,255,255,' + ripple.life * 0.6 + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(ripplePoint.x, ripplePoint.y, ripple.radius, ripple.radius * renderer.groundScale, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    const directionX = Math.cos(goose.facing);
    const directionY = Math.sin(goose.facing);

    if (gooseWearingCrown) {
      drawShadow(goose.x, goose.y, 18, 10, 0.28);

      const torso = projectPoint(goose.x, goose.y, 26);
      const head = projectPoint(goose.x + directionX * 4, goose.y + directionY * 3, 46);
      const leftLeg = projectPoint(goose.x - 6, goose.y + 5, 0);
      const rightLeg = projectPoint(goose.x + 6, goose.y + 5, 0);
      const cape = projectPoint(goose.x - directionX * 9, goose.y - directionY * 8, 22);

      // 霸气披风
      ctx.fillStyle = 'rgba(74, 22, 124, 0.88)';
      ctx.beginPath();
      ctx.moveTo(cape.x - 14, cape.y - 2);
      ctx.lineTo(cape.x + 14, cape.y - 2);
      ctx.lineTo(cape.x + 10, cape.y + 20);
      ctx.lineTo(cape.x - 10, cape.y + 20);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#2e2350';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(torso.x - 4, torso.y + 12);
      ctx.lineTo(leftLeg.x, leftLeg.y);
      ctx.moveTo(torso.x + 4, torso.y + 12);
      ctx.lineTo(rightLeg.x, rightLeg.y);
      ctx.stroke();

      // 紫金礼袍
      ctx.fillStyle = '#7e49b5';
      ctx.beginPath();
      ctx.ellipse(torso.x, torso.y, 18, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(232, 208, 120, 0.95)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(torso.x, torso.y + 2, 11, 13, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 头部
      ctx.fillStyle = '#f3d6b0';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // 冷峻眼神
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(head.x - 4, head.y - 1);
      ctx.lineTo(head.x - 1, head.y - 2);
      ctx.moveTo(head.x + 1, head.y - 2);
      ctx.lineTo(head.x + 4, head.y - 1);
      ctx.stroke();

      // 王冠 + 宝石
      const crownTop = projectPoint(goose.x + directionX * 4, goose.y + directionY * 3, 58);
      ctx.fillStyle = '#f5c542';
      ctx.beginPath();
      ctx.moveTo(crownTop.x - 11, crownTop.y + 7);
      ctx.lineTo(crownTop.x - 7, crownTop.y - 6);
      ctx.lineTo(crownTop.x - 1, crownTop.y + 1);
      ctx.lineTo(crownTop.x + 4, crownTop.y - 7);
      ctx.lineTo(crownTop.x + 11, crownTop.y + 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ff5ca8';
      ctx.beginPath();
      ctx.arc(crownTop.x + 4, crownTop.y - 2, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 权杖
      const staffTop = projectPoint(goose.x + directionX * 11, goose.y + directionY * 10, 42);
      const staffBottom = projectPoint(goose.x + directionX * 7, goose.y + directionY * 13, 4);
      ctx.strokeStyle = '#c8a13f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(staffTop.x, staffTop.y);
      ctx.lineTo(staffBottom.x, staffBottom.y);
      ctx.stroke();

      ctx.fillStyle = '#6ee7ff';
      ctx.beginPath();
      ctx.arc(staffTop.x, staffTop.y - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 威压光环
      const aura = projectPoint(goose.x, goose.y, 40);
      ctx.strokeStyle = 'rgba(255, 215, 110, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(aura.x, aura.y, 30, 16, 0, 0, Math.PI * 2);
      ctx.stroke();

      return;
    }

    drawShadow(goose.x, goose.y, 18, 10, 0.22);

    const body = projectPoint(goose.x, goose.y, 14);
    const wing = projectPoint(goose.x - directionY * 4, goose.y + directionX * 2, 17);
    const neckBase = projectPoint(goose.x + directionX * 6, goose.y + directionY * 6, 22);
    const head = projectPoint(goose.x + directionX * 18, goose.y + directionY * 10, 36);

    ctx.fillStyle = goose.hidden ? '#d8ddd9' : '#ffffff';
    ctx.beginPath();
    ctx.ellipse(body.x, body.y, 22, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(224, 228, 224, 0.9)';
    ctx.beginPath();
    ctx.ellipse(wing.x, wing.y, 11, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(neckBase.x, neckBase.y);
    ctx.lineTo(head.x - directionX * 8, head.y + 4);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(head.x, head.y, 10, 12, 0.15, 0, Math.PI * 2);
    ctx.fill();

    if (gooseSkin.outfit === 'king') {
        const cape = projectPoint(goose.x - directionX * 9, goose.y - directionY * 8, 22);

        // 王袍披风
        ctx.fillStyle = 'rgba(74, 22, 124, 0.92)';
        ctx.beginPath();
        ctx.moveTo(cape.x - 14, cape.y - 2);
        ctx.lineTo(cape.x + 14, cape.y - 2);
        ctx.lineTo(cape.x + 10, cape.y + 20);
        ctx.lineTo(cape.x - 10, cape.y + 20);
        ctx.closePath();
        ctx.fill();

        // 紫金礼袍
        ctx.fillStyle = '#7e49b5';
        ctx.beginPath();
        ctx.ellipse(body.x, body.y + 2, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // 金色领饰
        ctx.strokeStyle = 'rgba(232, 208, 120, 0.98)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(neckBase.x + directionX * 1.2, neckBase.y + 1, 5.2, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();

        // 大王冠
        const kingCrown = projectPoint(goose.x + directionX * 17, goose.y + directionY * 9, 52);
        ctx.fillStyle = '#f5c542';
        ctx.beginPath();
        ctx.moveTo(kingCrown.x - 10, kingCrown.y + 6);
        ctx.lineTo(kingCrown.x - 6, kingCrown.y - 5);
        ctx.lineTo(kingCrown.x - 1, kingCrown.y + 1);
        ctx.lineTo(kingCrown.x + 4, kingCrown.y - 6);
        ctx.lineTo(kingCrown.x + 10, kingCrown.y + 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff5ca8';
        ctx.beginPath();
        ctx.arc(kingCrown.x + 3, kingCrown.y - 1, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // 权杖
        const staffTop = projectPoint(goose.x + directionX * 12, goose.y + directionY * 9, 40);
        const staffBottom = projectPoint(goose.x + directionX * 8, goose.y + directionY * 12, 6);
        ctx.strokeStyle = '#c8a13f';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(staffTop.x, staffTop.y);
        ctx.lineTo(staffBottom.x, staffBottom.y);
        ctx.stroke();

        ctx.fillStyle = '#6ee7ff';
        ctx.beginPath();
        ctx.arc(staffTop.x, staffTop.y - 2, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // 王者光环
        const aura = projectPoint(goose.x, goose.y, 30);
        ctx.strokeStyle = 'rgba(255, 215, 110, 0.45)';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.ellipse(aura.x, aura.y, 30, 14, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else if (gooseSkin.outfit === 'cool') {
        // 酷感外套描边
        ctx.strokeStyle = goose.hidden ? 'rgba(79, 86, 95, 0.75)' : '#263341';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(body.x, body.y + 1, 22, 15, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 金属项链
        ctx.strokeStyle = 'rgba(255, 214, 102, 0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(neckBase.x + directionX * 1.5, neckBase.y + 1, 5, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();

        // 墨镜
        const shadesCenterX = head.x + directionX * 0.8;
        const shadesCenterY = head.y - 2;
        ctx.fillStyle = 'rgba(15, 19, 28, 0.92)';
        ctx.beginPath();
        ctx.ellipse(shadesCenterX - 3.4, shadesCenterY, 3.2, 2.5, 0, 0, Math.PI * 2);
        ctx.ellipse(shadesCenterX + 2.8, shadesCenterY, 3.2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(180, 192, 210, 0.8)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(shadesCenterX - 0.2, shadesCenterY);
        ctx.lineTo(shadesCenterX + 0.1, shadesCenterY);
        ctx.stroke();
    } else if (gooseSkin.outfit === 'sailor') {
        ctx.fillStyle = 'rgba(45, 94, 165, 0.88)';
        ctx.beginPath();
        ctx.ellipse(body.x, body.y + 2, 20, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e8f4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(body.x - 10, body.y + 1);
        ctx.lineTo(body.x + 10, body.y + 1);
        ctx.moveTo(body.x - 8, body.y + 6);
        ctx.lineTo(body.x + 8, body.y + 6);
        ctx.stroke();
    } else if (gooseSkin.outfit === 'armor') {
        ctx.fillStyle = 'rgba(126, 134, 150, 0.9)';
        ctx.beginPath();
        ctx.ellipse(body.x, body.y + 2, 20, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(210, 220, 238, 0.95)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(body.x, body.y - 8);
        ctx.lineTo(body.x, body.y + 10);
        ctx.moveTo(body.x - 10, body.y - 1);
        ctx.lineTo(body.x + 10, body.y - 1);
        ctx.stroke();
    }

    if (gooseSkin.hat === 'straw') {
        const hatBase = projectPoint(goose.x + directionX * 16, goose.y + directionY * 9, 45);
        ctx.fillStyle = '#d7b46a';
        ctx.beginPath();
        ctx.ellipse(hatBase.x, hatBase.y, 12, 4.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(hatBase.x - 4.2, hatBase.y - 8.5, 8.4, 6.5);
    } else if (gooseSkin.hat === 'beanie') {
        const hatBase = projectPoint(goose.x + directionX * 16, goose.y + directionY * 9, 45);
        ctx.fillStyle = '#dc4f66';
        ctx.beginPath();
        ctx.ellipse(hatBase.x, hatBase.y - 2, 8, 6, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f9f2f2';
        ctx.fillRect(hatBase.x - 7, hatBase.y - 3, 14, 3);
    } else if (gooseSkin.hat === 'wizard') {
        const hatBase = projectPoint(goose.x + directionX * 16, goose.y + directionY * 9, 45);
        ctx.fillStyle = '#5f3ea8';
        ctx.beginPath();
        ctx.moveTo(hatBase.x, hatBase.y - 14);
        ctx.lineTo(hatBase.x - 8, hatBase.y + 2);
        ctx.lineTo(hatBase.x + 8, hatBase.y + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#7fe4ff';
        ctx.beginPath();
        ctx.arc(hatBase.x + 2, hatBase.y - 8, 1.6, 0, Math.PI * 2);
        ctx.fill();
    }

    if (gooseSkin.weapon === 'umbrella') {
        const rainyUmbrella = isRainyLevel();
        const top = rainyUmbrella
            ? projectPoint(goose.x - directionX * 2, goose.y - directionY * 2, 64)
            : projectPoint(goose.x - directionX * 10, goose.y - directionY * 10, 54);
        const bottom = projectPoint(goose.x - directionX * 5, goose.y - directionY * 5, 8);
        ctx.strokeStyle = '#5b3b1f';
        ctx.lineWidth = rainyUmbrella ? 3 : 2.4;
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bottom.x, bottom.y);
        ctx.stroke();

        ctx.fillStyle = '#5da2ff';
        ctx.beginPath();
        ctx.arc(top.x, top.y + 2, rainyUmbrella ? 15 : 8, Math.PI, Math.PI * 2);
        ctx.fill();

        if (rainyUmbrella) {
            ctx.strokeStyle = 'rgba(232, 246, 255, 0.92)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(top.x - 10, top.y + 2);
            ctx.lineTo(top.x, top.y - 6);
            ctx.lineTo(top.x + 10, top.y + 2);
            ctx.stroke();
        }
    } else if (gooseSkin.weapon === 'woodSword') {
        const hilt = projectPoint(goose.x + directionX * 10, goose.y + directionY * 6, 22);
        const tip = projectPoint(goose.x + directionX * 18, goose.y + directionY * 11, 50);
        ctx.strokeStyle = '#8b6b47';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(hilt.x, hilt.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();

        ctx.strokeStyle = '#f2cf7f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hilt.x - 5, hilt.y + 2);
        ctx.lineTo(hilt.x + 5, hilt.y - 2);
        ctx.stroke();
    } else if (gooseSkin.weapon === 'hammer') {
        const handleTop = projectPoint(goose.x + directionX * 10, goose.y + directionY * 8, 28);
        const handleBottom = projectPoint(goose.x + directionX * 6, goose.y + directionY * 12, 6);
        ctx.strokeStyle = '#91673d';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(handleTop.x, handleTop.y);
        ctx.lineTo(handleBottom.x, handleBottom.y);
        ctx.stroke();

        ctx.fillStyle = '#9da7b4';
        ctx.fillRect(handleTop.x - 6, handleTop.y - 3, 12, 6);
    }

    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(head.x + directionX * 7, head.y - 1);
    ctx.lineTo(head.x + directionX * 18 + 2, head.y + directionY * 3);
    ctx.lineTo(head.x + directionX * 7, head.y + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#101010';
    ctx.beginPath();
    ctx.arc(head.x + directionX * 2, head.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawNPCs() {
    const level = LEVELS[currentLevelIndex];
    const levelNpcs = level._npcs || level.npcs;
    if (!levelNpcs || levelNpcs.length === 0) return;

    for (const npc of levelNpcs) {
        const point = projectPoint(npc.x, npc.y, 22);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (gooseWearingCrown) {
            const bowWave = Math.sin(sceneTime * 3.8 + npc.x * 0.01) * 1.6;
            const px = point.x;
            const py = point.y + bowWave;

            // 头
            ctx.fillStyle = '#f3d6b0';
            ctx.beginPath();
            ctx.arc(px + 6, py - 16, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // 身体（前倾）
            ctx.strokeStyle = '#2f4f6f';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(px - 8, py - 10);
            ctx.lineTo(px + 8, py - 3);
            ctx.stroke();

            // 腿（微屈）
            ctx.strokeStyle = '#1f2d3a';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(px - 3, py - 4);
            ctx.lineTo(px - 6, py + 7);
            ctx.moveTo(px + 4, py - 2);
            ctx.lineTo(px + 1, py + 8);
            ctx.stroke();

            // 手臂（向前）
            ctx.strokeStyle = '#365b7a';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(px - 2, py - 8);
            ctx.lineTo(px + 7, py - 1);
            ctx.stroke();

            ctx.font = '12px Microsoft YaHei';
            ctx.fillStyle = '#ffe79a';
            ctx.fillText('向鹅王鞠躬', px, py + 20);
            continue;
        }

        ctx.font = '28px Segoe UI Emoji, Microsoft YaHei';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(npc.emoji, point.x, point.y);
        ctx.font = '13px Microsoft YaHei';
        ctx.fillText(npc.label, point.x, point.y + 24);
    }
}

function updateNPCs(dt) {
    const level = LEVELS[currentLevelIndex];
    const levelNpcs = level._npcs || level.npcs;
    if (!levelNpcs || levelNpcs.length === 0) return;

    for (const npc of levelNpcs) {
        if (npc.id !== 'kitten') continue;

        npc._wanderTimer = (npc._wanderTimer || 0) - dt;
        if (npc._wanderTimer <= 0) {
            npc._wanderTimer = 1.2 + Math.random() * 1.8;
            const angle = Math.random() * Math.PI * 2;
            npc._vx = Math.cos(angle) * (24 + Math.random() * 28);
            npc._vy = Math.sin(angle) * (24 + Math.random() * 28);
        }

        npc.x += (npc._vx || 0) * dt;
        npc.y += (npc._vy || 0) * dt;

        const minX = world.x + 18;
        const maxX = world.x + world.width - 18;
        const minY = world.y + 18;
        const maxY = world.y + world.height - 18;
        npc.x = clamp(npc.x, minX, maxX);
        npc.y = clamp(npc.y, minY, maxY);
    }
}

function drawObjects() {
    const level = LEVELS[currentLevelIndex];
    const objs = level._objects || level.objects;
    if (!objs) return;

    for (const obj of objs) {
        if (obj.x < 0 || obj.y < 0) continue;
        if (obj.carried) continue;

        const bob = 24 + Math.sin(sceneTime * 2.4 + obj.x * 0.025 + obj.y * 0.018) * 3;
        const point = projectPoint(obj.x, obj.y, bob);

        if (obj.id === 'crown' && obj.state === 'underTable') {
            ctx.globalAlpha = 0.6;
        }

        if (obj.id === 'gate') {
            ctx.fillStyle = obj.locked ? '#8b4513' : '#d4a574';
            ctx.fillRect(point.x - 25, point.y - 6, 50, 14);
            if (obj.locked) {
                ctx.fillStyle = '#ff4444';
                ctx.font = 'bold 14px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText('🔒', point.x, point.y + 4);
            }
            ctx.globalAlpha = 1;
            continue;
        }

        ctx.globalAlpha = 1;
        ctx.font = '24px Segoe UI Emoji, Microsoft YaHei';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.emoji, point.x, point.y);
        if (obj.label && obj.id !== 'crown') {
            ctx.font = '11px Microsoft YaHei';
            ctx.fillText(obj.label, point.x, point.y + 20);
        }
    }
}

function drawActors() {
    const renderables = [
        { depth: enemy.y, draw: drawGardener },
        { depth: goose.y, draw: drawGoose }
    ];

    for (const item of items) {
        if (!item.collected) {
            renderables.push({ depth: item.y, draw: () => drawItem(item) });
        }
    }

    renderables.sort((a, b) => a.depth - b.depth);

    for (const renderable of renderables) {
        renderable.draw();
    }
}

function drawOverlay() {
    if (gameState === 'playing') {
        return;
    }

    ctx.fillStyle = 'rgba(5, 11, 8, 0.48)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 42px Microsoft YaHei';
    ctx.fillText(gameState === 'won' ? '任务完成！' : '任务失败', canvas.width / 2, canvas.height / 2 - 18);
    ctx.font = '22px Microsoft YaHei';
    ctx.fillText(gameState === 'won' ? '最终奖励：👑 皇冠' : '园丁把你逮住了。', canvas.width / 2, canvas.height / 2 + 28);
}

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

function frame(timestamp) {
    const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
    lastTime = timestamp;
    sceneTime += dt;

    if (gameState === 'playing') {
      updateGoose(dt);
      updateGardener(dt);
      updateSecondaryEnemy(dt);
      if (typeof updateInteractions === 'function') {
        updateInteractions(dt);
      }
      updateNPCs(dt);
      updateRipples(dt);
    }

    updateHud();
    draw();
    requestAnimationFrame(frame);
}

window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    const isFocusToggle = key === 'h' || event.code === 'KeyH';
    const isInteractKey = key === 'e' || event.code === 'KeyE';

    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'e', 'h'].includes(key) || event.code === 'Space' || event.code === 'KeyE' || event.code === 'KeyH') {
        event.preventDefault();
    }

    if (isFocusToggle) {
        toggleFocusMode();
        return;
    }

    if (event.code === 'Space' || key === ' ') {
        triggerHonk();
        return;
    }

    if (isInteractKey) {
        if (typeof handleInteract === 'function') {
            handleInteract();
        }
        return;
    }

    keys.add(key);
});

window.addEventListener('keyup', event => {
    keys.delete(event.key.toLowerCase());
});

window.addEventListener('fullscreenchange', () => {
    const isGameFullscreen = document.fullscreenElement === gameShell;
    if (!isGameFullscreen && focusMode) {
        focusMode = false;
        pageBody.classList.remove('focus-mode');
    }
});

restartButton.addEventListener('click', () => {
    resetGame();
});

if (outfitSelect) {
    outfitSelect.addEventListener('change', event => {
        gooseSkin.outfit = event.target.value;
        saveGooseSkin();
    });
}

if (hatSelect) {
    hatSelect.addEventListener('change', event => {
        gooseSkin.hat = event.target.value;
        saveGooseSkin();
    });
}

if (weaponSelect) {
    weaponSelect.addEventListener('change', event => {
        gooseSkin.weapon = event.target.value;
        saveGooseSkin();
    });
}

loadGooseSkin();
syncGooseSkinUI();
resetGame();
requestAnimationFrame(frame);
