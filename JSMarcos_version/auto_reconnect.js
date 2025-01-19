// ===============配置区====================

// 该脚本在登录时，默认你在登录大厅里把指南针握在手上

const userList = [
  { username: "Alice", password: "123456" },
  { username: "Bob", password: "admin" },
];

// 当前使用的用户名，登录输密码用，不填就自动获取
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

// 检查事件类型是否为 Service，即是否被作为 Service 运行
JsMacros.assertEvent(event, "Service");
// 定义一个变量，用于记录重连次数
let reconnect_times = 0;

// 定义一个函数，根据 username 查找对应的 password
function getPasswordByUsername(username) {
  const user = userList.find((item) => item.username === username);
  return user ? user.password : null; // 如果找到返回密码，否则返回 null
}

function get_username() {
  if (username_now === undefined) {
    // 获取当前玩家的用户名，调用的是 Minecraft 的原始接口，这个方法在1.20.1有效，其它版本不确定是否有效。
    const current_username = Client.getMinecraft().method_1548().method_1676();
    return current_username;
  } else {
    return username_now;
  }
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

  if (text.includes(`You were kicked from 10th`)) {
    try_enter_server(); // 被踢回了登录大厅
  } else if (text.includes(`请输入 /login 密码 以登录`)) {
    Chat.say(`/login ${getPasswordByUsername(get_username())}`);

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
