<?php
require_once 'db_connect.php';

header("Content-Type: application/json");

if (!isset($_GET['ticket_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ticket ID required']);
    exit();
}

$ticketId = $_GET['ticket_id'];

try {
    // First get the basic ticket info
    $stmt = $conn->prepare("
        SELECT t.*, u.name, u.mail_id, e.*
        FROM hall_tickets t
        JOIN users u ON t.user_id = u.id
        JOIN exams e ON t.exam_id = e.exam_id
        WHERE t.ticket_id = ?
    ");
    $stmt->execute([$ticketId]);
    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$ticket) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Ticket not found']);
        exit();
    }
    
    // Then get Aadhar number separately (if exists)
    $aadhar = null;
    $stmt = $conn->prepare("
        SELECT aadhar_number 
        FROM registered_students 
        WHERE student_id = ? AND exam_id = ?
    ");
    $stmt->execute([$ticket['user_id'], $ticket['exam_id']]);
    $registration = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($registration) {
        $aadhar = $registration['aadhar_number'];
    }
    
    // Format response
    $response = [
        'status' => 'success',
        'ticket' => [
            'ticket_id' => $ticket['ticket_id'],
            'registration_date' => $ticket['registration_date']
        ],
        'student' => [
            'id' => $ticket['user_id'],
            'name' => $ticket['name'],
            'mail_id' => $ticket['mail_id']
        ],
        'exam' => [
            'exam_id' => $ticket['exam_id'],
            'exam_name' => $ticket['exam_name'],
            'institute_name' => $ticket['institute_name'],
            'exam_date' => $ticket['exam_date'],
            'exam_time' => $ticket['exam_time'],
            'exam_venue' => $ticket['exam_venue'] ?? 'To be announced'
        ],
        'registration' => [
            'aadhar_number' => $aadhar
        ]
    ];
    
    echo json_encode($response);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error_details' => $e->getMessage()
    ]);
}
?>