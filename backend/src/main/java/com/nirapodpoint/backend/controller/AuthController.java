package com.nirapodpoint.backend.controller;

import com.nirapodpoint.backend.model.User;
import com.nirapodpoint.backend.service.UserService;
import com.nirapodpoint.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    @Autowired
    private UserService userService;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam String password,
            @RequestParam("nidFront") MultipartFile nidFront,
            @RequestParam("nidBack") MultipartFile nidBack
    ) {
        try {
            userService.registerUser(name, email, phone, password, nidFront, nidBack);
            return ResponseEntity.status(HttpStatus.CREATED).body("Registration successful! Please wait for admin verification.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Registration failed");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        try {
            User user = userService.authenticateUser(loginRequest.getEmailOrPhone(), loginRequest.getPassword());
            String jwt = jwtUtil.generateToken(user.getEmail());
            return ResponseEntity.ok(new JwtResponse(jwt, user.isVerified(), user.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@org.springframework.security.core.annotation.AuthenticationPrincipal com.nirapodpoint.backend.model.User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        return ResponseEntity.ok(new UserInfo(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.isVerified(), user.isAdmin(), user.getCreatedAt()));
    }

    public static class LoginRequest {
        private String emailOrPhone;
        private String password;
        public String getEmailOrPhone() { return emailOrPhone; }
        public void setEmailOrPhone(String emailOrPhone) { this.emailOrPhone = emailOrPhone; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
    public static class JwtResponse {
        private String token;
        private boolean isVerified;
        private String name;
        public JwtResponse(String token, boolean isVerified, String name) {
            this.token = token;
            this.isVerified = isVerified;
            this.name = name;
        }
        public String getToken() { return token; }
        public boolean isVerified() { return isVerified; }
        public String getName() { return name; }
    }

    public static class UserInfo {
        private String id;
        private String name;
        private String email;
        private String phone;
        private boolean isVerified;
        private boolean isAdmin;
        private java.time.LocalDateTime createdAt;
        public UserInfo(String id, String name, String email, String phone, boolean isVerified, boolean isAdmin, java.time.LocalDateTime createdAt) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.isVerified = isVerified;
            this.isAdmin = isAdmin;
            this.createdAt = createdAt;
        }
        public String getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getPhone() { return phone; }
        public boolean isVerified() { return isVerified; }
        public boolean isAdmin() { return isAdmin; }
        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    }
} 