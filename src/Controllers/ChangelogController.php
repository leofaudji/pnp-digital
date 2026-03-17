<?php

class ChangelogController extends BaseController
{
    public function index()
    {
        $filePath = __DIR__ . '/../../CHANGELOG.md';
        if (!file_exists($filePath)) {
            $this->json(['error' => 'Changelog file not found'], 404);
        }

        $content = file_get_contents($filePath);
        $versions = $this->parseMarkdown($content);
        
        $this->json(['versions' => $versions]);
    }

    private function parseMarkdown($content)
    {
        $versions = [];
        $lines = explode("\n", $content);
        $currentVersion = null;
        $currentSection = 'Update';

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Match ## [1.1.0] - 2024-03-20
            if (preg_match('/^##\s+\[(.*?)\]\s+-\s+(.*)/', $line, $matches)) {
                if ($currentVersion) {
                    $versions[] = $currentVersion;
                }
                $currentVersion = [
                    'version' => $matches[1],
                    'date' => $matches[2],
                    'changes' => []
                ];
                $currentSection = 'Update';
            } 
            // Match ### Added/Fixed etc
            elseif (preg_match('/^###\s+(.*)/', $line, $matches) && $currentVersion) {
                $sectionName = trim($matches[1]);
                if (strtolower($sectionName) === 'added') $currentSection = 'New Feature';
                elseif (strtolower($sectionName) === 'fixed') $currentSection = 'Bug Fix';
                else $currentSection = $sectionName;
            }
            // Match - Change description
            elseif ($line[0] === '-' && $currentVersion) {
                $description = trim(substr($line, 1));
                $currentVersion['changes'][] = [
                    'type' => $currentSection,
                    'description' => $description
                ];
            }
        }

        if ($currentVersion) {
            $versions[] = $currentVersion;
        }

        return $versions;
    }
}
