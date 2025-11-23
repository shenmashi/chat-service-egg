const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'custom_service'
    });
    
    // 更新所有客服的 max_concurrent_chats 为 100
    const [updateResult] = await conn.query(`
      UPDATE customer_services 
      SET max_concurrent_chats = 100, updated_at = NOW()
      WHERE max_concurrent_chats < 100
    `);
    
    console.log('✅ 更新完成，受影响行数:', updateResult.affectedRows);
    
    // 查询更新后的数据
    const [rows] = await conn.query(`
      SELECT id, username, max_concurrent_chats, current_chats 
      FROM customer_services
    `);
    
    console.log('\n✅ 更新后的客服信息:');
    console.table(rows);
    
    await conn.end();
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    process.exit(1);
  }
})();

