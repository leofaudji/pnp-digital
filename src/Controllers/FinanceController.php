<?php

class FinanceController extends BaseController
{
    public function index()
    {
        $db = Database::getInstance();
        $month = $_GET['month'] ?? date('n');
        $year = $_GET['year'] ?? date('Y');

        // 1. Fetch Transactions (Filtered by month/year)
        $stmt = $db->query(
            "SELECT f.*, u.full_name as created_by_name 
             FROM finance f 
             JOIN users u ON f.created_by = u.id 
             WHERE MONTH(f.date) = ? AND YEAR(f.date) = ?
             ORDER BY date DESC",
            [$month, $year]
        );
        $financeData = $stmt->fetchAll();

        // 2. Fetch Summary Statistics
        // Total Balance (Always overall total)
        $stmt = $db->query("SELECT 
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) - 
            SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_balance 
            FROM finance");
        $totalBalance = $stmt->fetch()['total_balance'] ?? 0;

        // Statistics for the SELECTED Month & Year
        $stmt = $db->query("SELECT 
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as selected_income,
            SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as selected_expense
            FROM finance 
            WHERE MONTH(date) = ? AND YEAR(date) = ?",
            [$month, $year]
        );
        $selectedStats = $stmt->fetch();

        $this->json([
            'data' => $financeData,
            'summary' => [
                'total_balance' => $totalBalance,
                'monthly_income' => $selectedStats['selected_income'] ?? 0,
                'monthly_expense' => $selectedStats['selected_expense'] ?? 0
            ]
        ]);
    }

    public function store()
    {
        // Only Admin or Bendahara
        $role = Auth::role();
        if ($role != 1 && $role != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['type', 'amount', 'description', 'date']);

        $db = Database::getInstance();
        $db->query(
            "INSERT INTO finance (type, amount, description, date, created_by) VALUES (?, ?, ?, ?, ?)",
            [$data['type'], $data['amount'], $data['description'], $data['date'], Auth::user()]
        );

        $this->json(['success' => true]);
    }

