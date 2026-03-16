<?php

class AuthController extends BaseController
{
    public function login()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['username', 'password']);

        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM users WHERE username = ?", [$data['username']]);
        $user = $stmt->fetch();

        if ($user && password_verify($data['password'], $user['password'])) {
            Auth::login($user);

            // Get Role Name
            $stmt = $db->query("SELECT name FROM roles WHERE id = ?", [$user['role_id']]);
            $role = $stmt->fetch();

            $this->json(['success' => true, 'role' => $role['name']]);
        } else {
            $this->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }
    }

    public function logout()
    {
        Auth::clearRememberMe();
        Auth::logout();
        $this->json(['success' => true]);
    }

    public function me()
    {
        $userId = Auth::user();
        if (!$userId) {
            $this->json(['error' => 'Unauthorized'], 401);
        }

        $db = Database::getInstance();
        $stmt = $db->query("SELECT u.id, u.username, u.full_name, u.role_id, u.google_email, r.name as role, w.no_rumah, w.wa_number 
                           FROM users u 
                           JOIN roles r ON u.role_id = r.id 
                           LEFT JOIN warga w ON u.id = w.user_id
                           WHERE u.id = ?", [$userId]);
        $user = $stmt->fetch();

        $this->json($user);
    }
}
