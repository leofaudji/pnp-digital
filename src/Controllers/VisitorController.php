<?php

class VisitorController extends BaseController
{
    private function get_post_data()
    {
        return json_decode(file_get_contents("php://input"), true) ?? [];
    }

    private function fixSchema($db)
    {
        // Check if table exists, if not create it
        try {
            $db->query("SELECT 1 FROM visitors LIMIT 1");
        } catch (\Exception $e) {
            $db->query("CREATE TABLE IF NOT EXISTS `visitors` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `host_id` int(11) NOT NULL,
              `name` varchar(100) NOT NULL,
              `phone` varchar(20) DEFAULT NULL,
              `purpose` varchar(255) DEFAULT NULL,
              `qr_token` varchar(64) NOT NULL UNIQUE,
              `status` enum('PENDING', 'ARRIVED', 'DEPARTED') DEFAULT 'PENDING',
              `arrival_time` timestamp NULL DEFAULT NULL,
              `departure_time` timestamp NULL DEFAULT NULL,
              `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              FOREIGN KEY (`host_id`) REFERENCES `users` (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        }
    }

    public function index()
    {
        $user_id = Auth::user();
        if (!$user_id)
            $this->json(['error' => 'Unauthorized'], 401);

        $db = Database::getInstance();
        $this->fixSchema($db);

        $role = Auth::role();

        if ($role == 4) { // Warga
            $stmt = $db->query("SELECT v.*, u.full_name as host_name 
                               FROM visitors v 
                               JOIN users u ON v.host_id = u.id 
                               WHERE v.host_id = ? 
                               ORDER BY v.created_at DESC", [$user_id]);
        } else { // Admin, Bendahara, Satpam
            $stmt = $db->query("SELECT v.*, u.full_name as host_name 
                               FROM visitors v 
                               JOIN users u ON v.host_id = u.id 
                               ORDER BY v.created_at DESC");
        }

        $this->json($stmt->fetchAll());
    }

    public function store()
    {
        $user_id = Auth::user();
        if (!$user_id)
            $this->json(['error' => 'Unauthorized'], 401);
        $data = $this->get_post_data();

        if (empty($data['name'])) {
            $this->json(['success' => false, 'error' => 'Nama tamu harus diisi'], 400);
            return;
        }

        $qr_token = bin2hex(random_bytes(16));
        $db = Database::getInstance();
        $this->fixSchema($db);

        try {
            $db->query("INSERT INTO visitors (host_id, name, phone, purpose, qr_token, status) 
                       VALUES (?, ?, ?, ?, ?, 'PENDING')", [
                $user_id,
                $data['name'],
                $data['phone'] ?? null,
                $data['purpose'] ?? null,
                $qr_token
            ]);

            $this->json(['success' => true, 'id' => $db->lastInsertId(), 'qr_token' => $qr_token]);
        } catch (\Exception $e) {
            $this->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function verify()
    {
        $data = $this->get_post_data();
        $token = $data['qr_token'] ?? '';

        if (empty($token)) {
            $this->json(['success' => false, 'error' => 'Token QR tidak valid'], 400);
            return;
        }

        $db = Database::getInstance();
        $stmt = $db->query("SELECT v.*, u.full_name as host_name 
                           FROM visitors v 
                           JOIN users u ON v.host_id = u.id 
                           WHERE v.qr_token = ?", [$token]);
        $visitor = $stmt->fetch();

        if (!$visitor) {
            $this->json(['success' => false, 'error' => 'Tamu tidak terdaftar'], 404);
            return;
        }

        if ($visitor['status'] === 'ARRIVED') {
            $this->json(['success' => false, 'error' => 'Tamu sudah tercatat datang'], 400);
            return;
        }

        $db->query("UPDATE visitors SET status = 'ARRIVED', arrival_time = CURRENT_TIMESTAMP WHERE id = ?", [$visitor['id']]);

        $this->json([
            'success' => true,
            'message' => 'Kedatangan tamu berhasil dikonfirmasi',
            'visitor' => $visitor
        ]);
    }

    public function checkout()
    {
        $user_id = Auth::user();
        if (!$user_id)
            $this->json(['error' => 'Unauthorized'], 401);

        $data = $this->get_post_data();
        $id = $data['id'] ?? null;

        if (!$id) {
            $this->json(['success' => false, 'error' => 'ID tidak valid'], 400);
            return;
        }

        $db = Database::getInstance();
        $db->query("UPDATE visitors SET status = 'DEPARTED', departure_time = CURRENT_TIMESTAMP WHERE id = ?", [$id]);

        $this->json(['success' => true]);
    }

    public function public_view()
    {
        $token = $_GET['token'] ?? '';

        if (empty($token)) {
            $this->json(['success' => false, 'error' => 'Token tidak valid'], 400);
            return;
        }

        $db = Database::getInstance();
        $this->fixSchema($db);

        $stmt = $db->query("SELECT v.*, u.full_name as host_name 
                           FROM visitors v 
                           JOIN users u ON v.host_id = u.id 
                           WHERE v.qr_token = ?", [$token]);
        $visitor = $stmt->fetch();

        if (!$visitor) {
            $this->json(['success' => false, 'error' => 'Data tidak ditemukan'], 404);
            return;
        }

        $this->json($visitor);
    }
}
