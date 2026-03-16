<?php

class CCTVController extends BaseController
{
    public function index()
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM cctv_channels ORDER BY name ASC");
        $this->json($stmt->fetchAll());
    }

    public function store()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['name', 'stream_url']);

        $db = Database::getInstance();

        try {
            $db->query(
                "INSERT INTO cctv_channels (name, stream_url, location, status, use_proxy) VALUES (?, ?, ?, ?, ?)",
                [$data['name'], $data['stream_url'], $data['location'] ?? '', 'ONLINE', $data['use_proxy'] ?? 0]
            );
            $this->json(['success' => true]);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['id', 'name', 'stream_url']);

        $db = Database::getInstance();

        try {
            $db->query(
                "UPDATE cctv_channels SET name = ?, stream_url = ?, location = ?, use_proxy = ? WHERE id = ?",
                [$data['name'], $data['stream_url'], $data['location'] ?? '', $data['use_proxy'] ?? 0, $data['id']]
            );
            $this->json(['success' => true]);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }

    public function delete()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $id = $_GET['id'] ?? null;
        if (!$id)
            $this->json(['error' => 'ID required'], 400);

        $db = Database::getInstance();
        $db->query("DELETE FROM cctv_channels WHERE id = ?", [$id]);
        $this->json(['success' => true]);
    }

    public function proxy()
    {
        $url = $_GET['url'] ?? '';
        if (!$url) {
            http_response_code(400);
            echo "URL required";
            exit;
        }

        // Simple validation
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            http_response_code(400);
            echo "Invalid URL";
            exit;
        }

        // Fetch content
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        // Emulate Browser Headers
        $headers = [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer: ' . parse_url($url, PHP_URL_SCHEME) . '://' . parse_url($url, PHP_URL_HOST) . '/',
            'Origin: ' . parse_url($url, PHP_URL_SCHEME) . '://' . parse_url($url, PHP_URL_HOST),
            'Accept: */*'
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $content = curl_exec($ch);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            http_response_code($httpCode);
            header("Content-Type: application/json");
            echo json_encode(['error' => "Proxy Error: Upstream returned $httpCode", 'url' => $url]);
            exit;
        }

        header("Content-Type: $contentType");
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, OPTIONS");

        // Handle M3U8 Rewriting
        if (strpos($contentType, 'mpegurl') !== false || strpos($url, '.m3u8') !== false) {
            $baseUrl = dirname($url);

            // Normalize content to lines
            $lines = preg_split('/\r\n|\r|\n/', $content);
            $newContent = [];

            // Get current API base URL
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];

            // Smartly detect base path
            $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
            $scriptDir = $scriptDir === '/' || $scriptDir === '\\' ? '' : $scriptDir;

            // Use BASE_PATH constant if available, otherwise deduce
            $basePath = defined('BASE_PATH') ? BASE_PATH : str_replace('/public', '', $scriptDir);

            // Use protocol-relative URL (//example.com/...) to support both HTTP and HTTPS automatically
            // This prevents Mixed Content errors when behind a reverse proxy
            $proxyBase = "//" . $host . $basePath . "/api/cctv/proxy?url=";

            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line))
                    continue;

                if ($line[0] !== '#') {
                    // It's a URL/path
                    if (filter_var($line, FILTER_VALIDATE_URL)) {
                        // Absolute URL
                        $newContent[] = $proxyBase . urlencode($line);
                    } else {
                        // Relative path
                        $absUrl = $baseUrl . '/' . $line;
                        $newContent[] = $proxyBase . urlencode($absUrl);
                    }
                } else {
                    $newContent[] = $line;
                }
            }
            echo implode("\n", $newContent);
        } else {
            echo $content;
        }
    }
}
