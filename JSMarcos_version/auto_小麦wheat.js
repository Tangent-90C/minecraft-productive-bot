// =================================
// 瓦坎达小麦塔bot

const BaritoneAPI = Java.type("baritone.api.BaritoneAPI");
const GoalXZ = Java.type("baritone.api.pathing.goals.GoalXZ");
const GoalXYZ = Java.type("baritone.api.pathing.goals.GoalBlock");

const baritone = BaritoneAPI.getProvider().getPrimaryBaritone();

const Point_A_start = { x: 6073, z: -2927 }; // 第一次进入菜场的位置
const Point_A_end = { x: 6073, z: -2873 }; // 第一次结束菜场的位置

const pick_up_area_A_1 = { x: 6070, z: -2926 };
const pick_up_area_A_2 = { x: 6076, z: -2873 };

const Point_B_start = { x: 6081, z: -2927 }; // 第2次进入菜场的位置
const Point_B_end = { x: 6081, z: -2873 }; // 第2次结束菜场的位置

const pick_up_area_B_1 = { x: 6078, z: -2926 };
const pick_up_area_B_2 = { x: 6084, z: -2873 };

const step_z_points = [-2923, -2916, -2909, -2902, -2895, -2888, -2881, -2875];

const Exit_Point = { x: 6085, z: -2929 }; // 出口的位置
const Ladder_Point = { x: 6070, z: -2930 }; // 梯子的位置

const destory_seeds_point = { x: 6072, z: -2929 };
const throw_wheat_point = { x: 6077, z: -2927 };

const anti_anti_cheat = false;

const start_hight = 68; // 小麦塔起始高度
const end_hight = 125; // 小麦塔停止高度
let high_now = start_hight;
high_now = 68; // 如果需要在某层楼启动，就改这个高度

function is_reach_pos(x, y, z, threshold = 0.5, need_add_05) {
  const player_info = Player.getPlayer();
  let player_pos = player_info.getPos();

  let dx = 0;
  let dy = 0;
  let dz = 0;
  if (x != "~") {
    dx = x + 0.5 - player_pos.x;
    if (need_add_05) {
      dx += 0.5;
    }
  }
  if (y != "~") {
    dy = y - player_pos.y;
  }
  if (z != "~") {
    dz = z + 0.5 - player_pos.z;
    if (need_add_05) {
      dz += 0.5;
    }
  }

  const distanceSquared = dx * dx + dy * dy + dz * dz;
  const thresholdSquared = threshold * threshold;

  return distanceSquared < thresholdSquared;
}

function wait_reach_pos(
  x,
  y,
  z,
  sleep_time,
  threshold = 0.5,
  need_add_05 = true
) {
  for (let i = 0; i < 20; i++) {
    Time.sleep((sleep_time / 20) >> 0);
    if (is_reach_pos(x, y, z, threshold, need_add_05)) {
      break;
    }
  }
}

function item_filter(entity) {
  if (entity.getType() == "minecraft:item") {
    const item = entity.asItem().getContainedItemStack();
    if (
      item.getItemId() == "minecraft:wheat" ||
      item.getItemId() == "minecraft:wheat_seeds"
    ) {
      return true;
    }
  }
  return false;
}

function give_up_mouse_item(inv) {
  const hold = inv.getHeld();
  //const map = inv.getMap();
  if (hold.getItemId() != "minecraft:air") {
    const canplace_slot = inv.findFreeSlot("main");
    if (canplace_slot != -1) {
      inv.click(canplace_slot);
    }
  }
}

