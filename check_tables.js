const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Namya@123',
    database: 'fifa_playerstats'
});

db.connect(() => {
    console.log('Checking playerpositions table structure...');
    db.query('DESCRIBE playerpositions', (err, results) => {
        if (!err) {
            console.log('PLAYERPOSITIONS columns:');
            results.forEach(col => {
                console.log(` - ${col.Field} (${col.Type})`);
            });
        } else {
            console.log('Error:', err.message);
        }
        
        console.log('\nChecking positions table structure...');
        db.query('DESCRIBE positions', (err2, results2) => {
            if (!err2) {
                console.log('POSITIONS columns:');
                results2.forEach(col => {
                    console.log(` - ${col.Field} (${col.Type})`);
                });
            } else {
                console.log('Error:', err2.message);
            }
            
            db.end();
        });
    });
});
