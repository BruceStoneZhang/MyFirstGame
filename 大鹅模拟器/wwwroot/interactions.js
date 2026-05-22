// interactions.js — 任务系统、E键互动、对话气泡
// 依赖: LEVELS (from levels.js)
// 暴露: taskState, speechBubbles, initTaskSystem, updateInteractions,
//        handleInteract, drawSpeechBubbles, isTaskLevel

let taskState = null;
let speechBubbles = [];
let carriedItem = null;
let pickupCooldown = 0;

const FREE_PECK_RANGE = 52;
const IMMOVABLE_OBJECT_IDS = new Set(['gate', 'table', 'sewer']);

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
    lureStep: 0
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

  if (task.onComplete) {
    task.onComplete({ objects: level._objects || level.objects, enemy: enemy, level: level });
  }

  if (task.onCompleteSpeech) {
    triggerSpeech(task.onCompleteSpeech);
  }

  if (task.onCompleteHint) {
    message = '提示：' + task.onCompleteHint;
  }

  taskState.currentTaskIndex++;
  if (taskState.currentTaskIndex < taskState.tasks.length) {
    taskState.tasks[taskState.currentTaskIndex].status = 'available';
  }

  if (taskState.currentTaskIndex >= taskState.tasks.length) {
    if (currentLevelIndex >= LEVELS.length - 1) {
      if (typeof crownRewardUnlocked !== 'undefined') {
        crownRewardUnlocked = true;
      }
      if (typeof gooseWearingCrown !== 'undefined') {
        gooseWearingCrown = false;
      }
      message = '最终奖励已解锁：👑 按 E 由大鹅自己领取皇冠。';
    } else {
      message = '全部任务完成！你可以自己继续当前关，准备好后再进入下一关。';
    }
  }
}

function advanceTaskLevel() {
  advanceLevel();
}