function craft_full_item_by_crafting_table(
  input_id,
  output_id,
  CONTAINER,
  face = "west",
  WAIT_TIME = 500,
  CRAFT_WAIT_TIME = 50
) {
  const interact = Player.getInteractionManager();
  interact.interactBlock(CONTAINER.x, CONTAINER.y, CONTAINER.z, face, true);

  Time.sleep(WAIT_TIME);

  const inv2 = Player.openInventory();
  const map = inv2.getMap();
  const input_slots = inv2.getSlots("input");

  for (let i2 = 0; i2 < 10; i2++) {
    let list_item = inv2.getItemCount();

    let item_num = list_item.get(input_id);

    if (item_num < 9) {
      break;
    }

    let pos = inv2.findItem(input_id);

    for (let i = 0; i < pos.length; i++) {
      if (input_slots.includes(pos[i])) {
        //Chat.log("pass");
        continue;
      }

      inv2.click(pos[i]);
      Time.sleep(CRAFT_WAIT_TIME);
      inv2.dragClick(input_slots, 0);
    }

    Time.sleep(CRAFT_WAIT_TIME * 2);

    let out_item = inv2.getSlot(map["output"][0]).getItemId();

    if (out_item == output_id) {
      inv2.quick(map["output"][0]);
    }

    give_up_mouse_item(inv2);
    Time.sleep(CRAFT_WAIT_TIME);
    let pos2 = inv2.findItem(input_id);

    for (let i = 0; i < pos2.length; i++) {
      if (input_slots.includes(pos2[i])) {
        inv2.quickAll(pos[i]);
        break;
      }
    }
    Time.sleep(CRAFT_WAIT_TIME);
  }

  inv2.close();
}

function findClosestCoordinate(target, coordinatesArray) {
  // 如果数组为空，返回 false
  if (coordinatesArray.length === 0) {
    return false;
  }

  // 初始化最小距离和最接近的坐标
  let minDistance = Infinity;
  let closestCoordinate = null;

  // 遍历数组中的每个坐标
  for (const coordinate of coordinatesArray) {
    // 计算与目标坐标的欧几里得距离
    const distance = Math.sqrt(
      Math.pow(target.x - coordinate.x, 2) +
        Math.pow(target.y - coordinate.y, 2) +
        Math.pow(target.z - coordinate.z, 2)
    );

    // 如果当前距离比最小距离小，更新最小距离和最接近的坐标
    if (distance < minDistance) {
      minDistance = distance;
      closestCoordinate = coordinate;
    }
  }

  // 检查最小距离是否小于等于 5
  if (minDistance <= 5) {
    // 如果是，则返回深拷贝的最接近的坐标
    return closestCoordinate;
  }

  // 否则返回 false
  return false;
}

function crafting_table_filter(block, obj, bool_value) {
  if (block.getId() == "minecraft:crafting_table") {
    return true;
  } else {
    return false;
  }
}

function crafting_state_filter(state, obj, bool_value) {
  return true;
}

function walkToXYZ(x, y, z) {
  try {
    if (y == "~") {
      const goal = new GoalXZ(x, z);
      baritone.getCustomGoalProcess().setGoalAndPath(goal);
    } else {
      const goal = new GoalXYZ(x, y, z);
      baritone.getCustomGoalProcess().setGoalAndPath(goal);
    }

    //Chat.log("已开始自动寻路至坐标: " + x + ", " + z);
  } catch (e) {
    Chat.log("错误: " + e);
  }
}

function wait_walk_reach_pos() {
  const query = baritone.getPathingBehavior();
  Time.sleep(200);
  for (let i = 0; i < 10000; i++) {
    if (query.isPathing() == false) {
      break;
    }
    Time.sleep(50);
  }
}

function goto(x, y, z) {
  walkToXYZ(x, y, z);
  wait_walk_reach_pos();
}

function total_wheat() {
  const all_wheats = World.findBlocksMatching("minecraft:wheat", 5);
}

function goto_ladder() {
  goto(Ladder_Point.x, "~", Ladder_Point.z);
  player_input = Player.createPlayerInput(1, -1, 90, 0, false, false, false);
  Time.sleep(2000);
  Player.addInputs(Array(9).fill(player_input));
  Time.sleep(500);
}

