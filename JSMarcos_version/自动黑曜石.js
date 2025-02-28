const WAIT_NETWORK_TIME = 250;
const WAIT_TACK_TIME = 50;
const WAIT_CLIENT_TIME = 10;
const WAIT_PLACE_LAVA_TIME = 1600;
const WAIT_EPOCH_TIME = 1000;
const GET_LAVA_POS = { x: 6124, y: 120, z: -3021 };
const PUSH_BUCKET_POS = { x: 6122, y: 122, z: -3024 };
const PLACE_LAVA_POS = { x: 6120, y: 120, z: -3021 };

const WORK_POINT_A = { x: 6124, y: 119.5, z: -3022 }; // 工作点 A
const WORK_POINT_B = { x: 6121, y: 121, z: -3019 }; // 工作点 B

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

    if (force && hand_item == item) {
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
function findClosePoints(target, array, max_distance = 4.5) {
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



function push_item_to_box(item_id, CONTAINER, face = "up") {

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

    const pos = inv.findItem(item_id);

    const main = inv.getSlots("main");
    const hotbar = inv.getSlots("hotbar");
    const player_bag = [...main, ...hotbar];

    for (let i = 0; i < pos.length; i++) {
        if (player_bag.includes(pos[i])) {
            inv.quickAll(pos[i]);
            break;
        } else {
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


    const tmp_inv = Player.openInventory();
    const is_forget_quit = tmp_inv.isContainer();
    if (is_forget_quit) {
        tmp_inv.close();
        Time.sleep(WAIT_NETWORK_TIME);
    }


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

function look_at(x, y, z) {
    let player_eye_pos = Player.getPlayer().getEyePos();
    const deltaX = x - player_eye_pos.x;
    const deltaZ = z - player_eye_pos.z;
    let deltaY = 0;
    if (y != "~") {
        deltaY = player_eye_pos.y - y;
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

function place_block_up(block_pos) {
    const look_pos = { x: block_pos.x + 0.5, y: block_pos.y + 1, z: block_pos.z + 0.5 };

    result = look_at(look_pos.x, look_pos.y, look_pos.z);
    let player_input = Player.createPlayerInput(
        0,
        0,
        result.yaw,
        result.pitch,
        false,
        false,
        false
    );
    Player.addInput(player_input);
    //Time.sleep(WAIT_CLIENT_TIME);
    const Target = Player.getInteractionManager().getTargetedBlock();
    if (Target != null) {
        if (Target.getX() == block_pos.x && Target.getY() == block_pos.y && Target.getZ() == block_pos.z) {
            //Chat.log("look_block_up success");
            // 看对地方了，放岩浆
            Player.getInteractionManager().interact(true);
            //Time.sleep(WAIT_CLIENT_TIME);
        }
        else {
            Chat.log("look_block_up failed");
        }
    }
    else {
        Chat.log("look_block_up failed, no block targeted");
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

function push_lava() {
    let tmp_inv = Player.openInventory();
    force_hand("minecraft:lava_bucket", tmp_inv, true); //刷新一下，避免假桶

    let inv = Player.openInventory();
    while (bag_have_item("minecraft:lava_bucket")) {

        tmp_inv = Player.openInventory();
        const is_forget_quit = tmp_inv.isContainer();
        if (is_forget_quit) {
            tmp_inv.close();
            Time.sleep(WAIT_NETWORK_TIME);
            inv = Player.openInventory();
        }



        force_hand("minecraft:lava_bucket", inv);
        place_block_up(PLACE_LAVA_POS);
        Time.sleep(WAIT_PLACE_LAVA_TIME);
    }
}


for (let epoch = 0; true; epoch++) {

    try {
        const start_time = Time.time();
        if (!PlayerisPointInsideCube()) {
            //Chat.log("玩家不在工作区域内，等待10秒后重新检查");
            Time.sleep(10000);
            Chat.log(1);
            continue;
        }

        if (
            !bag_have_item("minecraft:lava_bucket")) {
            Chat.log(2);
            take_item_from_box("minecraft:lava_bucket", GET_LAVA_POS, 9);
        }
        Chat.log(3);
        push_lava();

        if (
            bag_have_item("minecraft:bucket")) {
            Chat.log(4);
            push_item_to_box("minecraft:bucket", PUSH_BUCKET_POS);
        }

        if (Time.time() - start_time < WAIT_EPOCH_TIME) {
            Chat.log(5);
            Time.sleep(WAIT_EPOCH_TIME);
        }

    }
    catch (e) {
        Chat.log(e);
        Time.sleep(WAIT_EPOCH_TIME);
    }

}




