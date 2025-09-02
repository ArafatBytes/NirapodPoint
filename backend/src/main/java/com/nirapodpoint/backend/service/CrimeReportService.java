package com.nirapodpoint.backend.service;

import com.nirapodpoint.backend.model.CrimeReport;
import com.nirapodpoint.backend.repository.CrimeReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.geo.Box;
import org.springframework.data.geo.Point;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.Collections;

@Service
public class CrimeReportService {
    @Autowired
    private CrimeReportRepository crimeReportRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

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

    public List<CrimeReport> getCrimeReports(String type, int page, int size, 
            Double minLat, Double maxLat, Double minLng, Double maxLng) {
        Query query = new Query();
        
        if (type != null && !type.equals("all")) {
            query.addCriteria(
                Criteria.where("type").regex("^" + type + "$", "i")
            );
        }
        
        
        if (minLat != null && maxLat != null && minLng != null && maxLng != null) {
            Point bottomLeft = new Point(minLng, minLat);
            Point topRight = new Point(maxLng, maxLat);
            Box box = new Box(bottomLeft, topRight);
            
            query.addCriteria(
                Criteria.where("location")
                    .within(box)
            );
        }
        
        
        query.skip((long) page * size).limit(size);
        
        return mongoTemplate.find(query, CrimeReport.class);
    }
    
    public Map<String, Object> getCrimesInBounds(Double minLat, Double maxLat, 
            Double minLng, Double maxLng, String type) {
        Query query = new Query();
        
        
        if (type != null && !type.equals("all")) {
            query.addCriteria(
                Criteria.where("type").regex("^" + type + "$", "i")
            );
        }
        
        
        Point bottomLeft = new Point(minLng, minLat);
        Point topRight = new Point(maxLng, maxLat);
        Box box = new Box(bottomLeft, topRight);
        
        query.addCriteria(
            Criteria.where("location").within(box)
        );
        
        
        List<CrimeReport> crimes = mongoTemplate.find(query, CrimeReport.class);
        
        
        Map<String, Integer> typeCounts = new HashMap<>();
        for (CrimeReport crime : crimes) {
            typeCounts.merge(crime.getType().toLowerCase(), 1, Integer::sum);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("crimes", crimes);
        result.put("typeCounts", typeCounts);
        result.put("total", crimes.size());
        
        return result;
    }

    public Map<String, Object> getDistrictStatistics() {
        List<CrimeReport> allCrimes = crimeReportRepository.findAll();
        
        
        Map<String, DistrictStats> districtStatsMap = new HashMap<>();
        Map<Integer, Integer> hourlyStats = new HashMap<>();
        Map<Integer, Integer> dailyStats = new HashMap<>();
        Map<String, Integer> crimeTypeStats = new HashMap<>();
        
        for (CrimeReport crime : allCrimes) {
            String district = DistrictUtil.findDistrict(
                crime.getLocation().getY(),  
                crime.getLocation().getX()   
            );
            
            if (district == null) continue;
            
            
            districtStatsMap.computeIfAbsent(district, k -> new DistrictStats())
                           .addCrime(crime);
            
            
            if (crime.getTime() != null) {
                int hour = crime.getTime().getHour();
                int day = crime.getTime().getDayOfWeek().getValue() % 7; // 0-6, Sunday = 0
                hourlyStats.merge(hour, 1, Integer::sum);
                dailyStats.merge(day, 1, Integer::sum);
            }
            
            
            String crimeType = crime.getType().toLowerCase();
            crimeTypeStats.merge(crimeType, 1, Integer::sum);
        }
        
        
        List<Map.Entry<String, DistrictStats>> statsList = 
            new ArrayList<>(districtStatsMap.entrySet());
        statsList.sort((a, b) -> Double.compare(b.getValue().getSeverityScore(), 
                                               a.getValue().getSeverityScore()));
        
        
        List<Map<String, Object>> dangerousDistricts = new ArrayList<>();
        List<Map<String, Object>> safestDistricts = new ArrayList<>();
        
        
        for (int i = 0; i < Math.min(5, statsList.size()); i++) {
            Map.Entry<String, DistrictStats> entry = statsList.get(i);
            Map<String, Object> districtData = new HashMap<>();
            districtData.put("district", entry.getKey());
            districtData.put("crimeCount", entry.getValue().getTotalCrimes());
            districtData.put("severityScore", entry.getValue().getSeverityScore());
            districtData.put("mostCommonCrime", entry.getValue().getMostCommonCrimeType());
            dangerousDistricts.add(districtData);
        }
        
        
        for (int i = Math.max(0, statsList.size() - 5); i < statsList.size(); i++) {
            Map.Entry<String, DistrictStats> entry = statsList.get(i);
            Map<String, Object> districtData = new HashMap<>();
            districtData.put("district", entry.getKey());
            districtData.put("crimeCount", entry.getValue().getTotalCrimes());
            districtData.put("severityScore", entry.getValue().getSeverityScore());
            districtData.put("mostCommonCrime", entry.getValue().getMostCommonCrimeType());
            safestDistricts.add(districtData);
        }
        Collections.reverse(safestDistricts); 
        
        
        List<Map<String, Object>> hourlyData = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            Map<String, Object> hourData = new HashMap<>();
            hourData.put("hour", String.format("%d:00", i));
            hourData.put("count", hourlyStats.getOrDefault(i, 0));
            hourlyData.add(hourData);
        }
        
        
        String[] dayNames = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
        List<Map<String, Object>> dailyData = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("day", dayNames[i]);
            dayData.put("count", dailyStats.getOrDefault(i, 0));
            dailyData.add(dayData);
        }
    
        List<Map<String, Object>> typeData = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : crimeTypeStats.entrySet()) {
            Map<String, Object> typeInfo = new HashMap<>();
            typeInfo.put("type", entry.getKey());
            typeInfo.put("count", entry.getValue());
            typeData.add(typeInfo);
        }
        
    
        Map<String, Object> result = new HashMap<>();
        result.put("dangerousDistricts", dangerousDistricts);
        result.put("safestDistricts", safestDistricts);
        result.put("hourlyStats", hourlyData);
        result.put("dailyStats", dailyData);
        result.put("crimeTypeStats", typeData);
        
        return result;
    }
    
    private static class DistrictStats {
        private int totalCrimes = 0;
        private Map<String, Integer> crimeTypeCounts = new HashMap<>();
        private double severityScore = 0.0;
        
        public void addCrime(CrimeReport crime) {
            totalCrimes++;
            crimeTypeCounts.merge(crime.getType().toLowerCase(), 1, Integer::sum);
            severityScore += getSeverity(crime.getType());
        }
        
        public int getTotalCrimes() {
            return totalCrimes;
        }
        
        public double getSeverityScore() {
            return severityScore;
        }
        
        public String getMostCommonCrimeType() {
            return crimeTypeCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("unknown");
        }
        
        private double getSeverity(String type) {
            return switch (type.toLowerCase()) {
                case "murder" -> 10.0;
                case "rape" -> 9.0;
                case "kidnap" -> 8.0;
                case "assault" -> 7.0;
                case "robbery" -> 6.0;
                case "harassment" -> 5.0;
                case "theft" -> 3.0;
                default -> 1.0;
            };
        }
    }
} 