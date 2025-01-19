
// ===============配置区====================

// 该脚本在登录时，默认你在登录大厅里把指南针握在手上

const userList = [
  { username: "Alice", password: "123456" },
  { username: "Bob", password: "admin" },
];

let username_now;
const server_ip = "d.fishport.net";
const server_port = 31450;

// 设置最大重连次数，不要设置太多次，否则容易被服务器识别为机器人并拒绝登录。
const max_reconnect_times = 5;
// 设置重连接延迟，单位为ms
let reconnect_delay = 10000;

// 设置登录过程中等待服务器响应的时间，单位为ms
const wait_server_react = 1000;

// ===============配置区====================

// 检查事件类型是否为 Service
JsMacros.assertEvent(event, "Service");
// 定义一个变量，用于记录重连次数
let reconnect_times = 0;

// 定义一个函数，根据 username 查找对应的 password
function getPasswordByUsername(username) {
  const user = userList.find((item) => item.username === username);
  return user ? user.password : null; // 如果找到返回密码，否则返回 null
}

// JSMarcos 没有查询自己用户名的方法，所以只能用获取玩家列表的方法来曲线救国了
function guess_login() {
  const server_player_list = World.getLoadedPlayers();
  const local_usernames = userList.map((user) => user.username.trim());
  const server_usernames = server_player_list.map((user) =>
    user.getName().getString().trim()
  );

  local_usernames.forEach((item_l, index_l) => {
    server_usernames.forEach((item_s, index_s) => {
      if (item_l == item_s) {
        //Chat.log(userList[index_l].password);
        Chat.say(`/login ${userList[index_l].password}`);
      }
    });
  });
}

function try_enter_server() {
  for (let i = 0; i < 20; i++, Time.sleep(wait_server_react)) {
    try {
      const f = Player.openInventory();
      let r = f.findItem("minecraft:compass");
      if (Chat.log(r[0] == null)) {
        Chat.log("还未完全进入服务器");
      } else {
        // 假设手上有一个指南针
        // Chat.log(r[0]);
        const enter = Player.getInteractionManager();
        enter.interact();

        Time.sleep(wait_server_react);
        const bag = Player.openInventory();
        const title = bag.getContainerTitle();

        if (title === "选择服务器") {
          bag.click(0); // 点击第一个服务器
          reconnect_times = 0; // 连接成功，重置重连次数
          Chat.log("已经确认连接亚欧大陆，请等待");
          break;
        } else {
          Chat.log("没打开服务器选择菜单");
        }
      }
    } catch (e) {
      console.log("尝试连接服务器失败");
      console.log(e);
    }
  }
}

function check_login_info(event) {
  const text = event[`text`].toString();

  if (username_now === undefined) {
    // 使用正则表达式提取用户名
    const match = text.match(/#\s*(\w+)\s*欢迎加入/);

    // 检查是否匹配到结果
    if (match) {
      username_now = match[1];
      Chat.log("提取到您的用户名:" + username);
    }
  } else if (event[`text`].toString().includes(`You were kicked from 10th`)) {
    try_enter_server(); // 被踢回了登录大厅
  } else if (event[`text`].toString().includes(`请输入 /login 密码 以登录`)) {
    if (username_now === undefined) {
      guess_login();
    } else {
      Chat.say(`/login ${getPasswordByUsername(username_now)}`);
    }
    try_enter_server();
  }
}

function check_screen_change(event) {
  // 屏幕变化了就是被踢了

  if (event["screenName"] == `Connection Lost`) {
    // be kick
    Client.connect(server_ip, server_port);

    try_enter_server();
  } else if (event["screenName"] == `Failed to connect to the server`) {
    // 一般是因为网络问题没连接上，重连，要求最多重连 5 次，注意，重练连接不上也会触发这个事件
    Time.sleep(reconnect_delay);
    reconnect_times++;
    if (reconnect_times > max_reconnect_times) {
      // 超过最大重连次数，停止重连
      return;
    }

    Client.connect(server_ip, server_port);

    try_enter_server();
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

event.stopListener = JavaWrapper.methodToJava(() => {
  JsMacros.off(kickListener);
  JsMacros.off(ScreenListener);
});
