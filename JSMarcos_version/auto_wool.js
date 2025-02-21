// =================================
// 瓦坎达全自动刷石 + 羊毛合成 + 铅合成 一体bot

// 容器坐标配置（请替换为实际坐标）
const A_CONTAINER = { x: 6117, y: 130, z: -3016 }; // 输入容器坐标
const B_CONTAINER_1 = { x: 6114, y: 130, z: -3016 }; // 输出容器坐标
const B_CONTAINER_2 = { x: 6114, y: 130, z: -3015 }; // 输出容器坐标
const CRAFTING_CONTAINER = { x: 6115, y: 129, z: -3015 };
const C_CONTAINER = { x: 6117, y: 129, z: -3018 };
const D_CONTAINER = { x: 6116, y: 130, z: -3012 };

const CHECK_INTERVAL = 6000; // 检查间隔（毫秒）
const CRAFT_WAIT_TIME = 20;
const WAIT_TIME = 300;

const WORK_POINT_A = { x: 6114, y: 128, z: -3017 }; // 工作点 A
const WORK_POINT_B = { x: 6120, y: 132, z: -3011 }; // 工作点 B

// 物品ID常量
const STRING_ID = "minecraft:string";
const WOOL_ID = "minecraft:white_wool";

const CHECK_ITEM_ID = "minecraft:cobblestone";
const SMOOTH_STONE_ID = "minecraft:smooth_stone";
const LEAD_ORE_ID = "minecraft:blackstone";
const LEAD_INGOT_ID = "minecraft:flint";

let block_lock = false;

