<?php

class InvoiceController extends BaseController
{
    public function index()
    {
        $role = Auth::role();
        $userId = Auth::user();
        $db = Database::getInstance();
        $month = $_GET['month'] ?? date('n');
        $year = $_GET['year'] ?? date('Y');
        $status = $_GET['status'] ?? null;
        $targetUserId = $_GET['user_id'] ?? null;

        if ($role == 1 || $role == 2) {
            // Admin/Bendahara can see all with filters
            $query = "SELECT i.*, u.full_name, u.username, f.date as paid_at
                      FROM invoices i 
                      JOIN users u ON i.user_id = u.id 
                      LEFT JOIN finance f ON i.finance_id = f.id
                      WHERE 1=1";
            $params = [];

            if (!empty($month)) {
                $query .= " AND i.month = ?";
                $params[] = $month;
            }

            if (!empty($year)) {
                $query .= " AND i.year = ?";
                $params[] = $year;
            }

            if ($status) {
                $query .= " AND i.status = ?";
                $params[] = $status;
            }

            if ($targetUserId) {
                $query .= " AND i.user_id = ?";
                $params[] = $targetUserId;
            }

            $query .= " ORDER BY i.year DESC, i.month DESC, u.full_name ASC";
            $stmt = $db->query($query, $params);
        } else {
            // Residents only see theirs
            $stmt = $db->query(
                "SELECT i.*, u.full_name, f.date as paid_at 
                 FROM invoices i 
                 JOIN users u ON i.user_id = u.id 
                 LEFT JOIN finance f ON i.finance_id = f.id
                 WHERE i.user_id = ?
                 ORDER BY i.year DESC, i.month DESC",
                [$userId]
            );
        }

        $this->json($stmt->fetchAll());
    }

