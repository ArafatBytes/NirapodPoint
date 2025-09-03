package com.nirapodpoint.backend.controller;

import com.nirapodpoint.backend.model.User;
import com.nirapodpoint.backend.repository.UserRepository;
import com.nirapodpoint.backend.service.MailService;
import com.nirapodpoint.backend.service.UserService;
import com.nirapodpoint.backend.repository.CrimeReportRepository;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private MailService mailService;
    @Autowired
    private UserService userService;
    @Autowired
    private CrimeReportRepository crimeReportRepository;

    
    @GetMapping
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal User admin,
                                         @RequestParam(value = "verified", required = false, defaultValue = "all") String verified) {
        if (admin == null || !admin.isAdmin()) {
            return ResponseEntity.status(403).body("Forbidden: Admins only");
        }
        List<User> users = userRepository.findAll();
        if (verified.equals("true")) {
            users = users.stream().filter(User::isVerified).collect(Collectors.toList());
        } else if (verified.equals("false")) {
            users = users.stream().filter(u -> !u.isVerified()).collect(Collectors.toList());
        }
        return ResponseEntity.ok(users);
    }

    
    @PatchMapping("/{id}/verify")
    public ResponseEntity<?> verifyUser(@AuthenticationPrincipal User admin,
                                        @PathVariable String id,
                                        @RequestParam boolean approve) {
        if (admin == null || !admin.isAdmin()) {
            return ResponseEntity.status(403).body("Forbidden: Admins only");
        }
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        boolean wasUnverified = !user.isVerified();
        boolean wasVerified = user.isVerified();

        
        if (approve) {
            
            if (user.getNidFront() == null || user.getPhoto() == null) {
                return ResponseEntity.status(400).body(Map.of(
                    "verified", false,
                    "message", "NID front or real-time photo missing. Cannot verify user."
                ));
            }
            try {
                
                RestTemplate restTemplate = new RestTemplate();
                String pythonUrl = "http://localhost:5001/verify";
                Map<String, String> req = new HashMap<>();
                req.put("nid", user.getNidFront().startsWith("data:") ? user.getNidFront() : "data:image/jpeg;base64," + user.getNidFront());
                req.put("selfie", user.getPhoto().startsWith("data:") ? user.getPhoto() : "data:image/png;base64," + user.getPhoto());
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, String>> entity = new HttpEntity<>(req, headers);
                Map resp = restTemplate.postForObject(pythonUrl, entity, Map.class);
                boolean verified = Boolean.TRUE.equals(resp.get("verified"));
                double confidence = resp.get("confidence") != null ? Double.parseDouble(resp.get("confidence").toString()) : 0.0;
                if (!verified) {
                    return ResponseEntity.ok(Map.of(
                        "verified", false,
                        "message", "Face verification failed. User not verified.",
                        "confidence", confidence
                    ));
                }
                if (confidence < 0.40) {
                    return ResponseEntity.ok(Map.of(
                        "verified", false,
                        "message", String.format("Low confidence (%.2f). User not verified.", confidence),
                        "confidence", confidence
                    ));
                }
                
                user.setVerified(true);
                userRepository.save(user);
                if (wasUnverified) {
                    try {
                        mailService.sendVerificationApprovedEmail(user.getEmail(), user.getName());
                    } catch (MessagingException e) {
                        e.printStackTrace();
                    }
                }
                return ResponseEntity.ok(Map.of(
                    "verified", true,
                    "message", String.format("User verified! Confidence: %.2f", confidence),
                    "confidence", confidence
                ));
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of(
                    "verified", false,
                    "message", "Face verification service error: " + e.getMessage()
                ));
            }
        } else {
            
            if (wasVerified) {
                try {
                    mailService.sendVerificationDisapprovedEmail(user.getEmail(), user.getName());
                } catch (MessagingException e) {
                    e.printStackTrace();
                }
                
                crimeReportRepository.deleteByReporter(user.getId());
            }
            user.setVerified(false);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                "verified", false,
                "message", "User disapproved."
            ));
        }
    }

    
    @PatchMapping("/me")
    public ResponseEntity<?> updateOwnInfo(@AuthenticationPrincipal User user,
                                           @RequestBody User update) {
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        // Only update fields that are present (not null) in the request
        if (update.getName() != null) user.setName(update.getName());
        if (update.getEmail() != null) user.setEmail(update.getEmail());
        if (update.getPhone() != null) user.setPhone(update.getPhone());
        if (update.getPhoto() != null && !update.getPhoto().isEmpty()) user.setPhoto(update.getPhoto());
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    
    @PostMapping("/me/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal User user, @RequestBody ChangePasswordRequest req) {
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        try {
            userService.changePassword(user, req.getCurrentPassword(), req.getNewPassword());
            return ResponseEntity.ok("Password changed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    
    @GetMapping("/me/crime-count")
    public ResponseEntity<?> getMyCrimeCount(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        long count = crimeReportRepository.countByReporter(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/crime-counts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUserCrimeCounts(@AuthenticationPrincipal User admin) {
        if (admin == null || !admin.isAdmin()) {
            return ResponseEntity.status(403).body("Forbidden: Admins only");
        }
        List<User> users = userRepository.findAll();
        Map<String, Long> counts = new HashMap<>();
        for (User u : users) {
            counts.put(u.getId(), crimeReportRepository.countByReporter(u.getId()));
        }
        return ResponseEntity.ok(counts);
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal User admin, @PathVariable String id) {
        if (admin == null || !admin.isAdmin()) {
            return ResponseEntity.status(403).body("Forbidden: Admins only");
        }
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.status(404).body("User not found");
    
        crimeReportRepository.deleteByReporter(user.getId());
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", true, "message", "User and their crimes deleted"));
    }
} 