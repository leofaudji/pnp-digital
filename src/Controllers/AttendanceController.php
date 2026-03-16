<?php

class AttendanceController extends BaseController
{
    public function scan()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['qr_code', 'type']);

        $user_id = Auth::user();
        if (!$user_id)
            $this->json(['error' => 'Unauthorized'], 401);

        $db = Database::getInstance();
        $this->fixSchema($db);

        $qr = trim($data['qr_code']);
        $type = $data['type']; // IN, OUT, or CHECKPOINT
        $qrUpper = strtoupper($qr);
        $today = date('Y-m-d');
        $nowTs = date('Y-m-d H:i:s');

        if ($type === 'CHECKPOINT') {
            $stmt = $db->query("SELECT * FROM checkpoints WHERE UPPER(trim(qr_code_string)) = ?", [$qrUpper]);
            $checkpoint = $stmt->fetch();

            if ($checkpoint) {
                if (($checkpoint['type'] ?? 'PATROL') !== 'PATROL') {
                    $this->json(['error' => "QR ini dikhususkan untuk 'Absensi', tidak bisa digunakan untuk 'Patroli'."], 400);
                }

                $image_path = null;
                if (!empty($data['image'])) {
                    $imageData = $data['image'];
                    if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type_match)) {
                        $imageData = substr($imageData, strpos($imageData, ',') + 1);
                        $imageExt = strtolower($type_match[1]);
                        if (in_array($imageExt, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                            $imageData = base64_decode($imageData);
                            if ($imageData !== false) {
                                $uploadDir = __DIR__ . '/../../public/uploads/patrol/';
                                if (!is_dir($uploadDir))
                                    mkdir($uploadDir, 0777, true);
                                $fileName = 'patrol_' . time() . '_' . uniqid() . '.' . $imageExt;
                                file_put_contents($uploadDir . $fileName, $imageData);
                                $image_path = $fileName;
                            }
                        }
                    }
                }

                // COOLDOWN CHECK (In-memory from JSON is easier actually)
                $stmtSetting = $db->query("SELECT value FROM settings WHERE `key` = 'patrol_scan_cooldown'");
                $settingRow = $stmtSetting->fetch();
                $cooldownMinutes = intval(($settingRow && isset($settingRow['value'])) ? $settingRow['value'] : 60);

                $stmtLog = $db->query("SELECT scans FROM daily_patrol_logs WHERE user_id = ? AND date = ?", [$user_id, $today]);
                $dailyLog = $stmtLog->fetch();
                $scans = $dailyLog ? json_decode($dailyLog['scans'], true) : [];

                // Check last scan for this checkpoint in today's scans
                $lastScanTime = null;
                foreach (array_reverse($scans) as $s) {
                    if ($s['checkpoint_id'] == $checkpoint['id']) {
                        $lastScanTime = $s['time'];
                        break;
                    }
                }

                if ($lastScanTime) {
                    $diff = time() - strtotime("$today $lastScanTime");
                    if ($diff < ($cooldownMinutes * 60)) {
                        $remaining = $cooldownMinutes - ceil($diff / 60);
                        $this->json(['error' => "Titik ini baru saja discan. Harap tunggu $remaining menit lagi."], 400);
                    }
                }

                // Add new scan
                $newScan = [
                    'checkpoint_id' => $checkpoint['id'],
                    'time' => date('H:i:s'),
                    'notes' => $data['notes'] ?? null,
                    'image' => $image_path
                ];
                $scans[] = $newScan;
                $scansJson = json_encode($scans);

                $db->query(
                    "INSERT INTO daily_patrol_logs (user_id, date, scans) VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE scans = VALUES(scans)",
                    [$user_id, $today, $scansJson]
                );

                $this->json(['success' => true, 'message' => "Checkpoint {$checkpoint['name']} berhasil dicatat."]);
            } else {
                $this->json(['error' => "QR Code '$qr' tidak terdaftar sebagai Titik Patroli."], 404);
            }
        } else {
            // Attendance IN/OUT
            $targetUser_id = $user_id;
            $checkpoint_name = "User QR";

            $stmt = $db->query("SELECT * FROM checkpoints WHERE UPPER(trim(qr_code_string)) = ?", [$qrUpper]);
            $checkpoint = $stmt->fetch();

            if ($checkpoint) {
                if (($checkpoint['type'] ?? 'PATROL') !== 'ATTENDANCE') {
                    $this->json(['error' => "QR ini dikhususkan untuk 'Patroli', tidak bisa digunakan untuk 'Absensi'."], 400);
                }
                $checkpoint_name = $checkpoint['name'];
            } else if (strpos($qrUpper, 'USER-') === 0) {
                $stmt = $db->query("SELECT id, full_name FROM users WHERE UPPER(qr_code_string) = ?", [$qrUpper]);
                $targetUser = $stmt->fetch();
                if (!$targetUser)
                    $this->json(['error' => 'Data Pengguna tidak ditemukan.'], 404);
                $targetUser_id = $targetUser['id'];
                $checkpoint_name = $targetUser['full_name'];
            } else {
                $this->json(['error' => "Format QR Code '$qr' tidak dikenali."], 400);
            }

            if ($type === 'IN') {
                $db->query(
                    "INSERT INTO attendance (user_id, date, clock_in, lat_in, lon_in) VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE clock_in = IF(clock_in IS NULL, VALUES(clock_in), clock_in), 
                                            lat_in = IF(lat_in IS NULL, VALUES(lat_in), lat_in),
                                            lon_in = IF(lon_in IS NULL, VALUES(lon_in), lon_in)",
                    [$targetUser_id, $today, $nowTs, $data['latitude'] ?? null, $data['longitude'] ?? null]
                );
            } else {
                // Shift-aware OUT: Find latest open attendance (within last 24h)
                $stmtCheck = $db->query("
                    SELECT id FROM attendance 
                    WHERE user_id = ? AND clock_out IS NULL 
                    AND clock_in >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                    ORDER BY clock_in DESC LIMIT 1
                ", [$targetUser_id]);
                $activeRow = $stmtCheck->fetch();

                if ($activeRow) {
                    $db->query(
                        "UPDATE attendance SET clock_out = ?, lat_out = ?, lon_out = ? WHERE id = ?",
                        [$nowTs, $data['latitude'] ?? null, $data['longitude'] ?? null, $activeRow['id']]
                    );
                } else {
                    $db->query(
                        "INSERT INTO attendance (user_id, date, clock_out, lat_out, lon_out) VALUES (?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE clock_out = VALUES(clock_out), 
                                                lat_out = VALUES(lat_out),
                                                lon_out = VALUES(lon_out)",
                        [$targetUser_id, $today, $nowTs, $data['latitude'] ?? null, $data['longitude'] ?? null]
                    );
                }
            }

            $msg = $type === 'IN' ? 'Masuk' : 'Pulang';
            $this->json(['success' => true, 'message' => "Absensi $msg berhasil dicatat untuk $checkpoint_name"]);
        }
    }

    public function history()
    {
        $userId = Auth::user();
        if (!$userId)
            $this->json(['error' => 'Unauthorized'], 401);
        $db = Database::getInstance();

        $month = isset($_GET['month']) ? intval($_GET['month']) : date('m');
        $year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
        $targetUserId = $userId;

        if (Auth::role() == 1 || Auth::role() == 2 || Auth::role() == 4) {
            if (isset($_GET['user_id']))
                $targetUserId = intval($_GET['user_id']);
        }

        // Fetch consolidated attendance
        $stmtAt = $db->query("
            SELECT date, clock_in, clock_out, lat_in, lon_in, lat_out, lon_out
            FROM attendance 
            WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
        ", [$targetUserId, $month, $year]);
        $attendance = $stmtAt->fetchAll();

        // Fetch consolidated patrol logs
        $stmtPl = $db->query("
            SELECT date, scans
            FROM daily_patrol_logs
            WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
        ", [$targetUserId, $month, $year]);
        $patrols = $stmtPl->fetchAll();

        // Map checkpoints for detail name in patrol scans
        $stmtCp = $db->query("SELECT id, name FROM checkpoints");
        $checkpoints = [];
        foreach ($stmtCp->fetchAll() as $cp)
            $checkpoints[$cp['id']] = $cp['name'];

        // Format to legacy structure for frontend compatibility
        $history = [];
        foreach ($attendance as $at) {
            if ($at['clock_in']) {
                $history[] = [
                    'type' => 'IN',
                    'timestamp' => $at['clock_in'],
                    'detail' => 'Station/User',
                    'latitude' => $at['lat_in'],
                    'longitude' => $at['lon_in']
                ];
            }
            if ($at['clock_out']) {
                $history[] = [
                    'type' => 'OUT',
                    'timestamp' => $at['clock_out'],
                    'detail' => 'Station/User',
                    'latitude' => $at['lat_out'],
                    'longitude' => $at['lon_out']
                ];
            }
        }

        foreach ($patrols as $pl) {
            $scans = json_decode($pl['scans'], true);
            foreach ($scans as $s) {
                $history[] = [
                    'type' => 'CHECKPOINT',
                    'timestamp' => "{$pl['date']} {$s['time']}",
                    'detail' => $checkpoints[$s['checkpoint_id']] ?? 'Unknown Checkpoint',
                    'notes' => $s['notes'] ?? null,
                    'image_proof' => $s['image'] ?? null
                ];
            }
        }

        // Sort DESC
        usort($history, fn($a, $b) => strcmp($b['timestamp'], $a['timestamp']));
        $this->json($history);
    }

    public function generate_qr()
    {
        $userId = Auth::user();
        $db = Database::getInstance();
        $stmt = $db->query("SELECT qr_code_string FROM users WHERE id = ?", [$userId]);
        $user = $stmt->fetch();

        // If empty, generate one
        if (!$user || empty($user['qr_code_string'])) {
            $qr = 'USER-' . uniqid();
            $db->query("UPDATE users SET qr_code_string = ? WHERE id = ?", [$qr, $userId]);
            $user['qr_code_string'] = $qr;
        }

        $this->json(['qr_code' => $user['qr_code_string']]);
    }

    public function list_checkpoints()
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM checkpoints ORDER BY name ASC");
        $this->json($stmt->fetchAll());
    }

    public function list_satpam()
    {
        if (Auth::role() != 1 && Auth::role() != 2 && Auth::role() != 4)
            $this->json(['error' => 'Unauthorized'], 403);
        $db = Database::getInstance();
        $stmt = $db->query("SELECT id, full_name, username FROM users WHERE role_id = 3 ORDER BY full_name ASC");
        $this->json($stmt->fetchAll());
    }
    public function store_checkpoint()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['name']);

        $qr = !empty($data['qr_code_string']) ? $data['qr_code_string'] : 'POS-' . strtoupper(uniqid());
        if (strpos($qr, 'POS-') !== 0 && strpos($qr, 'STATION-') !== 0) {
            $qr = 'POS-' . $qr;
        }

        $db = Database::getInstance();
        $this->fixSchema($db);
        $db->query("INSERT INTO checkpoints (name, qr_code_string, type) VALUES (?, ?, ?)", [$data['name'], $qr, $data['type'] ?? 'PATROL']);
        $this->json(['success' => true, 'message' => 'Checkpoint created successfully']);
    }

    public function update_checkpoint()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['id', 'name', 'qr_code_string']);

        $db = Database::getInstance();
        $this->fixSchema($db);
        $db->query("UPDATE checkpoints SET name = ?, qr_code_string = ?, type = ? WHERE id = ?", [$data['name'], $data['qr_code_string'], $data['type'] ?? 'PATROL', $data['id']]);
        $this->json(['success' => true, 'message' => 'Checkpoint updated successfully']);
    }

    public function delete_checkpoint()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['id']);

        $db = Database::getInstance();

        // Check if logs exist
        $stmt = $db->query("SELECT COUNT(*) as count FROM checkpoint_logs WHERE checkpoint_id = ?", [$data['id']]);
        $resCount = $stmt->fetch();
        if ($resCount && ($resCount['count'] ?? 0) > 0) {
            $this->json(['error' => 'Cannot delete checkpoint as it has associated logs.'], 400);
        }

        $db->query("DELETE FROM checkpoints WHERE id = ?", [$data['id']]);
        $this->json(['success' => true, 'message' => 'Checkpoint deleted successfully']);
    }

    public function get_status()
    {
        $userId = Auth::user();
        if (!$userId)
            $this->json(['error' => 'Unauthorized'], 401);
        $db = Database::getInstance();

        // Shift-aware status: find most recent relevant record
        $stmt = $db->query("
            SELECT * FROM attendance 
            WHERE user_id = ? 
            ORDER BY date DESC, clock_in DESC LIMIT 1
        ", [$userId]);

        $statusRow = $stmt->fetch();
        $today = date('Y-m-d');

        $checkedIn = false;
        $checkInTime = null;
        $checkedOut = false;
        $checkOutTime = null;

        if ($statusRow) {
            $isToday = $statusRow['date'] == $today;
            $hasIn = !empty($statusRow['clock_in']);
            $hasOut = !empty($statusRow['clock_out']);

            // Case 1: Active shift (Clocked in within last 24h, not clocked out)
            if ($hasIn && !$hasOut) {
                $checkInTs = strtotime($statusRow['clock_in']);
                if (time() - $checkInTs < 86400) { // 24h window
                    $checkedIn = true;
                    $checkInTime = date('H:i', $checkInTs);
                }
            }
            // Case 2: Already finished for today
            else if ($hasIn && $hasOut && $isToday) {
                $checkedIn = true;
                $checkInTime = date('H:i', strtotime($statusRow['clock_in']));
                $checkedOut = true;
                $checkOutTime = date('H:i', strtotime($statusRow['clock_out']));
            }
        }

        $this->json([
            'checkedIn' => $checkedIn,
            'checkInTime' => $checkInTime,
            'checkedOut' => $checkedOut,
            'checkOutTime' => $checkOutTime
        ]);
    }

    public function get_monthly_summary()
    {
        $userId = Auth::user();
        if (!$userId)
            $this->json(['error' => 'Unauthorized'], 401);

        $roleId = Auth::role();
        $targetUserId = $userId;

        if (($roleId == 1 || $roleId == 2 || $roleId == 4) && isset($_GET['user_id'])) {
            $targetUserId = intval($_GET['user_id']);
        }

        $db = Database::getInstance();
        $stmt = $db->query("
            SELECT COUNT(*) as total_days 
            FROM attendance 
            WHERE user_id = ? 
            AND clock_in IS NOT NULL
            AND MONTH(date) = MONTH(CURRENT_DATE()) 
            AND YEAR(date) = YEAR(CURRENT_DATE())
        ", [$targetUserId]);

        $result = $stmt->fetch();
        $this->json(['total_days' => ($result && isset($result['total_days'])) ? $result['total_days'] : 0]);
    }

    public function get_alert_count()
    {
        if (!Auth::user())
            $this->json(['error' => 'Unauthorized'], 401);

        $db = Database::getInstance();
        $today = date('Y-m-d');

        $alerts = 0;

        // 1. Satpam who haven't checked in today
        $stmt = $db->query("
            SELECT COUNT(*) as count 
            FROM users 
            WHERE role_id = 3 
            AND id NOT IN (
                SELECT user_id FROM attendance WHERE date = ? AND clock_in IS NOT NULL
            )
        ", [$today]);
        $resCountUsers = $stmt->fetch();
        $alerts += (int) (($resCountUsers && isset($resCountUsers['count'])) ? $resCountUsers['count'] : 0);

        // 2. Patrol incomplete today
        $stmtCp = $db->query("SELECT COUNT(*) as total FROM checkpoints WHERE type = 'PATROL'");
        $resTotalCP = $stmtCp->fetch();
        $totalCP = (int) (($resTotalCP && isset($resTotalCP['total'])) ? $resTotalCP['total'] : 0);

        if ($totalCP > 0) {
            $stmtLog = $db->query("SELECT scans FROM daily_patrol_logs WHERE date = ? ", [$today]);
            $scannedIds = [];
            foreach ($stmtLog->fetchAll() as $row) {
                $scans = json_decode($row['scans'], true);
                foreach ($scans as $s)
                    $scannedIds[$s['checkpoint_id']] = true;
            }

            if (count($scannedIds) < $totalCP) {
                $alerts += 1;
            }
        }

        $this->json(['count' => $alerts]);
    }

    private function fixSchema($db)
    {
        try {
            $db->query("ALTER TABLE checkpoint_logs ADD COLUMN notes TEXT DEFAULT NULL AFTER user_id");
        } catch (Exception $e) {
        }
        try {
            $db->query("ALTER TABLE checkpoint_logs ADD COLUMN image_proof VARCHAR(255) DEFAULT NULL AFTER notes");
        } catch (Exception $e) {
        }
        try {
            $db->query("ALTER TABLE checkpoints ADD COLUMN type ENUM('ATTENDANCE', 'PATROL') DEFAULT 'PATROL'");
        } catch (Exception $e) {
        }
    }
}
