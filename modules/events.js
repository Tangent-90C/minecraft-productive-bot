function setupEvents(bot) {
    bot.on("message", (message) => {
        console.log(`[Server] ${message.toAnsi()}`);
    });

    bot.on("windowOpen", (window) => {
        console.log("Window opened:", window.title);
        const slot = 0;
        bot.clickWindow(slot, 0, 0, (err) => {
            if (err) {
                console.log("Error clicking window:", err);
            } else {
                console.log("Clicked slot", slot);
            }
        });
    });

    bot.on("whisper", (username, message) => {
        console.log(`[Whisper] ${username}: ${message}`);
        bot.whisper(username, "Hello!");
    });

    bot.on("kicked", (reason) => {
        console.log("I was kicked from the server: " + reason.value['text']['value']);
    });

    let lastPosition = null;
    bot.on("move", () => {
        const currentPosition = bot.entity.position;
        if (!lastPosition) {
            lastPosition = currentPosition.clone();
            return;
        }
        const distance = currentPosition.distanceTo(lastPosition);
        if (distance > 0.5) {
            console.log(`Bot moved to: ${currentPosition}`);
            lastPosition = currentPosition.clone();
        }
    });
}

module.exports = { setupEvents };