<?php

class BackupController extends BaseController
{
    public function export()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
            return;
        }

        $db = Database::getInstance()->getConnection();
        $tables = [];
        $stmt = $db->query("SHOW TABLES");
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }

        $sql = "-- Database Backup\n";
        $sql .= "-- Generated at: " . date('Y-m-d H:i:s') . "\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $table) {
            // Drop table if exists
            $sql .= "DROP TABLE IF EXISTS `$table`;\n";

            // Get create table statement
            $stmt = $db->query("SHOW CREATE TABLE `$table` ");
            $row = $stmt->fetch(PDO::FETCH_NUM);
            $sql .= $row[1] . ";\n\n";

            // Get all data
            $stmt = $db->query("SELECT * FROM `$table` ");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $sql .= "INSERT INTO `$table` VALUES (";
                $values = [];
                foreach ($row as $val) {
                    if (is_null($val)) {
                        $values[] = "NULL";
                    } else {
                        $values[] = $db->quote($val);
                    }
                }
                $sql .= implode(", ", $values);
                $sql .= ");\n";
            }
            $sql .= "\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        $filename = 'backup_db_' . date('Y-m-d_His') . '.sql';

        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo $sql;
        exit;
    }

    public function restore()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
            return;
        }

        if (!isset($_FILES['backup']) || $_FILES['backup']['error'] !== UPLOAD_ERR_OK) {
            $this->json(['error' => 'Gagal upload file backup.'], 400);
            return;
        }

        $file = $_FILES['backup'];
        $content = file_get_contents($file['tmp_name']);

        if (!$content) {
            $this->json(['error' => 'File backup kosong.'], 400);
            return;
        }

        $db = Database::getInstance()->getConnection();

        try {
            $db->exec("SET FOREIGN_KEY_CHECKS=0");

            // Remove comments and multi-line breaks
            $content = preg_replace('/--.*?\n/', '', $content);
            $content = preg_replace('/\/\*.*?\*\//s', '', $content);

            // Split into individual queries by semicolon + newline
            $queries = explode(";\n", $content);
            foreach ($queries as $query) {
                $query = trim($query);
                if (!empty($query)) {
                    $db->exec($query);
                }
            }

            $db->exec("SET FOREIGN_KEY_CHECKS=1");
            $this->json(['success' => true, 'message' => 'Database berhasil direstore.']);
        } catch (Exception $e) {
            $this->json(['error' => 'Gagal restore database: ' . $e->getMessage()], 500);
        }
    }
}
