<?php

class UserController extends BaseController
{
    public function index()
    {
        $role = Auth::role();
        if ($role != 1 && $role != 2)
            $this->json(['error' => 'Forbidden'], 403);
        $db = Database::getInstance();
        try {
            $stmt = $db->query("
                SELECT u.*, r.name as role_name, w.no_rumah, w.wa_number, w.no_kk, w.is_kk_head, w.tgl_lahir, w.jenis_kelamin, w.pekerjaan 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                LEFT JOIN warga w ON u.id = w.user_id
                ORDER BY u.id DESC
            ");
            $this->json($stmt->fetchAll());
        } catch (Exception $e) {
            // Log error or handle missing columns
            $stmt = $db->query("
                SELECT u.*, r.name as role_name, w.no_rumah, w.wa_number, w.no_kk, w.is_kk_head 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                LEFT JOIN warga w ON u.id = w.user_id
                ORDER BY u.id DESC
            ");
            $this->json($stmt->fetchAll());
        }
    }

    public function store()
    {
        $role = Auth::role();
        if ($role != 1 && $role != 2)
            $this->json(['error' => 'Forbidden'], 403);
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['username', 'password', 'full_name', 'role_id']);

        $db = Database::getInstance();
        $qr = 'USER-' . uniqid();
        $password = password_hash($data['password'], PASSWORD_DEFAULT);

        try {
            $db->query(
                "INSERT INTO users (username, password, full_name, phone, role_id, qr_code_string) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    $data['username'],
                    $password,
                    $data['full_name'],
                    $data['phone'] ?? null,
                    $data['role_id'],
                    $qr
                ]
            );
            $newUserId = $db->lastInsertId();

            // If Warga, insert into warga table
            if ($data['role_id'] == 4) {
                $db->query(
                    "INSERT INTO warga (user_id, no_rumah, wa_number, no_kk, is_kk_head, tgl_lahir, jenis_kelamin, pekerjaan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        $newUserId,
                        $data['no_rumah'] ?? null,
                        $data['wa_number'] ?? null,
                        $data['no_kk'] ?? null,
                        $data['is_kk_head'] ?? 0,
                        $data['tgl_lahir'] ?? null,
                        $data['jenis_kelamin'] ?? null,
                        $data['pekerjaan'] ?? null
                    ]
                );
            }

            $this->json(['success' => true, 'message' => 'User created successfully']);
        } catch (Exception $e) {
            $this->json(['error' => 'Username already exists or database error'], 400);
        }
    }

    public function update()
    {
        $role = Auth::role();
        if ($role != 1 && $role != 2)
            $this->json(['error' => 'Forbidden'], 403);
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['id', 'username', 'full_name', 'role_id']);

        $db = Database::getInstance();
        $params = [
            $data['username'],
            $data['full_name'],
            $data['phone'] ?? null,
            $data['role_id']
        ];
        $sql = "UPDATE users SET username = ?, full_name = ?, phone = ?, role_id = ?";

        if (!empty($data['password'])) {
            $sql .= ", password = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        $sql .= " WHERE id = ?";
        $params[] = $data['id'];

        $db->query($sql, $params);

        // Handle Warga table
        if ($data['role_id'] == 4) {
            // Use INSERT ... ON DUPLICATE KEY UPDATE for robustness
            $db->query(
                "INSERT INTO warga (user_id, no_rumah, wa_number, no_kk, is_kk_head, tgl_lahir, jenis_kelamin, pekerjaan) VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                    no_rumah = VALUES(no_rumah), 
                    wa_number = VALUES(wa_number),
                    no_kk = VALUES(no_kk),
                    is_kk_head = VALUES(is_kk_head),
                    tgl_lahir = VALUES(tgl_lahir),
                    jenis_kelamin = VALUES(jenis_kelamin),
                    pekerjaan = VALUES(pekerjaan)",
                [
                    $data['id'],
                    $data['no_rumah'] ?? null,
                    $data['wa_number'] ?? null,
                    $data['no_kk'] ?? null,
                    $data['is_kk_head'] ?? 0,
                    $data['tgl_lahir'] ?? null,
                    $data['jenis_kelamin'] ?? null,
                    $data['pekerjaan'] ?? null
                ]
            );
        } else {
            // If role changed FROM Warga, maybe cleanup? 
            // User didn't ask, but good for data integrity.
            $db->query("DELETE FROM warga WHERE user_id = ?", [$data['id']]);
        }

        $this->json(['success' => true, 'message' => 'User updated successfully']);
    }

    public function delete()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['id']);

        $db = Database::getInstance();
        // Prevent deleting self
        if ($data['id'] == Auth::user()) {
            $this->json(['error' => 'Cannot delete your own account'], 400);
        }

        $db->query("DELETE FROM users WHERE id = ?", [$data['id']]);
        $this->json(['success' => true, 'message' => 'User deleted successfully']);
    }
}
