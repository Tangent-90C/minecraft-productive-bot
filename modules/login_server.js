const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Read the password from config.yaml
const configPath = path.join(__dirname, '../config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
const password = config.bot.password;

function login(bot) {
    bot.chat(`/login ${password}`);
    setTimeout(() => {
        bot.setQuickBarSlot(0);
        if (bot.heldItem) {
            bot.activateItem();
        } else {
            console.log("No item in hand to activate.");
        }
    }, 1000);

    const position = bot.entity.position;
    console.log(`[Bot position]: ${position}`);
}

module.exports = { login };