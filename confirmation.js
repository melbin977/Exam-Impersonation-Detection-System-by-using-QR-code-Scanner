document.addEventListener('DOMContentLoaded', function() {
    // Get ticket ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('ticket_id');
    
    if (!ticketId) {
        alert('Invalid hall ticket URL');
        window.location.href = 'student.html';
        return;
    }

    // Load ticket data
    loadTicketData(ticketId);
    
    // Set up button events
    document.getElementById('homeBtn').addEventListener('click', function() {
        window.location.href = 'student.html';
    });
    
    document.getElementById('downloadBtn').addEventListener('click', downloadHallTicket);
});

async function loadTicketData(ticketId) {
    try {
        const response = await fetch(`api/get_ticket.php?ticket_id=${ticketId}`);
        const data = await response.json();

        console.log(JSON.stringify(data));
        
        if (data.status !== 'success') {
            // throw new Error(data.message || 'Failed to load ticket data');
        }
        
        // Display data
        document.getElementById('ticketId').textContent = data.ticket.ticket_id;
        document.getElementById('studentName').textContent = data.student.name;
        document.getElementById('studentEmail').textContent = data.student.mail_id;
        document.getElementById('studentAadhar').textContent = data.registration.aadhar_number || 'Not provided';
        
        document.getElementById('examName').textContent = data.exam.exam_name;
        document.getElementById('instituteName').textContent = data.exam.institute_name;
        document.getElementById('examDate').textContent = formatDate(data.exam.exam_date);
        document.getElementById('examTime').textContent = formatTime(data.exam.exam_time);
        document.getElementById('examVenue').textContent = data.exam.exam_venue || 'To be announced';
        
        // Generate QR Code
        const qrData = [
            data.ticket.ticket_id,
            data.student.id,
            data.exam.exam_id,
            data.student.name,
            data.exam.exam_name,
            data.exam.exam_date
        ]
        // Encode each value and join with special character (|)
        .map(value => encodeURIComponent(value))
        .join('|');
        
        
        new QRCode(document.getElementById('qrCode'), {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
    } catch (error) {
        console.error('Error loading ticket data:', error);
        alert('Failed to load hall ticket. Please try again.');
        window.location.href = 'student.html';
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

async function downloadHallTicket() {
    const { jsPDF } = window.jspdf;
    const ticketElement = document.getElementById('hallTicket');
    
    // Show loading state
    const btn = document.getElementById('downloadBtn');
    btn.disabled = true;
    btn.textContent = 'Generating PDF...';
    
    try {
        // Create canvas from HTML
        const canvas = await html2canvas(ticketElement, {
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('hall_ticket.pdf');
        
        // Send email with PDF
        await sendTicketEmail();
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        // Reset button
        btn.disabled = false;
        btn.textContent = 'Download Hall Ticket';
    }
}

async function sendTicketEmail() {
    try {
        const ticketId = document.getElementById('ticketId').textContent;
        const response = await fetch('api/send_ticket_email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticket_id: ticketId
            })
        });
        
        const data = await response.json();
        
        if (data.status !== 'success') {
            console.warn('Email sending failed:', data.message);
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
}