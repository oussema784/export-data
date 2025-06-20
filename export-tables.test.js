const { exportDatabaseTables } = require('./export-tables');
const fs = require('fs/promises');
const mysql = require('mysql2/promise');
const path = require('path');

// Mock the modules
jest.mock('fs/promises', () => ({
    readFile: jest.fn(() => Promise.resolve('users\nproducts\norders')),
    writeFile: jest.fn(() => Promise.resolve())
}));

jest.mock('mysql2/promise', () => ({
    createConnection: jest.fn(() => Promise.resolve({
        query: jest.fn(),
        end: jest.fn()
    }))
}));

describe('MySQL Table Export', () => {
    let mockConnection;

    beforeEach(() => {
        mockConnection = {
            query: jest.fn(),
            end: jest.fn()
        };
        mysql.createConnection.mockResolvedValue(mockConnection);
        fs.readFile.mockClear();
        fs.writeFile.mockClear();
    });

    test('should export tables to existing directory', async () => {
        mockConnection.query
            .mockResolvedValueOnce([[{ id: 1 }]])
            .mockResolvedValueOnce([[{ id: 2 }]])
            .mockResolvedValueOnce([[{ id: 3 }]]);

        await exportDatabaseTables();

        // Normalize paths for cross-platform testing
        const calls = fs.writeFile.mock.calls.map(call => [
            call[0].replace(/\\/g, '/'), // Convert backslashes to forward slashes
            call[1]
        ]);

        expect(calls.some(call =>
            call[0].includes('database_export/001_users.json')
        )).toBe(true);
    });

    test('should export tables with proper formatting', async () => {
        mockConnection.query
            .mockResolvedValueOnce([[{ id: 1, name: 'John' }]])
            .mockResolvedValueOnce([[{ id: 101, name: 'Phone' }]]);

        await exportDatabaseTables();

        // Check for any call that matches our pattern
        const found = fs.writeFile.mock.calls.some(call =>
            call[0].replace(/\\/g, '/').includes('001_users.json') &&
            call[1] === JSON.stringify([{ id: 1, name: 'John' }], null, 2)
        );

        expect(found).toBe(true);
    });
});