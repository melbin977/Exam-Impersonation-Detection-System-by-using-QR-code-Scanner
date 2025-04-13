<?php
// Ensure no output before headers
ob_start();

require_once 'db_connect.php';
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Clear any existing output
ob_clean();

// Set headers
header("Content-Type: application/json");
header("Cache-Control: no-cache, must-revalidate");

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

try {
    // Get raw POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Validate input
    if (!$data || !isset($data['user_id'])) {
        throw new Exception('Invalid request data');
    }

    $userId = filter_var($data['user_id'], FILTER_VALIDATE_INT);
    if (!$userId) {
        throw new Exception('Invalid user ID');
    }

    // Generate OTP
    $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiry = time() + 300; // 5 minutes

    // Get user email
    $stmt = $conn->prepare("SELECT mail_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('User not found');
    }

    $email = filter_var($user['mail_id'], FILTER_VALIDATE_EMAIL);
    if (!$email) {
        throw new Exception('Invalid email address');
    }

    // Store OTP
    $stmt = $conn->prepare("UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?");
    $stmt->execute([$otp, $expiry, $userId]);

    // Configure PHPMailer
    $mail = new PHPMailer(true);
    
    // Server settings
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'btechcodingwallah@gmail.com';
    $mail->Password = 'uxfs frot sarj ntiy';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->SMTPDebug = 0; // Change to 2 for debugging

    // Recipients
    $mail->setFrom('btechcodingwallah@gmail.com', 'SEAP System');
    $mail->addAddress($email);

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Your Exam Registration OTP';
    $mail->Body = "Your OTP code is: <strong>$otp</strong><br>Valid for 5 minutes.";
    $mail->AltBody = "Your OTP code is: $otp\nValid for 5 minutes.";

    $mail->send();

    // Successful response
    echo json_encode([
        'status' => 'success',
        'message' => 'OTP sent successfully'
    ]);

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    error_log("OTP error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

// Ensure no extra output
ob_end_flush();
?>