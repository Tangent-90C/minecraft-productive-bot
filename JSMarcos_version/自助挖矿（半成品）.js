//#blocksToDisallowBreaking white_bed,chest,hopper

const BaritoneAPI = Java.type("baritone.api.BaritoneAPI");
const GoalXZ = Java.type("baritone.api.pathing.goals.GoalXZ");
const GoalXYZ = Java.type("baritone.api.pathing.goals.GoalBlock");

const baritone = BaritoneAPI.getProvider().getPrimaryBaritone();

const WAIT_REACT_TIME = 1000;

// 配置参数
const HOME_COORD = "100 64 200"; // 替换为家的实际坐标
const START_MINE_PATH = { x: 20495, y: 63, z: -21354 }; // 开始挖掘的路径点
const WORKSHOP_POS = { x: 20527, y: 64, z: -21339 }; // 放东西的坐标

let auto_attack_index = 0;
let tick_count = 0;


const TARGET_ORES = ["iron_ore", "deepslate_iron_ore"]; // 要挖掘的矿物列表
const HOSTILE_MOBS = [
    "minecraft:zombie",
    "minecraft:skeleton",
    "minecraft:creeper",
    "minecraft:spider",
]; // 敌对生物列表

const RANGED_HOSTILES = ["minecraft:skeleton"];

const need_save_item = [
    "minecraft:diamond_pickaxe",
    "minecraft:diamond_shovel",
    "minecraft:backed_potato",
    "minecraft:bread"
];

const need_ore_item = [
    "minecraft:raw_iron",
    "minecraft:raw_copper",
    "minecraft:raw_gold",
    "minecraft:diamond",
];

const food_item = [
    "minecraft:baked_potato",
    "minecraft:bread"
]

const weapon_item = [
    "minecraft:diamond_pickaxe",
    "minecraft:diamond_shovel",
]

const garbage_item = [
    "minecraft:cobblestone",
    "minecraft:diorite",
    "minecraft:andesite",
    "minecraft:granite",
    "minecraft:cobbled_deepslate"
]

const TOOL_CONTAINER = {
    x: 20526,
    y: 66,
    z: -21337
};

const SAVE_ORE_CONTAINER = {
    x: 20526,
    y: 66,
    z: -21337,
};
const WAIT_NETWORK_TIME = 1000;

const NEAR_HOSTILE_DISTANCE = 4.0;
const CHECK_SKELETON_DISTANCE = 16;
const MIN_FOOL_LEVEL = 10;
const YAW_ALLOW = 12;
const PITCH_ALLOW = 45; // 新增垂直角度容差

const COME_BACK_HOME_BUTTON = "key.keyboard.h";

// 状态变量
let isMining = false;
let currentTarget = null;

let last_state = "start";
let state_now = "start";

let need_to_back_state_when_battle = null;
let target_path = null;
let last_action = null;
let enemy_pos_list = null;
let is_going_to_fight = false;

//Chat.log(baritone.getPathingBehavior().isPathing());
//Chat.log(baritone.getMineProcess().isActive());

