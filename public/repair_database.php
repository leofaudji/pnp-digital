<?php
// Database Repair Script
// This script will fix missing columns and tables on production.

require_once __DIR__ . '/../src/Core/Env.php';
require_once __DIR__ . '/../src/Core/Database.php';

if (!Env::load(__DIR__ . '/../.env')) {
    die("Error: .env file not found.");
}

$db = Database::getInstance();
$conn = $db->getConnection();

echo "<h1>Database Repair Utility</h1>";

try {
    // 1. Check/Add role_id to users
    echo "<li>Checking 'users' table columns... ";
    $cols = $conn->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('role_id', $cols)) {
        $conn->exec("ALTER TABLE users ADD COLUMN role_id INT NOT NULL DEFAULT 4 AFTER password");
        echo "<b>Added role_id.</b> ";
    }
    
    if (!in_array('phone', $cols)) {
        $conn->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER full_name");
        echo "<b>Added phone.</b> ";
    }
    echo "DONE.</li>";

    // 2. Create roles table if not exists
    echo "<li>Creating 'roles' table... ";
    $conn->exec("CREATE TABLE IF NOT EXISTS `roles` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(50) NOT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    
    // Populate roles if empty
    $count = $conn->query("SELECT COUNT(*) FROM roles")->fetchColumn();
    if ($count == 0) {
        $conn->exec("INSERT INTO `roles` (`id`, `name`) VALUES (1, 'Admin'), (2, 'Bendahara'), (3, 'Satpam'), (4, 'Warga')");
        echo "<b>Populated roles.</b> ";
    }
    echo "DONE.</li>";

    // 3. Create warga table if not exists
    echo "<li>Creating 'warga' table... ";
    $conn->exec("CREATE TABLE IF NOT EXISTS `warga` (
        `user_id` int(11) NOT NULL,
        `no_rumah` varchar(20) DEFAULT NULL,
        `wa_number` varchar(20) DEFAULT NULL,
        `no_kk` varchar(20) DEFAULT NULL,
        `is_kk_head` tinyint(1) DEFAULT 0,
        `tgl_lahir` date DEFAULT NULL,
        `jenis_kelamin` varchar(10) DEFAULT NULL,
        `pekerjaan` varchar(100) DEFAULT NULL,
        PRIMARY KEY (`user_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "DONE.</li>";

    // 4. Create remember_tokens table if not exists
    echo "<li>Creating 'remember_tokens' table... ";
    $conn->exec("CREATE TABLE IF NOT EXISTS remember_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "DONE.</li>";

    echo "<h2 style='color:green'>Database Repair Successful!</h2>";
    echo "<p>Please delete this file (public/repair_database.php) for security.</p>";

} catch (Exception $e) {
    echo "<h2 style='color:red'>Error during repair:</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
