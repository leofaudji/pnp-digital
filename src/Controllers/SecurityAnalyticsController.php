<?php

class SecurityAnalyticsController extends BaseController
{
    public function getPatterns()
    {
        $days = $_GET['days'] ?? 30; // Default last 30 days
        $cacheKey = "security_patterns_days_{$days}";

        $result = cache()->remember($cacheKey, 1800, function() use ($days) {
            $db = Database::getInstance();
            try {
                // 1. Hourly Patrol Heatmap
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

                // 2. Checkpoint Coverage
                $checkpoints = $db->query("SELECT id, name FROM checkpoints")->fetchAll();
                $totalCheckpoints = count($checkpoints);

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
                
                usort($coverageData, fn($a, $b) => $a['visits'] - $b['visits']);

                $blindSpots = array_slice($coverageData, 0, 3);
                $blindSpots = array_filter($blindSpots, fn($c) => $c['visits'] < 5);

                // 3. Security Score Calculation
                $visitedCount = count(array_filter($coverageData, fn($c) => $c['visits'] > 0));
                $coverageScore = ($totalCheckpoints > 0) ? ($visitedCount / $totalCheckpoints) * 100 : 0;

                $activeHours = count(array_filter($hourlyActivity, fn($c) => $c > 0));
                $timeScore = ($activeHours / 24) * 100;

                $overallScore = round(($coverageScore * 0.6) + ($timeScore * 0.4));

                return [
                    'heatmap' => $hourlyActivity,
                    'coverage' => $coverageData,
                    'blind_spots' => array_values($blindSpots),
                    'score' => $overallScore,
                    'total_logs' => array_sum($hourlyActivity),
                    'period_days' => $days
                ];
            } catch (Exception $e) {
                return ['error' => $e->getMessage()];
            }
        });

        if (isset($result['error'])) {
            $this->json($result, 500);
        } else {
            $this->json($result);
        }
    }

    public function getContributions()
    {
        $targetUserId = $_GET['user_id'] ?? Auth::user();
        $year = $_GET['year'] ?? date('Y');
        $cacheKey = "security_contributions_{$targetUserId}_{$year}";

        $result = cache()->remember($cacheKey, 3600, function() use ($targetUserId, $year) {
            $db = Database::getInstance();
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
                $datesWithActivity = [];

                foreach ($rows as $row) {
                    $scans = json_decode($row['scans'], true) ?: [];
                    $count = count($scans);
                    $contributions[$row['date']] = $count;
                    $totalScans += $count;
                    
                    if ($count > $maxDaily) $maxDaily = $count;
                    if ($count > 0) $datesWithActivity[] = $row['date'];
                }

                $longestStreak = 0;
                $currentStreak = 0;
                $today = date('Y-m-d');
                $yesterday = date('Y-m-d', strtotime('-1 day'));
                
                $punchCard = [];
                for ($d = 0; $d < 7; $d++) { $punchCard[$d] = array_fill(0, 24, 0); }

                foreach ($rows as $row) {
                    $dayOfWeek = date('w', strtotime($row['date']));
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
                        if (($curr - $prev) == 86400) {
                            $tempStreak++;
                        } else {
                            if ($tempStreak > $longestStreak) $longestStreak = $tempStreak;
                            $tempStreak = 1;
                        }
                    }
                    if ($tempStreak > $longestStreak) $longestStreak = $tempStreak;
                    
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

                return [
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
                ];
            } catch (Exception $e) {
                return ['error' => $e->getMessage()];
            }
        });

        if (isset($result['error'])) {
            $this->json($result, 500);
        } else {
            $this->json($result);
        }
    }
}