// 有限状态机
function state_machine() {
    switch (state_now) {
        case "start":
            target_path = START_MINE_PATH;
            if (
                is_reach_pos(target_path.x, target_path.y, target_path.z)
            ) {
                // 到挖掘点了
                state_now = "mining";
            }
            else {
                // 没到挖掘点，走过去
                Chat.say(
                    `#goto ${START_MINE_PATH.x} ${START_MINE_PATH.y} ${START_MINE_PATH.z}`
                );

                state_now = "walking";
                last_action = "start";
                Time.sleep(WAIT_REACT_TIME);
            }
            break;

        case "walking":
            // 检测附近是否有敌对生物
            if ((enemy_pos_list = is_close_to_hostile())) {
                need_to_back_state_when_battle = "walking";
                state_now = "meeting_hostiles";
            } else if (
                target_path &&
                is_reach_pos(target_path.x, target_path.y, target_path.z)
            ) {
                // 到了目标点
                target_path = null;
                state_now = last_action;

            } else if (!baritone.getPathingBehavior().isPathing() && !is_reach_pos(target_path.x, target_path.y, target_path.z) && target_path) {
                // 不知道为什么没在走了，重新走过去
                //Chat.say("#resume");
                Chat.say(
                    `#goto ${target_path.x} ${target_path.y} ${target_path.z}`
                )
            } else if (Player.getPlayer().getFoodLevel() < MIN_FOOL_LEVEL) {
                take_lunch();
            }

            break;

        case "going_to_workshop":
            break;

        case "mining":
            const press = KeyBind.getPressedKeys();
            if (
                press.contains(COME_BACK_HOME_BUTTON) &&
                state_now != "come_back_to_workshop"
            ) {
                state_now = "come_back_to_workshop";
            } else if ((enemy_pos_list = is_close_to_hostile())) {
                state_now = "meeting_hostiles";
                need_to_back_state_when_battle = "mining";
            } else if (isInventoryFull()) {
                state_now = "come_back_to_workshop";
            }
            else if (!baritone.getMineProcess().isActive()) {
                Chat.say(`#mine ${TARGET_ORES.join(" ")}`);
                Time.sleep(WAIT_REACT_TIME);
            } else if (Player.getPlayer().getFoodLevel() < 16) {
                take_lunch();
            }

            break;

        case "meeting_hostiles":

            if (!is_going_to_fight) {
                Chat.say(`#pause`);
                is_going_to_fight = true;
            }


            if (enemy_pos_list != null && enemy_pos_list.length > 0) {
                Chat.say(
                    `#goto ${enemy_pos_list[0].x} ${enemy_pos_list[0].y} ${enemy_pos_list[0].z}`
                );
                Time.sleep(1500); // 让bot先走到敌人面前
            }
            state_now = "attack_hostiles";
            break;

        case "attack_hostiles":
            if (attackNearestHostile()) {
            } else {
                state_now = "hostiles_dead";
            }
            break; // 攻击最近的敌对生物

        case "hostiles_dead":
            Chat.say(`#resume`);
            is_going_to_fight = false;
            state_now = need_to_back_state_when_battle;
            break;

        case "come_back_to_workshop":
            target_path = WORKSHOP_POS;
            if (is_reach_pos(target_path.x, target_path.y, target_path.z)) {

                drop_items(garbage_item);

                push_item_to_box(
                    //[...need_save_item, ...need_ore_item],
                    need_save_item,
                    SAVE_ORE_CONTAINER
                );

                take_tools();
                Time.sleep(WAIT_NETWORK_TIME);
                state_now = "start";
                target_path = null;
            }
            else {
                Chat.say(`#goto ${WORKSHOP_POS.x} ${WORKSHOP_POS.y} ${WORKSHOP_POS.z}`);
                state_now = "walking";
                last_action = "come_back_to_workshop";
                Time.sleep(WAIT_REACT_TIME);
            }

            break;

    }

    if (state_now != last_state) {
        Chat.log(state_now);
    }
    last_state = state_now;

}

function is_reach_pos(x, y, z, threshold = 0.5) {
    const player_info = Player.getPlayer();
    let player_pos = player_info.getPos();

    let dx = 0;
    let dy = 0;
    let dz = 0;
    if (x != "~") {
        dx = x + 0.5 - player_pos.x;
    }
    if (y != "~") {
        dy = y - player_pos.y;
    }
    if (z != "~") {
        dz = z + 0.5 - player_pos.z;
    }

    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const thresholdSquared = threshold * threshold;

    return distanceSquared < thresholdSquared;
}

// 攻击生物
function attackMob(entity) {
    // 如果手上拿的不是 weapon_item 就换一个
    const inventory = Player.openInventory();
    const interact = Player.getInteractionManager();
    let hand_index = inventory.getSelectedHotbarSlotIndex();
    let hand_slots_list = inventory.getSlots(`hotbar`);
    let hand_slot = hand_slots_list[hand_index];
    const hand_item = inventory.getSlot(hand_slot).getItemId();


    const weapon_item_in_bag = weapon_item.filter(item => inventory.getItemCount().get(item) > 0);
    let item_slot = inventory.findItem(weapon_item_in_bag[0])[0];

    Chat.log(`hand: ${hand_item} item: ${weapon_item_in_bag[0]}`);
    Chat.log(weapon_item.includes(hand_item));
    currentTarget = entity;

    //Chat.say('#pause')
    if (weapon_item.includes(hand_item) && (entity.isAlive() && getDistance(entity) < 5)) {
        interact.attack(entity);
        Chat.log("攻击");
    }
    {
        swap_slot(inventory, hand_slot, item_slot);
        Time.sleep(50);
        if (entity.isAlive() && getDistance(entity) < 5) {
            interact.attack(entity);
            Chat.log("攻击2");
        }
        //Time.sleep(50);
        //swap_slot(inventory, hand_slot, item_slot);
    }



}

