<?php
require_once 'db_connect.php';
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['ticket_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ticket ID required']);
    exit();
}

$ticketId = $data['ticket_id'];

try {
    // Get ticket and user info
    $stmt = $conn->prepare("
        SELECT u.mail_id, u.name, e.exam_name, e.exam_date
        FROM hall_tickets t
        JOIN users u ON t.user_id = u.id
        JOIN exams e ON t.exam_id = e.exam_id
        WHERE t.ticket_id = ?
    ");
    $stmt->execute([$ticketId]);
    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$ticket) {
        throw new Exception('Ticket not found');
    }
    
    // Configure PHPMailer
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'btechcodingwallah@gmail.com';
    $mail->Password = 'uxfs frot sarj ntiy';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    
    // Recipients
    $mail->setFrom('btechcodingwallah@gmail.com', 'SEAP System');
    $mail->addAddress($ticket['mail_id'], $ticket['name']);
    
    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Your Exam Hall Ticket';
    $mail->Body = "
        <h2>Exam Hall Ticket Attached</h2>
        <p>Dear {$ticket['name']},</p>
        <p>Your hall ticket for <strong>{$ticket['exam_name']}</strong> on {$ticket['exam_date']} is attached.</p>
        <p>Please bring a printed copy along with your Aadhar card to the exam center.</p>
        <p>Ticket ID: <strong>$ticketId</strong></p>
        <p>Best regards,<br>SEAP Team</p>
    ";
    $mail->AltBody = "Your hall ticket for {$ticket['exam_name']} is attached.";
    
    // Generate PDF and attach
    $pdfUrl = "https://yourdomain.com/generate_pdf.php?ticket_id=$ticketId";
    $pdfContent = file_get_contents($pdfUrl);
    $mail->addStringAttachment($pdfContent, 'hall_ticket.pdf');
    
    $mail->send();
    
    echo json_encode(['status' => 'success', 'message' => 'Email sent successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>