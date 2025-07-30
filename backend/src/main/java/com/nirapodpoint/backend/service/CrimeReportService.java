package com.nirapodpoint.backend.service;

import com.nirapodpoint.backend.model.CrimeReport;
import com.nirapodpoint.backend.repository.CrimeReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CrimeReportService {
    @Autowired
    private CrimeReportRepository crimeReportRepository;

    public CrimeReport createCrimeReport(CrimeReport report) {
        return crimeReportRepository.save(report);
    }

    public List<CrimeReport> getAllCrimeReports() {
        return crimeReportRepository.findAll();
    }

    public Optional<CrimeReport> getCrimeReportById(String id) {
        return crimeReportRepository.findById(id);
    }

    public CrimeReport updateCrimeReport(String id, CrimeReport updatedReport) {
        updatedReport.setId(id);
        return crimeReportRepository.save(updatedReport);
    }

    public void deleteCrimeReport(String id) {
        crimeReportRepository.deleteById(id);
    }
} 