-- 更新所有客服的最大并发聊天数为 100
UPDATE customer_services 
SET max_concurrent_chats = 100, updated_at = NOW()
WHERE max_concurrent_chats < 100;

-- 查询更新后的结果
SELECT id, username, max_concurrent_chats, current_chats 
FROM customer_services;