function jump_to_water() {
  goto(Exit_Point.x, "~", Exit_Point.z);
  let player_input = Player.createPlayerInput(
    0,
    -1,
    -180,
    0,
    false,
    false,
    false
  );
  Player.addInputs(Array(2).fill(player_input));
  player_input = Player.createPlayerInput(1, 0, -180, 0, false, false, false);
  Player.addInputs(Array(6).fill(player_input));
}

function out_water() {
  let player_input = Player.createPlayerInput(1, 0, 90, 0, false, false, false);
  Player.addInputs(Array(60).fill(player_input));
  Time.sleep(60 * 50 + 100);
}

function craft_wheat_block() {
  const craft_tables = World.findBlocksMatching(block_filter, state_filter, 1);
  const player_pos = Player.getPlayer().getPos();

  const closest_crafting_table = findClosestCoordinate(
    player_pos,
    craft_tables
  );
  try {
    craft_full_item_by_crafting_table(
      "minecraft:wheat",
      "minecraft:hay_block",
      closest_crafting_table
    );
  } catch (err) {
    Chat.log(err);
  }
}

function climb_to_hight(hight) {
  //Chat.log(`climb to ${hight}`);
  const player_input_UP = Player.createPlayerInput(
    0,
    0,
    0,
    0,
    true,
    false,
    false
  );
  const player_input_DOWN = Player.createPlayerInput(
    0,
    0,
    0,
    0,
    false,
    true,
    false
  );

  let player_pos = Player.getPlayer().getPos();
  if (Math.abs(player_pos.y - hight) < 0.1) {
    //Chat.log("已经到达，无需再爬");
    return;
  }

  if (hight < player_pos.y) {
    for (let i = 0; i < 10000; i++) {
      Player.addInputs([player_input_DOWN]);
      //Client.waitTick(1);
      Time.sleep(50);
      player_pos = Player.getPlayer().getPos();
      if (player_pos.y <= hight + 0.1) {
        break;
      }
    }
  }
  if (hight > player_pos.y) {
    for (let i = 0; i < 10000; i++) {
      Player.addInputs([player_input_UP]);
      //Client.waitTick(1);
      Time.sleep(50);
      player_pos = Player.getPlayer().getPos();
      if (player_pos.y >= hight) {
        break;
      }
    }
  }
}

function drop_wheat(drop_hay_block = true) {
  const inv = Player.openInventory();
  let wheats;
  if (drop_hay_block) {
    wheats = inv.findItem("minecraft:hay_block");
  } else {
    wheats = inv.findItem("minecraft:wheat");
  }

  if (wheats.length > 0) {
    goto(throw_wheat_point.x, "~", throw_wheat_point.z);
    let player_input = Player.createPlayerInput(
      0,
      0,
      0,
      0,
      false,
      false,
      false
    );
    Player.addInput(player_input);
    Time.sleep(500);
    try {
      for (let i = 0; i < wheats.length; i++) {
        inv.dropSlot(wheats[i], true);
      }
    } catch (error) {
      Chat.log(error);
    }

    Time.sleep(500);
  }
}

