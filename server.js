const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8008;

// ==================== НАСТРОЙКА ====================
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ==================== БАЗА ДАННЫХ ====================
const db = new sqlite3.Database('./kshor.db', (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Подключено к SQLite базе данных');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Таблица заявок (адаптирована под твою структуру из index.html)
        db.run(`CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            age INTEGER NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            direction TEXT NOT NULL,
            direction_name TEXT NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Таблица клиентов (уникальные email)
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            orders_count INTEGER DEFAULT 0,
            first_order TIMESTAMP,
            last_order TIMESTAMP
        )`);

        // Таблица администраторов
        db.run(`CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`);

        // Создаём админа (пароль через переменную окружения или по умолчанию)
        const adminPass = process.env.ADMIN_PASSWORD || 'admin2024';
        db.get("SELECT * FROM admins WHERE username = 'admin'", (err, row) => {
            if (!row) {
                db.run("INSERT INTO admins (username, password) VALUES (?, ?)", ['admin', adminPass]);
                console.log('👑 Создан администратор: admin / ' + adminPass);
            }
        });

        console.log('✅ База данных инициализирована');
    });
}

// ==================== API ====================

// 1. Создать заявку (из формы на главной)
app.post('/api/applications', (req, res) => {
    const { fullName, age, phone, email, direction, directionName, message } = req.body;

    if (!fullName || !age || !phone || !email || !direction) {
        return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const createdAt = new Date().toISOString();

    db.run(
        `INSERT INTO applications (full_name, age, phone, email, direction, direction_name, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullName, age, phone, email, direction, directionName, message || '', createdAt],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }

            // Обновляем данные клиента
            db.get("SELECT * FROM customers WHERE email = ?", [email], (err, customer) => {
                if (customer) {
                    db.run(
                        `UPDATE customers SET orders_count = orders_count + 1, last_order = ? WHERE email = ?`,
                        [createdAt, email]
                    );
                } else {
                    db.run(
                        `INSERT INTO customers (name, phone, email, orders_count, first_order, last_order)
                         VALUES (?, ?, ?, 1, ?, ?)`,
                        [fullName, phone, email, createdAt, createdAt]
                    );
                }
            });

            res.json({ success: true, id: this.lastID });
        }
    );
});

// 2. Получить все заявки (с фильтром по статусу)
app.get('/api/applications', (req, res) => {
    const { status } = req.query;
    let query = "SELECT * FROM applications";
    const params = [];

    if (status && status !== 'all') {
        query += " WHERE status = ?";
        params.push(status);
    }
    query += " ORDER BY created_at DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. Обновить статус заявки
app.put('/api/applications/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['new', 'processed', 'rejected'];

    if (!allowed.includes(status)) {
        return res.status(400).json({ error: 'Некорректный статус' });
    }

    db.run("UPDATE applications SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Заявка не найдена' });
        res.json({ success: true });
    });
});

// 4. Получить всех клиентов
app.get('/api/customers', (req, res) => {
    db.all("SELECT * FROM customers ORDER BY last_order DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 5. Статистика для админ-панели
app.get('/api/stats', (req, res) => {
    db.get("SELECT COUNT(*) as total_applications FROM applications", (err, appStats) => {
        db.get("SELECT COUNT(*) as total_customers FROM customers", (err2, custStats) => {
            db.get("SELECT COUNT(*) as new_applications FROM applications WHERE status = 'new'", (err3, newApps) => {
                db.get("SELECT COUNT(*) as processed_applications FROM applications WHERE status = 'processed'", (err4, processedApps) => {
                    res.json({
                        total_applications: appStats.total_applications || 0,
                        total_customers: custStats.total_customers || 0,
                        new_applications: newApps.new_applications || 0,
                        processed_applications: processedApps.processed_applications || 0
                    });
                });
            });
        });
    });
});

// 6. Авторизация админа
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM admins WHERE username = ? AND password = ?", [username, password], (err, admin) => {
        if (err) return res.status(500).json({ error: err.message });
        if (admin) {
            res.json({ success: true, user: { username: admin.username } });
        } else {
            res.status(401).json({ error: 'Неверные логин или пароль' });
        }
    });
});

// 7. Экспорт заявок в CSV
app.get('/api/export/applications', (req, res) => {
    db.all("SELECT * FROM applications ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let csv = 'ID,ФИО,Возраст,Телефон,Email,Направление,Статус,Примечания,Дата\n';
        rows.forEach(app => {
            csv += `"${app.id}","${app.full_name}","${app.age}","${app.phone}","${app.email}","${app.direction_name}","${app.status}","${app.message || ''}","${app.created_at}"\n`;
        });

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.header('Content-Disposition', 'attachment; filename="applications_export.csv"');
        res.send('\uFEFF' + csv);
    });
});

// ==================== СТАТИЧЕСКИЕ МАРШРУТЫ ====================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// Дополнительные страницы направлений
app.get('/wrestling.html', (req, res) => res.sendFile(path.join(__dirname, 'wrestling.html')));
app.get('/swimming.html', (req, res) => res.sendFile(path.join(__dirname, 'swimming.html')));
app.get('/athletics.html', (req, res) => res.sendFile(path.join(__dirname, 'athletics.html')));
app.get('/table-tennis.html', (req, res) => res.sendFile(path.join(__dirname, 'table-tennis.html')));
app.get('/gymnastics.html', (req, res) => res.sendFile(path.join(__dirname, 'gymnastics.html')));
app.get('/chess.html', (req, res) => res.sendFile(path.join(__dirname, 'chess.html')));

// ==================== ЗАПУСК ====================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Сайт:    http://localhost:${PORT}/`);
    console.log(`🔧 Админка: http://localhost:${PORT}/admin`);
    console.log(`📁 Демо-данные будут созданы автоматически при первой заявке`);
    console.log('='.repeat(50));
});