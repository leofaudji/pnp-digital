<?php
require_once __DIR__ . '/../src/Core/Env.php';
require_once __DIR__ . '/../src/Core/Cache.php';
require_once __DIR__ . '/../src/Core/Database.php';

Env::load(__DIR__ . '/../.env');

echo "Flushing Redis Cache...\n";
try {
    $cache = Cache::getInstance();
    $cache->flush();
    echo "Success! All cache cleared.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
