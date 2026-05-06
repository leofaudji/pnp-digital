<?php

/**
 * Storage Core Class
 * Handles file uploads to local or Cloudflare R2 (S3 Compatible)
 */
class Storage
{
    private static $config = null;

    private static function init()
    {
        if (self::$config !== null)
            return;

        self::$config = [
            'driver' => env('STORAGE_DRIVER', 'local'),
            'r2' => [
                'key' => env('R2_ACCESS_KEY_ID'),
                'secret' => env('R2_SECRET_ACCESS_KEY'),
                'bucket' => env('R2_BUCKET_NAME'),
                'region' => env('R2_REGION', 'auto'),
                'endpoint' => env('R2_ENDPOINT'), // https://<accountid>.r2.cloudflarestorage.com
                'public_url' => env('R2_PUBLIC_URL'), // https://pub-<hash>.r2.dev or custom domain
            ],
            'local' => [
                'path' => __DIR__ . '/../../public/uploads/',
                'url' => env('APP_URL', '') . '/uploads/'
            ]
        ];
    }

    /**
     * Upload a file to storage
     * @param array $file $_FILES element
     * @param string $folder Target folder
     * @return string|bool URL of the uploaded file or false on failure
     */
    public static function upload($file, $folder = 'general')
    {
        self::init();

        $filename = time() . '_' . bin2hex(random_bytes(4)) . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
        $targetPath = trim($folder, '/') . '/' . $filename;

        if (self::$config['driver'] === 'r2') {
            return self::uploadToR2($file['tmp_name'], $targetPath, $file['type']);
        }

        return self::uploadToLocal($file['tmp_name'], $targetPath);
    }

    /**
     * Upload base64 image data
     */
    public static function uploadBase64($base64Data, $folder = 'general')
    {
        self::init();

        if (!preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type_match)) {
            return false;
        }

        $imageExt = strtolower($type_match[1]);
        $contentType = 'image/' . $imageExt;
        $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        $decodedData = base64_decode($base64Data);

        if (!$decodedData)
            return false;

        $filename = time() . '_' . bin2hex(random_bytes(4)) . '.' . $imageExt;
        $targetPath = trim($folder, '/') . '/' . $filename;

        if (self::$config['driver'] === 'r2') {
            return self::uploadToR2Raw($decodedData, $targetPath, $contentType);
        }

