<?php

class SecurityAnalyticsController extends BaseController
{
    public function getPatterns()
    {
        $db = Database::getInstance();
        $days = $_GET['days'] ?? 30; // Default last 30 days

        try {
            // 1. Hourly Patrol Heatmap (Activity Distribution)
            $heatmapStmt = $db->query("
                SELECT HOUR(timestamp) as hour, COUNT(*) as count 
                FROM checkpoint_logs 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY HOUR(timestamp)
                ORDER BY hour ASC
            ", [$days]);
            $heatmapData = $heatmapStmt->fetchAll();

            // Fill missing hours with 0
            $hourlyActivity = array_fill(0, 24, 0);
            foreach ($heatmapData as $row) {
                $hourlyActivity[intval($row['hour'])] = intval($row['count']);
            }

            // 2. Checkpoint Coverage (Blind Spot Detection)
            // Get all checkpoints first
            $checkpoints = $db->query("SELECT id, name FROM checkpoints")->fetchAll();
            $totalCheckpoints = count($checkpoints);

            $coverageStmt = $db->query("
                SELECT c.name, COUNT(cl.id) as visits 
                FROM checkpoints c
                LEFT JOIN checkpoint_logs cl ON c.id = cl.checkpoint_id AND cl.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY c.id, c.name
                ORDER BY visits ASC
            ", [$days]);
            $coverageData = $coverageStmt->fetchAll();

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
}
