<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Debug Info</h1>";
echo "PHP Version: " . PHP_VERSION . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Script Name: " . $_SERVER['SCRIPT_NAME'] . "<br>";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "<br>";
echo "Dirname __FILE__: " . dirname(__FILE__) . "<br>";

$envPath = dirname(__FILE__) . '/../.env';
echo "Checking .env at: " . $envPath . "<br>";
if (file_exists($envPath)) {
    echo "SUCCESS: .env file exists.<br>";
    if (is_readable($envPath)) {
        echo "SUCCESS: .env file is readable.<br>";
    } else {
        echo "FAILURE: .env file is NOT readable.<br>";
    }
} else {
    echo "FAILURE: .env file does NOT exist at that path.<br>";
}

echo "<h2>Autoloader Test</h2>";
$coreDir = dirname(__FILE__) . '/../src/Core/';
echo "Checking Core Dir: " . $coreDir . "<br>";
if (is_dir($coreDir)) {
    echo "SUCCESS: Core directory exists.<br>";
    if (file_exists($coreDir . 'Env.php')) {
        echo "SUCCESS: Env.php exists.<br>";
    } else {
        echo "FAILURE: Env.php NOT found.<br>";
    }
} else {
    echo "FAILURE: Core directory NOT found.<br>";
}
