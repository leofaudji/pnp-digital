<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Debug Info</h1>";
echo "PHP Version: " . PHP_VERSION . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Script Name: " . $_SERVER['SCRIPT_NAME'] . "<br>";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "<br>";
// Autoload class for Env
spl_autoload_register(function ($class) {
    if (file_exists(__DIR__ . '/../src/Core/' . $class . '.php')) {
        require_once __DIR__ . '/../src/Core/' . $class . '.php';
    }
});

echo "Current Directory: " . __DIR__ . "\n";
echo "Base Path: " . realpath(__DIR__ . '/..') . "\n";

$envPath = __DIR__ . '/../.env';
echo "Checking .env at: " . $envPath . "\n";
echo "File Exists: " . (file_exists($envPath) ? 'YES' : 'NO') . "\n";

if (file_exists($envPath)) {
    Env::load($envPath);
    echo "Value of APP_VERSION: " . env('APP_VERSION', 'NOT SET') . "\n";
}

echo "\n--- Database Check ---\n";
try {
    require_once __DIR__ . '/../src/Core/Database.php';
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $roles = $conn->query("SELECT COUNT(*) FROM roles")->fetchColumn();
    echo "Roles count: " . $roles . "\n";
    
    $users = $conn->query("SELECT id, username, role_id FROM users LIMIT 1")->fetch();
    echo "Sample User: " . $users['username'] . " (Role ID: " . $users['role_id'] . ")\n";
} catch (Exception $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}

echo "\n--- File Status ---\n";
$filesToCheck = [
    'CHANGELOG.md' => __DIR__ . '/../CHANGELOG.md',
    'menu.json' => __DIR__ . '/assets/json/menu.json',
    'sidebar.js' => __DIR__ . '/assets/js/sidebar.js',
    'app.js' => __DIR__ . '/assets/js/app.js',
    'changelog.js' => __DIR__ . '/assets/js/modules/changelog.js'
];

foreach ($filesToCheck as $name => $path) {
    echo "$name: " . (file_exists($path) ? "EXISTS (" . date("Y-m-d H:i:s", filemtime($path)) . ", " . filesize($path) . " bytes)" : "MISSING") . "\n";
}
echo "SUCCESS: Core directory exists.<br>";
    if (file_exists($coreDir . 'Env.php')) {
        echo "SUCCESS: Env.php exists.<br>";
    } else {
        echo "FAILURE: Env.php NOT found.<br>";
    echo "FAILURE: Core directory NOT found.<br>";
}