function get_first_walk(choice = 0) {
  let all_wheats = World.getEntities(JavaWrapper.methodToJava(item_filter));
  all_wheats = all_wheats.filter(
    (item) => Math.abs(item.getPos().y - Player.getPlayer().getPos().y) < 0.1
  );

  if (all_wheats.length > 0) {
    let x = Math.floor(all_wheats[choice].getPos().x);
    let y = Math.round(all_wheats[choice].getPos().y);
    let z = Math.floor(all_wheats[choice].getPos().z);

    let skip_west = false;
    let skip_east = false;

    if (x == 6077) {
      Chat.log(`这个物品在悬崖上，去旁边的地方`);
      let player_pos = Player.getPlayer().getPos();
      let dx = player_pos.x - x;
      if (dx < 0) {
        x--;
        skip_west = true;
      } else {
        x++;
        skip_east = true;
      }
    }

    const block = World.getBlock(x, y + 1, z);

    if (block.getId() == "minecraft:air") {
      return {
        done: false,
        x: x,
        z: z,
        precise_x: all_wheats[choice].getPos().x,
        precise_z: all_wheats[choice].getPos().z,
      };
    } else {
      Chat.log("绕道");
      for (let i = -1; i <= 1; i++) {
        if (skip_west && i == -1) {
          continue;
        }
        if (skip_east && i == 1) {
          continue;
        }

        for (let j = -1; j <= 1; j++) {
          if (
            World.getBlock(x + i, y + 1, z + j).getId() == "minecraft:air" &&
            (World.getBlock(x + i, y, z + j).getId() == "minecraft:air" ||
              World.getBlock(x + i, y, z + j).getId() == "minecraft:wheat")
          ) {
            return {
              done: false,
              x: x + i,
              z: z + j,
              precise_x: all_wheats[choice].getPos().x,
              precise_z: all_wheats[choice].getPos().z,
            };
          }
        }
      }
    }

    Chat.log("找不到能捡该物品的路径, skip");
    if (all_wheats.length > choice + 1) {
      return get_first_walk(choice + 1);
    } else {
      return {
        done: true,
      };
    }
  } else {
    return {
      done: true,
    };
  }
}

function look_at(x, y, z) {
  let player_pos = Player.getPlayer().getPos();
  const deltaX = x - player_pos.x;
  const deltaZ = z - player_pos.z;
  let deltaY = 0;
  if (y != "~") {
    deltaY = y - player_pos.y + 1.8;
  }

  // 使用Math.atan2计算弧度值
  const radians = -Math.atan2(deltaX, deltaZ);
  const radians_Y = Math.atan2(
    deltaY,
    Math.sqrt(deltaX * deltaX + deltaZ * deltaZ)
  );
  // 转换为角度（0-360度）
  const result_yaw = radians * (180 / Math.PI);
  const result_pitch = radians_Y * (180 / Math.PI);

  return {
    yaw: result_yaw,
    pitch: result_pitch,
  };
}

function look_and_break_place(
  x,
  y,
  z,
  is_break,
  look_add_05 = true,
  delay = 500
) {
  let x_look = x;
  let y_look = y;
  let z_look = z;
  if (look_add_05) {
    x_look += 0.5;
    z_look += 0.5;
  }
  result = look_at(x_look, y_look, z_look);
  let player_input = Player.createPlayerInput(
    0,
    0,
    result.yaw,
    result.pitch,
    false,
    false,
    false
  );
  Player.addInputs(Array(1).fill(player_input));
  Time.sleep(delay);
  const interact = Player.getInteractionManager();
  if (is_break) {
    interact.breakBlock(x, y, z);
  } else {
    interact.interactBlock(x, y, z, "up", false);
    //interact.interact();
  }
}

function walk_little(x, z) {
  const result_yaw = look_at(x, "~", z).yaw;

  let player_input = Player.createPlayerInput(
    1,
    0,
    result_yaw,
    0,
    false,
    false,
    false
  );
  Player.addInputs(Array(2).fill(player_input));
  //Client.waitTick(2);
  Time.sleep(100);
}

function can_farm7x7(pos) {
  let do_something = false;

  for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
      let x = pos.x + i;
      let z = pos.z + j;

      let block_here = World.getBlock(x, pos.y, z);
      let id_here = block_here.getId();
      if (id_here == "minecraft:air") {
        let block_here_2 = World.getBlock(x, pos.y - 1, z);
        let id_here_2 = block_here_2.getId();
        if (id_here_2 == "minecraft:farmland") {
          do_something = true;
          break;
        }
      } else if (id_here == "minecraft:wheat") {
        if (block_here.getBlockState().age == 7) {
          do_something = true;
          break;
        }
      }
    }
  }
  return do_something;
}

