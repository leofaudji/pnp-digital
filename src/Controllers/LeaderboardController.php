<?php

class LeaderboardController extends BaseController
{
    public function index()
    {
        $db = Database::getInstance();
        $month = date('m');
        $year = date('Y');

        // Fetch shift settings
        $stmtSettings = $db->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('shift_morning_start', 'shift_night_start', 'patrol_max_points_daily')");
        $settingsRaw = $stmtSettings->fetchAll();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s['key']] = $s['value'];
        }
        $morningShift = $settings['shift_morning_start'] ?? '06:00';
        $nightShift = $settings['shift_night_start'] ?? '20:00';
        $maxPointsDaily = intval($settings['patrol_max_points_daily'] ?? 20);

        // Fetch all Satpams
        $stmtUsers = $db->query("SELECT id, full_name, username FROM users WHERE role_id = 3 ORDER BY full_name ASC");
        $satpams = $stmtUsers->fetchAll();

        $leaderboard = [];

        foreach ($satpams as $user) {
            // Calculate Punctual Attendance from consolidated attendance table
            $stmtAtt = $db->query("
                SELECT date, clock_in 
                FROM attendance 
                WHERE user_id = ? 
                AND MONTH(date) = ? AND YEAR(date) = ?
                AND clock_in IS NOT NULL
            ", [$user['id'], $month, $year]);
            $attendances = $stmtAtt->fetchAll();

            $onTimeCount = 0;
            $totalAttendance = count($attendances);

            foreach ($attendances as $att) {
                $attTime = date('H:i', strtotime($att['clock_in']));
                $hour = intval(date('H', strtotime($att['clock_in'])));
                $threshold = ($hour < 14) ? $morningShift : $nightShift;

                if ($attTime <= $threshold) {
                    $onTimeCount++;
                }
            }

            // Calculate Patrol Score from consolidated daily_patrol_logs
            $stmtPatrol = $db->query("
                SELECT scans
                FROM daily_patrol_logs
                WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
            ", [$user['id'], $month, $year]);
            $monthlyPatrolLogs = $stmtPatrol->fetchAll();

            $patrolPoints = 0;
            $totalPatrols = 0;

            foreach ($monthlyPatrolLogs as $log) {
                $scans = json_decode($log['scans'] ?? '[]', true);
                if (!is_array($scans))
                    $scans = [];

                $dailyCount = count($scans);
                $totalPatrols += $dailyCount;

                $dayPoints = $dailyCount * 2;
                if ($dayPoints > $maxPointsDaily) {
                    $dayPoints = $maxPointsDaily;
                }
                $patrolPoints += $dayPoints;
            }

            $attendancePoints = $onTimeCount * 10;
            $totalPoints = $attendancePoints + $patrolPoints;

            $leaderboard[] = [
                'id' => $user['id'],
                'full_name' => $user['full_name'],
                'username' => $user['username'],
                'attendance_points' => $attendancePoints,
                'patrol_points' => $patrolPoints,
                'total_points' => $totalPoints,
                'total_attendance' => $totalAttendance,
                'on_time_attendance' => $onTimeCount,
                'total_patrols' => $totalPatrols
            ];
        }

        // Sort by total score DESC
        usort($leaderboard, function ($a, $b) {
            if ($a['total_points'] == $b['total_points']) {
                return strcmp($a['full_name'], $b['full_name']);
            }
            return $b['total_points'] - $a['total_points'];
        });

        $this->json($leaderboard);
    }
}
