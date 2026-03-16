<?php

class ProfileController extends BaseController
{
    public function update()
    {
        $userId = Auth::user();
        if (!$userId)
            $this->json(['error' => 'Unauthorized'], 401);

        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['full_name']);

        $db = Database::getInstance();
        $db->query("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", [
            $data['full_name'],
            $data['phone'] ?? null,
            $userId
        ]);

        $this->json(['success' => true, 'message' => 'Profil berhasil diperbarui']);
    }

    public function changePassword()
    {
        $userId = Auth::user();
        if (!$userId)
            $this->json(['error' => 'Unauthorized'], 401);

        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['current_password', 'new_password']);

        $db = Database::getInstance();
        $stmt = $db->query("SELECT password FROM users WHERE id = ?", [$userId]);
        $user = $stmt->fetch();

        if (password_verify($data['current_password'], $user['password'])) {
            $newHash = password_hash($data['new_password'], PASSWORD_DEFAULT);
            $db->query("UPDATE users SET password = ? WHERE id = ?", [$newHash, $userId]);
            $this->json(['success' => true, 'message' => 'Kata sandi berhasil diubah']);
        } else {
            $this->json(['success' => false, 'message' => 'Kata sandi saat ini salah'], 400);
        }
    }
    public function activity()
    {
        $userId = Auth::user();
        if (!$userId)
            $this->json(['error' => 'Unauthorized'], 401);

        $db = Database::getInstance();
        $logs = [];

        // 1. Finance (Transactions created by user)
        // Note: finance table uses 'created_by', not 'user_id' for the recorder.
        // For Warga paying dues, we don't have a direct link in current schema unless name is in description.
        // So we show what the user *did* (Record income/expense).
        $stmt = $db->query("SELECT * FROM finance WHERE created_by = ? ORDER BY date DESC LIMIT 10", [$userId]);
        $finance = $stmt->fetchAll();
        foreach ($finance as $f) {
            $logs[] = [
                'type' => 'finance',
                'title' => $f['type'] == 'INCOME' ? 'Mencatat Pemasukan' : 'Mencatat Pengeluaran',
                'desc' => $f['description'],
                'date' => $f['date'],
                'amount' => $f['amount']
            ];
        }

        // 2. Attendance (Satpam only)
        $stmt = $db->query("SELECT * FROM attendance WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10", [$userId]);
        $attendance = $stmt->fetchAll();
        foreach ($attendance as $a) {
            $logs[] = [
                'type' => 'attendance',
                'title' => $a['type'] == 'IN' ? 'Check-In Shift' : 'Check-Out Shift',
                'desc' => 'Presensi pada ' . date('H:i', strtotime($a['timestamp'])),
                'date' => $a['timestamp']
            ];
        }

        // 3. Patrol Logs (Satpam only)
        $stmt = $db->query("
            SELECT cl.*, c.name as checkpoint_name 
            FROM checkpoint_logs cl 
            JOIN checkpoints c ON cl.checkpoint_id = c.id
            WHERE cl.user_id = ? 
            ORDER BY cl.timestamp DESC LIMIT 10
        ", [$userId]);
        $patrols = $stmt->fetchAll();
        foreach ($patrols as $p) {
            $logs[] = [
                'type' => 'patrol',
                'title' => 'Patroli Titik',
                'desc' => 'Scan lokasi: ' . $p['checkpoint_name'],
                'date' => $p['timestamp']
            ];
        }

        // Sort by date DESC
        usort($logs, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        $this->json(array_slice($logs, 0, 20));
    }

    public function family()
    {
        $userId = Auth::user();
        if (!$userId)
            $this->json(['error' => 'Unauthorized'], 401);

        $db = Database::getInstance();

        // 1. Get current user's KK number
        $stmt = $db->query("SELECT no_kk FROM warga WHERE user_id = ?", [$userId]);
        $currentUser = $stmt->fetch();

        if (!$currentUser || empty($currentUser['no_kk'])) {
            $this->json([]); // User not a resident or has no KK assigned
            return;
        }

        // 2. Get all members with same KK number
        $stmt = $db->query("
            SELECT u.id, u.full_name, u.role_id, r.name as role_name, w.wa_number, w.status_keluarga, w.is_kk_head
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN warga w ON u.id = w.user_id
            WHERE w.no_kk = ?
            ORDER BY w.is_kk_head DESC, u.id ASC
        ", [$currentUser['no_kk']]);

        $family = $stmt->fetchAll();

        // Add flag for current user
        $result = array_map(function ($member) use ($userId) {
            $member['is_me'] = ($member['id'] == $userId);
            return $member;
        }, $family);

        $this->json($result);
    }
}
