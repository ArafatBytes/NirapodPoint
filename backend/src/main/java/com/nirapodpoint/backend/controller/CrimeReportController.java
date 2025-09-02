package com.nirapodpoint.backend.controller;

import com.nirapodpoint.backend.model.CrimeReport;
import com.nirapodpoint.backend.service.CrimeReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crimes")
@CrossOrigin(origins = "*")
public class CrimeReportController {
    @Autowired
    private CrimeReportService crimeReportService;

    @PostMapping
    public ResponseEntity<CrimeReport> createCrimeReport(@RequestBody CrimeReport report, @AuthenticationPrincipal com.nirapodpoint.backend.model.User user) {
        report.setReporter(user.getId());
        return ResponseEntity.ok(crimeReportService.createCrimeReport(report));
    }

    @GetMapping("/district-stats")
    public ResponseEntity<?> getDistrictStats() {
        return ResponseEntity.ok(crimeReportService.getDistrictStatistics());
    }

    @GetMapping
    public ResponseEntity<List<CrimeReport>> getAllCrimeReports(
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "100") int size,
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLat,
            @RequestParam(required = false) Double minLng,
            @RequestParam(required = false) Double maxLng
    ) {
        return ResponseEntity.ok(crimeReportService.getCrimeReports(type, page, size, minLat, maxLat, minLng, maxLng));
    }

    @GetMapping("/bounds")
    public ResponseEntity<Map<String, Object>> getCrimesInBounds(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLng,
            @RequestParam Double maxLng,
            @RequestParam(required = false) String type
    ) {
        return ResponseEntity.ok(crimeReportService.getCrimesInBounds(minLat, maxLat, minLng, maxLng, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CrimeReport> getCrimeReportById(@PathVariable String id) {
        return crimeReportService.getCrimeReportById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CrimeReport> updateCrimeReport(@PathVariable String id, @RequestBody CrimeReport updatedReport) {
        return ResponseEntity.ok(crimeReportService.updateCrimeReport(id, updatedReport));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCrimeReport(@PathVariable String id) {
        crimeReportService.deleteCrimeReport(id);
        return ResponseEntity.noContent().build();
    }
}