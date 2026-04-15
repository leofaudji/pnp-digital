<?php
require_once __DIR__ . '/src/Core/Database.php';
$db = Database::getInstance();
foreach(['attendance', 'checkpoint_logs'] as $table) {
    echo "Table: $table\n";
    try {
        $stmt = $db->query("SHOW COLUMNS FROM $table");
        foreach($stmt->fetchAll() as $col) {
            echo " - {$col['Field']} ({$col['Type']})\n";
        }
    } catch (Exception $e) {
        echo " Error: " . $e->getMessage() . "\n";
    }
}
