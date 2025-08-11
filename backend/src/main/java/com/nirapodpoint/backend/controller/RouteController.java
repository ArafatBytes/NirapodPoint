package com.nirapodpoint.backend.controller;

import com.nirapodpoint.backend.model.RouteRequest;
import com.nirapodpoint.backend.model.RouteResponse;
import com.nirapodpoint.backend.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RouteController {
    @Autowired
    private RouteService routeService;

    @PostMapping("/safest")
    public ResponseEntity<RouteResponse> getSafestRoute(@RequestBody RouteRequest request) {
        RouteResponse response = routeService.findSafestRoute(request);
        return ResponseEntity.ok(response);
    }
} 