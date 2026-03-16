<?php

class MeetingController extends BaseController
{
    public function list()
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT m.*, u.full_name as creator_name FROM meetings m JOIN users u ON m.created_by = u.id ORDER BY m.date DESC, m.created_at DESC");
        $this->json($stmt->fetchAll());
    }

    public function save()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['title', 'date', 'raw_content']);

        $db = Database::getInstance();

        try {
            $db->query(
                "INSERT INTO meetings (title, date, raw_content, summary, action_items, created_by) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    $data['title'],
                    $data['date'],
                    $data['raw_content'],
                    $data['summary'] ?? null,
                    isset($data['action_items']) ? json_encode($data['action_items']) : null,
                    Auth::user()
                ]
            );
            $this->json(['success' => true, 'message' => 'Notulensi berhasil disimpan']);
        } catch (Exception $e) {
            $this->json(['error' => 'Gagal menyimpan notulensi: ' . $e->getMessage()], 500);
        }
    }

    public function delete()
    {
        $id = $_GET['id'] ?? null;
        if (!$id)
            $this->json(['error' => 'ID is required'], 400);

        $db = Database::getInstance();
        $db->query("DELETE FROM meetings WHERE id = ?", [$id]);
        $this->json(['success' => true]);
    }

    /**
     * AI Summarization endpoint
     * For now, this is a mock that simulates AI logic.
     * In a real production app, this would call Gemini/GPT API.
     */
    public function summarize()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $text = $data['text'] ?? '';

        if (strlen($text) < 20) {
            $this->json(['error' => 'Teks terlalu pendek untuk diringkas'], 400);
        }

        // Simulating AI delay
        usleep(1500000);

        // Mock Summary Logic:
        // In real world, we'd send $text to an LLM.
        // Here we'll do some basic extraction to make it feel real.

        $lines = explode("\n", $text);
        $actionItems = [];
        foreach ($lines as $line) {
            if (preg_match('/(harus|perlu|akan|tugas|pic|nanti|besok)/i', $line)) {
                $actionItems[] = trim($line);
            }
        }

        // Fallback if no action items found
        if (empty($actionItems)) {
            $actionItems = ["Menindaklanjuti hasil rapat koordinasi rutinan."];
        }

        $summary = "Rapat membahas poin-poin penting terkait pengelolaan lingkungan RT. Peserta aktif memberikan masukan mengenai peningkatan fasilitas dan keamanan bersama.";

        $this->json([
            'summary' => $summary,
            'action_items' => array_slice($actionItems, 0, 5)
        ]);
    }
}
