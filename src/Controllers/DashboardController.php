<?php

class DashboardController extends BaseController
{
    public function index()
    {
        $db = Database::getInstance();
        $stats = [];

        // 1. Total Warga
        $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role_id = 4");
        $stats['total_warga'] = $stmt->fetch()['total'] ?? 0;

        // 2. Saldo Kas RT
        $stmt = $db->query("SELECT 
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) - 
            SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as balance 
            FROM finance");
        $stats['saldo_kas'] = $stmt->fetch()['balance'] ?? 0;

        // 3. Absensi Hari Ini (Hanya IN)
        $stmt = $db->query("SELECT COUNT(*) as total FROM attendance WHERE clock_in IS NOT NULL AND date = CURDATE()");
        $stats['absensi_today'] = $stmt->fetch()['total'] ?? 0;

        // 4. Tagihan Tertunggak & Total Tunggakan
        try {
            $stmt = $db->query("SELECT COUNT(*) as count, SUM(total_amount) as total FROM invoices WHERE status = 'UNPAID'");
            $invData = $stmt->fetch();
            $stats['unpaid_invoices'] = $invData['count'] ?? 0;
            $stats['total_arrears'] = $invData['total'] ?? 0;
        } catch (Exception $e) {
            $stats['unpaid_invoices'] = 0;
            $stats['total_arrears'] = 0;
        }

        // --- Patrol Shift Logic ---
        $now = new DateTime('now', new DateTimeZone('Asia/Jakarta'));
        $currentHour = (int) $now->format('H');
        $todayStr = $now->format('Y-m-d');

        $shiftName = 'Pagi'; // Default
        $shiftStart = "$todayStr 07:00:00";
        $shiftEnd = "$todayStr 15:00:00";

        if ($currentHour >= 7 && $currentHour < 15) {
            $shiftName = 'Pagi';
            $shiftStart = "$todayStr 07:00:00";
            $shiftEnd = "$todayStr 15:00:00";
        } elseif ($currentHour >= 15 && $currentHour < 23) {
            $shiftName = 'Sore';
            $shiftStart = "$todayStr 15:00:00";
            $shiftEnd = "$todayStr 23:00:00";
        } else {
            $shiftName = 'Malam';
            // Logic Malam (23:00 - 07:00)
            if ($currentHour >= 23) {
                // 23:00 s/d 23:59 (Hari ini -> Besok)
                $shiftStart = "$todayStr 23:00:00";
                $shiftEnd = $now->modify('+1 day')->format('Y-m-d') . " 07:00:00";
            } else {
                // 00:00 s/d 06:59 (Kemarin -> Hari ini)
                $yesterday = $now->modify('-1 day')->format('Y-m-d');
                $todayDate = $now->format('Y-m-d'); // Reset object? No, modify changes it. careful.
                // Re-init for clear dates
                $n = new DateTime('now', new DateTimeZone('Asia/Jakarta'));
                $y = (clone $n)->modify('-1 day');

                $shiftStart = $y->format('Y-m-d') . " 23:00:00";
                $shiftEnd = $n->format('Y-m-d') . " 07:00:00";
            }
        }

        // 5. Patrol Coverage (Unique checkpoints today vs Total)
        $stmt = $db->query("SELECT COUNT(*) as total FROM checkpoints WHERE type = 'PATROL'");
        $totalCheckpoints = $stmt->fetch()['total'] ?? 0;

        $stmtLog = $db->query("SELECT scans FROM daily_patrol_logs WHERE date = CURDATE()");
        $scannedIds = [];
        foreach ($stmtLog->fetchAll() as $row) {
            $scans = json_decode($row['scans'], true);
            foreach ($scans as $s)
                $scannedIds[$s['checkpoint_id']] = true;
        }
        $scannedToday = count($scannedIds);

        $stats['patrol_coverage'] = $totalCheckpoints > 0 ? round(($scannedToday / $totalCheckpoints) * 100) : 0;
        $stats['total_checkpoints'] = $totalCheckpoints;
        $stats['scanned_today'] = $scannedToday;

        // 6. Recent Activities (Synthesized from multiple tables)
        $activities = [];

        // - New Residents
        $stmt = $db->query("SELECT full_name as title, 'Terdaftar sebagai warga baru' as description, created_at as time, 'user' as type 
                            FROM users WHERE role_id = 4 ORDER BY created_at DESC LIMIT 5");
        $activities = array_merge($activities, $stmt->fetchAll());

        // - Finance Activities
        $stmt = $db->query("SELECT description as title, 
                            (CASE WHEN type = 'INCOME' THEN CONCAT('Pemasukan: Rp ', CAST(amount AS CHAR)) ELSE CONCAT('Pengeluaran: Rp ', CAST(amount AS CHAR)) END) as description, 
                            created_at as time, 'finance' as type 
                            FROM finance ORDER BY created_at DESC LIMIT 5");
        $activities = array_merge($activities, $stmt->fetchAll());

        // - Patrol Activities (Complex for JSON, so we just show "X Patrols Today")
        $stmt = $db->query("
            SELECT u.full_name as title, 'Melakukan patroli rutin' as description, MAX(dpl.date) as time, 'patrol' as type 
            FROM daily_patrol_logs dpl
            JOIN users u ON dpl.user_id = u.id
            GROUP BY u.id, u.full_name, dpl.date
            ORDER BY dpl.date DESC LIMIT 5
        ");
        $activities = array_merge($activities, $stmt->fetchAll());

        // Sort by time DESC
        usort($activities, function ($a, $b) {
            return strtotime($b['time']) - strtotime($a['time']);
        });
        $stats['recent_activities'] = array_slice($activities, 0, 10);

        // 7. Patrol Findings (Last 10 with images or notes - Needs manual extract from JSON)
        $findings = [];
        $stmtFindings = $db->query("
            SELECT dpl.*, u.full_name as satpam_name 
            FROM daily_patrol_logs dpl
            JOIN users u ON dpl.user_id = u.id
            ORDER BY dpl.date DESC LIMIT 20
        ");

        $stmtCp = $db->query("SELECT id, name FROM checkpoints");
        $cpMap = [];
        foreach ($stmtCp->fetchAll() as $cp)
            $cpMap[$cp['id']] = $cp['name'];

        foreach ($stmtFindings->fetchAll() as $row) {
            $scans = json_decode($row['scans'], true);
            foreach ($scans as $s) {
                if (!empty($s['notes']) || !empty($s['image'])) {
                    $findings[] = [
                        'checkpoint_name' => $cpMap[$s['checkpoint_id']] ?? 'Unknown',
                        'satpam_name' => $row['satpam_name'],
                        'timestamp' => "{$row['date']} {$s['time']}",
                        'notes' => $s['notes'],
                        'image_proof' => $s['image']
                    ];
                }
            }
        }
        usort($findings, fn($a, $b) => strcmp($b['timestamp'], $a['timestamp']));
        $stats['patrol_findings'] = array_slice($findings, 0, 10);

        // --- Real-Time Patrol Status ---
        $stmtSt = $db->query("SELECT scans FROM daily_patrol_logs WHERE date = CURDATE()");
        $dayScans = [];
        foreach ($stmtSt->fetchAll() as $row) {
            $scans = json_decode($row['scans'], true);
            foreach ($scans as $s) {
                if (!isset($dayScans[$s['checkpoint_id']]) || $s['time'] > $dayScans[$s['checkpoint_id']]['time']) {
                    $dayScans[$s['checkpoint_id']] = $s;
                }
            }
        }

        $stmtCpAll = $db->query("SELECT id, name FROM checkpoints WHERE type = 'PATROL' ORDER BY name ASC");
        $patrolStatus = [];
        foreach ($stmtCpAll->fetchAll() as $cp) {
            $scan = $dayScans[$cp['id']] ?? null;
            $patrolStatus[] = [
                'id' => $cp['id'],
                'name' => $cp['name'],
                'status' => $scan ? 'scanned' : 'pending',
                'scanned_at' => $scan ? "{$todayStr} {$scan['time']}" : null,
                'satpam' => 'Petugas' // Simplified
            ];
        }
        $stats['patrol_status'] = $patrolStatus;

        // Add current shift info
        $stats['current_shift'] = [
            'name' => $shiftName,
            'start' => $shiftStart,
            'end' => $shiftEnd
        ];

        $this->json($stats);
    }

    public function publicStats()
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role_id = 4");
        $total = $stmt->fetch()['total'] ?? 0;
        $this->json(['total_warga' => (int)$total]);
    }
}
