const mineflayer = require("mineflayer");
const { pathfinder } = require("mineflayer-pathfinder");
const inventoryViewer = require("mineflayer-web-inventory");
const mineflayerViewer = require("prismarine-viewer").mineflayer;
const webserver = require("./modules/server");
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Read the config from config.yaml
const configPath = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
const options = config.bot.options;
const web_ports = config.bot.webserver;

global.bot = mineflayer.createBot(options);
bot.loadPlugin(pathfinder);

inventoryViewer(bot, { port: web_ports.inventoryViewer_port });
mineflayerViewer(bot, { port: web_ports.mineflayerViewer_firstPerson_port, firstPerson: true });
mineflayerViewer(bot, { port: web_ports.mineflayerViewer_port, firstPerson: false });
webserver(bot, web_ports.control_web_port,web_ports.mineflayerViewer_firstPerson_port);

const { login } = require("./modules/login_server");
const { setupEvents } = require("./modules/events");
const { moveToCoordinates, lookAt } = require("./modules/movement");
global.moveToCoordinates = moveToCoordinates;
global.lookAt = lookAt;

bot.once("spawn", () => login(bot));
setupEvents(bot);

// Load server.js and pass the bot variable and port
