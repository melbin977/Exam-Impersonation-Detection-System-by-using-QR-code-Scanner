<?php
require_once 'db_connect.php';

header("Content-Type: application/json");

if (!isset($_GET['exam_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Exam ID required']);
    exit();
}

$examId = $_GET['exam_id'];

try {
    $stmt = $conn->prepare("
        SELECT a.*, u.name, rs.aadhar_number
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        LEFT JOIN registered_students rs ON a.student_id = rs.student_id AND a.exam_id = rs.exam_id
        WHERE a.exam_id = ?
        ORDER BY a.timestamp DESC
    ");
    $stmt->execute([$examId]);
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'attendance' => $attendance
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
?>