        return self::uploadToLocalRaw($decodedData, $targetPath);
    }

    /**
     * Get the public URL for a stored file
     * @param string $path Path or URL
     * @return string
     */
    public static function url($path)
    {
        if (empty($path))
            return '';

        self::init();
        $r2Config = self::$config['r2'];
        $publicBase = rtrim($r2Config['public_url'], '/');

        // If it's already a full R2 public URL, extract the relative path to re-sign it
        if (strpos($path, $publicBase) === 0) {
            $path = ltrim(substr($path, strlen($publicBase)), '/');
        }

        if (strpos($path, 'http') === 0)
            return $path;

        $driver = self::$config['driver'];
        if ($driver === 'r2') {
            return self::getSignedUrl($path);
        }

        return self::$config['local']['url'] . ltrim($path, '/');
    }

    /**
     * Generate a Pre-signed URL for R2 (S3 V4)
     */
    public static function getSignedUrl($path, $expires = 3600)
    {
        $r2 = self::$config['r2'];
        $bucket = $r2['bucket'];
        $parsedUrl = parse_url($r2['endpoint']);
        $host = $parsedUrl['host'];
        $baseUrl = $parsedUrl['scheme'] . '://' . $host;
        
        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $region = $r2['region'];
        $credentialScope = $dateStamp . "/" . $region . "/s3/aws4_request";
        
        $canonicalUri = '/' . $bucket . '/' . ltrim($path, '/');
        $endpoint = $baseUrl . $canonicalUri;

        $queryParams = [
            'X-Amz-Algorithm' => 'AWS4-HMAC-SHA256',
            'X-Amz-Credential' => $r2['key'] . '/' . $credentialScope,
            'X-Amz-Date' => $amzDate,
            'X-Amz-Expires' => $expires,
            'X-Amz-SignedHeaders' => 'host'
        ];
        ksort($queryParams);
        $queryStr = http_build_query($queryParams);

        $canonicalHeaders = "host:" . $host . "\n";
        $signedHeaders = "host";
        $payloadHash = "UNSIGNED-PAYLOAD";

        $canonicalRequest = "GET\n" . $canonicalUri . "\n" . $queryStr . "\n" . $canonicalHeaders . "\n" . $signedHeaders . "\n" . $payloadHash;
        $stringToSign = "AWS4-HMAC-SHA256\n" . $amzDate . "\n" . $credentialScope . "\n" . hash('sha256', $canonicalRequest);

        $kDate = hash_hmac('sha256', $dateStamp, "AWS4" . $r2['secret'], true);
        $kRegion = hash_hmac('sha256', $region, $kDate, true);
        $kService = hash_hmac('sha256', "s3", $kRegion, true);
        $kSigning = hash_hmac('sha256', "aws4_request", $kService, true);
        $signature = hash_hmac('sha256', $stringToSign, $kSigning);

        return $endpoint . '?' . $queryStr . '&X-Amz-Signature=' . $signature;
    }

    private static function uploadToLocal($tmpFile, $targetPath)
    {
        $fullPath = self::$config['local']['path'] . $targetPath;
        $dir = dirname($fullPath);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if (move_uploaded_file($tmpFile, $fullPath)) {
            return self::$config['local']['url'] . $targetPath;
        }

        return false;
    }

    private static function uploadToLocalRaw($data, $targetPath)
    {
        $fullPath = self::$config['local']['path'] . $targetPath;
        $dir = dirname($fullPath);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if (file_put_contents($fullPath, $data)) {
            return self::$config['local']['url'] . $targetPath;
        }

        return false;
    }

    /**
     * Simple S3 V4 Signature Upload for R2 (No dependencies needed)
     */
    private static function uploadToR2($tmpFile, $targetPath, $contentType)
    {
        $content = file_get_contents($tmpFile);
        return self::performR2Upload($content, $targetPath, $contentType);
    }

    private static function uploadToR2Raw($content, $targetPath, $contentType)
    {
        return self::performR2Upload($content, $targetPath, $contentType);
    }

    private static function performR2Upload($content, $targetPath, $contentType)
    {
        $r2 = self::$config['r2'];
        $bucket = $r2['bucket'];
        
        $parsedUrl = parse_url($r2['endpoint']);
        $host = $parsedUrl['host'];
        $baseUrl = $parsedUrl['scheme'] . '://' . $host;
        $endpoint = $baseUrl . '/' . $bucket . '/' . $targetPath;

        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');

        $canonicalUri = '/' . $bucket . '/' . $targetPath;
        $canonicalQuerystring = '';
        $canonicalHeaders = "content-type:" . $contentType . "\n" . "host:" . $host . "\n" . "x-amz-content-sha256:" . hash('sha256', $content) . "\n" . "x-amz-date:" . $amzDate . "\n";
        $signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

        $payloadHash = hash('sha256', $content);
        $canonicalRequest = "PUT\n" . $canonicalUri . "\n" . $canonicalQuerystring . "\n" . $canonicalHeaders . "\n" . $signedHeaders . "\n" . $payloadHash;

        $algorithm = "AWS4-HMAC-SHA256";
        $credentialScope = $dateStamp . "/" . $r2['region'] . "/s3/aws4_request";
        $stringToSign = $algorithm . "\n" . $amzDate . "\n" . $credentialScope . "\n" . hash('sha256', $canonicalRequest);

        $kDate = hash_hmac('sha256', $dateStamp, "AWS4" . $r2['secret'], true);
        $kRegion = hash_hmac('sha256', $r2['region'], $kDate, true);
        $kService = hash_hmac('sha256', "s3", $kRegion, true);
        $kSigning = hash_hmac('sha256', "aws4_request", $kService, true);
        $signature = hash_hmac('sha256', $stringToSign, $kSigning);

        $authorizationHeader = $algorithm . " Credential=" . $r2['key'] . "/" . $credentialScope . ", SignedHeaders=" . $signedHeaders . ", Signature=" . $signature;

        $headers = [
            'Authorization: ' . $authorizationHeader,
            'x-amz-date: ' . $amzDate,
            'x-amz-content-sha256: ' . $payloadHash,
            'Content-Type: ' . $contentType,
            'Content-Length: ' . strlen($content)
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode == 200) {
            return $targetPath;
        }

        error_log("[Storage] R2 Upload Failed. HTTP: $httpCode, Error: $curlError, Path: $targetPath");
        return false;
    }
}
