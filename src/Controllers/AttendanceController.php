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

    public function print_checkpoint_qr()
    {
        require_once __DIR__ . '/../Libs/fpdf/fpdf.php';
        require_once __DIR__ . '/../Libs/CustomPDF.php';

        $id = $_GET['id'] ?? null;
        if (!$id)
            die('ID Checkpoint diperlukan.');

        $db = Database::getInstance();

        // 1. Fetch Checkpoint
        $stmt = $db->query("SELECT * FROM checkpoints WHERE id = ?", [$id]);
        $checkpoint = $stmt->fetch();
        if (!$checkpoint)
            die('Checkpoint tidak ditemukan.');

        // 2. Fetch Settings
        $stmtSettings = $db->query("SELECT * FROM settings");
        $settingsRaw = $stmtSettings->fetchAll();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s['key']] = $s['value'];
        }

        $rtName = $settings['rt_name'] ?? 'LINGKUNGAN myPuri';
        $rtAddress = $settings['rt_address'] ?? 'Unit Lingkungan Masyarakat';
        $rtHead = $settings['rt_head'] ?? 'Ketua RT';
        $appLogo = $settings['app_logo'] ?? null;
        $appTitle = $settings['app_title'] ?? 'myPuri';

        // 3. Generate PDF
        $pdf = new CustomPDF('P', 'mm', 'A4', $rtName, $rtAddress, $appLogo);
        $pdf->showDefaultHeader = false; // MODERN: Remove Kop Surat
        $pdf->AliasNbPages();
        $pdf->AddPage();

        // BRAND SIDEBAR ACCENT
        $pdf->SetFillColor(0, 112, 243); // Premium Blue
        $pdf->Rect(0, 0, 8, 297, 'F');

        // SECURITY WATERMARK (Subtle)
        $pdf->SetFont('Helvetica', 'B', 40);
        $pdf->SetTextColor(245, 245, 245);
        $pdf->RotatedText(35, 190, 'myPuri SECURE DOCUMENT', 45);
        $pdf->RotatedText(35, 260, 'myPuri SECURE DOCUMENT', 45);
        $pdf->RotatedText(35, 120, 'myPuri SECURE DOCUMENT', 45);
        $pdf->RotatedText(35, 50, 'myPuri SECURE DOCUMENT', 45);

        // MODERN HEADER
        $pdf->SetY(13);
        $pdf->SetFont('Helvetica', 'B', 24);
        $pdf->SetTextColor(0, 112, 243); // Premium Blue
        $pdf->Cell(0, 10, strtoupper($appTitle), 0, 1, 'C');

        $jargons = [
            "Digitalizing Home Security, One Scan at a Time.",
            "Security in Your Pocket, Peace in Your Home.",
            "Modern Patrol for a Safer Environment.",
            "Smart Guarding, Smarter Living.",
            "Advanced Protection for the Modern Neighborhood."
        ];
        $randomJargon = $jargons[array_rand($jargons)];

        $pdf->SetFont('Helvetica', 'I', 10);
        $pdf->SetTextColor(100, 116, 139);
        $pdf->Cell(0, 5, $randomJargon, 0, 1, 'C');

        $pdf->Ln(5);
        $pdf->SetDrawColor(226, 232, 240);
        $pdf->Line(20, $pdf->GetY(), 190, $pdf->GetY());
        $pdf->Ln(10);

        // Badge-like container in the middle of A4
        $pdf->SetDrawColor(226, 232, 240);
        $pdf->SetFillColor(248, 250, 252);
        $pdf->RoundedRect(25, 40, 160, 140, 5, 'DF');

        // Checkpoint Name (Big)
        $pdf->SetY(50);
        $pdf->SetFont('Helvetica', 'B', 24);
        $pdf->SetTextColor(15, 23, 42);
        $pdf->Cell(0, 15, strtoupper($checkpoint['name']), 0, 1, 'C');

        // QR Code Image
        // Use high-res Google Charts API or similar for QR generation
        $qrData = $checkpoint['qr_code_string'];
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" . urlencode($qrData);

        // Draw QR
        $pdf->Image($qrUrl, 75, 70, 60, 60, 'PNG');

        // QR ID Text
        $pdf->SetY(135);
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetTextColor(100, 116, 139);
        $pdf->Cell(0, 5, 'ID: ' . $qrData, 0, 1, 'C');

        // Instructions
        $pdf->SetY(150);
        $pdf->SetFont('Helvetica', 'B', 12);
        $pdf->SetTextColor(0, 112, 243);
        $pdf->Cell(0, 8, 'PINDAI SETIAP PATROLI RUTIN', 0, 1, 'C');

        $pdf->SetFont('Helvetica', 'I', 8);
        $pdf->SetTextColor(148, 163, 184);
        $pdf->Cell(0, 5, 'Gunakan aplikasi ' . $appTitle . ' untuk memindai kode di atas.', 0, 1, 'C');

        // SAFETY SOP SECTION
        $pdf->SetY(185);
        $pdf->SetX(30);
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetTextColor(51, 65, 85);
        $pdf->Cell(0, 8, 'PROSEDUR PATROLI KEAMANAN:', 0, 1, 'L');

        $pdf->SetFont('Helvetica', '', 8);
        $pdf->SetTextColor(71, 85, 105);
        $sop = [
            "1. Periksa kondisi fisik & keamanan di sekitar area titik kontrol.",
            "2. Gunakan smartphone untuk memindai kode QR pada titik ini.",
            "3. Pastikan status 'Berhasil' muncul & tambahkan catatan jika perlu.",
            "4. Lanjutkan patroli ke titik berikutnya sesuai rute terjadwal."
        ];
        foreach ($sop as $line) {
            $pdf->SetX(30);
            $pdf->Cell(0, 5, $line, 0, 1, 'L');
        }

        $pdf->Ln(10);
        $pdf->SetFont('Helvetica', 'I', 10);
        $pdf->SetTextColor(71, 85, 105);
        $quotes = [
            '"Keamanan bukanlah sebuah produk, melainkan sebuah proses yang berkelanjutan."',
            '"Kewaspadaan kita hari ini adalah kedamaian kita di hari esok."',
            '"Lingkungan yang aman adalah pondasi utama kebahagiaan setiap keluarga."',
            '"Ketertiban dimulai dari diri sendiri, keamanan dijaga bersama-sama."'
        ];
        $randomQuote = $quotes[array_rand($quotes)];
        $pdf->MultiCell(0, 6, $randomQuote, 0, 'C');

        // EMERGENCY HOTLINE BOX
        $pdf->SetY(240);
        $pdf->SetX(110);
        $pdf->SetFillColor(254, 242, 242); // Light red
        $pdf->SetDrawColor(252, 165, 165); // Red border
        $pdf->RoundedRect(110, 240, 75, 25, 3, 'DF');

        $pdf->SetY(242);
        $pdf->SetX(115);
        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->SetTextColor(153, 27, 27);
        $pdf->Cell(0, 5, 'LAYANAN DARURAT (EMERGENCY):', 0, 1);

        $pdf->SetX(115);
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->Cell(0, 4, '- Polisi / Keamanan: 110', 0, 1);
        $pdf->SetX(115);
        $pdf->Cell(0, 4, '- Ambulans / Medis: 118', 0, 1);
        $pdf->SetX(115);
        $pdf->Cell(0, 4, '- Pemadam Kebakaran: 113', 0, 1);


        $pdf->Output('I', 'QR_Checkpoint_' . str_replace(' ', '_', $checkpoint['name']) . '.pdf');
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
