package com.nirapodpoint.backend.service;

import com.nirapodpoint.backend.model.User;
import com.nirapodpoint.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User registerUser(String name, String email, String phone, String password, MultipartFile nidFront, MultipartFile nidBack) throws IOException {
        String cleanEmail = email.trim().toLowerCase();
        String cleanPhone = phone.trim();
        if (userRepository.findByEmail(cleanEmail).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (userRepository.findByPhone(cleanPhone).isPresent()) {
            throw new IllegalArgumentException("Phone already registered");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(cleanEmail);
        user.setPhone(cleanPhone);
        user.setPassword(passwordEncoder.encode(password));
        user.setNidFront(Base64.getEncoder().encodeToString(nidFront.getBytes()));
        user.setNidBack(Base64.getEncoder().encodeToString(nidBack.getBytes()));
        user.setVerified(false);
        return userRepository.save(user);
    }

    public User authenticateUser(String emailOrPhone, String password) {
        String query = emailOrPhone.trim();
        User user;
        if (query.contains("@")) {
            user = userRepository.findByEmail(query.toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
        } else {
            user = userRepository.findByPhone(query)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        return user;
    }
} 