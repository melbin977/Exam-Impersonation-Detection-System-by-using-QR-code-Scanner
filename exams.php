<?php
require_once 'db_connect.php';
session_start();

header("Content-Type: application/json");

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$userId = $_SESSION['user_id'];
$userRole = $_SESSION['user_role'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get exams based on user role
    try {
        if ($userRole === 'examiner') {
            // Get exams created by this examiner
            $stmt = $conn->prepare("SELECT * FROM exams WHERE creator_id = :userId ORDER BY exam_date DESC");
            $stmt->bindParam(':userId', $userId);
        }// Modify the student query section in exams.php
        if ($userRole === 'student') {
            $stmt = $conn->prepare("
                SELECT e.*, 
                    rs.registration_date,
                    rs.aadhar_number,
                    ht.ticket_id,
                    CASE WHEN rs.student_id IS NOT NULL THEN 1 ELSE 0 END AS is_registered
                FROM exams e
                LEFT JOIN registered_students rs ON e.exam_id = rs.exam_id AND rs.student_id = :userId
                LEFT JOIN hall_tickets ht ON e.exam_id = ht.exam_id AND ht.user_id = :userId
                WHERE e.exam_date >= CURDATE()
                ORDER BY e.exam_date ASC
            ");
            $stmt->bindParam(':userId', $userId);
        }
        
        $stmt->execute();
        $exams = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode(['status' => 'success', 'data' => $exams]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create new exam (only for examiners)
    if ($userRole !== 'examiner') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $examName = sanitizeInput($data['exam_name']);
    $instituteName = sanitizeInput($data['institute_name']);
    $examDate = sanitizeInput($data['exam_date']);
    $examTime = sanitizeInput($data['exam_time']);
    $lastRegDay = sanitizeInput($data['last_registration_day']);
    
    try {
        $stmt = $conn->prepare("INSERT INTO exams (exam_name, institute_name, exam_date, exam_time, last_registration_day, creator_id) 
                              VALUES (:exam_name, :institute_name, :exam_date, :exam_time, :last_reg_day, :creator_id)");
        $stmt->bindParam(':exam_name', $examName);
        $stmt->bindParam(':institute_name', $instituteName);
        $stmt->bindParam(':exam_date', $examDate);
        $stmt->bindParam(':exam_time', $examTime);
        $stmt->bindParam(':last_reg_day', $lastRegDay);
        $stmt->bindParam(':creator_id', $userId);
        
        if ($stmt->execute()) {
            $examId = $conn->lastInsertId();
            http_response_code(201);
            echo json_encode([
                'status' => 'success',
                'message' => 'Exam created successfully',
                'exam_id' => $examId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to create exam']);
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