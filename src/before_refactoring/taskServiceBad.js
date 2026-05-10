// ============================================
// БРУДНИЙ КОД (ДО РЕФАКТОРИНГУ)
// Цей код містить всі проблеми з аналізу
// ============================================

function doStuff(x, y, z, a, b, c) {
    let data = [];
    for (let i = 0; i < x.length; i++) {
        if (x[i] != null) {
            if (x[i].status == 1) {
                data.push(x[i]);
            } else if (x[i].status == 2) {
                if (x[i].priority > 5) {
                    data.push(x[i]);
                }
            }
        }
    }
    let result = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (y == true) {
            item.price = item.price * 0.85;
        } else if (y == false) {
            if (item.price > 500) {
                item.price = item.price * 0.95;
            }
        }
        result.push(item);
    }
    try {
        const fs = require('fs');
        fs.appendFileSync('log.txt', JSON.stringify(result));
    } catch (e) {
        // silent fail
    }
    return result;
}

class Manager {
    constructor() {
        const sqlite3 = require('sqlite3');
        this.db = new sqlite3.Database('tasks.db');
    }

    doTask(id, name, desc, prio, dead, uid, cat, tags, att, noti) {
        this.db.get("SELECT * FROM tasks WHERE id=" + id, (err, row) => {
            if (row != null) {
                this.db.run("UPDATE tasks SET name='" + name + "' WHERE id=" + id);
            }
            this.db.run("INSERT INTO logs VALUES (?,?,?)", [id, name, "updated"]);
        });
        return true;
    }
}

module.exports = { doStuff, Manager };
