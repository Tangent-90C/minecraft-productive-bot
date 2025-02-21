// ===============配置区====================

const userList = [
  { username: "Alice", password: "123456" },
  { username: "Bob", password: "admin" },
];

let username_now; // 当前使用的用户名，登录用，不填就自动获取
const server_ip = "d.fishport.net";
const server_port = 31450;

// 设置最大重连次数，不要设置太多次，否则容易被服务器识别为机器人并拒绝登录。
const max_reconnect_times = 50;
// 设置重连接延迟，单位为ms
const reconnect_delay = 61000;

// 设置登录过程中等待服务器响应的时间，单位为ms
const wait_server_react = 1000;

// ===============配置区====================

// 检查事件类型是否为 Service
JsMacros.assertEvent(event, "Service");
// 定义一个变量，用于记录重连次数
let reconnect_times = 0;
let is_in_server = false;
let is_entering_server = false;
let is_full_login = false;
let last_full_login_time = Time.time();

// 定义一个函数，根据 username 查找对应的 password
function getPasswordByUsername(get_username) {
    const user = userList.find((item) => item.username === get_username);
    return user ? user.password : null; // 如果找到返回密码，否则返回 null
}

function get_username() {
    if (username_now === undefined) {
        const player_name = Player.getPlayer().getName().getString();
        return player_name;
    } else {
        return username_now;
    }
}

function try_enter_server(wait_time = wait_server_react) {
    if (is_entering_server || is_in_server) {
        Chat.log('跳过登录');
        return;
    }
    is_entering_server = true;
    Time.sleep(wait_time);
    Chat.log("正在尝试连接");
    Chat.say("/server 10th");
    is_entering_server = false;
}

function check_login_info(event) {
    const text = event[`text`].getString();
    if (is_full_login && Time.time() - last_full_login_time > 15000) {
        // 15s 没有检测到满员状态，认为已经登录成功
        is_full_login = false;
        try_enter_server();
    }

    if (text.includes(`You were kicked from`)) {
        try_enter_server(wait_time=3000); // 被踢回了登录大厅
    }
    else if (text.includes(`已达到最大重连次数。`)) {
        try_enter_server(); // 再接再厉
    }
    else if (text.includes(`正在将你连接至`)) {
        // 连接成功
        is_in_server = true;
        reconnect_times = 0;
    }
    else if (text.includes(`大厅 当前状态: 满员`)) {
        is_full_login = true;
    }
    else if (text.includes(`欢迎回来，已帮你自动登录到此服务器`)) {
        try_enter_server(wait_time=3000);
    }
    else if (text.includes(`请输入 /login 密码 以登录`)) {
        let user_passwd = getPasswordByUsername(get_username());

        if (user_passwd === null) {
            Chat.say("未找到对应的用户名，请检查配置");
        } else {
            Chat.say(`/login ${user_passwd}`);

            console.log("passwd is: " + user_passwd);
            try_enter_server();
        }
    }
}

function check_boss_bar(event) {
    if (event.type == 'ADD') {
        const text = event.bossBar.getName().getString()
        if (text.toLowerCase().includes('fishport')) {
            Chat.log('entering server');
            is_in_server = false;
            try_enter_server();
        }
    }
    

}

function connect_server() {
    if (World.isWorldLoaded()) {
        // pass
        console.log('已经在游戏里了，不需要重连');
    }
    else {
        // 重连
        console.log('开始重连');
        Client.connect(server_ip, server_port);
    }
    
}

function check_screen_change(event) {
    // 屏幕变化了就是被踢了

    if (event["screenName"] == `Connection Lost`) {
        // be kick
        is_in_server = false;
        Time.sleep(reconnect_delay);
        connect_server();

    } else if (event["screenName"] == `Failed to connect to the server`) {
        // 一般是因为网络问题没连接上，注意，重练连接不上也会触发这个事件
        is_in_server = false;
        Time.sleep(reconnect_delay);
        reconnect_times++;
        if (reconnect_times > max_reconnect_times) {
            // 超过最大重连次数，停止重连
            console.say("重连次数过多，停止重连");
            return;
        }
        connect_server();

        
    }
}

const kickListener = JsMacros.on(
    "RecvMessage",
    JavaWrapper.methodToJava(check_login_info)
);

const ScreenListener = JsMacros.on(
    "OpenScreen",
    JavaWrapper.methodToJava(check_screen_change)
);

const BossbarListener = JsMacros.on(
    "Bossbar",
    JavaWrapper.methodToJava(check_boss_bar)
);




event.stopListener = JavaWrapper.methodToJava(() => {
    JsMacros.off(kickListener);
    JsMacros.off(ScreenListener);
});

