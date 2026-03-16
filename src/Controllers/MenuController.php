<?php

class MenuController extends BaseController
{
    private $menuFile;

    public function __construct()
    {
        $this->menuFile = __DIR__ . '/../../public/assets/json/menu.json';
    }

    public function index()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);

        if (!file_exists($this->menuFile)) {
            $this->json(['error' => 'Menu file not found'], 404);
        }

        $content = file_get_contents($this->menuFile);
        $this->json(json_decode($content, true));
    }

    public function update()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);

        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['sidebar']) || !isset($data['mobileTabs'])) {
            $this->json(['error' => 'Invalid menu data'], 400);
        }

        // Pretty print JSON for readability
        $jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        if (file_put_contents($this->menuFile, $jsonContent)) {
            $this->json(['success' => true, 'message' => 'Menu permissions updated successfully']);
        } else {
            $this->json(['error' => 'Failed to write to menu file'], 500);
        }
    }
}
