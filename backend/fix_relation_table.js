const mysql = require('mysql2/promise');
require('dotenv').config();

// Extract database configuration from DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL is not defined in .env');
    process.exit(1);
}

// Parse URL to get connection details
// mysql://root:password@localhost:3306/db_name
const regex = /mysql:\/\/(.*):(.*)@(.*):(\d+)\/(.*)/;
const match = dbUrl.match(regex);

if (!match) {
    console.error('Invalid DATABASE_URL format');
    process.exit(1);
}

const [_, user, password, host, port, database] = match;

async function fixTableRelation() {
    let connection;
    try {
        console.log('Connecting to database:', database, 'on', host);
        connection = await mysql.createConnection({
            host,
            user,
            password: password || '', // Handle empty password
            database,
            port: parseInt(port)
        });

        console.log('Connected!');

        // 1. Rename _subjecttouser TO _SubjectToUser (Correct Prisma Default)
        // Check if lowercase table exists first
        try {
            const [rows] = await connection.execute("SHOW TABLES LIKE '_subjecttouser'");
            if (rows.length > 0) {
                console.log('Found lowercase table _subjecttouser. Renaming to _SubjectToUser...');
                await connection.execute("RENAME TABLE _subjecttouser TO _SubjectToUser");
                console.log('Success: Table renamed to _SubjectToUser');
            } else {
                console.log('Table _subjecttouser not found. Checking if _SubjectToUser exists...');
                const [rows2] = await connection.execute("SHOW TABLES LIKE '_SubjectToUser'");
                if (rows2.length > 0) {
                    console.log('Table _SubjectToUser already exists. No action needed.');
                } else {
                    console.error('CRITICAL: Neither _subjecttouser nor _SubjectToUser table found!');
                }
            }
        } catch (err) {
            console.error('Error handling table rename:', err.message);
        }

    } catch (error) {
        console.error('Database connection failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

fixTableRelation();
