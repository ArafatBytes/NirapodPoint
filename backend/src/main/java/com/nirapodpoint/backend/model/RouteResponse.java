package com.nirapodpoint.backend.model;

import lombok.Data;
import java.util.List;

@Data
public class RouteResponse {
    private List<Coordinate> route;

    @Data
    public static class Coordinate {
        private double lat;
        private double lng;
    }
} 