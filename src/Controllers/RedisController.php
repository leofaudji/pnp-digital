<?php

class RedisController extends BaseController
{
    public function index()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $cache = Cache::getInstance();
        $info = $cache->info();
        
        $this->json([
            'connected' => $cache->isConnected(),
            'info' => $info,
            'config' => [
                'socket' => env('REDIS_SOCKET'),
                'host' => env('REDIS_HOST'),
                'port' => env('REDIS_PORT')
            ]
        ]);
    }

    public function flush()
    {
        // Only Admin
        if (Auth::role() != 1) {
            $this->json(['error' => 'Unauthorized'], 403);
        }

        $cache = Cache::getInstance();
        $success = $cache->flush();
        
        $this->json(['success' => $success, 'message' => $success ? 'Redis cache cleared successfully' : 'Failed to clear Redis cache']);
    }
}
