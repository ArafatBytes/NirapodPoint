package com.nirapodpoint.backend.model;

import lombok.Data;

@Data
public class RouteRequest {
    private double startLat;
    private double startLng;
    private double endLat;
    private double endLng;
    private String networkType; 
} 