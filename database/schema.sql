-- Database Schema for RT Management System

SET FOREIGN_KEY_CHECKS = 0;

-- Roles
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `roles` (`id`, `name`) VALUES (1, 'Admin'), (2, 'Bendahara'), (3, 'Satpam'), (4, 'Warga');

-- Users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role_id` int(11) NOT NULL,
  `qr_code_string` varchar(255) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Admin (password: admin123)
INSERT INTO `users` (`username`, `password`, `full_name`, `role_id`, `qr_code_string`) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 1, 'admin-qr-code');

-- Attendance
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('IN', 'OUT') NOT NULL,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  `latitude` decimal(10, 8) DEFAULT NULL,
  `longitude` decimal(11, 8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Finance
DROP TABLE IF EXISTS `finance`;
CREATE TABLE `finance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('INCOME', 'EXPENSE') NOT NULL,
  `amount` decimal(15, 2) NOT NULL,
  `description` text NOT NULL,
  `date` date NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Checkpoints (for Satpam)
DROP TABLE IF EXISTS `checkpoints`;
CREATE TABLE `checkpoints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `qr_code_string` varchar(255) NOT NULL UNIQUE,
  `latitude` decimal(10, 8) DEFAULT NULL,
  `longitude` decimal(11, 8) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `checkpoints` (`name`, `qr_code_string`) VALUES ('Pos Utama', 'POS-001'), ('Gerbang Belakang', 'POS-002');

-- Checkpoint Logs
DROP TABLE IF EXISTS `checkpoint_logs`;
CREATE TABLE `checkpoint_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `checkpoint_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  `image_proof` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`checkpoint_id`) REFERENCES `checkpoints` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
