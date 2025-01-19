const express = require('express');
const http = require('http');
const WebSocket = require('ws');

module.exports = function(bot, port, firstPersonViewerPort) {
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    app.use(express.static('public'));
    app.use(express.json());

    app.post('/control', (req, res) => {
        const { action, state } = req.body;
        console.log(`[Control] ${action} ${state}`);
        if (action === 'back' && state === true) {
            bot.setControlState('sprint', false); // Disable sprinting when moving backward
        }
        switch (action) {
            case 'forward':
            case 'back':
            case 'left':
            case 'right':
            case 'jump':
            case 'sprint':
            case 'sneak':
                bot.setControlState(action, state);
                break;
        }
        res.sendStatus(200);
    });

    app.get('/bot-view-url', (req, res) => {
        res.json({ url: `http://127.0.0.1:${firstPersonViewerPort}/` });
    });

    app.post('/revive', (req, res) => {
        console.log('[Control] Revive bot');
        bot.revive(); // Assuming you have a revive method in your bot object
        res.sendStatus(200);
    });

    app.get('/status', (req, res) => {
        const velocity = bot.entity.velocity;
        const totalSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
        const status = {
            health: bot.health,
            hunger: bot.food,
            position: bot.entity.position,
            direction: bot.entity.yaw, // Yaw represents the direction the bot is facing
            speed: velocity, // Velocity represents the speed in X, Y, and Z directions
            totalSpeed: totalSpeed
        };
        res.json(status);
    });

    app.post('/mouse-move', (req, res) => {
        const { movementX, movementY } = req.body;
        const sensitivity = 0.002; // Adjust sensitivity as needed

        bot.entity.yaw -= movementX * sensitivity;

        let newPitch = bot.entity.pitch - movementY * sensitivity;
        if (newPitch > Math.PI / 2) {
            newPitch = Math.PI / 2;
        } else if (newPitch < -Math.PI / 2) {
            newPitch = -Math.PI / 2;
        }
        bot.entity.pitch = newPitch;

        res.sendStatus(200);
    });

    app.post('/chat', (req, res) => {
        const { message } = req.body;
        bot.chat(message);
        res.sendStatus(200);
    });

    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toHTML();
        const chatMessage = { message };
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(chatMessage));
            }
        });
    });

    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};