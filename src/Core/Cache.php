<?php

class Cache
{
    private static $instance = null;
    private $redis = null;
    private $connected = false;

    private function __construct()
    {
        if (!class_exists('Redis')) {
            return;
        }

        $this->redis = new Redis();
        try {
            $socket = env('REDIS_SOCKET');
            $host = env('REDIS_HOST', '127.0.0.1');
            $port = (int)env('REDIS_PORT', 6379);
            $password = env('REDIS_PASSWORD');

            // Use socket if it exists on the system (hosting mode)
            if ($socket && @file_exists($socket)) {
                $this->connected = @$this->redis->connect($socket);
            } else {
                // Fallback to TCP (local development)
                $this->connected = @$this->redis->connect($host, $port, 1.5); // 1.5s timeout
            }

            if ($this->connected && $password) {
                $this->redis->auth($password);
            }
        } catch (Exception $e) {
            error_log("Redis Connection Error: " . $e->getMessage());
            $this->connected = false;
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function get($key)
    {
        if (!$this->connected) return null;
        $data = $this->redis->get($key);
        return $data !== false ? unserialize($data) : null;
    }

    public function set($key, $value, $ttl = 3600)
    {
        if (!$this->connected) return false;
        return $this->redis->set($key, serialize($value), $ttl);
    }

    /**
     * Get an item from the cache, or execute the given Closure and store the result.
     */
    public function remember($key, $ttl, $callback)
    {
        $value = $this->get($key);
        if ($value !== null) {
            return $value;
        }

        $value = $callback();
        $this->set($key, $value, $ttl);
        return $value;
    }

    public function delete($key)
    {
        if (!$this->connected) return false;
        return $this->redis->del($key);
    }

    /**
     * Delete multiple keys by prefix.
     */
    public function deleteByPrefix($prefix)
    {
        if (!$this->connected) return false;
        $keys = $this->redis->keys($prefix . '*');
        if (!empty($keys)) {
            return $this->redis->del($keys);
        }
        return true;
    }

    public function flush()
    {
        if (!$this->connected) return false;
        return $this->redis->flushDB();
    }

    /**
     * Unified invalidation method to clear cache by logical groups.
     * 
     * @param string $group 'finance', 'warga', 'security', or 'settings'
     */
    public function invalidate($group)
    {
        if (!$this->connected) return;

        switch ($group) {
            case 'finance':
                $this->deleteByPrefix('finance_index_');
                $this->delete('dashboard_stats');
                break;
            case 'warga':
                $this->delete('users_list_all');
                $this->delete('warga_demographics_summary');
                $this->delete('dashboard_stats');
                break;
            case 'security':
                $this->deleteByPrefix('security_patterns_');
                $this->deleteByPrefix('security_contributions_');
                $this->deleteByPrefix('leaderboard_');
                $this->delete('dashboard_stats');
                break;
            case 'settings':
                $this->delete('app_settings');
                break;
            case 'invoices':
                $this->deleteByPrefix('invoices_');
                $this->delete('dashboard_stats');
                break;
            case 'visitors':
                $this->deleteByPrefix('visitors_');
                $this->delete('dashboard_stats');
                break;
        }
    }

    public function info()
    {
        if (!$this->connected) return [];
        return $this->redis->info();
    }

    public function isConnected()
    {
        return $this->connected;
    }
}
