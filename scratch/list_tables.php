<?php
require_once __DIR__ . '/src/Core/Database.php';
$db = Database::getInstance();
$stmt = $db->query("SHOW TABLES");
foreach($stmt->fetchAll() as $row) {
    echo array_values($row)[0] . "\n";
}
