package com.nirapodpoint.backend.controller;

import com.nirapodpoint.backend.model.User;
import com.nirapodpoint.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserRepository userRepository;

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
        user.setVerified(approve);
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateOwnInfo(@AuthenticationPrincipal User user,
                                           @RequestBody User update) {
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        if (update.getName() != null) user.setName(update.getName());
        if (update.getEmail() != null) user.setEmail(update.getEmail());
        if (update.getPhone() != null) user.setPhone(update.getPhone());
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }
} 