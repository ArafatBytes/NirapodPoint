package com.nirapodpoint.backend.controller;

import com.nirapodpoint.backend.model.CrimeReport;
import com.nirapodpoint.backend.service.CrimeReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

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

    @GetMapping
    public ResponseEntity<List<CrimeReport>> getAllCrimeReports() {
        return ResponseEntity.ok(crimeReportService.getAllCrimeReports());
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