function triggerSpeech(speechDef) {
  let pos = { x: goose.x, y: goose.y - 30 };
  const level = LEVELS[currentLevelIndex];

  if (speechDef.speaker === 'farmer' || speechDef.speaker === 'queen' || speechDef.speaker === 'woodcutter') {
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

  // Check objects array
  const levelObjs = level._objects || level.objects;
  if (levelObjs) {
    for (const obj of levelObjs) {
      if ((task.targetObjId || task.carryObjId) !== obj.id) continue;
      if (task.type === 'carry' && obj.carried) continue; // already carrying
      const dist = Math.hypot(goosePos.x - obj.x, goosePos.y - obj.y);
      const range = task.interactRange || 40;
      if (dist <= range) return { type: 'object', target: obj, task: task };
    }
  }

  // Check npcs array (waterCup etc.)
  if (level.npcs) {
    for (const npc of level.npcs) {
      if ((task.targetObjId || task.carryObjId) !== npc.id) continue;
      const dist = Math.hypot(goosePos.x - npc.x, goosePos.y - npc.y);
      const range = task.interactRange || 40;
      if (dist <= range) return { type: 'npc', target: npc, task: task };
    }
  }

  // Carry drop check
  if (task.type === 'carry' && carriedItem && task.dropTarget) {
    const dist = Math.hypot(goosePos.x - task.dropTarget.x, goosePos.y - task.dropTarget.y);
    if (dist <= 50) return { type: 'drop', target: carriedItem, task: task };
  }

  // Lure: peck farmer check
  if (task.type === 'lure' && task.lureSteps) {
    const step = task.lureSteps[taskState.lureStep];
    if (step && step.type === 'peck') {
      const dist = Math.hypot(goosePos.x - enemy.x, goosePos.y - enemy.y);
      if (dist <= 50) return { type: 'enemy', target: enemy, task: task };
    }
  }

  return null;
}

function findNearestFreePeckTarget() {
  const level = LEVELS[currentLevelIndex];
  if (!level) return null;

  const candidates = [];

  const levelObjs = level._objects || level.objects || [];
  for (const obj of levelObjs) {
    if (obj.carried || obj.x < 0 || obj.y < 0) continue;
    const dist = Math.hypot(goose.x - obj.x, goose.y - obj.y);
    if (dist <= FREE_PECK_RANGE) {
      candidates.push({ type: 'object', target: obj, dist: dist });
    }
  }

  const npcs = level.npcs || [];
  for (const npc of npcs) {
    const dist = Math.hypot(goose.x - npc.x, goose.y - npc.y);
    if (dist <= FREE_PECK_RANGE) {
      candidates.push({ type: 'npc', target: npc, dist: dist });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.dist - b.dist);
  return candidates[0];
}

function nudgeTarget(target, power = 20) {
  if (typeof target.x !== 'number' || typeof target.y !== 'number') return;

  let dx = Math.cos(goose.facing);
  let dy = Math.sin(goose.facing);

  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    const tx = target.x - goose.x;
    const ty = target.y - goose.y;
    const len = Math.hypot(tx, ty) || 1;
    dx = tx / len;
    dy = ty / len;
  }

  target.x += dx * power;
  target.y += dy * power;

  if (typeof world !== 'undefined') {
    target.x = Math.max(world.x + 12, Math.min(world.x + world.width - 12, target.x));
    target.y = Math.max(world.y + 12, Math.min(world.y + world.height - 12, target.y));
  }
}

function tryFreePeck() {
  const nearest = findNearestFreePeckTarget();
  if (!nearest) return false;

  pickupCooldown = 0.25;

  if (typeof ripples !== 'undefined') {
    ripples.push({ x: goose.x, y: goose.y, radius: 8, life: 0.28 });
  }

  if (nearest.type === 'object') {
    if (!IMMOVABLE_OBJECT_IDS.has(nearest.target.id)) {
      nudgeTarget(nearest.target, 24);
    }
    message = '提示：你啄了' + (nearest.target.label || '物体') + '一下。';
    return true;
  }

  if (nearest.type === 'npc') {
    nudgeTarget(nearest.target, 10);
    message = '提示：你啄了' + (nearest.target.label || '路人') + '一下。';
    return true;
  }

  return false;
}

function findNearbyCrownHelperNpc() {
  const level = LEVELS[currentLevelIndex];
  if (!level || !level.npcs || level.npcs.length === 0) return null;

  let nearest = null;
  let nearestDist = Infinity;

  for (const npc of level.npcs) {
    const dist = Math.hypot(goose.x - npc.x, goose.y - npc.y);
    if (dist <= 60 && dist < nearestDist) {
      nearest = npc;
      nearestDist = dist;
    }
  }

  return nearest;
}

function tryWearCrownByNpcHelp() {
  if (typeof crownRewardUnlocked === 'undefined' || !crownRewardUnlocked) return false;
  if (typeof gooseWearingCrown !== 'undefined' && gooseWearingCrown) return false;

  const helperNpc = findNearbyCrownHelperNpc();
  if (!helperNpc) return false;

  if (typeof gooseWearingCrown !== 'undefined') {
    gooseWearingCrown = true;
  }

  gameState = 'won';
  pickupCooldown = 0.4;
  message = '提示：路人帮你戴上了皇冠！';

  triggerSpeech({
    speaker: helperNpc.id === 'kid' ? 'kid' : (helperNpc.id === 'pig' ? 'pig' : 'neighbors'),
    text: '给你戴上皇冠啦！👑',
    duration: 2.5
  });

  return true;
}

function tryTakeCrownReward() {
  if (typeof crownRewardUnlocked === 'undefined' || !crownRewardUnlocked) return false;
  if (typeof gooseWearingCrown !== 'undefined' && gooseWearingCrown) return false;

  if (typeof gooseWearingCrown !== 'undefined') {
    gooseWearingCrown = true;
  }

  gameState = 'playing';
  pickupCooldown = 0.35;
  message = '提示：大鹅自己拿到了皇冠！现在路人都会向你鞠躬。';

  triggerSpeech({
    speaker: 'goose',
    text: '嘎！皇冠归我了！👑',
    duration: 2.4
  });

  return true;
}

function handleInteract() {
  if (gameState !== 'playing') return;
  if (pickupCooldown > 0) return;

  if (tryTakeCrownReward()) {
    return;
  }

  // If carrying an item, try to drop it
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
    // Cancel carry (drop at goose position)
    carriedItem.carried = false;
    carriedItem.x = goose.x;
    carriedItem.y = goose.y + 20;
    carriedItem = null;
    pickupCooldown = 0.5;
    return;
  }

  if (!isTaskLevel()) {
    tryFreePeck();
    return;
  }

  const nearest = findNearestInteractable();
  if (!nearest) {
    tryFreePeck();
    return;
  }

  const { type, target, task } = nearest;
  pickupCooldown = 0.6;

  switch (task.type) {
    case 'push':
      if (type === 'object') {
        if (target.pushed !== undefined) {
          target.pushed = true;
        }
        if (task.targetZone) {
          target.x = task.targetZone.x + task.targetZone.width / 2;
          target.y = task.targetZone.y + task.targetZone.height / 2;
        }
        completeCurrentTask();
      }
      break;

    case 'proximity':
      if (type === 'object' || type === 'npc') {
        // Check enemy state precondition (queen looking down)
        if (task.requiresEnemyState) {
          const enemyData = LEVELS[currentLevelIndex].enemy;
          if (task.requiresEnemyState === 'lookingDown') {
            if (!enemyData._isLookingDown) return;
          }
        }
        // Check enemy phase precondition (woodcutter phase 2)
        if (task.requiresEnemyPhase) {
          const enemyData = LEVELS[currentLevelIndex].enemy;
          if (enemyData._phase !== task.requiresEnemyPhase) return;
        }
        completeCurrentTask();
      }
      break;

    case 'carry':
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
      if (task.lureSteps && taskState.lureStep < task.lureSteps.length) {
        const step = task.lureSteps[taskState.lureStep];
        if (step.type === 'peck' && type === 'enemy') {
          enemy.chaseTimer = 5;
          enemy.state = 'chase';
          taskState.lureStep++;
          const nextStep = task.lureSteps[taskState.lureStep];
          message = '提示：' + (nextStep ? nextStep.hint : '');
        }
      }
      break;
  }
}

