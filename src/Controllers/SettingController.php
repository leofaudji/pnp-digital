<?php

class SettingController extends BaseController
{
    public function index()
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM settings");
        $settings = $stmt->fetchAll();

        // Transform to key-value object
        $result = [];
        foreach ($settings as $s) {
            $result[$s['key']] = $s['value'];
        }

        // Inject App Version from Env
        $result['app_version'] = env('APP_VERSION', '1.0.0');

        $this->json($result);
    }

    public function update()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data)) {
            $this->json(['error' => 'No data provided'], 400);
        }

        $db = Database::getInstance();

        try {
            foreach ($data as $key => $value) {
                $db->query(
                    "INSERT INTO settings (`key`, `value`) VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
                    [$key, $value]
                );

                if ($key === 'app_title') {
                    $manifestPath = __DIR__ . '/../../public/manifest.json';
                    if (file_exists($manifestPath) && is_writable($manifestPath)) {
                        $manifest = json_decode(file_get_contents($manifestPath), true);
                        if (json_last_error() === JSON_ERROR_NONE) {
                            $manifest['name'] = $value;
                            $manifest['short_name'] = $value;
                            file_put_contents($manifestPath, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
                        }
                    }
                }
            }
            $this->json(['success' => true, 'message' => 'Pengaturan berhasil diperbarui']);
        } catch (Exception $e) {
            $this->json(['error' => 'Gagal memperbarui pengaturan: ' . $e->getMessage()], 500);
        }
    }

    public function upload_logo()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
            $this->json(['error' => 'Gagal upload file.'], 400);
        }

        $file = $_FILES['logo'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        $maxSize = 2 * 1024 * 1024; // 2MB

        if (!in_array($file['type'], $allowedTypes)) {
            $this->json(['error' => 'Tipe file tidak valid. Gunakan JPG/PNG.'], 400);
        }

        if ($file['size'] > $maxSize) {
            $this->json(['error' => 'Ukuran file terlalu besar (Max 2MB).'], 400);
        }

        $uploadDir = __DIR__ . '/../../public/assets/images/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate unique filename to avoid browser caching issues immediately, 
        // OR use fixed name but user needs to clear cache. 
        // Better: Use fixed name 'logo_app.png' and handle cache busting in frontend/pdf.
        // Actually, let's use a hashed name and store it in DB.
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'logo_' . time() . '.' . $ext;
        $targetPath = $uploadDir . $filename;

        // Validasi upload
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $db = Database::getInstance();
            // Update setting
            $relativeUrl = '/assets/images/' . $filename;

            $db->query(
                "INSERT INTO settings (`key`, `value`) VALUES ('app_logo', ?) 
                 ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
                [$relativeUrl]
            );

            $this->json(['success' => true, 'path' => $relativeUrl]);
        } else {
            $this->json(['error' => 'Gagal menyimpan file.'], 500);
        }
    }
    public function get_fee_categories()
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM fee_categories ORDER BY id ASC");
        $this->json($stmt->fetchAll());
    }

    public function add_fee_category()
    {
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['name']) || !isset($data['amount'])) {
            $this->json(['error' => 'Data tidak lengkap'], 400);
        }

        $db = Database::getInstance();
        try {
            $db->query(
                "INSERT INTO fee_categories (name, amount, is_active) VALUES (?, ?, ?)",
                [$data['name'], $data['amount'], $data['is_active'] ?? 1]
            );
            $this->json(['success' => true]);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update_fee_category()
    {
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->json(['error' => 'ID required'], 400);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $db = Database::getInstance();
        try {
            $db->query(
                "UPDATE fee_categories SET name = ?, amount = ?, is_active = ? WHERE id = ?",
                [$data['name'], $data['amount'], $data['is_active'], $id]
            );
            $this->json(['success' => true]);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }

    public function delete_fee_category()
    {
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->json(['error' => 'ID required'], 400);
        }

        $db = Database::getInstance();
        try {
            $db->query("DELETE FROM fee_categories WHERE id = ?", [$id]);
            $this->json(['success' => true]);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }

    public function get_holidays()
    {
        $year = $_GET['year'] ?? date('Y');
        $db = Database::getInstance();
        // Fetch holidays for the given year (or all if no year, but better to filter)
        // For simplicity in UI, let's fetch all future and recent past 
        $stmt = $db->query("SELECT * FROM holidays WHERE YEAR(date) = ? ORDER BY date ASC", [$year]);
        $this->json($stmt->fetchAll());
    }

    public function add_holiday()
    {
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['date']) || empty($data['description'])) {
            $this->json(['error' => 'Tanggal dan Keterangan wajib diisi'], 400);
        }

        $db = Database::getInstance();
        try {
            $db->query(
                "INSERT INTO holidays (date, description) VALUES (?, ?)",
                [$data['date'], $data['description']]
            );
            $this->json(['success' => true]);
        } catch (PDOException $e) {
            if ($e->errorInfo[1] == 1062) {
                $this->json(['error' => 'Tanggal ini sudah ada di daftar libur'], 409);
            } else {
                $this->json(['error' => $e->getMessage()], 500);
            }
        }
    }

    public function delete_holiday()
    {
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->json(['error' => 'ID required'], 400);
        }

        $db = Database::getInstance();
        try {
            $db->query("DELETE FROM holidays WHERE id = ?", [$id]);
            $this->json(['success' => true]);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }
}
