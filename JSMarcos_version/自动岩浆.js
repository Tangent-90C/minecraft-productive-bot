const WAIT_NETWORK_TIME = 250;
const WAIT_TACK_TIME = 50;
const WAIT_BUTTOM_TIME = 2500;
const WAIT_EPOCH_TIME = 2000;
const BUTTON_POS = { x: 6141, y: 68, z: -3010 };
const GET_BUCKET_POS = { x: 6141, y: 68, z: -3017 };
const PUSH_LAVA_POS = { x: 6141, y: 69, z: -3018 };

const WORK_POINT_A = { x: 6143, y: 67, z: -3007 }; // 工作点 A
const WORK_POINT_B = { x: 6142, y: 67, z: -3068 }; // 工作点 B

// 把Z_points反过来
const Z_points = [
  -3008, -3012, -3016, -3020, -3024, -3028, -3032, -3036, -3040, -3044, -3048,
  -3052, -3056, -3060, -3064,
];

function swap_slot(inventory, slot1, slot2) {
  inventory.click(slot1);
  inventory.click(slot2);
  inventory.click(slot1);
}

// 强行让手上拿着某个物品
function force_hand(item_name, inventory, force = false) {
  //const inventory = Player.openInventory();
  let hand_index = inventory.getSelectedHotbarSlotIndex();
  let hand_slots_list = inventory.getSlots(`hotbar`);
  let hand_slot = hand_slots_list[hand_index];

  let item = inventory.findItem(item_name);
  let hand_item = inventory.getSlot(hand_slot).getItemId();

  if (force) {
    inventory.click(hand_slot);
    inventory.click(hand_slot);
  }
  else if (hand_item != item_name) {
    if (item.length > 0) {
      swap_slot(inventory, hand_slot, item[0]);
    } else {
      //Chat.log(`${item_name} 不足`);
    }
  }
}

// 计算两个点之间的距离（三维欧几里得距离）
function euclideanDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

