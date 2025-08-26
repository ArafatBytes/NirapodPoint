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
     public static class DebugCrimeCheckRequest {
        private double crimeLat;
        private double crimeLng;
        private double startLat;
        private double startLng;
        private double endLat;
        private double endLng;
        private String networkType;
        public double getCrimeLat() { return crimeLat; }
        public void setCrimeLat(double crimeLat) { this.crimeLat = crimeLat; }
        public double getCrimeLng() { return crimeLng; }
        public void setCrimeLng(double crimeLng) { this.crimeLng = crimeLng; }
        public double getStartLat() { return startLat; }
        public void setStartLat(double startLat) { this.startLat = startLat; }
        public double getStartLng() { return startLng; }
        public void setStartLng(double startLng) { this.startLng = startLng; }
        public double getEndLat() { return endLat; }
        public void setEndLat(double endLat) { this.endLat = endLat; }
        public double getEndLng() { return endLng; }
        public void setEndLng(double endLng) { this.endLng = endLng; }
        public String getNetworkType() { return networkType; }
        public void setNetworkType(String networkType) { this.networkType = networkType; }
    }

    @PostMapping("/debug-crime-check")
    public ResponseEntity<?> debugCrimeCheck(@RequestBody DebugCrimeCheckRequest req) {
        RouteRequest routeReq = new RouteRequest();
        routeReq.setStartLat(req.getStartLat());
        routeReq.setStartLng(req.getStartLng());
        routeReq.setEndLat(req.getEndLat());
        routeReq.setEndLng(req.getEndLng());
        routeReq.setNetworkType(req.getNetworkType());
        RouteService.CrimeRouteDebugResult debugResult = routeService.isCrimeOnRouteWithRoute(req.getCrimeLat(), req.getCrimeLng(), routeReq);
        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("result", debugResult.result ? "yes" : "no");
        resp.put("route", debugResult.route);
        resp.put("edgeWeights", debugResult.edgeWeights);
        resp.put("altPaths", debugResult.altPaths);
        resp.put("altPathScores", debugResult.altPathScores);
        return ResponseEntity.ok(resp);
    }
} 