function get_item_total(item_name, distance = 128) {
  const all_items = World.getEntities(distance, "item");
  need_items = all_items.filter(
    (item) => item.getContainedItemStack().getItemId() == item_name
  );
  let total = 0;
  for (let i = 0; i < need_items.length; i++) {
    total += need_items[i].getContainedItemStack().getCount();
  }
  return total;
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

function take_item_from_box(item_id, CONTAINER, face = "west") {
  const interact = Player.getInteractionManager();
  interact.interactBlock(CONTAINER.x, CONTAINER.y, CONTAINER.z, face, true);

  Time.sleep(WAIT_TIME);
  const inv = Player.openInventory();

  const pos = inv.findItem(item_id);
  const container_slots = inv.getSlots("container");

  for (let i = 0; i < pos.length; i++) {
    if (container_slots.includes(pos[i])) {
      inv.quick(pos[i]);
      //break;
    } else {
      // Chat.log('item not in box')
    }
  }

  inv.close();
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

function craft_full_item(input_id, output_id) {
  const inv2 = Player.openInventory();
  const map = inv2.getMap();
  const input_slots = inv2.getSlots("crafting_in");

  for (let i2 = 0; i2 < 20; i2++) {
    let list_item = inv2.getItemCount();

    let item_num = list_item.get(input_id);
    //Chat.log(item_num);

    if (item_num < 4) {
      //Chat.log("no enough items");
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

    let out_item = inv2.getSlot(map["craft_out"][0]).getItemId();

    if (out_item == output_id) {
      inv2.quick(map["craft_out"][0]);
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

  inv2.closeAndDrop();
}

function craft_full_item_by_crafting_table(
  input_id,
  output_id,
  face = "west",
  CONTAINER
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

    Time.sleep(CRAFT_WAIT_TIME);

    let out_item = inv2.getSlot(map["output"][0]).getItemId();

    if (out_item == output_id) {
      inv2.quick(map["output"][0]);
    }

    // give_up_mouse_item(inv2);
    // Time.sleep(CRAFT_WAIT_TIME);
    // let pos2 = inv2.findItem(input_id);

    // for (let i = 0; i < pos2.length; i++) {
    //   if (input_slots.includes(pos2[i])) {
    //     inv2.quickAll(pos[i]);
    //     break;
    //   }
    // }
    // Time.sleep(CRAFT_WAIT_TIME);
  }
  inv2.close();
}

function push_item_to_box(item_id, CONTAINER, face = "west") {
  const interact = Player.getInteractionManager();
  interact.interactBlock(CONTAINER.x, CONTAINER.y, CONTAINER.z, face, true);

  Time.sleep(WAIT_TIME);
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

  inv.close();
}

function max_drop_item(item_id, threshold = 128) {
  const inv2 = Player.openInventory();
  let list_item = inv2.getItemCount();

  let item_num = list_item.get(item_id);
  //Chat.log('===========');
  //Chat.log(`${item_id} ${item_num} ${threshold}`);

  if (item_num > threshold) {
    let pos = inv2.findItem(item_id);
    Chat.log(`drop ${item_id}: ${pos[0]}-${pos[pos.length - 1]}`);

    for (let i = 0; i < pos.length; i++) {
      //Chat.log(pos[i]);
      inv2.dropSlot(pos[i], true);
    }
  }
  
  inv2.closeAndDrop();
}

function craft_full_item_fast(inv2, input_id, output_id) {
  const map = inv2.getMap();
  const input_slots = inv2.getSlots("crafting_in");
  let list_item = inv2.getItemCount();
  let item_num = list_item.get(input_id);

  try {
    if (item_num >= 256) {
      let pos = inv2.findItem(input_id);
      let full_list = [];

      for (let i = 0; i < pos.length; i++) {
        if (input_slots.includes(pos[i])) {
          continue;
        }
        const item_count = inv2.getSlot(pos[i]).getCount();
        if (item_count == 64) {
          full_list.push(pos[i]);
        }
      }

      let i = 0;

      while (i < 4) {
        inv2.click(full_list[i]);
        inv2.click(input_slots[i]);
        i++;
      }

      let out_item = inv2.getSlot(map["craft_out"][0]).getItemId();

      //Time.sleep(CRAFT_WAIT_TIME);
      if (out_item == output_id) {
        inv2.quick(map["craft_out"][0]);
      }
    }
  } catch (err) {}
}

function deal_pick_up_item(event) {
  try {
    if (PlayerisPointInsideCube() && block_lock == false) {
      const inv = Player.openInventory();

      if (inv.getContainerTitle() == "Crafting") {
        craft_full_item_fast(inv, STRING_ID, WOOL_ID);
      }

      //inv.close();
    }
  } catch (err) {}
}

// const d2d = Hud.createDraw2D();
// let tpsmeter = null;

// d2d.setOnInit(
//   JavaWrapper.methodToJava(() => {
//     const total = get_item_total(CHECK_ITEM_ID, 128);

//     tpsmeter = d2d.addText(
//       "场上现有圆石数量: " + total,
//       0,
//       d2d.getHeight() - 200,
//       0xffffff,
//       true
//     );
//   })
// );

// const tickListener = JsMacros.on(
//   "Tick",
//   JavaWrapper.methodToJava(() => {
//     try {
//       const total = get_item_total(CHECK_ITEM_ID, 128);
//       tpsmeter?.setText("场上现有圆石数量: " + total);
//     } catch (err) {}
//   })
// );

// d2d.register();

// // this fires when the service is stopped
// event.stopListener = JavaWrapper.methodToJava(() => {
//   d2d.unregister();
//   JsMacros.off(tickListener);
//   JsMacros.off(PickUpListener);
// });

const PickUpListener = JsMacros.on(
  "ItemPickup",
  JavaWrapper.methodToJava(deal_pick_up_item)
);

for (let i = 0; i < 9999999; i++) {
  try {
    if (!PlayerisPointInsideCube()) {
      Time.sleep(CHECK_INTERVAL);
      continue;
    }
  } catch (err) {}

  block_lock = true;

  // try {
  //   craft_full_item(STRING_ID, WOOL_ID);
  // } catch (err) {}

  // Time.sleep(WAIT_TIME);

  try {
    if (i % 2 == 0) {
      push_item_to_box(WOOL_ID, B_CONTAINER_1);
    } else {
      push_item_to_box(WOOL_ID, B_CONTAINER_2);
    }
  } catch (err) {
    Chat.log("放置B box物品失败");
    Chat.log(err);
  }

  Time.sleep(WAIT_TIME);

  try {
    max_drop_item(WOOL_ID);
    max_drop_item(STRING_ID, threshold = 1000);
  } catch (err) {
    Chat.log("丢羊毛失败");
    Chat.log(err);
  }

  if (i % 12 == 0) {
    try {
      take_item_from_box(SMOOTH_STONE_ID, C_CONTAINER, "up");
    } catch (err) {
      Chat.log("获取C box物品失败");
      Chat.log(err);
    }

    Time.sleep(WAIT_TIME);

    try {
      craft_full_item_by_crafting_table(
        SMOOTH_STONE_ID,
        LEAD_ORE_ID,
        "west",
        CRAFTING_CONTAINER
      );
    } catch (err) {
      Chat.log("合成铅矿失败");
      Chat.log(err);
    }

    Time.sleep(WAIT_TIME);

    try {
      craft_full_item_by_crafting_table(
        LEAD_ORE_ID,
        LEAD_INGOT_ID,
        "west",
        CRAFTING_CONTAINER
      );
    } catch (err) {
      Chat.log("合成铅失败");
      Chat.log(err);
    }

    Time.sleep(WAIT_TIME);

    try {
      push_item_to_box(LEAD_INGOT_ID, D_CONTAINER);
    } catch (err) {
      Chat.log("放置D box物品失败");
      Chat.log(err);
    }

    Time.sleep(WAIT_TIME);

    try {
      max_drop_item(LEAD_INGOT_ID);
      max_drop_item(SMOOTH_STONE_ID);
      max_drop_item("minecraft:smooth_stone_slab", threshold = 1);
      max_drop_item("minecraft:blackstone_slab", threshold = 1);
      max_drop_item("minecraft:blackstone_wall", threshold = 1);
    } catch (err) {
      Chat.log("丢铅失败");
      Chat.log(err);
    }
  }

  block_lock = false;
  Time.sleep(CHECK_INTERVAL);
}