function updateInteractions(dt) {
  if (pickupCooldown > 0) pickupCooldown -= dt;

  // Update speech bubble lifetimes
  speechBubbles = speechBubbles.filter(b => {
    b.life -= dt;
    return b.life > 0;
  });

  // Update carried item position (follow goose)
  if (carriedItem) {
    carriedItem.x = goose.x + Math.cos(goose.facing) * 20;
    carriedItem.y = goose.y + Math.sin(goose.facing) * 10;
  }

  // Lure task: check if enemy was led to target location
  if (!taskState || gameState !== 'playing') return;
  const task = getCurrentTask();
  if (!task || task.type !== 'lure' || !task.lureSteps) return;

  const step = task.lureSteps[taskState.lureStep];
  if (step && step.type === 'leadTo') {
    const level = LEVELS[currentLevelIndex];
    const searchObjs = level._objects || level.objects || [];
    const targetObj = searchObjs.find(o => o.id === step.target);
    if (targetObj && enemy.state === 'chase') {
      const dist = Math.hypot(enemy.x - targetObj.x, enemy.y - targetObj.y);
      if (dist < 40) {
        if (step.target === 'rake') {
          targetObj.triggered = true;
          taskState.lureStep++;
          const nextStep2 = task.lureSteps[taskState.lureStep];
          message = '提示：' + (nextStep2 ? nextStep2.hint : '');
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

    const bx = point.x - bw / 2;
    const by = point.y - bh;

    // Bubble background (use simple rect since roundRect may not be available)
    ctx.beginPath();
    ctx.moveTo(bx + 12, by);
    ctx.lineTo(bx + bw - 12, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + 12, 12);
    ctx.lineTo(bx + bw, by + bh - 12);
    ctx.arcTo(bx + bw, by + bh, bx + bw - 12, by + bh, 12);
    ctx.lineTo(bx + 12, by + bh);
    ctx.arcTo(bx, by + bh, bx, by + bh - 12, 12);
    ctx.lineTo(bx, by + 12);
    ctx.arcTo(bx, by, bx + 12, by, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bubble tail
    ctx.beginPath();
    ctx.moveTo(point.x - 8, by + bh);
    ctx.lineTo(point.x, by + bh + 10);
    ctx.lineTo(point.x + 8, by + bh);
    ctx.fill();

    // Text
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bubble.text, point.x, by + bh / 2);

    ctx.globalAlpha = 1;
  }
}
