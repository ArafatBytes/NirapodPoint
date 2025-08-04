package com.nirapodpoint.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class MailService {
    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendVerificationApprovedEmail(String to, String userName) throws MessagingException {
        String subject = "Your Nirapod Point Account is Verified!";
        String html = getApprovedHtmlTemplate(userName);
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setFrom("Nirapod Point <" + fromEmail + ">");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    private String getApprovedHtmlTemplate(String userName) {
        return """
        <div style='background:linear-gradient(135deg,#e0e7ff,#fff 60%,#bae6fd);padding:40px 0;'>
          <div style='max-width:480px;margin:0 auto;background:rgba(255,255,255,0.95);border-radius:18px;box-shadow:0 8px 32px 0 rgba(31,38,135,0.18);padding:32px 24px;font-family:sans-serif;'>
            <h2 style='color:#2563eb;font-size:2rem;margin-bottom:12px;text-align:center;'>Nirapod Point</h2>
            <p style='font-size:1.1rem;color:#222;margin-bottom:18px;'>
        """ +
        "Hello <b>" + userName + "</b>,<br><br>\n" +
        "Congratulations! Your Nirapod Point account has been <span style='color:#22c55e;font-weight:bold;'>verified</span> by our admin team.<br><br>\n" +
        "You can now <b>report crimes</b> and help make your community safer.\n" +
        "</p>\n" +
        "<div style='text-align:center;margin:24px 0;'>\n" +
        "  <a href='https://nirapodpoint.com' style='display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;border-radius:8px;font-weight:bold;text-decoration:none;box-shadow:0 2px 8px #2563eb22;'>Go to Nirapod Point</a>\n" +
        "</div>\n" +
        "<p style='font-size:0.95rem;color:#555;text-align:center;margin-top:24px;'>\n" +
        "  Thank you for joining us in building a safer Bangladesh.<br>\n" +
        "  <span style='color:#2563eb;font-weight:bold;'>Nirapod Point Team</span>\n" +
        "</p>\n" +
        "  </div>\n" +
        "</div>\n";
    }

    public void sendVerificationDisapprovedEmail(String to, String userName) throws MessagingException {
        String subject = "Your Nirapod Point Account Verification Status";
        String html = getDisapprovedHtmlTemplate(userName);
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setFrom("Nirapod Point <" + fromEmail + ">");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    private String getDisapprovedHtmlTemplate(String userName) {
        return """
        <div style='background:linear-gradient(135deg,#fee2e2,#fff 60%,#fca5a5);padding:40px 0;'>
          <div style='max-width:480px;margin:0 auto;background:rgba(255,255,255,0.95);border-radius:18px;box-shadow:0 8px 32px 0 rgba(239,68,68,0.18);padding:32px 24px;font-family:sans-serif;'>
            <h2 style='color:#dc2626;font-size:2rem;margin-bottom:12px;text-align:center;'>Nirapod Point</h2>
            <p style='font-size:1.1rem;color:#222;margin-bottom:18px;'>
        """ +
        "Hello <b>" + userName + "</b>,<br><br>\n" +
        "We regret to inform you that your Nirapod Point account <span style='color:#dc2626;font-weight:bold;'>verification has been disapproved</span> by our admin team.<br><br>\n" +
        "Please ensure your provided information and NID images are clear and valid. You may contact support for further assistance or try registering again.\n" +
        "</p>\n" +
        "<div style='text-align:center;margin:24px 0;'>\n" +
        "  <a href='https://nirapodpoint.com' style='display:inline-block;padding:12px 32px;background:#dc2626;color:#fff;border-radius:8px;font-weight:bold;text-decoration:none;box-shadow:0 2px 8px #dc262622;'>Go to Nirapod Point</a>\n" +
        "</div>\n" +
        "<p style='font-size:0.95rem;color:#555;text-align:center;margin-top:24px;'>\n" +
        "  Thank you for your interest in Nirapod Point.<br>\n" +
        "  <span style='color:#dc2626;font-weight:bold;'>Nirapod Point Team</span>\n" +
        "</p>\n" +
        "  </div>\n" +
        "</div>\n";
    }

    public void sendPasswordResetOtpEmail(String to, String userName, String otp) throws MessagingException {
        String subject = "Nirapod Point Password Reset OTP";
        String html = getPasswordResetOtpHtmlTemplate(userName, otp);
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setFrom("Nirapod Point <" + fromEmail + ">");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    private String getPasswordResetOtpHtmlTemplate(String userName, String otp) {
        return """
        <div style='background:linear-gradient(135deg,#e0e7ff,#fff 60%,#bae6fd);padding:40px 0;'>
          <div style='max-width:480px;margin:0 auto;background:rgba(255,255,255,0.95);border-radius:18px;box-shadow:0 8px 32px 0 rgba(31,38,135,0.18);padding:32px 24px;font-family:sans-serif;'>
            <h2 style='color:#2563eb;font-size:2rem;margin-bottom:12px;text-align:center;'>Nirapod Point</h2>
            <p style='font-size:1.1rem;color:#222;margin-bottom:18px;'>
        """ +
        "Hello <b>" + userName + "</b>,<br><br>\n" +
        "We received a request to reset your Nirapod Point account password.<br><br>\n" +
        "<b>Your OTP code is:</b><br>\n" +
        "<span style='font-size:2rem;color:#2563eb;font-weight:bold;letter-spacing:4px;'>" + otp + "</span><br><br>\n" +
        "This OTP is valid for <b>5 minutes</b>. If you did not request this, you can ignore this email.<br><br>\n" +
        "</p>\n" +
        "<p style='font-size:0.95rem;color:#555;text-align:center;margin-top:24px;'>\n" +
        "  Thank you for using Nirapod Point.<br>\n" +
        "  <span style='color:#2563eb;font-weight:bold;'>Nirapod Point Team</span>\n" +
        "</p>\n" +
        "  </div>\n" +
        "</div>\n";
    }
} 