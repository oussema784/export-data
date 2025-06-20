const fs = require('fs/promises');
const mysql = require('mysql2/promise');
const path = require('path');

async function exportDatabaseTables() {
    // Use existing export directory
    const exportDir = path.join(__dirname, 'database_export');
    console.log(`Using export directory: ${exportDir}`);

    // MySQL connection
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        // Read table order
        const tableOrder = await fs.readFile(path.join(__dirname, 'table_order.txt'), 'utf-8');
        const tables = tableOrder.split('\n')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        console.log(`Exporting ${tables.length} tables...`);

        // Export each table
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            const paddedIndex = String(i + 1).padStart(3, '0');
            const fileName = `${paddedIndex}_${table}.json`;
            const filePath = path.join(exportDir, fileName);

            try {
                const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
                await fs.writeFile(filePath, JSON.stringify(rows, null, 2));
                console.log(`✓ Exported ${rows.length} rows to ${fileName}`);
            } catch (error) {
                console.error(`✗ Error exporting ${table}:`, error.message);
            }
        }
    } finally {
        await connection.end();
        console.log('Database connection closed');
    }
}

// Only execute if run directly
if (require.main === module) {
    exportDatabaseTables().catch(err => {
        console.error('Export failed:', err);
        process.exit(1);
    });
}

module.exports = { exportDatabaseTables };