    public function get_advances()
    {
        $db = Database::getInstance();
        $role = Auth::role();
        $userId = Auth::user();

        if ($role == 1 || $role == 2) {
            // Admin/Bendahara see all
            $stmt = $db->query("SELECT s.*, u.full_name, r.name as role_name 
                               FROM salary_advances s 
                               JOIN users u ON s.user_id = u.id 
                               JOIN roles r ON u.role_id = r.id
                               ORDER BY s.date DESC");
        } else {
            // Others only see theirs
            $stmt = $db->query("SELECT s.*, u.full_name FROM salary_advances s 
                               JOIN users u ON s.user_id = u.id 
                               WHERE s.user_id = ? ORDER BY s.date DESC", [$userId]);
        }

        $this->json($stmt->fetchAll());
    }

    public function store_advance()
    {
        // Only Admin or Bendahara can record kasbon
        if (Auth::role() != 1 && Auth::role() != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['user_id', 'amount', 'date']);

        $db = Database::getInstance();

        // 1. Record Advance
        $db->query(
            "INSERT INTO salary_advances (user_id, amount, description, date, created_by) VALUES (?, ?, ?, ?, ?)",
            [$data['user_id'], $data['amount'], $data['description'] ?? 'Kasbon Petugas', $data['date'], Auth::user()]
        );

        // 2. Automatically record as EXPENSE in Finance
        $stmt = $db->query("SELECT full_name FROM users WHERE id = ?", [$data['user_id']]);
        $userName = $stmt->fetch()['full_name'];

        $financeDesc = "Kasbon Satpam: " . $userName . ($data['description'] ? " (" . $data['description'] . ")" : "");

        $db->query(
            "INSERT INTO finance (type, amount, description, date, created_by) VALUES (?, ?, ?, ?, ?)",
            ['EXPENSE', $data['amount'], $financeDesc, $data['date'], Auth::user()]
        );

        $this->json(['success' => true]);
    }

    public function get_my_debt()
    {
        $userId = Auth::user();
        if (!$userId)
            $this->json(['error' => 'Unauthorized'], 401);

        $roleId = Auth::role();
        $targetUserId = $userId;

        // Admin or Bendahara can view others
        if (($roleId == 1 || $roleId == 2) && isset($_GET['user_id'])) {
            $targetUserId = intval($_GET['user_id']);
        }

        $db = Database::getInstance();
        // Sum PENDING advances for the current month
        $stmt = $db->query("
            SELECT SUM(amount) as total_debt 
            FROM salary_advances 
            WHERE user_id = ? 
            AND status = 'PENDING'
            AND MONTH(date) = MONTH(CURRENT_DATE())
            AND YEAR(date) = YEAR(CURRENT_DATE())
        ", [$targetUserId]);

        $result = $stmt->fetch();

        // Get list of pending advances for easier settlement if admin
        $stmtList = $db->query("
            SELECT id, amount, description, date 
            FROM salary_advances 
            WHERE user_id = ? 
            AND status = 'PENDING'
            AND MONTH(date) = MONTH(CURRENT_DATE())
            AND YEAR(date) = YEAR(CURRENT_DATE())
        ", [$targetUserId]);

        $this->json([
            'total_debt' => $result['total_debt'] ?? 0,
            'pending_advances' => $stmtList->fetchAll()
        ]);
    }

    public function settle_advance()
    {
        if (Auth::role() != 1 && Auth::role() != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $id = $_GET['id'] ?? null;
        if (!$id)
            $this->json(['error' => 'ID required'], 400);

        $db = Database::getInstance();
        $db->query("UPDATE salary_advances SET status = 'SETTLED' WHERE id = ?", [$id]);
        $this->json(['success' => true]);
    }

    public function print_salary_slip()
    {
        require_once __DIR__ . '/../Libs/fpdf/fpdf.php';
        require_once __DIR__ . '/../Libs/CustomPDF.php';

        $userId = Auth::user();
        if (!$userId)
            die('Unauthorized');

        $roleId = Auth::role();
        $targetUserId = $userId;
        $month = date('m');
        $year = date('Y');

        // Check session first (for clean URLs)
        if (isset($_SESSION['print_target_user_id']) && ($roleId == 1 || $roleId == 2)) {
            $targetUserId = $_SESSION['print_target_user_id'];
        } else if (($roleId == 1 || $roleId == 2) && isset($_GET['user_id'])) {
            $targetUserId = intval($_GET['user_id']);
        }

        if (isset($_SESSION['print_month']))
            $month = $_SESSION['print_month'];
        else if (isset($_GET['month']))
            $month = $_GET['month'];

        if (isset($_SESSION['print_year']))
            $year = $_SESSION['print_year'];
        else if (isset($_GET['year']))
            $year = $_GET['year'];

        $db = Database::getInstance();

        // 1. Fetch User Data
        $stmtUser = $db->query("SELECT u.full_name, u.username, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?", [$targetUserId]);
        $user = $stmtUser->fetch();

        // 2. Fetch Settings & Attendance Summary
        $stmtSettings = $db->query("SELECT * FROM settings");
        $settingsRaw = $stmtSettings->fetchAll();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s['key']] = $s['value'];
        }
        $rtName = $settings['rt_name'] ?? 'LINGKUNGAN RT';
        $rtAddress = $settings['rt_address'] ?? 'KAVLING DKI BLOK 14 - LINGKUNGAN RT 05/01';
        $appLogo = $settings['app_logo'] ?? null;

        // Check if there is a recorded payment in salary_payments
        $stmtPay = $db->query("SELECT * FROM salary_payments WHERE user_id = ? AND month = ? AND year = ?", [$targetUserId, $month, $year]);
        $paymentRecord = $stmtPay->fetch();

        if ($paymentRecord) {
            // Use historical data from record
            $baseSalary = intval($paymentRecord['base_salary']);
            $mealAllowance = intval($paymentRecord['meal_allowance']);
            $mealRate = intval($settings['meal_allowance_amount'] ?? 25000);
            $totalDays = ($mealRate > 0) ? intval($mealAllowance / $mealRate) : 0;
            $kasbon = intval($paymentRecord['kasbon_deduction']);
            $totalTHP = intval($paymentRecord['total_thp']);
        } else {
            // Calculate real-time (usually for current month)
            $baseSalary = intval($settings['salary_satpam'] ?? 2000000);

            $stmtAtt = $db->query("
                SELECT COUNT(DISTINCT DATE(timestamp)) as total_days 
                FROM attendance 
                WHERE user_id = ? 
                AND type = 'IN' 
                AND MONTH(timestamp) = ? 
                AND YEAR(timestamp) = ?
            ", [$targetUserId, $month, $year]);
            $attendanceContent = $stmtAtt->fetch();
            $totalDays = intval($attendanceContent['total_days'] ?? 0);
            $mealRate = intval($settings['meal_allowance_amount'] ?? 25000);
            $mealAllowance = $totalDays * $mealRate;

            $stmtDebt = $db->query("
                SELECT SUM(amount) as total_debt 
                FROM salary_advances 
                WHERE user_id = ? 
                AND status = 'PENDING'
                AND MONTH(date) = ?
                AND YEAR(date) = ?
            ", [$targetUserId, $month, $year]);
            $debt = $stmtDebt->fetch();
            $kasbon = intval($debt['total_debt'] ?? 0);

            $totalTHP = ($baseSalary + $mealAllowance) - $kasbon;
        }

        // --- PERFORMANCE CALCULATION ---
        $morningShift = $settings['shift_morning_start'] ?? '06:00';
        $nightShift = $settings['shift_night_start'] ?? '20:00';

        // 1. Calculate Punctuality (Late arrivals)
        // We consider entry late if timestamp time > shift start time
        // Note: Simple logic based on shift threshold 14:00 (Pagi < 14:00, Malam >= 14:00)
        $stmtLate = $db->query("
            SELECT timestamp 
            FROM attendance 
            WHERE user_id = ? AND type = 'IN' 
            AND MONTH(timestamp) = ? AND YEAR(timestamp) = ?
        ", [$targetUserId, $month, $year]);
        $attendances = $stmtLate->fetchAll();

        $lateCount = 0;
        foreach ($attendances as $att) {
            $attTime = date('H:i', strtotime($att['timestamp']));
            $hour = intval(date('H', strtotime($att['timestamp'])));
            $threshold = ($hour < 14) ? $morningShift : $nightShift;
            if ($attTime > $threshold)
                $lateCount++;
        }

        // 2. Calculate Patrol Activity (Unique checkpoints scanned)
        $stmtPatrol = $db->query("
            SELECT COUNT(id) as total_scans, COUNT(DISTINCT DATE(timestamp)) as patrol_days
            FROM checkpoint_logs 
            WHERE user_id = ? 
            AND MONTH(timestamp) = ? AND YEAR(timestamp) = ?
        ", [$targetUserId, $month, $year]);
        $patrolData = $stmtPatrol->fetch();
        $totalScans = intval($patrolData['total_scans'] ?? 0);
        $patrolDays = intval($patrolData['patrol_days'] ?? 0);

        // 3. Generate Evaluation
        $stars = 5;
        $perfNote = "";

        if ($lateCount == 0 && $totalDays > 0) {
            if ($totalScans > ($totalDays * 2)) {
                $stars = 5;
                $perfNote = "Luar Biasa! Kehadiran 100% tepat waktu & patroli sangat aktif. Pertahankan dedikasi Anda untuk lingkungan yang aman! ✨";
            } else {
                $stars = 4;
                $perfNote = "Sangat Baik. Disiplin waktu sempurna. Tingkatkan lagi intensitas patroli di titik-titik rawan agar lebih maksimal. 👍";
            }
        } else if ($lateCount <= 3 && $totalDays > 0) {
            $stars = 4;
            $perfNote = "Kinerja Baik. Terdapat $lateCount keterlambatan, usahakan untuk lebih awal. Koordinasi patroli sudah berjalan cukup lancar.";
        } else {
            $stars = 3;
            $perfNote = "Cukup. Perlu peningkatan kedisiplinan waktu (Terlambat: $lateCount kali). Pastikan jadwal patroli rutin dilaksanakan sesuai SOP.";
        }

        if ($totalDays == 0) {
            $stars = 0;
            $perfNote = "Data kehadiran tidak ditemukan untuk periode ini.";
        }

        $starRating = str_repeat('⭐', $stars);

        // --- PDF GENERATION ---
        // Using CustomPDF for Logo and Footer
        $pdf = new CustomPDF('P', 'mm', array(148, 210), $rtName, $rtAddress, $appLogo); // A5 Portrait
        $pdf->AliasNbPages();
        $pdf->AddPage();
        $pdf->SetAutoPageBreak(false);

        // Sidebar color strip (Adjusted to not overlap with logo if needed, or keeping it behind)
        $pdf->SetFillColor(0, 112, 243); // Brand Blue
        $pdf->Rect(0, 0, 5, 210, 'F');

        // Title & Employee Name (Side by Side)
        $pdf->SetFont('Helvetica', 'B', 16);
        $pdf->SetTextColor(30, 41, 59);
        $pdf->Cell(10); // indent
        $pdf->Cell(65, 10, 'SLIP GAJI DIGITAL', 0, 0, 'L');

        $pdf->SetFont('Helvetica', 'B', 12);
        $pdf->SetTextColor(15, 23, 42);
        $pdf->Cell(0, 10, strtoupper($user['full_name']), 0, 1, 'R');

        // Period & Role (Side by Side)
        $pdf->SetFont('Helvetica', '', 9);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->Cell(10);
        $periodDate = DateTime::createFromFormat('!m-Y', $month . '-' . $year);
        $pdf->Cell(65, 6, 'Periode: ' . $periodDate->format('F Y'), 0, 0, 'L');

        $pdf->SetTextColor(100, 116, 139);
        $pdf->Cell(0, 6, $user['role_name'] . ' (@' . $user['username'] . ')', 0, 1, 'R');

        // Table Components
        $pdf->Ln(10);
        $pdf->Cell(10);
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetFillColor(248, 250, 252);
        $pdf->SetTextColor(71, 85, 105);
        $pdf->Cell(80, 8, ' KOMPONEN PENGHASILAN', 1, 0, 'L', true);
        $pdf->Cell(38, 8, 'JUMLAH ', 1, 1, 'R', true);

        $pdf->SetFont('Helvetica', '', 9);
        $pdf->SetTextColor(15, 23, 42);
        $pdf->Cell(10);
        $pdf->Cell(80, 8, ' Gaji Pokok', 'LR', 0, 'L');
        $pdf->Cell(38, 8, 'Rp ' . number_format($baseSalary, 0, ',', '.') . ' ', 'LR', 1, 'R');

        $pdf->Cell(10);
        $pdf->Cell(80, 8, ' Uang Makan (' . $totalDays . ' Hari x ' . number_format($mealRate / 1000, 0) . 'rb)', 'LR', 0, 'L');
        $pdf->Cell(38, 8, 'Rp ' . number_format($mealAllowance, 0, ',', '.') . ' ', 'LR', 1, 'R');

        $pdf->Cell(10);
        $pdf->SetTextColor(225, 29, 72); // Rose 600
        $pdf->Cell(80, 8, ' Potongan Kasbon', 'LR', 0, 'L');
        $pdf->Cell(38, 8, '- Rp ' . number_format($kasbon, 0, ',', '.') . ' ', 'LR', 1, 'R');

        $pdf->Cell(10);
        $pdf->Cell(118, 0, '', 'T', 1); // Bottom border of table

        // Total
        $pdf->Ln(5);
        $pdf->Cell(10);
        $pdf->SetFont('Helvetica', 'B', 11);
        $pdf->SetTextColor(15, 23, 42);
        $pdf->Cell(80, 10, 'TOTAL TAKE HOME PAY (THP)', 0, 0, 'L');
        $pdf->SetTextColor(0, 112, 243);
        $pdf->Cell(38, 10, 'Rp ' . number_format($totalTHP, 0, ',', '.') . ' ', 0, 1, 'R');

        // --- PERFORMANCE NOTES BOX ---
        // Show for Satpam, Admin, and Bendahara
        $isSatpam = (stripos($user['role_name'], 'Satpam') !== false);
        $isAdminOrBendahara = ($user['role_name'] == 'Admin' || $user['role_name'] == 'Bendahara');

        if ($isSatpam || $isAdminOrBendahara) {
            $pdf->Ln(7);
            $pdf->Cell(10);
            $currentY = $pdf->GetY();

            // Check if we have enough space (A5 height is 210, signature takes ~50)
            if ($currentY > 140) {
                $pdf->AddPage();
                $pdf->SetY(40); // Start below header on new page if needed
                $currentY = $pdf->GetY();
            }

            $pdf->SetY($currentY);
            $pdf->SetX(20);
            $pdf->SetFont('Helvetica', 'B', 8);
            $pdf->SetTextColor(100, 116, 139);
            $pdf->Cell(0, 4, 'REKOMENDASI KINERJA:', 0, 1);

            if ($totalDays > 0) {
                $pdf->SetX(20);
                $pdf->SetFont('Helvetica', 'I', 8);
                $pdf->SetTextColor(71, 85, 105);
                $pdf->MultiCell(113, 4, $perfNote, 0, 'L');
            } else {
                $pdf->SetX(20);
                $pdf->SetFont('Helvetica', 'I', 8);
                $pdf->SetTextColor(148, 163, 184); // Slate 400
                $pdf->Ln(2);
                $pdf->Cell(0, 5, "Data kinerja belum tersedia untuk periode ini.", 0, 1);
            }

            // Reset Y
            $pdf->Ln(5);
        }

        // Footer / Signature
        $creatorName = 'Admin Keuangan'; // Or Auth::user() name if available in scope
        // We need to fetch creator name if not available
        if ($userId) {
            $stmtCreator = $db->query("SELECT full_name FROM users WHERE id = ?", [$userId]);
            $creator = $stmtCreator->fetch();
            if ($creator)
                $creatorName = $creator['full_name'];
        }

        $rtChiefName = $settings['rt_head'] ?? 'Bpk. Koordinator';
        $city = $settings['rt_city'] ?? 'Jakarta';
        $date = $city . ', ' . date('d F Y');

        //$pdf->SignatureBox($date, $creatorName, 'Bendahara', $rtChiefName, 'Mengetahui');

        $pdf->Output('I', 'Slip_Gaji_' . str_replace(' ', '_', $user['full_name']) . '_' . $month . '_' . $year . '.pdf');
        unset($_SESSION['print_target_user_id']);
        unset($_SESSION['print_month']);
        unset($_SESSION['print_year']);
    }

    public function prepare_print()
    {
        if (Auth::role() != 1 && Auth::role() != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['user_id'])) {
            $this->json(['error' => 'User ID required'], 400);
        }

        $_SESSION['print_target_user_id'] = intval($data['user_id']);
        $_SESSION['print_month'] = isset($data['month']) ? intval($data['month']) : date('m');
        $_SESSION['print_year'] = isset($data['year']) ? intval($data['year']) : date('Y');
        $this->json(['success' => true]);
    }

    public function process_salary()
    {
        if (Auth::role() != 1 && Auth::role() != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $targetUserId = $data['user_id'] ?? null;
        if (!$targetUserId)
            $this->json(['error' => 'Target user ID required'], 400);

        $db = Database::getInstance();
        $currentMonth = date('m');
        $currentYear = date('Y');

        // Check if already processed
        $stmtCheck = $db->query("SELECT id FROM salary_payments WHERE user_id = ? AND month = ? AND year = ?", [$targetUserId, $currentMonth, $currentYear]);
        if ($stmtCheck->fetch()) {
            $this->json(['error' => 'Gaji bulan ini sudah diproses sebelumnya.'], 400);
        }

        // Fetch Data for Calculation
        $stmtUser = $db->query("SELECT full_name FROM users WHERE id = ?", [$targetUserId]);
        $user = $stmtUser->fetch();

        $stmtSettings = $db->query("SELECT `key`, `value` FROM settings");
        $settingsRaw = $stmtSettings->fetchAll();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s['key']] = $s['value'];
        }

        $baseSalary = intval($settings['salary_satpam'] ?? 2000000);

        $stmtAtt = $db->query("
            SELECT COUNT(DISTINCT DATE(timestamp)) as total_days 
            FROM attendance 
            WHERE user_id = ? 
            AND type = 'IN' 
            AND MONTH(timestamp) = ? 
            AND YEAR(timestamp) = ?
        ", [$targetUserId, $currentMonth, $currentYear]);
        $totalDays = intval($stmtAtt->fetch()['total_days'] ?? 0);
        $mealRate = intval($settings['meal_allowance_amount'] ?? 25000);
        $mealAllowance = $totalDays * $mealRate;

        $stmtDebt = $db->query("
            SELECT SUM(amount) as total_debt 
            FROM salary_advances 
            WHERE user_id = ? 
            AND status = 'PENDING'
            AND MONTH(date) = ?
            AND YEAR(date) = ?
        ", [$targetUserId, $currentMonth, $currentYear]);
        $kasbon = intval($stmtDebt->fetch()['total_debt'] ?? 0);

        $totalTHP = ($baseSalary + $mealAllowance) - $kasbon;

        // Start Transaction
        try {
            $db->getConnection()->beginTransaction();

            // 1. Insert into finance (Expense)
            $monthName = date('F');
            $description = "Pembayaran Gaji: " . $user['full_name'] . " - " . $monthName . " " . $currentYear;
            $db->query(
                "INSERT INTO finance (type, amount, description, date, created_by) VALUES ('EXPENSE', ?, ?, CURRENT_DATE(), ?)",
                [$totalTHP, $description, Auth::user()]
            );
            $financeId = $db->getConnection()->lastInsertId();

            // 2. Insert into salary_payments
            $db->query(
                "INSERT INTO salary_payments (user_id, month, year, base_salary, meal_allowance, kasbon_deduction, total_thp, finance_id, processed_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [$targetUserId, $currentMonth, $currentYear, $baseSalary, $mealAllowance, $kasbon, $totalTHP, $financeId, Auth::user()]
            );

            // 3. Settle all pending kasbon for the month
            $db->query(
                "UPDATE salary_advances SET status = 'SETTLED' 
                WHERE user_id = ? AND status = 'PENDING' AND MONTH(date) = ? AND YEAR(date) = ?",
                [$targetUserId, $currentMonth, $currentYear]
            );

            $db->getConnection()->commit();
            $this->json(['success' => true, 'message' => 'Gaji berhasil diproses dan dicatat sebagai pengeluaran.']);
        } catch (Exception $e) {
            $db->getConnection()->rollBack();
            $this->json(['error' => 'Gagal memproses gaji: ' . $e->getMessage()], 500);
        }
    }

    public function get_salary_history()
    {
        $userId = Auth::user();
        if (!$userId)
            $this->json(['error' => 'Unauthorized'], 401);

        $roleId = Auth::role();
        $targetUserId = $userId;
        if (($roleId == 1 || $roleId == 2) && isset($_GET['user_id'])) {
            $targetUserId = intval($_GET['user_id']);
        }

        $db = Database::getInstance();
        $stmt = $db->query(
            "SELECT sp.*, u.full_name, p.full_name as processor_name 
            FROM salary_payments sp
            JOIN users u ON sp.user_id = u.id
            JOIN users p ON sp.processed_by = p.id
            WHERE sp.user_id = ?
            ORDER BY sp.year DESC, sp.month DESC",
            [$targetUserId]
        );

        $this->json($stmt->fetchAll());
    }

    public function check_payment_status()
    {
        $uid = $_GET['user_id'] ?? Auth::user();
        $month = $_GET['month'] ?? date('m');
        $year = $_GET['year'] ?? date('Y');

        $db = Database::getInstance();
        $stmt = $db->query("SELECT id FROM salary_payments WHERE user_id = ? AND month = ? AND year = ?", [$uid, $month, $year]);
        $this->json(['is_paid' => (bool) $stmt->fetch()]);
    }

    public function export_pdf()
    {
        require_once __DIR__ . '/../Libs/fpdf/fpdf.php';
        require_once __DIR__ . '/../Libs/CustomPDF.php';
        $db = Database::getInstance();

        $month = $_GET['month'] ?? date('n');
        $year = $_GET['year'] ?? date('Y');

        // 1. Fetch Settings
        $stmtSettings = $db->query("SELECT * FROM settings");
        $settings = [];
        foreach ($stmtSettings->fetchAll() as $s) {
            $settings[$s['key']] = $s['value'];
        }
        $rtName = $settings['rt_name'] ?? 'LINGKUNGAN RT';
        $rtAddress = $settings['rt_address'] ?? 'KAVLING DKI BLOK 14 - LINGKUNGAN RT 05/01';
        $appLogo = $settings['app_logo'] ?? null;

        // 2. Fetch Data (Filtered)
        $stmt = $db->query(
            "SELECT f.*, u.full_name as created_by_name 
             FROM finance f 
             JOIN users u ON f.created_by = u.id 
             WHERE MONTH(f.date) = ? AND YEAR(f.date) = ?
             ORDER BY date ASC",
            [$month, $year]
        );
        $data = $stmt->fetchAll();

        // 3. Generate PDF
        $pdf = new CustomPDF('P', 'mm', 'A4', $rtName, $rtAddress, $appLogo);
        $pdf->AliasNbPages(); // for footer page numbering
        $pdf->AddPage();

        $pdf->SetFont('Helvetica', 'B', 16);
        $pdf->Cell(0, 10, 'LAPORAN KEUANGAN KAS RT', 0, 1, 'C');

        $monthNames = [1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'];
        $pdf->SetFont('Helvetica', 'B', 12);
        $pdf->Cell(0, 7, strtoupper($monthNames[$month] ?? '') . ' ' . $year, 0, 1, 'C');
        $pdf->Ln(5);

        // Header handled by CustomPDF, so no manual header here needed except title

        // Table Header
        $pdf->SetFillColor(240, 240, 240);
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->Cell(30, 10, ' TANGGAL', 1, 0, 'L', true);
        $pdf->Cell(80, 10, ' KETERANGAN', 1, 0, 'L', true);
        $pdf->Cell(30, 10, ' TIPE', 1, 0, 'C', true);
        $pdf->Cell(50, 10, ' JUMLAH ', 1, 1, 'R', true);

        $pdf->SetFont('Helvetica', '', 9);
        $totalIn = 0;
        $totalOut = 0;

        foreach ($data as $row) {
            $amount = floatval($row['amount']);
            if ($row['type'] === 'INCOME')
                $totalIn += $amount;
            else
                $totalOut += $amount;

            $desc = ' ' . $row['description'];
            $startX = $pdf->GetX();
            $startY = $pdf->GetY();

            // 1. Column Date
            $pdf->Cell(30, 0, '', 0); // Placeholder to measure
            $xAfterDate = $pdf->GetX();

            // Calculate height for MultiCell
            $pdf->SetXY($xAfterDate, $startY);
            $pdf->MultiCell(80, 8, $desc, 1, 'L');
            $endY = $pdf->GetY();
            $lineHeight = $endY - $startY;

            // Reset and Draw other cells with the same height
            $pdf->SetXY($startX, $startY);
            $pdf->Cell(30, $lineHeight, ' ' . date('d/m/Y', strtotime($row['date'])), 1);

            // Move to Type column
            $pdf->SetXY($startX + 30 + 80, $startY);
            $pdf->Cell(30, $lineHeight, ' ' . $row['type'], 1, 0, 'C');

            // Move to Amount column
            $prefix = ($row['type'] === 'INCOME') ? '+' : '-';
            $pdf->Cell(50, $lineHeight, $prefix . ' Rp ' . number_format($amount, 0, ',', '.') . ' ', 1, 1, 'R');
        }

        // Summary
        $pdf->Ln(10);
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->Cell(140, 8, 'TOTAL PEMASUKAN', 0, 0, 'R');
        $pdf->Cell(50, 8, 'Rp ' . number_format($totalIn, 0, ',', '.') . ' ', 0, 1, 'R');
        $pdf->Cell(140, 8, 'TOTAL PENGELUARAN', 0, 0, 'R');
        $pdf->Cell(50, 8, 'Rp ' . number_format($totalOut, 0, ',', '.') . ' ', 0, 1, 'R');

        $pdf->SetFillColor(230, 242, 255);
        $pdf->Cell(140, 10, 'SALDO BERSIH BULANAN', 0, 0, 'R', true);
        $pdf->Cell(50, 10, 'Rp ' . number_format($totalIn - $totalOut, 0, ',', '.') . ' ', 0, 1, 'R', true);

        // Signature Block
        $creatorName = isset($data[0]['created_by_name']) ? $data[0]['created_by_name'] : 'Admin Keuangan';
        $rtChiefName = $settings['rt_head'] ?? 'Bpk.';
        $city = $settings['rt_city'] ?? 'Malang';
        $date = $city . ', ' . date('d F Y');

        $pdf->SignatureBox($date, $creatorName, 'Bendahara', $rtChiefName, 'Mengetahui,');

        $pdf->Output('I', 'Laporan_Keuangan_RT_' . $month . '_' . $year . '.pdf');
    }

    public function export_lpj_pdf()
    {
        require_once __DIR__ . '/../Libs/fpdf/fpdf.php';
        require_once __DIR__ . '/../Libs/CustomPDF.php';
        $db = Database::getInstance();

        $year = $_GET['year'] ?? date('Y');

        // 1. Fetch Settings
        $stmtSettings = $db->query("SELECT * FROM settings");
        $settings = [];
        foreach ($stmtSettings->fetchAll() as $s) {
            $settings[$s['key']] = $s['value'];
        }
        $rtName = $settings['rt_name'] ?? 'LINGKUNGAN RT';
        $rtAddress = $settings['rt_address'] ?? 'KAVLING DKI BLOK 14 - LINGKUNGAN RT 05/01';
        $appLogo = $settings['app_logo'] ?? null;

        // 2. Fetch Annual Data (Grouped by Month)
        $stmt = $db->query("
            SELECT 
                MONTH(date) as month,
                SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_expense
            FROM finance 
            WHERE YEAR(date) = ?
            GROUP BY MONTH(date)
            ORDER BY month ASC
        ", [$year]);
        $monthlyData = $stmt->fetchAll();

        // Map data to array 1-12
        $reportData = array_fill(1, 12, ['income' => 0, 'expense' => 0]);
        foreach ($monthlyData as $row) {
            $reportData[intval($row['month'])] = [
                'income' => floatval($row['total_income']),
                'expense' => floatval($row['total_expense'])
            ];
        }

        // 3. Generate PDF
        $pdf = new CustomPDF('P', 'mm', 'A4', $rtName, $rtAddress, $appLogo);
        $pdf->AliasNbPages();
        $pdf->AddPage();

        $pdf->SetFont('Helvetica', 'B', 14);
        $pdf->Cell(0, 8, 'LAPORAN PERTANGGUNGJAWABAN (LPJ)', 0, 1, 'C');
        $pdf->SetFont('Helvetica', 'B', 12);
        $pdf->Cell(0, 8, 'KEUANGAN DAN KAS RT - TAHUN ' . $year, 0, 1, 'C');
        $pdf->Ln(10);

        // Table Header
        $pdf->SetFillColor(230, 230, 230);
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->Cell(15, 10, 'NO', 1, 0, 'C', true);
        $pdf->Cell(45, 10, 'BULAN', 1, 0, 'L', true);
        $pdf->Cell(45, 10, 'PEMASUKAN', 1, 0, 'R', true);
        $pdf->Cell(45, 10, 'PENGELUARAN', 1, 0, 'R', true);
        $pdf->Cell(40, 10, 'SALDO BULAN', 1, 1, 'R', true);

        $pdf->SetFont('Helvetica', '', 10);
        $monthNames = [1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'];

        $grandTotalIn = 0;
        $grandTotalOut = 0;

        for ($i = 1; $i <= 12; $i++) {
            $in = $reportData[$i]['income'];
            $out = $reportData[$i]['expense'];
            $net = $in - $out;

            $grandTotalIn += $in;
            $grandTotalOut += $out;

            $pdf->Cell(15, 8, $i, 1, 0, 'C');
            $pdf->Cell(45, 8, ' ' . $monthNames[$i], 1, 0, 'L');
            $pdf->Cell(45, 8, 'Rp ' . number_format($in, 0, ',', '.') . ' ', 1, 0, 'R');
            $pdf->Cell(45, 8, 'Rp ' . number_format($out, 0, ',', '.') . ' ', 1, 0, 'R');

            // Highlight negative net
            if ($net < 0)
                $pdf->SetTextColor(220, 50, 50);
            $pdf->Cell(40, 8, 'Rp ' . number_format($net, 0, ',', '.') . ' ', 1, 1, 'R');
            $pdf->SetTextColor(0, 0, 0);
        }

        // Grand Totals
        $pdf->Ln(2);
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->SetFillColor(240, 248, 255);
        $pdf->Cell(60, 10, 'TOTAL TAHUNAN', 1, 0, 'C', true);
        $pdf->Cell(45, 10, 'Rp ' . number_format($grandTotalIn, 0, ',', '.') . ' ', 1, 0, 'R', true);
        $pdf->Cell(45, 10, 'Rp ' . number_format($grandTotalOut, 0, ',', '.') . ' ', 1, 0, 'R', true);
        $pdf->Cell(40, 10, 'Rp ' . number_format($grandTotalIn - $grandTotalOut, 0, ',', '.') . ' ', 1, 1, 'R', true);

        // Summary Text
        $pdf->Ln(5);
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->MultiCell(0, 5, "Total Saldo Bersih (Surplus/Defisit) untuk Tahun $year adalah sebesar Rp " . number_format($grandTotalIn - $grandTotalOut, 0, ',', '.') . ".");

        // Signature
        $rtChiefName = $settings['rt_head'] ?? 'Bpk. Ketua RT';
        $city = $settings['rt_city'] ?? 'Jakarta';
        $date = $city . ', ' . date('d F Y');

        $pdf->SignatureBox($date, 'Admin Keuangan', 'Bendahara', $rtChiefName, 'Mengetahui, Ketua RT');

        $pdf->Output('I', 'LPJ_Keuangan_RT_Tahun_' . $year . '.pdf');
    }

    public function export_csv()
    {
        $db = Database::getInstance();
        $month = $_GET['month'] ?? date('n');
        $year = $_GET['year'] ?? date('Y');

        $stmt = $db->query(
            "SELECT * FROM finance 
             WHERE MONTH(date) = ? AND YEAR(date) = ?
             ORDER BY date ASC",
            [$month, $year]
        );
        $data = $stmt->fetchAll();

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=Laporan_Keuangan_RT_' . $month . '_' . $year . '.csv');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['Tanggal', 'Keterangan', 'Tipe', 'Jumlah']);

        foreach ($data as $row) {
            fputcsv($output, [
                $row['date'],
                $row['description'],
                $row['type'],
                $row['amount']
            ]);
        }
        fclose($output);
    }

    public function get_monthly_recap()
    {
        $year = $_GET['year'] ?? date('Y');
        $db = Database::getInstance();

        $stmt = $db->query("
            SELECT 
                MONTH(date) as month,
                SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_expense
            FROM finance 
            WHERE YEAR(date) = ?
            GROUP BY MONTH(date)
            ORDER BY month ASC
        ", [$year]);

        $raw = $stmt->fetchAll();
        $recap = array_fill(1, 12, ['income' => 0, 'expense' => 0]);

        foreach ($raw as $row) {
            $recap[intval($row['month'])] = [
                'income' => intval($row['total_income']),
                'expense' => intval($row['total_expense'])
            ];
        }

        $this->json(['year' => $year, 'data' => $recap]);
    }

    public function update()
    {
        // Only Admin or Bendahara
        $role = Auth::role();
        if ($role != 1 && $role != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            $this->json(['error' => 'ID required'], 400);
        }

        $this->validate($data, ['type', 'amount', 'description', 'date']);

        $db = Database::getInstance();
        $db->query(
            "UPDATE finance SET type = ?, amount = ?, description = ?, date = ? WHERE id = ?",
            [$data['type'], $data['amount'], $data['description'], $data['date'], $data['id']]
        );

        $this->json(['success' => true]);
    }

    public function destroy()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $id = $_GET['id'] ?? null;
        if (!$id)
            $this->json(['error' => 'ID required'], 400);

        $db = Database::getInstance();
        $db->query("DELETE FROM finance WHERE id = ?", [$id]);
        $this->json(['success' => true]);
    }

    public function get_analytics()
    {
        $db = Database::getInstance();

        // 1. Monthly Trends (Last 6 Months)
        $trendsQuery = "
            SELECT 
                DATE_FORMAT(date, '%Y-%m') as month,
                SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
            FROM finance 
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY month 
            ORDER BY month ASC
        ";
        $trends = $db->query($trendsQuery)->fetchAll();

        // 2. Fee Participation (Current Month)
        $month = date('n');
        $year = date('Y');

        $partQuery = "
            SELECT 
                status, COUNT(*) as count, SUM(amount) as total
            FROM invoices 
            WHERE month = ? AND year = ?
            GROUP BY status
        ";
        $participation = $db->query($partQuery, [$month, $year])->fetchAll();

        $this->json([
            'trends' => $trends,
            'participation' => $participation
        ]);
    }

    public function get_allocation()
    {
        $db = Database::getInstance();
        $year = $_GET['year'] ?? date('Y');
        $month = $_GET['month'] ?? date('n');

        // Aggregating expenses by keywords in description
        $query = "
            SELECT description, amount 
            FROM finance 
            WHERE type = 'EXPENSE' AND MONTH(date) = ? AND YEAR(date) = ?
        ";
        $expenses = $db->query($query, [$month, $year])->fetchAll();

        $categories = [
            'Gaji & Honor' => 0,
            'Kebersihan & Sampah' => 0,
            'Listrik & Air' => 0,
            'Sosial & Santunan' => 0,
            'Perbaikan & Sarana' => 0,
            'Kegiatan RT' => 0,
            'Lain-lain' => 0
        ];

        foreach ($expenses as $e) {
            $desc = strtolower($e['description']);
            $amount = (float) $e['amount'];

            if (strpos($desc, 'gaji') !== false || strpos($desc, 'honor') !== false || strpos($desc, 'insentif') !== false) {
                $categories['Gaji & Honor'] += $amount;
            } elseif (strpos($desc, 'sampah') !== false || strpos($desc, 'bersih') !== false || strpos($desc, 'fogging') !== false) {
                $categories['Kebersihan & Sampah'] += $amount;
            } elseif (strpos($desc, 'listrik') !== false || strpos($desc, 'pajak') !== false || strpos($desc, 'air') !== false || strpos($desc, 'pln') !== false) {
                $categories['Listrik & Air'] += $amount;
            } elseif (strpos($desc, 'sosial') !== false || strpos($desc, 'santunan') !== false || strpos($desc, 'duka') !== false || strpos($desc, 'sumbangan') !== false) {
                $categories['Sosial & Santunan'] += $amount;
            } elseif (strpos($desc, 'perbaikan') !== false || strpos($desc, 'renovasi') !== false || strpos($desc, 'bangun') !== false || strpos($desc, 'cat') !== false) {
                $categories['Perbaikan & Sarana'] += $amount;
            } elseif (strpos($desc, 'rapat') !== false || strpos($desc, 'kunjungan') !== false || strpos($desc, 'acara') !== false || strpos($desc, 'hut') !== false || strpos($desc, 'agustus') !== false) {
                $categories['Kegiatan RT'] += $amount;
            } else {
                $categories['Lain-lain'] += $amount;
            }
        }

        // Format for Chart.js
        $result = [];
        foreach ($categories as $label => $value) {
            if ($value > 0) {
                $result[] = ['label' => $label, 'value' => $value];
            }
        }

        $this->json($result);
    }
}
