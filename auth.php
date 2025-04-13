<?php
require_once 'db_connect.php';

session_start();

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (isset($data['action'])) {
        if ($data['action'] === 'login') {
            // Login logic
            $email = sanitizeInput($data['email']);
            $password = sanitizeInput($data['password']);
            $role = sanitizeInput($data['role']);
            
            try {
                $stmt = $conn->prepare("SELECT * FROM users WHERE mail_id = :email AND role = :role");
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':role', $role);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    if (password_verify($password, $user['password'])) {
                        $_SESSION['user_id'] = $user['id'];
                        $_SESSION['user_role'] = $user['role'];
                        $_SESSION['user_name'] = $user['name'];
                        
                        setcookie('loggedIn', 'true', time() + (86400 * 30), "/");
                        setcookie('userRole', $user['role'], time() + (86400 * 30), "/");
                        setcookie('userId', $user['id'], time() + (86400 * 30), "/");
                        
                        http_response_code(200);
                        echo json_encode([
                            'status' => 'success',
                            'message' => 'Login successful',
                            'role' => $user['role'],
                            'userId' => $user['id']
                        ]);
                    } else {
                        http_response_code(401);
                        echo json_encode(['status' => 'error', 'message' => 'Invalid credentials']);
                    }
                } else {
                    http_response_code(404);
                    echo json_encode(['status' => 'error', 'message' => 'User not found']);
                }
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
            }
        } elseif ($data['action'] === 'signup') {
            // Signup logic
            $name = sanitizeInput($data['name']);
            $email = sanitizeInput($data['email']);
            $password = password_hash(sanitizeInput($data['password']), PASSWORD_DEFAULT);
            $role = sanitizeInput($data['role']);
            $phone = isset($data['phone']) ? sanitizeInput($data['phone']) : null;
            
            try {
                // Check if email already exists
                $checkStmt = $conn->prepare("SELECT id FROM users WHERE mail_id = :email");
                $checkStmt->bindParam(':email', $email);
                $checkStmt->execute();
                
                if ($checkStmt->rowCount() > 0) {
                    http_response_code(409);
                    echo json_encode(['status' => 'error', 'message' => 'Email already exists']);
                    exit();
                }
                
                $stmt = $conn->prepare("INSERT INTO users (name, mail_id, phone, password, role) 
                                       VALUES (:name, :email, :phone, :password, :role)");
                $stmt->bindParam(':name', $name);
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':phone', $phone);
                $stmt->bindParam(':password', $password);
                $stmt->bindParam(':role', $role);
                
                if ($stmt->execute()) {
                    $userId = $conn->lastInsertId();
                    
                    $_SESSION['user_id'] = $userId;
                    $_SESSION['user_role'] = $role;
                    $_SESSION['user_name'] = $name;
                    
                    setcookie('loggedIn', 'true', time() + (86400 * 30), "/");
                    setcookie('userRole', $role, time() + (86400 * 30), "/");
                    setcookie('userId', $userId, time() + (86400 * 30), "/");
                    
                    http_response_code(201);
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'User registered successfully',
                        'role' => $role,
                        'userId' => $userId
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['status' => 'error', 'message' => 'Registration failed']);
                }
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
            }
        }
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>