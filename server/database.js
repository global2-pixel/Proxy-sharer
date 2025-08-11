const sqlite3 = require('sqlite3').verbose();

// 定义数据库文件路径。这将在 server 目录下创建一个 proxy_db.sqlite 文件
const DB_PATH = './proxy_db.sqlite';

// 创建并连接到数据库
// 如果文件不存在，sqlite3 会自动创建它
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('数据库连接错误:', err.message);
    } else {
        console.log('成功连接到 SQLite 数据库。');
        // 开启外键约束支持, SQLite 默认是关闭的
        db.exec('PRAGMA foreign_keys = ON;', (err) => {
            if (err) {
                console.error("无法开启外键支持:", err);
            }
        });
        initializeDB();
    }
});

// 定义 SQL 创建表的语句 (适配 SQLite 语法)
const USERS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const PROXIES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS proxies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_text TEXT NOT NULL,
    region VARCHAR(100),
    ip_type TEXT CHECK(ip_type IN ('datacenter', 'commercial', 'residential')),
    remaining_traffic VARCHAR(50),
    uploader_id VARCHAR(255) NOT NULL,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);`;

const REPORTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS validity_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proxy_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    is_valid BOOLEAN NOT NULL,
    report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (proxy_id, user_id),
    FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`;

// 初始化数据库表的函数
function initializeDB() {
    // db.serialize 可以确保其中的命令按顺序执行
    db.serialize(() => {
        db.run(USERS_TABLE_SQL, (err) => {
            if (err) console.error("创建 'users' 表失败:", err);
        });
        
        // vvvvvvvvvv 在这里添加下面的代码 vvvvvvvvvv
        const placeholderUserSql = `INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)`;
        db.run(placeholderUserSql, ['user_placeholder_01', 'test@example.com', '测试用户'], (err) => {
            if (err) console.error("插入虚拟用户失败:", err);
        });
        // ^^^^^^^^^^^ 添加代码结束 ^^^^^^^^^^^

        db.run(PROXIES_TABLE_SQL, (err) => {
            if (err) console.error("创建 'proxies' 表失败:", err);
        });
        db.run(REPORTS_TABLE_SQL, (err) => {
            if (err) console.error("创建 'validity_reports' 表失败:", err);
        });
        console.log('数据库表已检查/创建完毕。');
    });
}

// 导出数据库连接实例，以便在其他文件中使用
module.exports = db;