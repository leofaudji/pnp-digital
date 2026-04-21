<?php
date_default_timezone_set('Asia/Jakarta');

if (function_exists('opcache_reset')) {
    opcache_reset();
}

// Enable error reporting for debugging production 500
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't show to user
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt'); // Log to local file

// Autoloader
spl_autoload_register(function ($class) {
    if (file_exists(__DIR__ . '/../src/Core/' . $class . '.php')) {
        require_once __DIR__ . '/../src/Core/' . $class . '.php';
    } elseif (file_exists(__DIR__ . '/../src/Controllers/' . $class . '.php')) {
        require_once __DIR__ . '/../src/Controllers/' . $class . '.php';
    }
});

// Load Environment Variables
if (!Env::load(__DIR__ . '/../.env')) {
    error_log("Env::load failed: .env file NOT found at " . realpath(__DIR__ . '/../.env'));
}

// Load Config
$config = require __DIR__ . '/../config/database.php';

// Initialize Router
$router = new Router();

// Define API Routes
$router->add('GET', '/api/test', function () {
    header('Content-Type: application/json');
    echo json_encode(['message' => 'API is working!']);
});

$router->add('POST', '/api/login', [AuthController::class, 'login']);
$router->add('POST', '/api/logout', [AuthController::class, 'logout']);
$router->add('GET', '/api/me', [AuthController::class, 'me']);

// Google OAuth
$router->add('GET', '/api/auth/google', [GoogleAuthController::class, 'redirect']);
$router->add('GET', '/api/auth/google/callback', [GoogleAuthController::class, 'callback']);
$router->add('GET', '/api/auth/google/link', [GoogleAuthController::class, 'linkRedirect']);
$router->add('GET', '/api/auth/google/link-callback', [GoogleAuthController::class, 'linkCallback']);
$router->add('POST', '/api/auth/google/unlink', [GoogleAuthController::class, 'unlink']);

$router->add('GET', '/api/dashboard', [DashboardController::class, 'index']);
$router->add('GET', '/api/public/stats', [DashboardController::class, 'publicStats']);
$router->add('GET', '/api/changelog', [ChangelogController::class, 'index']);

// Attendance
$router->add('GET', '/api/attendance/history', [AttendanceController::class, 'history']);
$router->add('GET', '/api/attendance/alert-count', [AttendanceController::class, 'get_alert_count']);
$router->add('GET', '/api/attendance/status', [AttendanceController::class, 'get_status']);
$router->add('GET', '/api/attendance/summary', [AttendanceController::class, 'get_monthly_summary']);
$router->add('POST', '/api/attendance/scan', [AttendanceController::class, 'scan']);
$router->add('GET', '/api/user/qr', [AttendanceController::class, 'generate_qr']);
$router->add('GET', '/api/checkpoints', [AttendanceController::class, 'list_checkpoints']);
$router->add('POST', '/api/checkpoints', [AttendanceController::class, 'store_checkpoint']);
$router->add('POST', '/api/checkpoints/update', [AttendanceController::class, 'update_checkpoint']);
$router->add('POST', '/api/checkpoints/delete', [AttendanceController::class, 'delete_checkpoint']);
$router->add('GET', '/api/checkpoints/print', [AttendanceController::class, 'print_checkpoint_qr']);
$router->add('GET', '/api/users/satpam', [AttendanceController::class, 'list_satpam']);

