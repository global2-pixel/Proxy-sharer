const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors'); // <--- 1. 在这里引入 cors
require('dotenv').config({ path: '../.env' });

const db = require('./database.js');
const proxyRoutes = require('./routes/proxies');
const authRoutes = require('./routes/auth');

const app = express();

// --- 中间件配置 ---
app.use(cors({
    origin: 'http://127.0.0.1:5500', // 明确指定允许的前端源地址
    credentials: true                // 允许服务器接收并处理 cookie
}));
app.use(express.json());

// 1. 配置 Session
app.use(session({
    secret: process.env.SESSION_SECRET, // 用于签名 session ID cookie 的密钥
    resave: false,                      // 强制 session 重新保存，即使它没有变化
    saveUninitialized: false,           // 强制未初始化的 session 保存到存储
    cookie: { secure: false }           // 在非 https 环境下，需要设置为 false
}));

// 2. 初始化 Passport
app.use(passport.initialize());
app.use(passport.session()); // 使用 session 来持久化登录状态

// --- 路由配置 ---
app.use('/api', proxyRoutes); // 使用代理节点 API 路由
app.use('/api', authRoutes);  // 使用认证路由

// --- 根路由和启动 ---
app.get('/', (req, res) => {
    res.send('代理分享程序后端已启动！认证功能已配置。');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`服务器正在 http://localhost:${PORT} 上运行`);
});

// --- 优雅关闭 ---
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) return console.error(err.message);
        console.log('数据库连接已关闭。');
        process.exit(0);
    });
});