# Minecraft智能制造产业自动化机器人

在原版Minecraft的工业化发展进程中，红石自动化往往代表着生产力的最高水平。但在生产过程中，也有红石没法自动化的过程，如：`树场放置树苗`、`采集树叶`、`与村民交易`、`使用特定的工具`等。传统方法往往需要某个人在电脑上打开游戏用简单的脚本进行挂机。

为解决此处痛点，本项目以科技创新为核心驱动力，以深化高技术应用为主要特征，创新使用mineflayer替代原生JAVA客户端，通过可编程机器人，在只需要少量计算资源的情况下，实现全流程自动化的替代玩家在电脑前的真人操作，在Minecraft自动化这一关键技术领域上实现质的突破，为加快形成新质生产力迈出关键一步。

## 目前可用功能

- 人工干预bot移动
- 自动寻路


## 启动界面
启动后默认会监听4个端口
- 3000（人工干预bot移动用的控制台）
- 3001（bot背包可视化查看）
- 3002（bot第一人称视角，与3000端口中看到的一致）
- 3003（bot的上帝视角，可调整角度）

![image](https://github.com/user-attachments/assets/f2bcef11-7c25-40f7-8402-5761a4f0b156 "人工干预bot移动用的控制台")

![image](https://github.com/user-attachments/assets/36ce83dd-be25-458b-9142-6974b7680d11 "bot背包可视化查看")

![image](https://github.com/user-attachments/assets/b3260b09-2ae0-422f-bde8-35c1b19cf5bf "bot的上帝视角")



## 安装方法

1. 安装nodejs
https://nodejs.org/
   
2. 安装依赖库
```
npm install mineflayer mineflayer-pathfinder mineflayer-web-inventory prismarine-viewer js-yaml
```

3. 设置配置文件

把`config_example.yaml`内的配置改成你的，并重命名为`config.yaml`

![image](https://github.com/user-attachments/assets/88f2b8f6-d8e2-4fec-905a-c5eeab7d51ec)


4. 启动
```
node bot.js
```

![image](https://github.com/user-attachments/assets/c975094a-bb20-47d1-9dac-e368d8c5fde4)
