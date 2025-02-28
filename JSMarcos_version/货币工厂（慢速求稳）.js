// const SLEEP_TIME = 250;
// const TAKE_WAIT_TIME = 50;
// const ATTACK_WAIT_TIME = 250;

const SLEEP_TIME = 800;
const TAKE_WAIT_TIME = 200;
const ATTACK_WAIT_TIME = 200;
const MAX_DISTANCE = 4;
const TARGET_ITEM = "minecraft:amethyst_shard";

const target_box = { x: 6097, y: 63, z: -2841 }; // 做出来的money放的箱子坐标

// 计算两个点之间的距离（三维欧几里得距离）
function euclideanDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

// 找出距离目标坐标以内的项目
function findClosePoints(target, array, max_distance = MAX_DISTANCE) {
  const closePoints = [];
  array.forEach((point) => {
    const distance = euclideanDistance(point, target);
    //Chat.log(`距离目标坐标${target}的距离为${distance}`);
    if (distance <= max_distance) {
      closePoints.push(point);
    }
  });
  return closePoints;
}

function push_item_to_box(item_id, CONTAINER, face = "up") {
  const interact = Player.getInteractionManager();
  interact.interactBlock(CONTAINER.x, CONTAINER.y, CONTAINER.z, face, true);

  Time.sleep(SLEEP_TIME);
  const inv = Player.openInventory();

  const pos = inv.findItem(item_id);

  const main = inv.getSlots("main");
  const hotbar = inv.getSlots("hotbar");
  const player_bag = [...main, ...hotbar];

  for (let i = 0; i < pos.length; i++) {
    if (player_bag.includes(pos[i])) {
      inv.quickAll(pos[i]);
      break;
    } else {
      // Chat.log('item not in box')
    }
  }
  Time.sleep(SLEEP_TIME);
  inv.close();
}

function take_item_from_box(need_item_id, need_take = 4, face = "west") {
  const chest = World.findBlocksMatching("minecraft:chest", 1);
  const player_pos = Player.getPlayer().getPos();
  const CONTAINERs = findClosePoints(player_pos, chest);
  const interact = Player.getInteractionManager();

  take_num = 0;

  for (let j = 0; j < CONTAINERs.length; j++) {
    if (take_num >= need_take) {
      break;
    }

    const CONTAINER = CONTAINERs[j];
    interact.interactBlock(CONTAINER.x, CONTAINER.y, CONTAINER.z, face, true);

    Time.sleep(SLEEP_TIME);
    const inv = Player.openInventory();
    const item_map = inv.getItems("container");

    for (let i = 0; i < item_map.length; i++) {
      if (take_num >= need_take) {
        break;
      }
      const item_id = item_map[i].getItemId();
      if (item_id == need_item_id) {
        const pos = inv.findItem(item_id);
        const container_slots = inv.getSlots("container");

        for (let i = 0; i < pos.length; i++) {
          if (container_slots.includes(pos[i])) {
            take_num++;
            inv.quick(pos[i]);
            if (take_num >= need_take) {
              inv.close();
              break;
            }
          }
        }
      } else {
        inv.close();
      }
    }
  }
}

function take_items_from_box(need_item_ids_and_need_takes, face = "west") {
  
  const tmp_inv  = Player.openInventory();
  if (tmp_inv.getItemCount().get("minecraft:cake") >= 1 && Object.keys(need_item_ids_and_need_takes).length == 1) {
    return;
  }


  const chest = World.findBlocksMatching("minecraft:chest", 1);
  const player_pos = Player.getPlayer().getPos();
  const CONTAINERs = findClosePoints(player_pos, chest);
  const interact = Player.getInteractionManager();

  // 创建剩余需要拿取的物品字典
  const remaining = { ...need_item_ids_and_need_takes };

  for (const CONTAINER of CONTAINERs) {
    if (Object.keys(remaining).length === 0) break;

    interact.interactBlock(CONTAINER.x, CONTAINER.y, CONTAINER.z, face, true);
    Time.sleep(SLEEP_TIME);
    const inv = Player.openInventory();
    const containerItems = inv.getItems("container");

    // 遍历箱子内所有物品
    for (const item of containerItems) {
      const item_id = item.getItemId();

      if (remaining[item_id] > 0) {
        const positions = inv.findItem(item_id);
        const container_slots = inv.getSlots("container");

        for (const slot of positions) {
          if (container_slots.includes(slot)) {
            inv.quick(slot);
            remaining[item_id]--;

            if (remaining[item_id] <= 0) {
              delete remaining[item_id];
              break;
            }
          }
        }
      }
    }

    inv.close();
    Time.sleep(TAKE_WAIT_TIME);
  }
}

