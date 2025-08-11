const express = require('express');
const router = express.Router();
const db = require('../database'); // 引入数据库实例

// --- API 1: 获取所有代理节点 (GET /api/proxies) ---
// 按上传时间倒序排列，最新的在最前面
router.get('/proxies', (req, res) => {
    const sql = "SELECT * FROM proxies ORDER BY upload_time DESC";

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// --- API 2: 添加一个新的代理节点 (POST /api/proxies) ---
router.post('/proxies', (req, res) => {
    // 1. 检查用户是否已登录 (重要！)
    if (!req.isAuthenticated()) {
        return res.status(401).json({ "error": "请先登录再分享节点" });
    }

    const { node_text, region, ip_type, remaining_traffic } = req.body;

    // 简单的数据验证
    if (!node_text) {
        res.status(400).json({ "error": "必须提供 node_text 字段" });
        return;
    }

    // 2. 从 session 中获取当前登录用户的真实 ID (核心修正！)
    const uploader_id = req.user.id; 

    const sql = `INSERT INTO proxies (node_text, region, ip_type, remaining_traffic, uploader_id) VALUES (?, ?, ?, ?, ?)`;
    const params = [node_text, region, ip_type, remaining_traffic, uploader_id];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.status(201).json({
            "message": "success",
            "data": { "id": this.lastID }
        });
    });
});

// --- API 3: 删除一个指定的代理节点 (DELETE /api/proxies/:id) ---
router.delete('/proxies/:id', (req, res) => {
    // 1. 检查用户是否登录
    if (!req.isAuthenticated()) {
        return res.status(401).json({ "error": "请先登录" });
    }

    const proxyId = req.params.id;
    const userId = req.user.id;

    // 2. 在删除前，先验证该节点是否属于当前登录用户
    const findSql = "SELECT uploader_id FROM proxies WHERE id = ?";
    db.get(findSql, [proxyId], (err, row) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        if (!row) {
            return res.status(404).json({ "message": "未找到该节点" });
        }
        // 3. 权限判断
        if (row.uploader_id !== userId) {
            return res.status(403).json({ "error": "无权删除不属于你的节点" }); // 403 Forbidden
        }

        // 4. 验证通过，执行删除
        const deleteSql = "DELETE FROM proxies WHERE id = ?";
        db.run(deleteSql, proxyId, function(err) {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }
            res.status(200).json({ "message": `ID 为 ${proxyId} 的代理节点已成功删除` });
        });
    });
});

// --- API 4: 报告一个节点的有效性 (POST /api/proxies/:id/report) ---
router.post('/proxies/:id/report', (req, res) => {
    // 1. 检查用户是否登录
    if (!req.isAuthenticated()) {
        return res.status(401).json({ "error": "请先登录再进行操作" });
    }

    // 2. 获取参数
    const proxyId = req.params.id;
    const userId = req.user.id; // 从 session 中获取当前登录用户的 ID
    const { isValid } = req.body; // 从请求体中获取是“有效”还是“无效” (true/false)

    if (typeof isValid !== 'boolean') {
        return res.status(400).json({ "error": "请求体中必须包含 'isValid' (布尔值)" });
    }

    // 3. 将报告存入数据库
    const sql = `INSERT INTO validity_reports (proxy_id, user_id, is_valid) VALUES (?, ?, ?)`;
    const params = [proxyId, userId, isValid];

    db.run(sql, params, function(err) {
        if (err) {
            // 我们在 validity_reports 表上设置了 (proxy_id, user_id) 的唯一约束
            // 如果插入失败且错误信息包含 UNIQUE，说明用户已报告过
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ "message": "你已经评价过这个节点了" }); // 409 Conflict
            }
            return res.status(500).json({ "error": err.message });
        }
        res.status(201).json({ "message": "感谢你的反馈！" });
    });
});


module.exports = router;