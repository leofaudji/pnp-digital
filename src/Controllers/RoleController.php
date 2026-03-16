<?php

class RoleController extends BaseController
{
    public function index()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);
        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM roles ORDER BY id ASC");
        $this->json($stmt->fetchAll());
    }

    public function store()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['name']);

        $db = Database::getInstance();
        $db->query("INSERT INTO roles (name) VALUES (?)", [$data['name']]);
        $this->json(['success' => true, 'message' => 'Role created successfully']);
    }

    public function update()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['id', 'name']);

        $db = Database::getInstance();
        $db->query("UPDATE roles SET name = ? WHERE id = ?", [$data['name'], $data['id']]);
        $this->json(['success' => true, 'message' => 'Role updated successfully']);
    }

    public function delete()
    {
        if (Auth::role() != 1)
            $this->json(['error' => 'Forbidden'], 403);
        $data = json_decode(file_get_contents("php://input"), true);
        $this->validate($data, ['id']);

        $db = Database::getInstance();
        // Check if role is used
        $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE role_id = ?", [$data['id']]);
        if ($stmt->fetch()['count'] > 0) {
            $this->json(['error' => 'Cannot delete role as it is assigned to users'], 400);
        }

        $db->query("DELETE FROM roles WHERE id = ?", [$data['id']]);
        $this->json(['success' => true, 'message' => 'Role deleted successfully']);
    }
}
