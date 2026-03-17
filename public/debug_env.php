<?php
// Production Debug Script
header('Content-Type: text/plain');

echo "--- System Info ---\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Current File: " . __FILE__ . "\n";
echo "Current Dir: " . __DIR__ . "\n";
echo "Base Path (..): " . realpath(__DIR__ . '/..') . "\n";

// Autoload class for Env
spl_autoload_register(function ($class) {
    if (file_exists(__DIR__ . '/../src/Core/' . $class . '.php')) {
        require_once __DIR__ . '/../src/Core/' . $class . '.php';
    }
});

echo "\n--- Environment Check ---\n";
$envPath = __DIR__ . '/../.env';
echo "Checking .env at: " . $envPath . "\n";
if (file_exists($envPath)) {
    echo "File Exists: YES\n";
    if (class_exists('Env')) {
        Env::load($envPath);
        echo "Value of APP_VERSION in env(): " . (function_exists('env') ? env('APP_VERSION', 'NOT FOUND') : 'env() function missing') . "\n";
    } else {
        echo "Error: Env class not loaded.\n";
    }
} else {
    echo "File Exists: NO\n";
}

echo "\n--- Database Check ---\n";
try {
    if (file_exists(__DIR__ . '/../src/Core/Database.php')) {
        require_once __DIR__ . '/../src/Core/Database.php';
        if (class_exists('Database')) {
            $db = Database::getInstance();
            $conn = $db->getConnection();
            $roles = $conn->query("SELECT COUNT(*) FROM roles")->fetchColumn();
            echo "Roles count: " . $roles . "\n";
            
            $users = $conn->query("SELECT id, username, role_id FROM users LIMIT 1")->fetch(PDO::FETCH_ASSOC);
            if ($users) {
                echo "Sample User: " . $users['username'] . " (Role ID: " . $users['role_id'] . ")\n";
            } else {
                echo "No users found in database.\n";
            }
        }
    } else {
        echo "Database.php MISSING\n";
    }
} catch (Exception $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}

echo "\n--- File Status Check ---\n";
$filesToCheck = [
    'CHANGELOG.md' => __DIR__ . '/../CHANGELOG.md',
    'menu.json' => __DIR__ . '/assets/json/menu.json',
    'sidebar.js' => __DIR__ . '/assets/js/sidebar.js',
    'app.js' => __DIR__ . '/assets/js/app.js',
    'changelog.js' => __DIR__ . '/assets/js/modules/changelog.js',
    'Env.php' => __DIR__ . '/../src/Core/Env.php',
    'Database.php' => __DIR__ . '/../src/Core/Database.php'
];

foreach ($filesToCheck as $name => $path) {
    echo str_pad($name, 15) . ": ";
    if (file_exists($path)) {
        echo "EXISTS (" . date("Y-m-d H:i:s", filemtime($path)) . ", " . filesize($path) . " bytes)\n";
    } else {
        echo "MISSING at " . $path . "\n";
    }
}

echo "\n--- End of Debug ---\n";
