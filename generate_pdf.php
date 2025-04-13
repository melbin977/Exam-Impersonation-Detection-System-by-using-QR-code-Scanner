<?php
require_once 'db_connect.php';

if (!isset($_GET['ticket_id'])) {
    header("HTTP/1.0 404 Not Found");
    exit();
}

$ticketId = $_GET['ticket_id'];

// Get ticket data (similar to get_ticket.php)
// ... database query code ...

// Generate HTML for PDF
ob_start();
?>
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Similar to confirmation.css but optimized for PDF */
        body { font-family: Arial; margin: 0; padding: 20px; }
        .ticket { border: 2px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #000; text-align: center; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .qr-code { text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="ticket">
        <h1>Exam Hall Ticket</h1>
        <div class="ticket-id">Ticket ID: <?= $ticket['ticket_id'] ?></div>
        
        <div class="student-info">
            <h2>Student Information</h2>
            <div class="info-grid">
                <!-- Display student info -->
            </div>
        </div>
        
        <!-- Rest of the ticket content -->
        
        <div class="qr-code">
            <!-- Generate QR code using a PHP library or external service -->
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=<?= urlencode($qrData) ?>">
        </div>
    </div>
</body>
</html>
<?php
$html = ob_get_clean();

// Use a PDF generation library like Dompdf
require 'vendor/autoload.php';
use Dompdf\Dompdf;

$dompdf = new Dompdf();
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();
$dompdf->stream("hall_ticket.pdf", ["Attachment" => false]);
?>