// 找出距离目标坐标以内的项目
function findClosePoints(target, array, max_distance = 5) {
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

function bag_have_item(item) {
  const inventory = Player.openInventory();
  const items_num = inventory.getItemCount();

  if (items_num.get(item) > 0) {
    return true;
  } else {
    return false;
  }
}

function bag_item_num(item) {
  const inventory = Player.openInventory();
  const items_num = inventory.getItemCount();

  let result = items_num.get(item);
  if (result == null) {
    result = 0;
  }
  return result;
}

function is_reach_pos(z, threshold = 0.4) {
  const player_pos = Player.getPlayer().getPos();

  const dz = Math.abs(player_pos.z - z);
  if (dz < threshold) {
    return true;
  } else if (dz > 256) {
    Chat.log("距离过远，疑似出故障，强行结束");
    return true;
  } else {
    return false;
  }
}

function move_z(z_pos, look_yaw = -90) {
  const player_pos = Player.getPlayer().getPos();
  let z_direction = 0;
  if (player_pos.z > z_pos) {
    z_direction = 1;
  } else if (player_pos.z <= z_pos) {
    z_direction = -1;
  }

  if (look_yaw === 90) {
    z_direction = -z_direction;
  }
  // 根据 z 坐标的大小，决定是加z还是减z

  while (!is_reach_pos(z_pos)) {
    let player_input = Player.createPlayerInput(
      0,
      z_direction,
      look_yaw,
      0,
      false,
      false,
      false
    );
    Player.addInput(player_input);
    Client.waitTick(1);
  }
}

function press_button(button_pos, press_num = 1) {
  //move_z(button_pos.z, 90);
  move_z(button_pos.z);
  const interact = Player.getInteractionManager();
  for (let i = 0; i < press_num; i++) {
    interact.interactBlock(
      button_pos.x,
      button_pos.y,
      button_pos.z,
      "up",
      true
    );
    if (i < press_num - 1) {
      Time.sleep(WAIT_BUTTOM_TIME);
    }
  }
}

function push_item_to_box(item_id, CONTAINER, face = "up") {
  move_z(CONTAINER.z);
  const interact = Player.getInteractionManager();
  interact.interactBlock(CONTAINER.x, CONTAINER.y, CONTAINER.z, face, true);

  Time.sleep(WAIT_NETWORK_TIME);
  const inv = Player.openInventory();

  const pos = inv.findItem(item_id);

  const main = inv.getSlots("main");
  const hotbar = inv.getSlots("hotbar");
  const player_bag = [...main, ...hotbar];

  for (let i = 0; i < pos.length; i++) {
    if (player_bag.includes(pos[i])) {
      inv.quickAll(pos[i]);
      break;
      // inv.quick(pos[i]);
      // Time.sleep(WAIT_TACK_TIME);
    } else {
      // Chat.log('item not in box')
    }
  }
  Time.sleep(WAIT_NETWORK_TIME);
  inv.close();
}

function take_item_from_box(
  need_item_id,
  CONTAINER,
  need_take = 2,
  face = "west"
) {
  move_z(CONTAINER.z);
  const interact = Player.getInteractionManager();
  interact.interactBlock(CONTAINER.x, CONTAINER.y, CONTAINER.z, face, true);
  Time.sleep(WAIT_NETWORK_TIME);

  take_num = 0;

  const inv = Player.openInventory();

  const pos = inv.findItem(need_item_id);
  const container_slots = inv.getSlots("container");

  for (let i = 0; i < pos.length; i++) {
    if (container_slots.includes(pos[i])) {
      take_num++;
      inv.quick(pos[i]);
      if (take_num >= need_take) {
        inv.close();
        Time.sleep(WAIT_NETWORK_TIME);
        break;
      }
    }
  }

  if (take_num === 0) {
    inv.close();
  }
}

function take_lava_around() {
  // 避免还在开箱子
  const tmp_inv = Player.openInventory();
  const is_forget_quit = tmp_inv.isContainer();
  if (is_forget_quit) {
      tmp_inv.close();
      Time.sleep(WAIT_NETWORK_TIME);
  }

  const chest = World.findBlocksMatching("minecraft:lava_cauldron", 1);
  const player_pos = Player.getPlayer().getPos();
  const CONTAINERs = findClosePoints(player_pos, chest, 2.5);

  if (CONTAINERs.length === 0) {
    //Chat.log("没有找到岩浆");
  } else {
    const interact = Player.getInteractionManager();

    for (let j = 0; j < CONTAINERs.length; j++) {
      force_hand("minecraft:bucket", Player.openInventory());
      const CONTAINER = CONTAINERs[j];
      if (bag_have_item("minecraft:bucket")) {
        interact.interactBlock(
          CONTAINER.x,
          CONTAINER.y,
          CONTAINER.z,
          "up",
          false
        );
        Time.sleep(WAIT_NETWORK_TIME);
      } else {
        break;
      }
    }
  }
}

function take_lava_a_loop() {
  for (let i = 0; i < Z_points.length; i++) {
    if (
      bag_have_item("minecraft:bucket") &&
      bag_item_num("minecraft:lava_bucket") < 32 &&
      PlayerisPointInsideCube()
    ) {
      force_hand("minecraft:bucket", Player.openInventory(), true); //刷新一下，避免假桶
      const z_pos = Z_points[i];
      move_z(z_pos);

      if (!bag_have_item("minecraft:bucket")) {
        Chat.log('遇到假桶，跳过')
      }

      take_lava_around();
    } else {
      break;
    }
  }
}

function isPointInsideCube(pointP, pointA, pointB) {
  // 计算立方体的最小和最大边界
  const minX = pointA.x < pointB.x ? pointA.x : pointB.x;
  const maxX = pointA.x > pointB.x ? pointA.x : pointB.x;
  const minY = pointA.y < pointB.y ? pointA.y : pointB.y;
  const maxY = pointA.y > pointB.y ? pointA.y : pointB.y;
  const minZ = pointA.z < pointB.z ? pointA.z : pointB.z;
  const maxZ = pointA.z > pointB.z ? pointA.z : pointB.z;

  // 检查点是否在立方体的范围内
  const isInX = pointP.x >= minX && pointP.x <= maxX;
  const isInY = pointP.y >= minY && pointP.y <= maxY;
  const isInZ = pointP.z >= minZ && pointP.z <= maxZ;

  return isInX && isInY && isInZ;
}

function PlayerisPointInsideCube() {
  const pointP = Player.getPlayer();

  if (isPointInsideCube(pointP.getPos(), WORK_POINT_A, WORK_POINT_B)) {
    return true;
  } else {
    return false;
  }
}

for (let epoch = 0; true; epoch++) {
  try {
    if (!PlayerisPointInsideCube()) {
      //Chat.log("玩家不在工作区域内，等待10秒后重新检查");
      Time.sleep(10000);
      continue;
    }
    take_lava_a_loop();

    if (!PlayerisPointInsideCube()) {
      continue;
    }

    press_button(BUTTON_POS, 1);

    if (!PlayerisPointInsideCube()) {
      continue;
    }

    if (bag_have_item("minecraft:lava_bucket")) {
      push_item_to_box("minecraft:lava_bucket", PUSH_LAVA_POS);
    }

    if (!PlayerisPointInsideCube()) {
      continue;
    }

    if (!bag_have_item("minecraft:bucket")) {
      take_item_from_box("minecraft:bucket", GET_BUCKET_POS);
    }
  } catch (e) {
    Chat.log(e);
    Time.sleep(WAIT_EPOCH_TIME);
  }
}