function farm7x7() {
  let pos = Player.getPlayer().getPos();

  pos.x = pos.x >> 0;
  pos.y = (pos.y >> 0) + 1;
  pos.z = (pos.z >> 0) - 1;

  let interact = Player.getInteractionManager();
  let do_something = false;

  for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
      let x = pos.x + i;
      let z = pos.z + j;

      let block_here = World.getBlock(x, pos.y, z);
      let id_here = block_here.getId();
      if (id_here == "minecraft:air") {
        do_something = true;
        if (anti_anti_cheat) {
          look_and_break_place(x, pos.y - 1, z, (is_break = false));
        } else {
          interact.interactBlock(x, pos.y - 1, z, "up", false);
          Time.sleep(50);
        }
      } else if (id_here == "minecraft:wheat") {
        if (block_here.getBlockState().age == 7) {
          do_something = true;
          if (anti_anti_cheat) {
            look_and_break_place(x, pos.y, z, (is_break = true));
            look_and_break_place(x, pos.y - 1, z, (is_break = false));
          } else {
            interact.breakBlock(x, pos.y, z);
            interact.interactBlock(x, pos.y - 1, z, "up", false);
            Time.sleep(50);
          }
        }
      }
    }
  }
  return do_something;
}

function pickup_item() {
  while (true) {
    let item_pos = get_first_walk();
    if (item_pos.done) {
      break;
    } else {
      //Chat.log(item_pos);
      goto(item_pos.x, "~", item_pos.z);

      walk_little(item_pos.precise_x, item_pos.precise_z);
    }
  }
}

function drop_seeds(save_groups = 10) {
  const inv = Player.openInventory();
  const wheats = inv.findItem("minecraft:wheat_seeds");
  //Chat.log(`Seed: ${wheats.length}`);
  if (wheats.length > save_groups) {
    goto(destory_seeds_point.x, "~", destory_seeds_point.z);
    let player_input = Player.createPlayerInput(
      0,
      0,
      180,
      0,
      false,
      false,
      false
    );
    Player.addInput(player_input);
    Time.sleep(500);
    try {
      for (let i = save_groups; i < wheats.length; i++) {
        inv.dropSlot(wheats[i], true);
      }
    } catch (error) {
      Chat.log(error);
    }
    Time.sleep(500);
  }
}

const block_filter = JavaWrapper.methodToJava(crafting_table_filter);
const state_filter = JavaWrapper.methodToJava(crafting_state_filter);

Chat.say("#set allowBreak false");
Chat.say("#set allowPlace false");

let first_climb = true;

for (let epoch = 0; epoch < 1000; epoch++) {
  for (; high_now <= end_hight; high_now += 3) {
    if (first_climb) {
      first_climb = false;
    } else {
      Time.sleep(2000);
      climb_to_hight(high_now);
      Time.sleep(2000);
    }

    goto(Point_A_start.x, high_now, Point_A_start.z);

    for (let i = 0; i < step_z_points.length; i++) {
      if (
        can_farm7x7({
          x: Point_A_end.x,
          y: high_now,
          z: step_z_points[i],
        })
      ) {
        goto(Point_A_end.x, high_now, step_z_points[i]);
        if (farm7x7()) {
          Time.sleep(1000);
          pickup_item();
        }
      }
    }

    goto(Point_A_start.x, high_now, Point_A_start.z);
    drop_seeds();
    craft_wheat_block();
    goto(Point_B_start.x, high_now, Point_B_start.z);

    for (let i = 0; i < step_z_points.length; i++) {
      if (
        can_farm7x7({
          x: Point_B_end.x,
          y: high_now,
          z: step_z_points[i],
        })
      ) {
        goto(Point_B_end.x, high_now, step_z_points[i]);
        if (farm7x7()) {
          Time.sleep(1000);
          pickup_item();
        }
      }
    }

    goto(Point_B_start.x, high_now, Point_B_start.z);
    drop_seeds();
    drop_wheat();
    goto_ladder();
  }
  Time.sleep(2000);
  jump_to_water();
  wait_reach_pos("~", 63.5, "~", 20000);
  out_water();
  first_climb = true;

  high_now = start_hight;
}
