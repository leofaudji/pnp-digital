<?php

class ChatbotController extends BaseController
{
    public function query()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $message = strtolower($data['message'] ?? '');

        if (!$message) {
            $this->json(['error' => 'Pesan kosong'], 400);
        }

        $db = Database::getInstance();
        $response = "";
        $context = "";

        // Fetch settings for personalization
        $settingsStmt = $db->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('app_title', 'rt_name')");
        $settings = [];
        while ($row = $settingsStmt->fetch()) {
            $settings[$row['key']] = $row['value'];
        }
        $appTitle = $settings['app_title'] ?? 'RT-Digital';
        $rtName = $settings['rt_name'] ?? 'Unit Lingkungan';

        // 1. Check for Warga queries
        if (strpos($message, 'warga') !== false || strpos($message, 'penduduk') !== false) {
            $count = $db->query("SELECT COUNT(*) FROM users WHERE role_id = 4")->fetchColumn();
            $blocks = $db->query("SELECT COUNT(DISTINCT no_rumah) FROM users WHERE no_rumah IS NOT NULL")->fetchColumn();
            $response = "Saat ini tercatat ada *$count warga* yang terdaftar di $rtName pak, tersebar di *$blocks rumah/blok*.";
        }

        // 2. Check for Finance queries
        else if (strpos($message, 'kas') !== false || strpos($message, 'saldo') !== false || strpos($message, 'uang') !== false) {
            $income = $db->query("SELECT SUM(amount) FROM finance WHERE type = 'INCOME'")->fetchColumn() ?: 0;
            $expense = $db->query("SELECT SUM(amount) FROM finance WHERE type = 'EXPENSE'")->fetchColumn() ?: 0;
            $balance = $income - $expense;
            $response = "Saldo kas $rtName saat ini adalah *Rp " . number_format($balance, 0, ',', '.') . "*. Total pemasukan Rp " . number_format($income, 0, ',', '.') . " dan pengeluaran Rp " . number_format($expense, 0, ',', '.') . ".";
        }

        // 3. Check for SOP / Rules
        else if (strpos($message, 'tamu') !== false || strpos($message, 'izin') !== false) {
            $response = "Untuk tamu yang menginap lebih dari 24 jam di wilayah $rtName, warga wajib melapor ke Satpam atau lewat menu *Izin Tamu* di aplikasi $appTitle ya pak.";
        }

        // 4. Check for Payment / Iuran
        else if (strpos($message, 'iuran') !== false || strpos($message, 'bayar') !== false) {
            $unpaid = $db->query("SELECT COUNT(DISTINCT user_id) FROM invoices WHERE status = 'UNPAID'")->fetchColumn();
            $response = "Mengenai iuran di $rtName, ada *$unpaid warga* yang terpantau belum menyelesaikan tagihan bulan ini pak. Bapak bisa cek detailnya di menu *Digital Invoicing*.";
        }

        // 5. General / AI Simulation
        else {
            $responses = [
                "Siap pak! Ada yang bisa saya bantu terkait data warga atau laporan keuangan di $rtName?",
                "Saya Asisten AI $appTitle, siap membantu bapak mengelola $rtName. Mau cek data apa hari ini?",
                "Siap, perintah dimengerti. Bapak bisa tanya saya soal saldo kas, data warga, atau aturan lingkungan kita di $rtName."
            ];
            $response = $responses[array_rand($responses)];
        }

        // Simulating AI "thinking" time
        usleep(800000);

        $this->json([
            'answer' => $response,
            'timestamp' => date('H:i')
        ]);
    }
}
