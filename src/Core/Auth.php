<?php

class Auth
{
    public static function startSession()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'samesite' => 'Lax']);
            session_start();
        }
    }

    public static function generateCsrfToken()
    {
        self::startSession();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function verifyCsrfToken($token)
    {
        self::startSession();
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }

    public static function login($user)
    {
        self::startSession();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role_id'] = $user['role_id'];
        session_regenerate_id(true);
    }

    public static function logout()
    {
        self::startSession();
        session_destroy();
    }

    public static function user()
    {
        self::startSession();
        if (isset($_SESSION['user_id'])) {
            return $_SESSION['user_id'];
        }
        // Try remember-me cookie
        return self::loginFromCookie();
    }

    public static function role()
    {
        self::startSession();
        return isset($_SESSION['role_id']) ? $_SESSION['role_id'] : null;
    }

    /**
     * Set a secure 30-day remember-me cookie.
     */
    public static function setRememberMe(int $userId)
    {
        $token = bin2hex(random_bytes(32));
        $hash = hash('sha256', $token);
        $expiry = time() + (30 * 24 * 3600); // 30 days

        // Persist token in DB
        try {
            $db = Database::getInstance();
            // Ensure table exists
            $db->query("CREATE TABLE IF NOT EXISTS remember_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");
            // Remove old tokens for that user
            $db->query("DELETE FROM remember_tokens WHERE user_id = ?", [$userId]);
            $db->query("INSERT INTO remember_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)", [
                $userId,
                $hash,
                date('Y-m-d H:i:s', $expiry),
            ]);
        } catch (Exception $e) {
            return;
        }

        // Store selector:token in cookie
        setcookie('remember_me', $userId . ':' . $token, [
            'expires' => $expiry,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    /**
     * Attempt to log in using remember-me cookie.
     */
    public static function loginFromCookie()
    {
        if (!isset($_COOKIE['remember_me']))
            return null;
        $parts = explode(':', $_COOKIE['remember_me'], 2);
        if (count($parts) !== 2)
            return null;

        [$userId, $token] = $parts;
        $hash = hash('sha256', $token);

        try {
            $db = Database::getInstance();
            $stmt = $db->query("SELECT rt.user_id, u.role_id FROM remember_tokens rt
                JOIN users u ON u.id = rt.user_id
                WHERE rt.user_id = ? AND rt.token_hash = ? AND rt.expires_at > NOW()",
                [(int) $userId, $hash]
            );
            $row = $stmt->fetch();

            if ($row) {
                self::startSession();
                $_SESSION['user_id'] = $row['user_id'];
                $_SESSION['role_id'] = $row['role_id'];
                return $row['user_id'];
            }
        } catch (Exception $e) {
        }

        return null;
    }

    /**
     * Clear remember-me cookie and DB token.
     */
    public static function clearRememberMe()
    {
        if (!isset($_COOKIE['remember_me']))
            return;
        $parts = explode(':', $_COOKIE['remember_me'], 2);
        if (count($parts) === 2) {
            try {
                $db = Database::getInstance();
                $db->query("DELETE FROM remember_tokens WHERE user_id = ?", [(int) $parts[0]]);
            } catch (Exception $e) {
            }
        }
        setcookie('remember_me', '', ['expires' => time() - 3600, 'path' => '/']);
    }
}
