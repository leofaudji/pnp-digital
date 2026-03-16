<?php

class DemographicsController extends BaseController
{
    public function getSummary()
    {
        $db = Database::getInstance();

        try {
            // 1. Gender Distribution
            $genderStmt = $db->query("
                SELECT jenis_kelamin as label, COUNT(*) as value 
                FROM warga 
                WHERE jenis_kelamin IS NOT NULL 
                GROUP BY jenis_kelamin
            ");
            $genderData = $genderStmt->fetchAll();

            // 2. Occupation Distribution (Top 5)
            $jobStmt = $db->query("
                SELECT pekerjaan as label, COUNT(*) as value 
                FROM warga 
                WHERE pekerjaan IS NOT NULL 
                GROUP BY pekerjaan 
                ORDER BY value DESC 
                LIMIT 5
            ");
            $jobData = $jobStmt->fetchAll();

            // 3. Age Groups
            // SQL to calculate age: TIMESTAMPDIFF(YEAR, tgl_lahir, CURDATE())
            $ageStmt = $db->query("
                SELECT 
                    CASE 
                        WHEN TIMESTAMPDIFF(YEAR, tgl_lahir, CURDATE()) < 12 THEN 'Anak-anak'
                        WHEN TIMESTAMPDIFF(YEAR, tgl_lahir, CURDATE()) BETWEEN 12 AND 25 THEN 'Remaja/Pemuda'
                        WHEN TIMESTAMPDIFF(YEAR, tgl_lahir, CURDATE()) BETWEEN 26 AND 45 THEN 'Dewasa'
                        WHEN TIMESTAMPDIFF(YEAR, tgl_lahir, CURDATE()) BETWEEN 46 AND 60 THEN 'Pra-Lansia'
                        ELSE 'Lansia'
                    END as label,
                    COUNT(*) as value
                FROM warga
                WHERE tgl_lahir IS NOT NULL
                GROUP BY label
            ");
            $ageData = $ageStmt->fetchAll();

            $this->json([
                'gender' => $genderData,
                'occupation' => $jobData,
                'age' => $ageData,
                'total' => $db->query("SELECT COUNT(*) FROM warga")->fetchColumn()
            ]);
        } catch (Exception $e) {
            // Fallback for missing columns or query failures
            $this->json([
                'gender' => [],
                'occupation' => [],
                'age' => [],
                'total' => $db->query("SELECT COUNT(*) FROM warga")->fetchColumn()
            ]);
        }
    }
}
