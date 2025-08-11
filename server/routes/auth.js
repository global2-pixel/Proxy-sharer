const express = require('express');
const passport = require('passport');
const { jwtDecode } = require('jwt-decode');
const OAuth2Strategy = require('passport-oauth2');
const db = require('../database');

const router = express.Router();

// Passport-oauth2 策略配置
passport.use('linuxdo', new OAuth2Strategy({
    authorizationURL: 'https://connect.linux.do/oauth2/authorize',
    tokenURL: 'https://connect.linux.do/oauth2/token',
    clientID: process.env.LINUXDO_CLIENT_ID,
    clientSecret: process.env.LINUXDO_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3001/api/auth/linuxdo/callback"
  },
  // 这个函数在获取到 access token 后被调用
  (accessToken, refreshToken, params, done) => {
    try {
      // 1. 解码 Access Token
      const decodedToken = jwtDecode(accessToken);

      // 2. 从解码后的 token 中获取用户 ID (sub 字段)
      const userId = decodedToken.sub;
      if (!userId) {
        return done(new Error('无法从 Token 中解析出用户 ID'));
      }

      // 3. 在我们的数据库中查找或创建用户
      const findUserSql = 'SELECT * FROM users WHERE id = ?';
      db.get(findUserSql, [userId], (err, row) => {
        if (err) { return done(err); }

        // 如果用户已存在，直接返回用户信息
        if (row) {
          return done(null, row);
        } else {
          // 如果用户不存在，创建一个新用户
          // 注意：我们只能获取到 ID，其他信息设为占位符或 NULL
          const newUser = {
            id: userId,
            email: `${userId}@linux.do`, // 创建一个虚拟邮箱
            name: `user_${userId}`,       // 创建一个虚拟用户名
            avatar_url: null
          };

          const insertUserSql = 'INSERT INTO users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)';
          db.run(insertUserSql, [newUser.id, newUser.email, newUser.name, newUser.avatar_url], function(err) {
            if (err) { return done(err); }
            return done(null, newUser);
          });
        }
      });
    } catch (error) {
      // 如果解码失败，也视为错误
      return done(error);
    }
  }
));

// 序列化用户：决定将用户的哪些信息存储在 session 中
// 我们只存储用户的 ID，这样更高效
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// 反序列化用户：在每次请求时，根据 session 中存储的 ID 从数据库中重新获取完整的用户信息
passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        done(err, user);
    });
});

// --- 认证路由 ---

// 路由 1: 登录入口
// 访问这个地址会重定向到 Linux.do 的授权页面
router.get('/auth/linuxdo', passport.authenticate('linuxdo'));

// 路由 2: 回调地址
// 用户在 Linux.do 授权后，会被重定向回这里
router.get('/auth/linuxdo/callback',
  passport.authenticate('linuxdo', {
    successRedirect: 'http://127.0.0.1:5500/client', // 成功后跳回 Live Server 的地址
    failureRedirect: '/login-failed'
  })
);

// 路由 3: 获取当前登录用户信息 (用于测试)
router.get('/auth/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ message: '已登录', user: req.user });
    } else {
        res.status(401).json({ message: '未登录' });
    }
});

// 路由 4: 登出
router.get('/auth/logout', (req, res, next) => {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('http://127.0.0.1:5500/client'); // 登出后重定向到前端页面
    });
});


module.exports = router;