package com.nirapodpoint.backend.service;

import com.nirapodpoint.backend.model.User;
import com.nirapodpoint.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;
import java.time.Instant;
import java.time.Duration;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final ConcurrentHashMap<String, OtpInfo> otpMap = new ConcurrentHashMap<>();
    private final Random random = new Random();
    private static final int OTP_EXPIRY_MINUTES = 5;

    public User registerUser(String name, String email, String phone, String password, MultipartFile nidFront, MultipartFile nidBack, String photo) throws IOException {
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
        user.setPhoto(photo);
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
    public String generateAndSendOtp(String email, MailService mailService) throws Exception {
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null) throw new IllegalArgumentException("No user found with this email");
        String otp = String.format("%06d", random.nextInt(1000000));
        otpMap.put(email, new OtpInfo(otp, Instant.now().plus(Duration.ofMinutes(OTP_EXPIRY_MINUTES))));
        mailService.sendPasswordResetOtpEmail(email, user.getName(), otp);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpInfo info = otpMap.get(email);
        if (info == null) return false;
        if (Instant.now().isAfter(info.expiry)) {
            otpMap.remove(email);
            return false;
        }
        boolean valid = info.otp.equals(otp);
        if (valid) otpMap.remove(email);
        return valid;
    }

    public void resetPasswordWithOtp(String email, String otp, String newPassword) {
        if (!verifyOtp(email, otp)) throw new IllegalArgumentException("Invalid or expired OTP");
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null) throw new IllegalArgumentException("No user found with this email");
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as the old password.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void changePassword(User user, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as the old password.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private static class OtpInfo {
        String otp;
        Instant expiry;
        OtpInfo(String otp, Instant expiry) { this.otp = otp; this.expiry = expiry; }
    }
} 