function push_item_to_box(items_ids, CONTAINER, face = "up") {
    // 把除了items_ids之外的物品都推送到箱子里
    // 箱子的坐标为CONTAINER
    const tmp_inv = Player.openInventory();
    const is_forget_quit = tmp_inv.isContainer();
    if (is_forget_quit) {
        tmp_inv.close();
        Time.sleep(WAIT_NETWORK_TIME);
    }

    const interact = Player.getInteractionManager();
    interact.interactBlock(CONTAINER.x, CONTAINER.y, CONTAINER.z, face, true);

    Time.sleep(WAIT_NETWORK_TIME);
    const inv = Player.openInventory();

    const main = inv.getSlots("main");
    const hotbar = inv.getSlots("hotbar");
    const player_bag = [...main, ...hotbar];
    // 获取所有非排除物品的槽位
    const allSlots = player_bag;
    const nonExcludedSlots = allSlots.filter((slot) => {
        const item = inv.getSlot(slot)?.getItemId();
        return item && !items_ids.includes(item);
    });

    // 转移所有符合条件的物品
    for (let i = 0; i < nonExcludedSlots.length; i++) {
        const slot = nonExcludedSlots[i];
        if (player_bag.includes(slot)) {
            inv.quickAll(slot);
        }
    }
}

// 背包检测
function isInventoryFull() {
    const inv = Player.openInventory();

    if (inv.findFreeSlot('main') == -1 && inv.findFreeSlot('hotbar') == -1) {
        return true;
    }
    else {
        return false;
    }
}

function is_close_to_hostile() {
    const hostile = findNearestHostile();
    if (hostile && getDistance(hostile) < NEAR_HOSTILE_DISTANCE) {
        return true;
    } else {
        const staringHostiles = findStaringRangedHostiles();
        if (staringHostiles.length > 0) {
            staringHostiles.forEach((entity) => {
                const pos = entity.getPos();
                Chat.log(
                    `警告！有骷髅或其他敌对射手正在盯着你！位置 x:${pos.x.toFixed(
                        1
                    )}, y:${pos.y.toFixed(1)}, z:${pos.z.toFixed(1)}`
                );
            });

            return staringHostiles.map(entity => {
                const pos = entity.getPos();
                return {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z
                };
            });
        }
    }
    return false;
}

function euclideanDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

function getDistance(entity) {
    //const player_pos = Player.getPlayer().getPos();
    const player_pos = Player.getPlayer().getEyePos();
    const entity_pos = entity.getPos();
    return euclideanDistance(player_pos, entity_pos);
}

// 寻找最近的敌对生物
function findNearestHostile() {
    return World.getEntities()
        .filter((e) => HOSTILE_MOBS.includes(e.getType()) && getDistance(e) < 8)
        .sort((a, b) => getDistance(a) - getDistance(b))[0];
    // && e.getDistance() < 8000
}

function findStaringRangedHostiles() {
    // const player = Player.getPlayer();
    // const playerPos = player.getPos();
    const playerPos = Player.getPlayer().getEyePos();

    return World.getEntities().filter((entity) => {
        if (!RANGED_HOSTILES.includes(entity.getType())) {
            return false;
        }

        const entityPos = entity.getPos();
        // 计算三维距离
        const distance = euclideanDistance(entityPos, playerPos);
        if (distance > CHECK_SKELETON_DISTANCE) {
            return false;
        }

        // 水平角度计算
        const deltaX = playerPos.x - entityPos.x;
        const deltaZ = playerPos.z - entityPos.z;
        const targetYaw = -Math.atan2(deltaX, deltaZ) * (180 / Math.PI);

        // 新增垂直角度计算
        const deltaY = playerPos.y - entityPos.y;
        const horizontalDistance = Math.sqrt(deltaX ** 2 + deltaZ ** 2);
        const targetPitch = Math.atan2(deltaY, horizontalDistance) * (180 / Math.PI);

        // 获取实体实际角度
        const entityYaw = entity.getYaw();
        const entityPitch = entity.getPitch(); // 新增pitch获取

        // 同时检查水平和垂直角度
        return Math.abs(entityYaw - targetYaw) < YAW_ALLOW &&
            Math.abs(entityPitch - targetPitch) < PITCH_ALLOW;
    });
}

