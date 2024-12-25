const { Movements, goals } = require("mineflayer-pathfinder");

function moveToCoordinates(bot, x, y, z) {
    const mcData = require("minecraft-data")(bot.version);
    const defaultMove = new Movements(bot, mcData);
    defaultMove.canDig = false;
    // 禁止放置方块
    defaultMove.canPlaceOn = false;
    bot.pathfinder.setMovements(defaultMove);
    const goal = new goals.GoalBlock(x, y, z);
    bot.pathfinder.setGoal(goal);
}

function lookAt(bot, yaw, pitch) {
    bot.look(yaw, pitch, true, () => {
        console.log(`Bot is now looking at yaw: ${yaw}, pitch: ${pitch}`);
    });
}

async function buildUp() {
    bot.setControlState("jump", true);

    while (true) {
        let positionBelow = bot.entity.position.offset(0, -0.5, 0);
        let blockBelow = bot.blockAt(positionBelow);
        if (blockBelow.name == 'air') break;
        await bot.waitForTicks(1);
    }

    let sourcePosition = bot.entity.position.offset(0, -1.5, 0);
    let sourceBlock = bot.blockAt(sourcePosition);

    let faceVector = {x: 0, y: 1, z: 0};

    await bot.placeBlock(sourceBlock, faceVector);
    bot.setControlState("jump", false);
}

module.exports = { moveToCoordinates, lookAt };
