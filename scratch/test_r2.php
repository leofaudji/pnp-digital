<?php
require_once __DIR__ . '/../src/Core/Env.php';
require_once __DIR__ . '/../src/Core/Storage.php';

Env::load(__DIR__ . '/../.env');

// Mock env if needed or just use current ones
$config = [
    'key' => env('R2_ACCESS_KEY_ID'),
    'secret' => env('R2_SECRET_ACCESS_KEY'),
    'bucket' => env('R2_BUCKET_NAME'),
    'endpoint' => env('R2_ENDPOINT'),
    'region' => env('R2_REGION', 'auto'),
];

echo "Testing R2 Upload...\n";
echo "Endpoint: " . $config['endpoint'] . "\n";
echo "Bucket: " . $config['bucket'] . "\n";

$testContent = "Hello R2 " . time();
$testPath = "test_connection.txt";
$contentType = "text/plain";

$ch = curl_init();
// Manually do what performR2Upload does to see output
$parsedUrl = parse_url($config['endpoint']);
$host = $parsedUrl['host'];
$baseUrl = $parsedUrl['scheme'] . '://' . $host;
$endpoint = $baseUrl . '/' . $config['bucket'] . '/' . $testPath;

$amzDate = gmdate('Ymd\THis\Z');
$dateStamp = gmdate('Ymd');
$payloadHash = hash('sha256', $testContent);

$canonicalUri = '/' . $config['bucket'] . '/' . $testPath;
$canonicalHeaders = "content-type:" . $contentType . "\n" . "host:" . $host . "\n" . "x-amz-content-sha256:" . $payloadHash . "\n" . "x-amz-date:" . $amzDate . "\n";
$signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

$canonicalRequest = "PUT\n" . $canonicalUri . "\n\n" . $canonicalHeaders . "\n" . $signedHeaders . "\n" . $payloadHash;
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
    'x-amz-content-sha256: ' . $payloadHash,
    'Content-Type: ' . $contentType,
];

curl_setopt($ch, CURLOPT_URL, $endpoint);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, $testContent);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_HEADER, true); // Include headers in output

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Curl Error: $curlError\n";
echo "Response:\n$response\n";
