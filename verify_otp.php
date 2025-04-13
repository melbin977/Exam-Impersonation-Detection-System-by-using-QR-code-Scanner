<?php
require_once 'db_connect.php';

header("Content-Type: application/json");

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!$data || !isset($data['user_id']) || !isset($data['otp'])) {
            throw new Exception('Invalid request data');
        }

        $userId = sanitizeInput($data['user_id']);
        $otp = sanitizeInput($data['otp']);

        $stmt = $conn->prepare("SELECT otp, otp_expiry FROM users WHERE id = :user_id");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('User not found');
        }

        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user['otp'] !== $otp) {
            throw new Exception('Invalid OTP');
        }
        
        if (time() > $user['otp_expiry']) {
            throw new Exception('OTP expired');
        }

        // Clear OTP after successful verification
        $stmt = $conn->prepare("UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = :user_id");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        echo json_encode([
            'status' => 'success',
            'message' => 'OTP verified successfully'
        ]);

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>