function put_item_to_B(inv, item_id, craft_number) {
  const map = inv.getMap();
  let item_here_id = inv.getSlot(map["input"][craft_number]).getItemId();
  if (item_here_id == item_id) {
  } else {
    let milk_slot = inv.findItem(item_id);

    for (let j = 0; j < milk_slot.length; j++) {
      if (inv.getHeld().getItemId() == item_id) {
      } else {
        if (map["input"].includes(milk_slot[j])) {
          continue;
        }
        inv.click(milk_slot[j]);
      }

      Time.sleep(TAKE_WAIT_TIME);
      inv.click(map["input"][craft_number], 1);
      Time.sleep(TAKE_WAIT_TIME);

      break;
    }
  }
}

function craft_money() {
  const chest = World.findBlocksMatching("minecraft:crafting_table", 1);
  const player_pos = Player.getPlayer().getPos();
  const CONTAINERs = findClosePoints(player_pos, chest);
  const interact = Player.getInteractionManager();

  let inv = Player.openInventory();
  let map = inv.getMap();

  if (map.get("input") == null) {
    interact.interactBlock(
      CONTAINERs[0].x,
      CONTAINERs[0].y,
      CONTAINERs[0].z,
      "up",
      true
    );

    Time.sleep(SLEEP_TIME);
    inv = Player.openInventory();
    map = inv.getMap();
  }

  if (map.get("input") != null) {
    put_item_to_B(inv, "minecraft:flint", 0);
    put_item_to_B(inv, "minecraft:flint", 1);
    put_item_to_B(inv, "minecraft:gold_block", 2);
    put_item_to_B(inv, "minecraft:iron_block", 3);
    put_item_to_B(inv, "minecraft:copper_block", 5);
    put_item_to_B(inv, "minecraft:string", 4);
    put_item_to_B(inv, "minecraft:hay_block", 6);
    put_item_to_B(inv, "minecraft:tall_grass", 7);
    put_item_to_B(inv, "minecraft:cake", 8);

    put_item_to_B(inv, "minecraft:flint", 0);
    put_item_to_B(inv, "minecraft:flint", 1);
    put_item_to_B(inv, "minecraft:gold_block", 2);
    put_item_to_B(inv, "minecraft:iron_block", 3);
    put_item_to_B(inv, "minecraft:copper_block", 5);
    put_item_to_B(inv, "minecraft:string", 4);
    put_item_to_B(inv, "minecraft:hay_block", 6);
    put_item_to_B(inv, "minecraft:tall_grass", 7);
    put_item_to_B(inv, "minecraft:cake", 8);

    Time.sleep(TAKE_WAIT_TIME);

    let out_item = inv.getSlot(map["output"][0]).getItemId();

    if (out_item == TARGET_ITEM) {
      inv.quick(map["output"][0]);
    }
    Time.sleep(TAKE_WAIT_TIME);
  }

  //inv.close();
}

for (let epoch = 0; epoch < 99999999; epoch++) {
  try {
    let inv = Player.openInventory();

    // 创建需求字典
    const requirements = {
      "minecraft:flint": 2,
      "minecraft:gold_block": 1,
      "minecraft:iron_block": 1,
      "minecraft:copper_block": 1,
      "minecraft:string": 1,
      "minecraft:hay_block": 1,
      "minecraft:tall_grass": 1,
      "minecraft:cake": 18,
    };

    // 检测缺失物品
    const missing = {};
    for (const [item, needed] of Object.entries(requirements)) {
      const has = inv.getItemCount().get(item) || 0;
      if (has < needed) {
        missing[item] = needed - has;
      }
    }

    // 如果有缺失则批量获取
    if (Object.keys(missing).length > 0) {
      take_items_from_box(missing, "west");
      inv = Player.openInventory(); // 刷新库存状态
    }

    if (
      inv.getItemCount().get("minecraft:flint") >= 2 &&
      inv.getItemCount().get("minecraft:gold_block") >= 1 &&
      inv.getItemCount().get("minecraft:iron_block") >= 1 &&
      inv.getItemCount().get("minecraft:copper_block") >= 1 &&
      inv.getItemCount().get("minecraft:string") >= 1 &&
      inv.getItemCount().get("minecraft:hay_block") >= 1 &&
      inv.getItemCount().get("minecraft:tall_grass") >= 1 &&
      inv.getItemCount().get("minecraft:cake") >= 1
    ) {
      craft_money();
      inv = Player.openInventory();
    }

    if (inv.getItemCount().get(TARGET_ITEM) >= 64) {
      push_item_to_box(TARGET_ITEM, target_box, "up");
      inv = Player.openInventory();
    }

    //feed_cows(inv);

    //inv.close();
    //Time.sleep(5000);
  } catch (e) {
    Chat.log(e);
    Time.sleep(2000);
  }
}
