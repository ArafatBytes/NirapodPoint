package com.nirapodpoint.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String phone;
    private String password; 
    private String nidFront; 
    private String nidBack; 
    private boolean isVerified = false;
    private boolean isAdmin = false;
    private LocalDateTime createdAt = LocalDateTime.now();
} 