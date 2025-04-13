<?php
require_once 'db_connect.php';
session_start();

header("Content-Type: application/json");

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Check if user is logged in as student
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'student') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$studentId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $examId = sanitizeInput($data['exam_id']);
    $aadharNumber = isset($data['aadhar_number']) ? sanitizeInput($data['aadhar_number']) : null;
    
    try {
        // Check if already registered
        $checkStmt = $conn->prepare("SELECT * FROM registered_students WHERE student_id = :student_id AND exam_id = :exam_id");
        $checkStmt->bindParam(':student_id', $studentId);
        $checkStmt->bindParam(':exam_id', $examId);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(['status' => 'error', 'message' => 'Already registered for this exam']);
            exit();
        }
        
        // Check exam registration deadline
        $examStmt = $conn->prepare("SELECT last_registration_day FROM exams WHERE exam_id = :exam_id");
        $examStmt->bindParam(':exam_id', $examId);
        $examStmt->execute();
        $exam = $examStmt->fetch(PDO::FETCH_ASSOC);
        
        if (strtotime($exam['last_registration_day']) < strtotime(date('Y-m-d'))) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Registration deadline has passed']);
            exit();
        }
        
        // Register student
        $registrationDate = date('Y-m-d');
        $stmt = $conn->prepare("INSERT INTO registered_students (student_id, exam_id, registration_date, aadhar_number) 
                              VALUES (:student_id, :exam_id, :registration_date, :aadhar_number)");
        $stmt->bindParam(':student_id', $studentId);
        $stmt->bindParam(':exam_id', $examId);
        $stmt->bindParam(':registration_date', $registrationDate);
        $stmt->bindParam(':aadhar_number', $aadharNumber);
        
        if ($stmt->execute()) {
            http_response_code(201);
            // Add this after successful registration (before the success response)
            // Generate ticket ID
            $ticketId = strtoupper(bin2hex(random_bytes(4))); // 8-character ID

            // Store ticket
            $stmt = $conn->prepare("INSERT INTO hall_tickets (ticket_id, user_id, exam_id, registration_date) VALUES (?, ?, ?, NOW())");
            $stmt->execute([$ticketId, $studentId, $examId]);

            // Redirect to confirmation page
            echo json_encode([
                'status' => 'success',
                'message' => 'Registration successful',
                'ticket_id' => $ticketId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Registration failed']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>