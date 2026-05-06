<?php
require_once __DIR__ . '/../src/Core/Env.php';
require_once __DIR__ . '/../src/Core/Storage.php';

Env::load(__DIR__ . '/../.env');

$config = [
    'key' => env('R2_ACCESS_KEY_ID'),
    'secret' => env('R2_SECRET_ACCESS_KEY'),
    'bucket' => env('R2_BUCKET_NAME'),
    'endpoint' => env('R2_ENDPOINT'),
    'region' => env('R2_REGION', 'auto'),
];

$filePath = "patrol/1778041777_3dcc664f.jpeg";
echo "Checking file: $filePath\n";

$ch = curl_init();
$parsedUrl = parse_url($config['endpoint']);
$host = $parsedUrl['host'];
$baseUrl = $parsedUrl['scheme'] . '://' . $host;
$endpoint = $baseUrl . '/' . $config['bucket'] . '/' . $filePath;

$amzDate = gmdate('Ymd\THis\Z');
$dateStamp = gmdate('Ymd');

$canonicalUri = '/' . $config['bucket'] . '/' . $filePath;
$canonicalHeaders = "host:" . $host . "\n" . "x-amz-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n" . "x-amz-date:" . $amzDate . "\n";
$signedHeaders = "host;x-amz-content-sha256;x-amz-date";

$canonicalRequest = "GET\n" . $canonicalUri . "\n\n" . $canonicalHeaders . "\n" . $signedHeaders . "\n" . "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
$credentialScope = $dateStamp . "/" . $config['region'] . "/s3/aws4_request";
$stringToSign = "AWS4-HMAC-SHA256\n" . $amzDate . "\n" . $credentialScope . "\n" . hash('sha256', $canonicalRequest);

$kDate = hash_hmac('sha256', $dateStamp, "AWS4" . $config['secret'], true);
$kRegion = hash_hmac('sha256', $config['region'], $kDate, true);
$kService = hash_hmac('sha256', "s3", $kRegion, true);
$kSigning = hash_hmac('sha256', "aws4_request", $kService, true);
$signature = hash_hmac('sha256', $stringToSign, $kSigning);

$authorizationHeader = "AWS4-HMAC-SHA256 Credential=" . $config['key'] . "/" . $credentialScope . ", SignedHeaders=" . $signedHeaders . ", Signature=" . $signature;

$headers = [
    'Authorization: ' . $authorizationHeader,
    'x-amz-date: ' . $amzDate,
    'x-amz-content-sha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
];

curl_setopt($ch, CURLOPT_URL, $endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response Header:\n" . substr($response, 0, strpos($response, "\r\n\r\n")) . "\n";