    public function generate_monthly()
    {
        if (Auth::role() != 1 && Auth::role() != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $month = $data['month'] ?? date('n');
        $year = $data['year'] ?? date('Y');

        $db = Database::getInstance();

        // 1. Get all active fee categories
        $stmtCats = $db->query("SELECT * FROM fee_categories WHERE is_active = 1");
        $categories = $stmtCats->fetchAll();

        if (empty($categories)) {
            // Fallback to settings if no categories defined yet
            $stmtSettings = $db->query("SELECT value FROM settings WHERE `key` = 'fee_amount'");
            $defaultAmount = $stmtSettings->fetch()['value'] ?? 100000;
            $categories = [['name' => 'Iuran Bulanan', 'amount' => $defaultAmount]];
        }

        $totalAmount = 0;
        foreach ($categories as $cat) {
            $totalAmount += $cat['amount'];
        }

        // 2. Get all residents (role_id = 4) who are KK Heads (is_kk_head = 1)
        // Note: Joining with warga table to check is_kk_head
        $stmtWarga = $db->query("
            SELECT u.id 
            FROM users u 
            JOIN warga w ON u.id = w.user_id 
            WHERE u.role_id = 4 AND w.is_kk_head = 1
        ");
        $wargaIds = $stmtWarga->fetchAll(PDO::FETCH_COLUMN);

        $count = 0;
        foreach ($wargaIds as $uid) {
            try {
                // Insert Invoice
                $db->query(
                    "INSERT IGNORE INTO invoices (user_id, month, year, amount, status) VALUES (?, ?, ?, ?, 'UNPAID')",
                    [$uid, $month, $year, $totalAmount]
                );

                $invoiceId = $db->lastInsertId();

                if ($invoiceId) {
                    // Insert Items
                    foreach ($categories as $cat) {
                        $db->query(
                            "INSERT INTO invoice_items (invoice_id, category_name, amount) VALUES (?, ?, ?)",
                            [$invoiceId, $cat['name'], $cat['amount']]
                        );
                    }
                    $count++;
                }
            } catch (Exception $e) {
                // Ignore duplicates
            }
        }

        $this->json(['success' => true, 'message' => "$count tagihan berhasil dibuat/diverifikasi."]);
    }

    public function print_invoice()
    {
        require_once __DIR__ . '/../Libs/fpdf/fpdf.php';
        require_once __DIR__ . '/../Libs/CustomPDF.php';

        $id = $_GET['id'] ?? null;
        if (!$id)
            die('ID Required');

        $db = Database::getInstance();
        $stmt = $db->query(
            "SELECT i.*, u.full_name, u.username 
             FROM invoices i 
             JOIN users u ON i.user_id = u.id 
             WHERE i.id = ?",
            [$id]
        );
        $invoice = $stmt->fetch();

        if (!$invoice)
            die('Invoice not found');

        // Authorization check
        if (Auth::role() == 4 && $invoice['user_id'] != Auth::user()) {
            die('Unauthorized');
        }

        // Fetch Settings
        $stmtSettings = $db->query("SELECT * FROM settings");
        $settingsRaw = $stmtSettings->fetchAll();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s['key']] = $s['value'];
        }
        $rtName = $settings['rt_name'] ?? 'LINGKUNGAN RT';
        $rtAddress = $settings['rt_address'] ?? 'KAVLING DKI';
        $appLogo = $settings['app_logo'] ?? null;

        // Fetch Invoice Items
        $stmtItems = $db->query("SELECT * FROM invoice_items WHERE invoice_id = ?", [$id]);
        $items = $stmtItems->fetchAll();

        // If no items (old invoice), create a fallback
        if (empty($items)) {
            $items = [['category_name' => 'Iuran Bulanan Lingkungan RT', 'amount' => $invoice['amount']]];
        }

        // --- PDF GENERATION (V3: MODERN FINTECH EXECUTIVE) ---
        $pdf = new CustomPDF('P', 'mm', array(148, 210), $rtName, $rtAddress, $appLogo);
        $pdf->AliasNbPages();
        $pdf->AddPage();
        $pdf->SetAutoPageBreak(true, 15);

        // 1. Geometric Background & Premium Accents
        $pdf->SetFillColor(248, 250, 252); // Slate 50
        $pdf->Rect(0, 0, 148, 210, 'F');

        // Gradient-like Sidebar Strip
        $pdf->SetFillColor(16, 185, 129); // Emerald 500
        $pdf->Rect(0, 0, 5, 210, 'F');
        $pdf->SetFillColor(5, 150, 105); // Emerald 600
        $pdf->Rect(0, 0, 1.5, 210, 'F');

        // Abstract Circles (Fintech Style)
        $pdf->SetDrawColor(209, 250, 229); // Emerald 100
        $pdf->SetFillColor(236, 253, 245); // Emerald 50
        $pdf->Circle(140, 10, 25, 'F');
        $pdf->Circle(5, 200, 15, 'F');

        // Main Paper Container
        $pdf->SetFillColor(255, 255, 255);
        $pdf->RoundedRect(12, 45, 124, 150, 5, 'F');
        $pdf->SetDrawColor(241, 245, 249);
        $pdf->RoundedRect(12, 45, 124, 150, 5, 'D');

        // 2. Title Section
        $pdf->SetY(30);
        $pdf->SetFont('Helvetica', 'B', 22);
        $pdf->SetTextColor(15, 23, 42);
        $pdf->Cell(0, 10, 'TAGIHAN', 0, 1, 'C');

        $pdf->SetY(41);
        $pdf->SetFont('Helvetica', 'B', 7);
        $pdf->SetTextColor(100, 116, 139);
        $monthNames = [1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'];
        $periodStr = strtoupper($monthNames[$invoice['month']] . ' ' . $invoice['year']);
        $pdf->Cell(0, 4, 'PERIODE TAGIHAN: ' . $periodStr, 0, 1, 'C');

        // 3. Document Details Strip
        $pdf->SetY(52);
        $pdf->SetX(18);
        $pdf->SetFont('Helvetica', 'B', 7);
        $pdf->SetTextColor(148, 163, 184);
        $pdf->Cell(60, 4, 'DITUJUKAN KEPADA:', 0, 0);
        $pdf->Cell(52, 4, 'INFO TAGIHAN:', 0, 1, 'R');

        $pdf->Ln(1);
        $pdf->SetX(18);
        $pdf->SetFont('Helvetica', 'B', 11);
        $pdf->SetTextColor(15, 23, 42);
        $pdf->Cell(60, 5, strtoupper($invoice['full_name']), 0, 0);

        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->SetTextColor(71, 85, 105);
        $pdf->Cell(32, 5, 'ID Invoice:', 0, 0, 'R');
        $pdf->SetTextColor(15, 23, 42);
        $pdf->Cell(20, 5, 'INV-' . str_pad($invoice['id'], 5, '0', STR_PAD_LEFT), 0, 1, 'R');

        $pdf->SetX(18);
        $pdf->SetFont('Helvetica', '', 9);
        $pdf->SetTextColor(100, 116, 139);
        $pdf->Cell(60, 5, 'Warga: @' . $invoice['username'], 0, 0);

        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->SetTextColor(71, 85, 105);
        $pdf->Cell(32, 5, 'Tanggal Cetak:', 0, 0, 'R');
        $pdf->SetTextColor(15, 23, 42);
        $pdf->Cell(20, 5, date('d/m/Y'), 0, 1, 'R');

        // 4. Charges Table Layout
        $pdf->Ln(10);
        $pdf->SetX(18);
        $pdf->SetFillColor(15, 23, 42); // Navy Dark
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->Cell(80, 10, '  DESKRIPSI TAGIHAN', 0, 0, 'L', true);
        $pdf->Cell(32, 10, 'SUBTOTAL (IDR)  ', 0, 1, 'R', true);

        // Table Content
        $pdf->SetX(18);
        $pdf->SetFont('Helvetica', '', 9);
        $pdf->SetTextColor(51, 65, 85);
        $pdf->SetFillColor(252, 253, 254);

        foreach ($items as $item) {
            $pdf->SetX(18);
            $pdf->Cell(80, 10, '   ' . $item['category_name'], 'B', 0, 'L', true);
            $pdf->SetFont('Helvetica', 'B', 9);
            $pdf->Cell(32, 10, number_format($item['amount'], 0, ',', '.') . '  ', 'B', 1, 'R', true);
            $pdf->SetFont('Helvetica', '', 9);
        }

        // 5. Total Calculation Box
        $pdf->Ln(12);
        $pdf->SetX(60);
        $pdf->SetFillColor(248, 250, 252);
        $pdf->RoundedRect(60, 115, 70, 25, 3, 'F');

        $pdf->SetY(118);
        $pdf->SetX(65);
        $pdf->SetFont('Helvetica', 'B', 7);
        $pdf->SetTextColor(148, 163, 184);
        $pdf->Cell(30, 5, 'TOTAL TAGIHAN:', 0, 1);

        $pdf->SetX(65);
        $pdf->SetFont('Helvetica', 'B', 18);
        $pdf->SetTextColor(16, 185, 129); // Emerald
        $pdf->Cell(60, 10, 'Rp ' . number_format($invoice['amount'], 0, ',', '.'), 0, 1, 'L');

        // 6. Payment Status - DIGITAL STAMP STYLE
        $pdf->SetY(115);
        $pdf->SetX(18);
        $isPaid = ($invoice['status'] == 'PAID');
        $stampColor = $isPaid ? [16, 185, 129] : [225, 29, 72];
        $pdf->SetDrawColor($stampColor[0], $stampColor[1], $stampColor[2]);
        $pdf->SetTextColor($stampColor[0], $stampColor[1], $stampColor[2]);
        $pdf->SetLineWidth(0.8);

        // The Stamp Box
        $pdf->SetFont('Helvetica', 'B', 12);
        $pdf->RoundedRect(20, 118, 35, 18, 2, 'D');
        $pdf->SetY(122);
        $pdf->SetX(20);
        $pdf->Cell(35, 10, $isPaid ? 'LUNAS' : 'BELUM BAYAR', 0, 0, 'C');
        $pdf->SetLineWidth(0.2); // Reset

        // 7. Payment Instructions Header
        $pdf->SetY(150);
        $pdf->SetX(18);
        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->SetTextColor(15, 23, 42);
        $pdf->Cell(0, 5, 'CARA PEMBAYARAN:', 0, 1);

        $pdf->SetX(18);
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->SetTextColor(100, 116, 139);
        $instruction = "1. Serahkan pembayaran tunai kepada Bendahara RT.\n2. Pastikan Anda menerima konfirmasi pelunasan digital.\n3. Simpan invoice ini sebagai bukti kontribusi lingkungan.";
        $pdf->MultiCell(112, 4, $instruction, 0, 'L');

        // 8. Footer Section
        $pdf->SetY(182);
        $pdf->SetFont('Helvetica', 'I', 6);
        $pdf->SetTextColor(148, 163, 184);
        $pdf->Cell(0, 5, 'Dokumen ini dibuat secara otomatis oleh Sistem RT-Digital dan sah tanpa tanda tangan basah.', 0, 1, 'C');

        $pdf->SetY(186);
        $pdf->SetFont('Helvetica', 'B', 6);
        $pdf->SetTextColor(16, 185, 129);
        $pdf->Cell(0, 4, 'TERIMA KASIH ATAS KONTRIBUSI ANDA DALAM MENJAGA LINGKUNGAN', 0, 1, 'C');

        $pdf->Output('I', 'Invoice_RT_INV' . $invoice['id'] . '.pdf');
    }

    public function get_reminder_url()
    {
        if (Auth::role() != 1 && Auth::role() != 2) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $id = $_GET['id'] ?? null;
        if (!$id)
            $this->json(['error' => 'ID Required'], 400);

        $db = Database::getInstance();
        $stmt = $db->query(
            "SELECT i.*, u.full_name, u.phone 
             FROM invoices i 
             JOIN users u ON i.user_id = u.id 
             WHERE i.id = ?",
            [$id]
        );
        $invoice = $stmt->fetch();

        if (!$invoice)
            $this->json(['error' => 'Invoice not found'], 404);

        $monthNames = [1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'];
        $period = $monthNames[$invoice['month']] . ' ' . $invoice['year'];

        $message = "Halo Bpk/Ibu *{$invoice['full_name']}*,\n\nMengingatkan untuk pembayaran *Iuran RT* periode *{$period}* sebesar *Rp " . number_format($invoice['amount'], 0, ',', '.') . "*.\n\nPembayaran dapat dilakukan melalui Bendahara. Abaikan jika sudah membayar.\n\nTerima kasih atas partisipasinya! _- Pengurus RT_";

        // WhatsApp Web URL
        $phone = $invoice['phone'] ?? '';
        // Sanitize phone
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (substr($phone, 0, 1) === '0')
            $phone = '62' . substr($phone, 1);

        $waUrl = "https://web.whatsapp.com/send?phone={$phone}&text=" . urlencode($message);

        $this->json(['url' => $waUrl]);
    }

    public function get_unpaid_count()
    {
        $role = Auth::role();
        $userId = Auth::user();
        $db = Database::getInstance();

        if ($role == 1 || $role == 2) {
            // Admin/Bendahara see ALL unpaid for the current system year
            $stmt = $db->query("SELECT COUNT(*) as count FROM invoices WHERE status = 'UNPAID'");
        } else {
            // Residents see ONLY theirs
            $stmt = $db->query("SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = 'UNPAID'", [$userId]);
        }

        $result = $stmt->fetch();
        $this->json(['count' => (int) ($result['count'] ?? 0)]);
    }

    public function get_unpaid_users_count()
    {
        $role = Auth::role();
        if ($role != 1 && $role != 2) {
            $this->json(['count' => 0]);
            return;
        }

        $db = Database::getInstance();
        $stmt = $db->query("SELECT COUNT(DISTINCT user_id) as count FROM invoices WHERE status = 'UNPAID'");
        $result = $stmt->fetch();
        $this->json(['count' => (int) ($result['count'] ?? 0)]);
    }
}
