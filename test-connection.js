import mysql from 'mysql2/promise';
import { jest } from '@jest/globals';

describe('MySQL Database Connection', () => {
    let connection;

    beforeAll(async () => {
        // Mock console.error to test error cases
        jest.spyOn(console, 'error').mockImplementation(() => {});

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
    });

    afterAll(async () => {
        if (connection) await connection.end();
        jest.restoreAllMocks();
    });

    test('should successfully connect to MySQL', async () => {
        const [rows] = await connection.query('SELECT 1 + 1 AS result');
        expect(rows[0].result).toBe(2);
    });

    test('should have access to the target database', async () => {
        const [rows] = await connection.query('SELECT DATABASE() AS db');
        expect(rows[0].db).toBe(process.env.DB_NAME);
    });

    test('should fail with invalid credentials', async () => {
        const badConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: 'invalid_user',
            password: 'wrong_password'
        }).catch(err => err);

        expect(badConnection instanceof Error).toBe(true);
    });
});