// Finance
$router->add('GET', '/api/finance', [FinanceController::class, 'index']);
$router->add('POST', '/api/finance', [FinanceController::class, 'store']);
$router->add('POST', '/api/finance/update', [FinanceController::class, 'update']); // Edit Route
$router->add('GET', '/api/finance/export/pdf', [FinanceController::class, 'export_pdf']);
$router->add('GET', '/api/finance/export/csv', [FinanceController::class, 'export_csv']);
$router->add('GET', '/api/finance/export/lpj', [FinanceController::class, 'export_lpj_pdf']); // New LPJ Route
$router->add('GET', '/api/finance/recap', [FinanceController::class, 'get_monthly_recap']);
$router->add('POST', '/api/finance/delete', [FinanceController::class, 'destroy']);
$router->add('GET', '/api/finance/advances', [FinanceController::class, 'get_advances']);
$router->add('POST', '/api/finance/advances', [FinanceController::class, 'store_advance']);
$router->add('POST', '/api/finance/advances/settle', [FinanceController::class, 'settle_advance']);
$router->add('GET', '/api/finance/my-debt', [FinanceController::class, 'get_my_debt']);
$router->add('GET', '/api/finance/analytics', [FinanceController::class, 'get_analytics']);
$router->add('GET', '/api/finance/allocation', [FinanceController::class, 'get_allocation']);
$router->add('GET', '/api/finance/salary/print', [FinanceController::class, 'print_salary_slip']);
$router->add('POST', '/api/finance/salary/prepare', [FinanceController::class, 'prepare_print']);
$router->add('POST', '/api/finance/salary/process', [FinanceController::class, 'process_salary']);
$router->add('GET', '/api/finance/salary/history', [FinanceController::class, 'get_salary_history']);
$router->add('GET', '/api/finance/salary/status', [FinanceController::class, 'check_payment_status']);

$router->add('GET', '/api/fees/status', [FeeController::class, 'get_status']);
$router->add('GET', '/api/fees/summary', [FeeController::class, 'get_all_summary']);
$router->add('GET', '/api/fees/arrears', [FeeController::class, 'get_arrears_summary']);
$router->add('POST', '/api/fees/pay', [FeeController::class, 'pay']);
$router->add('POST', '/api/fees/pay-bulk', [FeeController::class, 'pay_bulk']);

// Invoices
$router->add('GET', '/api/invoices', [InvoiceController::class, 'index']);
$router->add('GET', '/api/invoices/unpaid-count', [InvoiceController::class, 'get_unpaid_count']);
$router->add('GET', '/api/invoices/unpaid-users-count', [InvoiceController::class, 'get_unpaid_users_count']);
$router->add('POST', '/api/invoices/generate', [InvoiceController::class, 'generate_monthly']);

// Visitors
$router->add('GET', '/api/visitors', [VisitorController::class, 'index']);
$router->add('POST', '/api/visitors/add', [VisitorController::class, 'store']);
$router->add('POST', '/api/visitors/verify', [VisitorController::class, 'verify']);
$router->add('POST', '/api/visitors/checkout', [VisitorController::class, 'checkout']);
$router->add('GET', '/api/visitors/public', [VisitorController::class, 'public_view']);

$router->add('GET', '/api/invoices/print', [InvoiceController::class, 'print_invoice']);
$router->add('GET', '/api/invoices/reminder', [InvoiceController::class, 'get_reminder_url']);

$router->add('GET', '/api/settings', [SettingController::class, 'index']);
$router->add('POST', '/api/settings', [SettingController::class, 'update']);
$router->add('POST', '/api/settings/logo', [SettingController::class, 'upload_logo']);
$router->add('GET', '/api/settings/fee-categories', [SettingController::class, 'get_fee_categories']);
$router->add('POST', '/api/settings/fee-categories/add', [SettingController::class, 'add_fee_category']);
$router->add('POST', '/api/settings/fee-categories/update', [SettingController::class, 'update_fee_category']);
$router->add('POST', '/api/settings/fee-categories/delete', [SettingController::class, 'delete_fee_category']);
$router->add('GET', '/api/settings/holidays', [SettingController::class, 'get_holidays']);
$router->add('POST', '/api/settings/holidays/add', [SettingController::class, 'add_holiday']);
$router->add('POST', '/api/settings/holidays/delete', [SettingController::class, 'delete_holiday']);

// User Management
$router->add('GET', '/api/users', [UserController::class, 'index']);
$router->add('GET', '/api/users', [UserController::class, 'index']);
$router->add('POST', '/api/users', [UserController::class, 'store']);