// 攻击最近的敌对生物
function attackNearestHostile() {
    const hostile = findNearestHostile();
    if (hostile) {
        attackMob(hostile);
        return true;
    } else {
        return false;
    }
}


function swap_slot(inventory, slot1, slot2) {
    if (slot1 == slot2) {
        inventory.click(slot1);
        inventory.click(slot2);
    }
    else {
        inventory.click(slot1);
        inventory.click(slot2);
        inventory.click(slot1);
    }
}

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

function force_off_hand(item_name, inventory) {
    //const inventory = Player.openInventory();
    let hand_slot = 45;

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


function drop_items(item_ids) { // 参数改为复数形式
    const inv = Player.openInventory();
    const main = inv.getSlots("main");
    const hotbar = inv.getSlots("hotbar");
    const player_bag = [...main, ...hotbar];

    // 获取所有需要丢弃物品的槽位（扁平化处理多个ID）
    const allSlots = item_ids.flatMap(id => inv.findItem(id));

    for (let i = 0; i < allSlots.length; i++) {
        const slot = allSlots[i];
        if (player_bag.includes(slot)) {
            inv.dropSlot(slot, true);
        }
    }
}

function take_lunch() {
    const inventory = Player.openInventory();
    const interact = Player.getInteractionManager();
    let hand_index = inventory.getSelectedHotbarSlotIndex();
    let hand_slots_list = inventory.getSlots(`hotbar`);
    let hand_slot = hand_slots_list[hand_index];
    const hand_item = inventory.getSlot(hand_slot).getItemId();
    const food_item_in_bag = food_item.filter(item => inventory.getItemCount().get(item) > 0);


    // 判断包里有没有食物
    if (food_item_in_bag.length == 0) {
        Chat.log("没食物了");
    }
    else {
        let item_slot = inventory.findItem(food_item_in_bag[0])[0];
        Chat.say('#pause')
        if (food_item.includes(hand_item)) {
            // 直接吃
            interact.holdInteract(40);
            Time.sleep(1000); // 等待食用完成
        }
        else {
            swap_slot(inventory, hand_slot, item_slot);
            interact.holdInteract(40);
            Time.sleep(1000); // 等待食用完成
            swap_slot(inventory, hand_slot, item_slot);
        }
        Chat.say('#resume')
    }
}

function take_tools() {
    const TARGET_TOOL = "minecraft:diamond_pickaxe";
    const REQUIRED_COUNT = 5;

    const inv = Player.openInventory();
    const currentCount = inv.getItemCount().get(TARGET_TOOL) || 0;

    if (currentCount >= REQUIRED_COUNT) {
        return;
    }

    // 打开工具箱
    const interact = Player.getInteractionManager();
    interact.interactBlock(TOOL_CONTAINER.x, TOOL_CONTAINER.y, TOOL_CONTAINER.z, "up", true);
    Time.sleep(1000);

    // 获取箱子物品
    const containerInv = Player.openInventory();
    const containerSlots = containerInv.getSlots('container');

    // 转移工具直到满足数量要求
    for (let slot of containerSlots) {
        const item = containerInv.getSlot(slot)?.getItemId();
        if (item === TARGET_TOOL) {
            containerInv.quick(slot);
            Time.sleep(200);

            if ((inv.getItemCount().get(TARGET_TOOL) || 0) >= REQUIRED_COUNT) {
                break;
            }
        }
    }

    // 关闭容器
    containerInv.close();
    Time.sleep(500);
}


function update_state() {
    if (tick_count++ > 5) {
        tick_count = 0;
        try {
            state_machine();
        }
        catch (e) {
            Chat.log(e);
        }

    }
}

const TickListener = JsMacros.on(
    "Tick",
    JavaWrapper.methodToJava(update_state)
);

// this fires when the service is stopped
event.stopListener = JavaWrapper.methodToJava(() => {
    JsMacros.off(TickListener);
    Chat.say('#cancel');
});
