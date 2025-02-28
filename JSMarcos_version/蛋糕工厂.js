// const SLEEP_TIME = 250;
// const TAKE_WAIT_TIME = 50;
// const ATTACK_WAIT_TIME = 250;

const SLEEP_TIME = 800;
const TAKE_WAIT_TIME = 200;
const ATTACK_WAIT_TIME = 200;

const target_box = { x: 6102, y: 103, z: -2844 }; // 做出来的蛋糕放的箱子坐标
let last_take_cow_uuid = null;
let need_to_dead_list = []; // 需要杀死的实体列表

// 计算两个点之间的距离（三维欧几里得距离）
function euclideanDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

// 找出距离目标坐标以内的项目
function findClosePoints(target, array, max_distance = 4) {
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

    //
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

function swap_slot(inventory, slot1, slot2) {
  inventory.click(slot1);
  inventory.click(slot2);
  inventory.click(slot1);
}

// 强行让手上拿着某个物品
function force_hand(item_name, inventory) {
  //const inventory = Player.openInventory();
  let hand_index = inventory.getSelectedHotbarSlotIndex();
  let hand_slots_list = inventory.getSlots(`hotbar`);
  let hand_slot = hand_slots_list[hand_index];

  let item = inventory.findItem(item_name);
  let hand_item = inventory.getSlot(hand_slot).getItemId();

  if (hand_item != item_name) {
    if (item.length > 0) {
      swap_slot(inventory, hand_slot, item[0]);
    } else {
      Chat.log(`${item_name} 不足`);
    }
  }
}

function take_3_milk(inv) {
  for (let epoch = 0; epoch < 3; epoch++) {
    const items_num = inv.getItemCount();

    if (items_num.get("minecraft:milk_bucket") >= 3) {
      return;
    }

    force_hand("minecraft:bucket", inv);

    const cow_list = [
      ...World.getEntities(5, "cow"),
      ...World.getEntities(5, "mooshroom"),
    ]; // 5是寻找奶牛的半径、其他牛比如蘑菇牛不算入内

    const interact = Player.getInteractionManager();
    for (let i = 0; i < cow_list.length; i++) {
      if (cow_list[i].isBaby() == true) {
        continue;
      }

      let uuid = cow_list[i].getUUID();
      let last_get = GlobalVars.getObject(uuid);
      if (uuid == null || Time.time() - last_get > 300 * 1000) {
        GlobalVars.putObject(uuid, Time.time());
        interact.interactEntity(cow_list[i], false);
        last_take_cow_uuid = uuid;
        Time.sleep(SLEEP_TIME);
        break;
      }
    }
  }
}

function craft_cake() {
  const chest = World.findBlocksMatching("minecraft:crafting_table", 1);
  const player_pos = Player.getPlayer().getPos();
  const CONTAINERs = findClosePoints(player_pos, chest);
  const interact = Player.getInteractionManager();

  interact.interactBlock(
    CONTAINERs[0].x,
    CONTAINERs[0].y,
    CONTAINERs[0].z,
    "up",
    true
  );

  Time.sleep(SLEEP_TIME);

  const inv = Player.openInventory();
  const map = inv.getMap();

  if (map.get("input") != null) {
    put_item_to_B(inv, "minecraft:milk_bucket", 0);
    //Time.sleep(TAKE_WAIT_TIME);
    put_item_to_B(inv, "minecraft:milk_bucket", 1);
    //Time.sleep(TAKE_WAIT_TIME);
    put_item_to_B(inv, "minecraft:milk_bucket", 2);
    //Time.sleep(TAKE_WAIT_TIME);

    put_item_to_B(inv, "minecraft:sugar", 3);
    
    put_item_to_B(inv, "minecraft:sugar", 5);
    //Time.sleep(TAKE_WAIT_TIME);

    put_item_to_B(inv, "minecraft:egg", 4);
    //Time.sleep(TAKE_WAIT_TIME);


    put_item_to_B(inv, "minecraft:wheat", 6);
    //Time.sleep(TAKE_WAIT_TIME);
    put_item_to_B(inv, "minecraft:wheat", 7);
    //Time.sleep(TAKE_WAIT_TIME);
    put_item_to_B(inv, "minecraft:wheat", 8);
    //Time.sleep(TAKE_WAIT_TIME);

    put_item_to_B(inv, "minecraft:milk_bucket", 0);
    put_item_to_B(inv, "minecraft:milk_bucket", 1);
    put_item_to_B(inv, "minecraft:milk_bucket", 2);
    put_item_to_B(inv, "minecraft:sugar", 3);
    put_item_to_B(inv, "minecraft:sugar", 5);
    put_item_to_B(inv, "minecraft:egg", 4);
    put_item_to_B(inv, "minecraft:wheat", 6);
    put_item_to_B(inv, "minecraft:wheat", 7);
    put_item_to_B(inv, "minecraft:wheat", 8);

    Time.sleep(TAKE_WAIT_TIME);

    let out_item = inv.getSlot(map["output"][0]).getItemId();

    if (out_item == "minecraft:cake") {
      inv.quick(map["output"][0]);
    }
    Time.sleep(TAKE_WAIT_TIME);
  }

  inv.close();
}

function deal_milk_message(event) {
  const text = event.text.getString();
  if (text.includes("[FPPGL] 这头牛已经无法生产更多牛奶了!")) {
    if (!need_to_dead_list.includes(last_take_cow_uuid)) {
      need_to_dead_list.push(last_take_cow_uuid);
      Chat.log(`${last_take_cow_uuid} 已经无法生产更多牛奶了`);
    }
  }
}

function attack_cow(inv) {
  // 攻击该死的牛
  force_hand("minecraft:diamond_shovel", inv); // 这个不会误伤其他牛
  Time.sleep(TAKE_WAIT_TIME);
  const cow_list = [
    ...World.getEntities(5, "cow"),
    ...World.getEntities(5, "mooshroom"),
  ]; // 5是寻找奶牛的半径
  const interact = Player.getInteractionManager();
  // 如果cow_list中存在need_to_dead_list中的实体，就攻击它
  for (let i = 0; i < cow_list.length; i++) {
    if (need_to_dead_list.includes(cow_list[i].getUUID())) {
      interact.attack(cow_list[i]);
      Time.sleep(ATTACK_WAIT_TIME);
    }
  }
}

function take_lunch(inv) {
  const interact = Player.getInteractionManager();
  if (inv.getItemCount().get("minecraft:mushroom_stew") > 0) {
    force_hand("minecraft:mushroom_stew", inv);
    interact.holdInteract(40);
  } else {
    force_hand("minecraft:bowl", inv);
    const cow_list = World.getEntities(5, "mooshroom"); // 5是寻找奶牛的半径
    Time.sleep(TAKE_WAIT_TIME);
    interact.interactEntity(cow_list[0], false);
    Time.sleep(SLEEP_TIME);
    force_hand("minecraft:mushroom_stew", inv);
    interact.holdInteract(40);
  }
}

function feed_cows(inv, feednum = 2) {
  const cow_list = [
    //...World.getEntities(5, "cow"), //这个就算了
    ...World.getEntities(5, "mooshroom"),
  ]; // 5是寻找奶牛的半径
  const interact = Player.getInteractionManager();
  force_hand("minecraft:wheat", inv);
  for (let i = 0, j = 0; i < cow_list.length && j < feednum; i++) {
    if (cow_list[i].isBaby() == true) {
      continue;
    }
    interact.interactEntity(cow_list[i], false);
    Time.sleep(TAKE_WAIT_TIME);
    j++;
  }
}

const MessageListener = JsMacros.on(
  "RecvMessage",
  JavaWrapper.methodToJava(deal_milk_message)
);

for (let epoch = 0; epoch < 99999999; epoch++) {
  try {
    let inv = Player.openInventory();

    if (inv.getItemCount().get("minecraft:wheat") < 3) {
      take_item_from_box("minecraft:wheat", 3);
      inv = Player.openInventory();
    }
    if (inv.getItemCount().get("minecraft:egg") < 1) {
      take_item_from_box("minecraft:egg", 4);
      inv = Player.openInventory();
    }
    if (inv.getItemCount().get("minecraft:sugar") < 2) {
      take_item_from_box("minecraft:sugar", 2);
      inv = Player.openInventory();
    }

    if (inv.getItemCount().get("minecraft:milk_bucket") < 3) {
      take_3_milk(inv);
    }

    attack_cow(inv);

    if (Player.getPlayer().getFoodLevel() < 20) {
      take_lunch(inv);
    }

    if (
      inv.getItemCount().get("minecraft:wheat") >= 3 &&
      inv.getItemCount().get("minecraft:egg") >= 1 &&
      inv.getItemCount().get("minecraft:sugar") >= 2 &&
      inv.getItemCount().get("minecraft:milk_bucket") >= 3
    ) {
      craft_cake();
      inv = Player.openInventory();
    }

    attack_cow(inv);

    if (inv.getItemCount().get("minecraft:cake") >= 1) {
      push_item_to_box("minecraft:cake", target_box, "up");
      inv = Player.openInventory();
    }

    //feed_cows(inv);

    inv.close();
    //Time.sleep(5000);

  } catch (e) {
    Chat.log(e);
    Time.sleep(2000);
  }
}