// Profile & Security
$router->add('POST', '/api/profile/update', [ProfileController::class, 'update']);
$router->add('POST', '/api/profile/password', [ProfileController::class, 'changePassword']);
$router->add('GET', '/api/profile/activity', [ProfileController::class, 'activity']);
$router->add('GET', '/api/profile/family', [ProfileController::class, 'family']);
$router->add('POST', '/api/users/update', [UserController::class, 'update']);
$router->add('POST', '/api/users/delete', [UserController::class, 'delete']);

// Role Management
$router->add('GET', '/api/roles', [RoleController::class, 'index']);
$router->add('POST', '/api/roles', [RoleController::class, 'store']);
$router->add('POST', '/api/roles/update', [RoleController::class, 'update']);
$router->add('POST', '/api/roles/delete', [RoleController::class, 'delete']);

// Menu & RBAC Management
$router->add('GET', '/api/menu', [MenuController::class, 'index']);
$router->add('POST', '/api/menu/update', [MenuController::class, 'update']);

// Leaderboard
$router->add('GET', '/api/leaderboard', [LeaderboardController::class, 'index']);

// AI Meetings (Notulensi Rapat)
$router->add('GET', '/api/meetings/init', function () {
    require_once __DIR__ . '/../migrate_create_meetings.php';
    echo "Migration Triggered";
});
$router->add('GET', '/api/meetings', [MeetingController::class, 'list']);
$router->add('POST', '/api/meetings', [MeetingController::class, 'save']);
$router->add('POST', '/api/meetings/delete', [MeetingController::class, 'delete']);
$router->add('POST', '/api/meetings/summarize', [MeetingController::class, 'summarize']);

// AI Chatbot
$router->add('POST', '/api/chatbot/query', [ChatbotController::class, 'query']);
$router->add('GET', '/api/analytics/demographics', [new DemographicsController(), 'getSummary']);
$router->add('GET', '/api/analytics/security', [new SecurityAnalyticsController(), 'getPatterns']);
$router->add('GET', '/api/analytics/contributions', [new SecurityAnalyticsController(), 'getContributions']);

// Database Backup & Restore
$router->add('GET', '/api/backup/export', [BackupController::class, 'export']);
$router->add('POST', '/api/backup/restore', [BackupController::class, 'restore']);

// CCTV
$router->add('GET', '/api/cctv', [CCTVController::class, 'index']);
$router->add('POST', '/api/cctv', [CCTVController::class, 'store']);
$router->add('POST', '/api/cctv/update', [CCTVController::class, 'update']);
$router->add('POST', '/api/cctv/delete', [CCTVController::class, 'delete']);
$router->add('GET', '/api/cctv/proxy', [CCTVController::class, 'proxy']);

// Temporary migration route for demographics
$router->add('GET', '/api/init/demographics', function () {
    require __DIR__ . '/../migrate_demographics.php';
    echo "Migration demographic fields triggered.";
});

$router->add('GET', '/api/init/seed-demographics', function () {
    require __DIR__ . '/../seed_demographics.php';
    echo "Demographic data seeding triggered.";
});

$router->add('GET', '/api/init/seed-patrols', function () {
    require __DIR__ . '/../seed_patrol_logs.php';
});

$router->add('GET', '/api/init/patrol-settings', function () {
    require __DIR__ . '/../migrate_patrol_settings.php';
});

// Define View Routes (SPA Entry)
$router->add('GET', '/favicon.ico', function () {
    header('Location: ' . BASE_PATH . '/assets/images/favicon.png');
    exit;
});

$router->add('GET', '/', function () {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('app_title', 'rt_name')");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $app_title = $settings['app_title'] ?? 'RT DIGITAL';
    $rt_name = $settings['rt_name'] ?? '';
    
    $csrf_token = Auth::generateCsrfToken();
    require __DIR__ . '/../views/index.php';
});

// Run Router
$router->run();
