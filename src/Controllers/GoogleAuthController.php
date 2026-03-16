<?php

class GoogleAuthController extends BaseController
{
    private function getConfig()
    {
        return require __DIR__ . '/../../config/google.php';
    }

    /**
     * Redirects the user to Google's OAuth 2.0 authorization URL.
     */
    public function redirect()
    {
        $config = $this->getConfig();

        $state = bin2hex(random_bytes(16));
        Auth::startSession();
        $_SESSION['oauth_state'] = $state;

        $params = http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => $config['redirect_uri'],
            'response_type' => 'code',
            'scope' => $config['scope'],
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'select_account',
        ]);

        header('Location: ' . $config['auth_url'] . '?' . $params);
        exit;
    }

    /**
     * Handles the OAuth callback from Google.
     * Links Google account to existing user by email, or returns error.
     */
    public function callback()
    {
        $config = $this->getConfig();
        Auth::startSession();

        // Validate state to prevent CSRF
        $returnedState = $_GET['state'] ?? '';
        $sessionState = $_SESSION['oauth_state'] ?? '';
        if (!$returnedState || $returnedState !== $sessionState) {
            $this->redirectWithError('State mismatch. Harap coba login kembali.');
            return;
        }

        $code = $_GET['code'] ?? '';
        if (!$code) {
            $this->redirectWithError('Kode otorisasi tidak ditemukan.');
            return;
        }

        // Exchange code for access token
        $tokenData = $this->exchangeCodeForToken($config, $code);
        if (!isset($tokenData['access_token'])) {
            $this->redirectWithError('Gagal mendapatkan token dari Google.');
            return;
        }

        // Get user info from Google
        $googleUser = $this->getGoogleUserInfo($tokenData['access_token']);
        if (!isset($googleUser['email'])) {
            $this->redirectWithError('Gagal mendapatkan informasi akun Google.');
            return;
        }

        // Find user in our database by google_id
        $db = Database::getInstance();

        $stmt = $db->query("SELECT * FROM users WHERE google_id = ?", [$googleUser['sub']]);
        $user = $stmt->fetch();

        if (!$user) {
            // Store Google info in session so admin can link the account
            $_SESSION['pending_google'] = [
                'google_id' => $googleUser['sub'],
                'google_email' => $googleUser['email'],
                'name' => $googleUser['name'] ?? '',
            ];

            $this->redirectWithError(
                'Akun Google (' . $googleUser['email'] . ') belum terhubung ke akun manapun. ' .
                'Silakan login dengan username & password terlebih dahulu, lalu hubungkan akun Google di menu Profil.'
            );
            return;
        }

        // Log the user in
        Auth::login($user);
        Auth::setRememberMe($user['id']); // Persistent session 30 days

        // Redirect to dashboard via SPA hash
        header('Location: ' . BASE_PATH . '/#/dashboard');
        exit;
    }

    /**
     * Redirects an already-logged-in user to Google for account linking.
     */
    public function linkRedirect()
    {
        $userId = Auth::user();
        if (!$userId) {
            $this->redirectWithError('Anda harus login terlebih dahulu untuk menghubungkan akun Google.');
            return;
        }

        $config = $this->getConfig();
        $state = bin2hex(random_bytes(16));
        Auth::startSession();
        $_SESSION['oauth_state'] = $state;
        $_SESSION['oauth_action'] = 'link'; // Mark this as link, not login
        $_SESSION['oauth_user_id'] = $userId;

        $params = http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => str_replace('/callback', '/link-callback', $config['redirect_uri']),
            'response_type' => 'code',
            'scope' => $config['scope'],
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'select_account',
        ]);

        header('Location: ' . $config['auth_url'] . '?' . $params);
        exit;
    }

    /**
     * Handles the Google callback for account linking.
     */
    public function linkCallback()
    {
        $config = $this->getConfig();
        Auth::startSession();

        $returnedState = $_GET['state'] ?? '';
        $sessionState = $_SESSION['oauth_state'] ?? '';
        $userId = $_SESSION['oauth_user_id'] ?? null;

        if (!$userId || $returnedState !== $sessionState || ($_SESSION['oauth_action'] ?? '') !== 'link') {
            $this->redirectWithError('Sesi tidak valid. Harap coba lagi.');
            return;
        }

        $code = $_GET['code'] ?? '';
        if (!$code) {
            $this->redirectWithError('Kode otorisasi tidak ditemukan.');
            return;
        }

        $config['redirect_uri'] = str_replace('/callback', '/link-callback', $config['redirect_uri']);
        $tokenData = $this->exchangeCodeForToken($config, $code);
        if (!isset($tokenData['access_token'])) {
            $this->redirectWithError('Gagal mendapatkan token dari Google.');
            return;
        }

        $googleUser = $this->getGoogleUserInfo($tokenData['access_token']);
        if (!isset($googleUser['email'])) {
            $this->redirectWithError('Gagal mendapatkan informasi akun Google.');
            return;
        }

        // Check if this google_id is already linked to another account
        $db = Database::getInstance();
        $stmt = $db->query("SELECT id FROM users WHERE google_id = ? AND id != ?", [$googleUser['sub'], $userId]);
        if ($stmt->fetch()) {
            $this->redirectWithError('Akun Google ini sudah terhubung ke akun lain.');
            return;
        }

        // Link the Google account
        $db->query("UPDATE users SET google_id = ?, google_email = ? WHERE id = ?", [
            $googleUser['sub'],
            $googleUser['email'],
            $userId
        ]);

        // Clear link action from session
        unset($_SESSION['oauth_action'], $_SESSION['oauth_user_id'], $_SESSION['oauth_state']);

        // Store success flag in session so the SPA can pick it up and show a toast
        $_SESSION['google_linked'] = true;

        $basePath = defined('BASE_PATH') ? BASE_PATH : '/app-rt';
        // Redirect to the SPA entry point — JS will pick up the session flag via /api/me
        header('Location: ' . $basePath . '/?google_linked=1');
        exit;
    }

    /**
     * Unlink Google account from current user.
     */
    public function unlink()
    {
        $userId = Auth::user();
        if (!$userId) {
            $this->json(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $db = Database::getInstance();
        $db->query("UPDATE users SET google_id = NULL, google_email = NULL WHERE id = ?", [$userId]);
        $this->json(['success' => true, 'message' => 'Akun Google berhasil diputuskan.']);
    }

    private function exchangeCodeForToken(array $config, string $code): array
    {
        $postData = http_build_query([
            'code' => $code,
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $config['redirect_uri'],
            'grant_type' => 'authorization_code',
        ]);

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => $postData,
                'timeout' => 10,
            ],
            'ssl' => ['verify_peer' => true],
        ]);

        $response = @file_get_contents($config['token_url'], false, $context);
        if (!$response)
            return [];
        return json_decode($response, true) ?? [];
    }

    private function getGoogleUserInfo(string $accessToken): array
    {
        $config = $this->getConfig();
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "Authorization: Bearer $accessToken\r\n",
                'timeout' => 10,
            ],
        ]);
        $response = @file_get_contents($config['userinfo_url'], false, $context);
        if (!$response)
            return [];
        return json_decode($response, true) ?? [];
    }

    private function redirectWithError(string $message)
    {
        $encoded = urlencode($message);
        // Redirect to SPA login page with error param
        $basePath = defined('BASE_PATH') ? BASE_PATH : '/app-rt';
        header('Location: ' . $basePath . '/#/login?oauth_error=' . $encoded);
        exit;
    }
}
