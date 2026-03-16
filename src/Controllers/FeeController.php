<?php

class FeeController extends BaseController
{
    public function get_status()
    {
        $userId = $_GET['user_id'] ?? null;
        $year = $_GET['year'] ?? date('Y');

        if (!$userId) {
            $this->json(['error' => 'User ID is required'], 400);
        }

        $db = Database::getInstance();
        $stmt = $db->query(
            "SELECT month, amount, paid_at FROM fee_payments WHERE user_id = ? AND year = ?",
            [$userId, $year]
        );
        $payments = $stmt->fetchAll();

        $this->json($payments);
    }

    public function pay()
    {
        // Only Admin or Bendahara
        $role = Auth::role();
        if ($role != 1 && $role != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['user_id', 'month', 'year', 'amount']);

        $db = Database::getInstance();

        // 1. Get all active fee categories
        $stmtCats = $db->query("SELECT * FROM fee_categories WHERE is_active = 1");
        $categories = $stmtCats->fetchAll();

        if (empty($categories)) {
            $stmtSettings = $db->query("SELECT value FROM settings WHERE `key` = 'fee_amount'");
            $defaultAmount = $stmtSettings->fetch()['value'] ?? 100000;
            $categories = [['name' => 'Iuran Bulanan', 'amount' => $defaultAmount]];
        }

        $totalAmount = 0;
        $itemDescriptions = [];
        foreach ($categories as $cat) {
            $totalAmount += $cat['amount'];
            $itemDescriptions[] = "{$cat['name']} (Rp " . number_format($cat['amount'], 0, ',', '.') . ")";
        }

        // Get User Name for Description
        $stmt = $db->query("SELECT full_name FROM users WHERE id = ?", [$data['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            $this->json(['error' => 'User not found'], 404);
        }

        $monthNames = [1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'];
        $monthName = $monthNames[$data['month']] ?? $data['month'];

        $itemizedDesc = implode(", ", $itemDescriptions);
        $description = "Pembayaran Iuran {$monthName} {$data['year']} - {$user['full_name']} [{$itemizedDesc}]";

        try {
            // 1. Create Finance Record
            $db->query(
                "INSERT INTO finance (type, amount, description, date, created_by) VALUES (?, ?, ?, ?, ?)",
                ['INCOME', $totalAmount, $description, date('Y-m-d'), Auth::user()]
            );
            $financeId = $db->lastInsertId();

            // 2. Create Fee Payment Record
            $db->query(
                "INSERT INTO fee_payments (user_id, month, year, amount, finance_id) VALUES (?, ?, ?, ?, ?)",
                [$data['user_id'], $data['month'], $data['year'], $totalAmount, $financeId]
            );

            // 3. Mark Invoice as PAID (If exists)
            $db->query(
                "UPDATE invoices SET status = 'PAID', finance_id = ? WHERE user_id = ? AND month = ? AND year = ?",
                [$financeId, $data['user_id'], $data['month'], $data['year']]
            );

            $this->json(['success' => true, 'message' => 'Pembayaran berhasil dicatat', 'amount' => $totalAmount]);
        } catch (Exception $e) {
            $this->json(['error' => 'Pembayaran gagal atau sudah pernah dicatat untuk bulan ini'], 400);
        }
    }

    public function get_all_summary()
    {
        // Get status for all warga for specific month
        $month = $_GET['month'] ?? date('n');
        $year = $_GET['year'] ?? date('Y');

        $db = Database::getInstance();
        $stmt = $db->query(
            "SELECT user_id FROM fee_payments WHERE month = ? AND year = ?",
            [$month, $year]
        );
        $paidUsers = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $this->json($paidUsers);
    }

    public function pay_bulk()
    {
        $role = Auth::role();
        if ($role != 1 && $role != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['user_ids', 'month', 'year', 'amount']);

        $db = Database::getInstance();

        // 1. Get all active fee categories
        $stmtCats = $db->query("SELECT * FROM fee_categories WHERE is_active = 1");
        $categories = $stmtCats->fetchAll();

        if (empty($categories)) {
            $stmtSettings = $db->query("SELECT value FROM settings WHERE `key` = 'fee_amount'");
            $defaultAmount = $stmtSettings->fetch()['value'] ?? 100000;
            $categories = [['name' => 'Iuran Bulanan', 'amount' => $defaultAmount]];
        }

        $totalAmount = 0;
        $itemDescriptions = [];
        foreach ($categories as $cat) {
            $totalAmount += $cat['amount'];
            $itemDescriptions[] = "{$cat['name']} (Rp " . number_format($cat['amount'], 0, ',', '.') . ")";
        }
        $itemizedDesc = implode(", ", $itemDescriptions);

        $count = 0;
        try {
            foreach ($data['user_ids'] as $userId) {
                // Get User Name
                $stmt = $db->query("SELECT full_name FROM users WHERE id = ?", [$userId]);
                $user = $stmt->fetch();
                if (!$user)
                    continue;

                $monthNames = [1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'];
                $monthName = $monthNames[$data['month']] ?? $data['month'];
                $description = "Iuran Kolektif {$monthName} {$data['year']} - {$user['full_name']} [{$itemizedDesc}]";

                // Insert to finance
                $db->query(
                    "INSERT INTO finance (type, amount, description, date, created_by) VALUES (?, ?, ?, ?, ?)",
                    ['INCOME', $totalAmount, $description, date('Y-m-d'), Auth::user()]
                );
                $financeId = $db->lastInsertId();

                // Insert to fee_payments
                $db->query(
                    "INSERT INTO fee_payments (user_id, month, year, amount, finance_id) VALUES (?, ?, ?, ?, ?)",
                    [$userId, $data['month'], $data['year'], $totalAmount, $financeId]
                );

                // Mark Invoice as PAID (If exists)
                $db->query(
                    "UPDATE invoices SET status = 'PAID', finance_id = ? WHERE user_id = ? AND month = ? AND year = ?",
                    [$financeId, $userId, $data['month'], $data['year']]
                );

                $count++;
            }

            $this->json(['success' => true, 'message' => "$count pembayaran kolektif berhasil dicatat", 'amount_per_person' => $totalAmount]);
        } catch (Exception $e) {
            $this->json(['error' => 'Beberapa pembayaran mungkin gagal (sudah terbayar sebelumnya)'], 400);
        }
    }

    public function get_arrears_summary()
    {
        $year = $_GET['year'] ?? date('Y');

        $db = Database::getInstance();

        // Query INVOICES directly for UNPAID status
        // This aligns with the "Digital Invoice" system.
        // If an invoice is not generated, it is NOT considered arrears.
        $stmt = $db->query(
            "SELECT user_id, month 
             FROM invoices 
             WHERE status = 'UNPAID' AND year = ?
             ORDER BY month ASC",
            [$year]
        );
        $unpaidInvoices = $stmt->fetchAll();

        $arrears = [];
        $monthNames = [1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'];

        foreach ($unpaidInvoices as $inv) {
            $uid = $inv['user_id'];
            if (!isset($arrears[$uid])) {
                $arrears[$uid] = [
                    'count' => 0,
                    'months' => []
                ];
            }

            $arrears[$uid]['count']++;
            $arrears[$uid]['months'][] = $monthNames[$inv['month']] ?? $inv['month'];
        }

        $this->json($arrears);
    }
}
