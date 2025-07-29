const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 静态文件服务
app.use(express.static(__dirname));

// 存储消息历史
let messageHistory = {
    left: [],
    right: []
};

// Socket.IO连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);
    
    // 发送历史消息给新连接的用户
    socket.emit('messageHistory', messageHistory);
    
    // 处理新消息
    socket.on('sendMessage', (data) => {
        const { side, text, timestamp } = data;
        
        const message = {
            id: Date.now() + Math.random(),
            text: text,
            timestamp: timestamp,
            socketId: socket.id
        };
        
        // 保存到历史记录
        messageHistory[side].unshift(message);
        
        // 限制历史记录数量（保留最新的50条）
        if (messageHistory[side].length > 50) {
            messageHistory[side] = messageHistory[side].slice(0, 50);
        }
        
        // 广播给所有连接的用户
        io.emit('newMessage', { side, message });
        
        console.log(`收到${side}侧消息:`, text);
    });
    
    // 处理清空消息
    socket.on('clearMessages', (side) => {
        messageHistory[side] = [];
        io.emit('messagesCleared', side);
        console.log(`${side}侧消息已清空`);
    });
    
    // 用户断开连接
    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});