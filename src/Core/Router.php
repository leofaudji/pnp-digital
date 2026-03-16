<?php

class Router
{
    private $routes = [];

    public function add($method, $path, $callback)
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'callback' => $callback
        ];
    }

    public function run()
    {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Detect Base Path (e.g. /app-rt if running in subdirectory)
        // Detect Base Path dynamic
        $scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME']);
        $baseDir = str_replace(['/public/index.php', '/index.php'], '', $scriptName);

        // Ensure valid root
        if ($baseDir === '.' || $baseDir === '/') {
            $baseDir = '';
        }

        // Trim trailing slash
        $baseDir = rtrim($baseDir, '/');

        // Strip baseDir from URI if it exists at the start
        if ($baseDir !== '' && strpos($uri, $baseDir) === 0) {
            $uri = substr($uri, strlen($baseDir));
        }

        // Ensure URI starts with /
        if ($uri === '' || $uri === false) {
            $uri = '/';
        }
        if ($uri[0] !== '/') {
            $uri = '/' . $uri;
        }

        // Remove trailing slash if not root
        if ($uri !== '/' && substr($uri, -1) === '/') {
            $uri = rtrim($uri, '/');
        }

        // Fix for when public is in the path but not stripped by baseDir logic
        if (strpos($uri, '/public/') === 0) {
            $uri = substr($uri, 7);
        }

        if ($uri === '' || $uri[0] !== '/') {
            $uri = '/' . $uri;
        }

        // Store base path for use in views
        define('BASE_PATH', $baseDir);

        $method = $_SERVER['REQUEST_METHOD'];

        foreach ($this->routes as $route) {
            // Simple string match for now, can be improved with regex
            if ($route['method'] === $method && $route['path'] === $uri) {
                // If callback is array [Controller, Method]
                if (is_array($route['callback'])) {
                    $controller = new $route['callback'][0]();
                    $methodName = $route['callback'][1];
                    return $controller->$methodName();
                }
                // If closure
                if (is_callable($route['callback'])) {
                    return call_user_func($route['callback']);
                }
            }
        }

        // 404
        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
    }
}
