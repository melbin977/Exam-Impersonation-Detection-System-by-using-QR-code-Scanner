<?php
require_once 'db_connect.php';

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['exam_id']) || !isset($data['student_id']) || !isset($data['ticket_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit();
}

try {
    // Verify the registration
    $stmt = $conn->prepare("
        SELECT rs.aadhar_number, u.name
        FROM registered_students rs
        JOIN users u ON rs.student_id = u.id
        WHERE rs.exam_id = ? AND rs.student_id = ?
    ");
    $stmt->execute([$data['exam_id'], $data['student_id']]);
    $registration = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$registration) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Student not registered for this exam']);
        exit();
    }
    
    // Record attendance
    $stmt = $conn->prepare("
        INSERT INTO attendance 
        (exam_id, student_id, ticket_id, timestamp) 
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE timestamp = NOW()
    ");
    $stmt->execute([$data['exam_id'], $data['student_id'], $data['ticket_id']]);
    
    // Remove from registered students (optional)
    $stmt = $conn->prepare("
        DELETE FROM registered_students 
        WHERE exam_id = ? AND student_id = ?
    ");
    $stmt->execute([$data['exam_id'], $data['student_id']]);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Attendance recorded',
        'aadhar_number' => $registration['aadhar_number'],
        'name' => $registration['name']
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
?>