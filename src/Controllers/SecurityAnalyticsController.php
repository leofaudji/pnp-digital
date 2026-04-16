<?php

class SecurityAnalyticsController extends BaseController
{
    public function getPatterns()
    {
        $db = Database::getInstance();
        $days = $_GET['days'] ?? 30; // Default last 30 days

        try {
            // 1. Hourly Patrol Heatmap (Activity Distribution)
            // Note: Data is fetched from daily_patrol_logs where scans are stored as JSON
            $stmt = $db->query("
                SELECT scans 
                FROM daily_patrol_logs 
                WHERE date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ", [$days]);
            $logs = $stmt->fetchAll();

            $hourlyActivity = array_fill(0, 24, 0);
            foreach ($logs as $row) {
                $scans = json_decode($row['scans'], true) ?: [];
                foreach ($scans as $scan) {
                    if (isset($scan['time'])) {
                        $hour = intval(explode(':', $scan['time'])[0]);
                        if ($hour >= 0 && $hour < 24) {
                            $hourlyActivity[$hour]++;
                        }
                    }
                }
            }

            // 2. Checkpoint Coverage (Blind Spot Detection)
            // Get all checkpoints first
            $checkpoints = $db->query("SELECT id, name FROM checkpoints")->fetchAll();
            $totalCheckpoints = count($checkpoints);

            // Get visit counts per checkpoint from JSON scans
            $checkpointVisits = [];
            foreach ($logs as $row) {
                $scans = json_decode($row['scans'], true) ?: [];
                foreach ($scans as $scan) {
                    if (isset($scan['checkpoint_id'])) {
                        $cid = $scan['checkpoint_id'];
                        $checkpointVisits[$cid] = ($checkpointVisits[$cid] ?? 0) + 1;
                    }
                }
            }

            $coverageData = [];
            foreach ($checkpoints as $c) {
                $coverageData[] = [
                    'name' => $c['name'],
                    'visits' => $checkpointVisits[$c['id']] ?? 0
                ];
            }
            
            // Sort by visits for blind spot detection
            usort($coverageData, function($a, $b) {
                return $a['visits'] - $b['visits'];
            });

            // Identify Blind Spots (Bottom 3 visited)
            $blindSpots = array_slice($coverageData, 0, 3);
            $blindSpots = array_filter($blindSpots, function ($c) {
                return $c['visits'] < 5; }); // Threshold for "Blind Spot"

            // 3. Security Score Calculation
            // - Coverage Score: % of checkpoints visited at least once in period
            // - consistency Score: Standard deviation of hourly patrol (lower is better, meaning consistent) - simplified here as "Active Hours ratio"

            $visitedCount = count(array_filter($coverageData, function ($c) {
                return $c['visits'] > 0; }));
            $coverageScore = ($totalCheckpoints > 0) ? ($visitedCount / $totalCheckpoints) * 100 : 0;

            // Active Hours Score (How many hours of the day have patrols?)
            $activeHours = count(array_filter($hourlyActivity, function ($c) {
                return $c > 0; }));
            $timeScore = ($activeHours / 24) * 100;

            $overallScore = round(($coverageScore * 0.6) + ($timeScore * 0.4));

            $this->json([
                'heatmap' => $hourlyActivity,
                'coverage' => $coverageData,
                'blind_spots' => array_values($blindSpots),
                'score' => $overallScore,
                'total_logs' => array_sum($hourlyActivity),
                'period_days' => $days
            ]);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getContributions()
    {
        $db = Database::getInstance();
        $targetUserId = $_GET['user_id'] ?? Auth::id();
        $year = $_GET['year'] ?? date('Y');

        try {
            $stmt = $db->query("
                SELECT date, scans 
                FROM daily_patrol_logs 
                WHERE user_id = ? AND YEAR(date) = ?
                ORDER BY date ASC
            ", [$targetUserId, $year]);
            $rows = $stmt->fetchAll();

            $contributions = [];
            $totalScans = 0;
            $maxDaily = 0;
            
            // For streak calculation
            $datesWithActivity = [];

            foreach ($rows as $row) {
                $scans = json_decode($row['scans'], true) ?: [];
                $count = count($scans);
                $contributions[$row['date']] = $count;
                $totalScans += $count;
                
                if ($count > $maxDaily) $maxDaily = $count;
                if ($count > 0) $datesWithActivity[] = $row['date'];
            }

            // Calculate Streaks & Punch Card
            $longestStreak = 0;
            $currentStreak = 0;
            $today = date('Y-m-d');
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            
            // Punch Card: 7 days x 24 hours
            $punchCard = [];
            for ($d = 0; $d < 7; $d++) { $punchCard[$d] = array_fill(0, 24, 0); }

            foreach ($rows as $row) {
                $dayOfWeek = date('w', strtotime($row['date'])); // 0 (Sun) to 6 (Sat)
                $scans = json_decode($row['scans'], true) ?: [];
                foreach ($scans as $scan) {
                    if (isset($scan['time'])) {
                        $hour = intval(explode(':', $scan['time'])[0]);
                        if ($hour >= 0 && $hour < 24) {
                            $punchCard[$dayOfWeek][$hour]++;
                        }
                    }
                }
            }

            if (!empty($datesWithActivity)) {
                $tempStreak = 1;
                for ($i = 1; $i < count($datesWithActivity); $i++) {
                    $prev = strtotime($datesWithActivity[$i-1]);
                    $curr = strtotime($datesWithActivity[$i]);
                    
                    if (($curr - $prev) == 86400) { // exactly 1 day
                        $tempStreak++;
                    } else {
                        if ($tempStreak > $longestStreak) $longestStreak = $tempStreak;
                        $tempStreak = 1;
                    }
                }
                if ($tempStreak > $longestStreak) $longestStreak = $tempStreak;
                
                // Current streak check
                $lastDate = end($datesWithActivity);
                if ($lastDate == $today || $lastDate == $yesterday) {
                    $currIdx = count($datesWithActivity) - 1;
                    $currentStreak = 1;
                    while ($currIdx > 0) {
                        $prev = strtotime($datesWithActivity[$currIdx-1]);
                        $curr = strtotime($datesWithActivity[$currIdx]);
                        if (($curr - $prev) == 86400) {
                            $currentStreak++;
                            $currIdx--;
                        } else {
                            break;
                        }
                    }
                }
            }

            $this->json([
                'user_id' => $targetUserId,
                'year' => $year,
                'contributions' => $contributions,
                'punch_card' => $punchCard,
                'summary' => [
                    'total_scans' => $totalScans,
                    'max_daily' => $maxDaily,
                    'longest_streak' => $longestStreak,
                    'current_streak' => $currentStreak
                ]
            ]);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }
}
