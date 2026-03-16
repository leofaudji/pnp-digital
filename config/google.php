<?php

return [
    'client_id' => '195664094075-mbfpnocjcito9p9n8cm9qniq7l2f6oa4.apps.googleusercontent.com',
    'client_secret' => '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',
    'redirect_uri' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
        . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
        . '/app-rt/api/auth/google/callback',
    'scope' => 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    'auth_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
    'token_url' => 'https://oauth2.googleapis.com/token',
    'userinfo_url' => 'https://www.googleapis.com/oauth2/v3/userinfo',
];
