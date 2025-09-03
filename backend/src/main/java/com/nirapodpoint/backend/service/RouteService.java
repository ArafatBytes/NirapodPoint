package com.nirapodpoint.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nirapodpoint.backend.model.RouteRequest;
import com.nirapodpoint.backend.model.RouteResponse;
import com.nirapodpoint.backend.model.CrimeReport;
import com.nirapodpoint.backend.repository.CrimeReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.cache.annotation.Cacheable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RouteService {
    @Autowired
    private CrimeReportRepository crimeReportRepository;
    
    @Autowired
    private MongoTemplate mongoTemplate;

    
    private final Map<String, Object[]> edgeWeightCache = new ConcurrentHashMap<>();
    private static final long CACHE_DURATION_MINUTES = 30;

    private static class Node {
        double lat, lng;
        List<Edge> edges = new ArrayList<>();
        long id;
    }
    private static class Edge {
        Node from, to;
        List<double[]> geometry; 
        double weight; 
        double length; 
    }
    
    private final Map<String, Map<Long, Node>> nodeCache = new ConcurrentHashMap<>();
    private final Map<String, List<Edge>> edgeCache = new ConcurrentHashMap<>();

    private static String getGraphKey(String district, String networkType) {
        return district.toLowerCase().replace(" ", "_") + "_" + networkType.toLowerCase();
    }

    private void loadGraphIfNeeded(String district, String networkType) throws Exception {
        String key = getGraphKey(district, networkType);
        if (nodeCache.containsKey(key) && edgeCache.containsKey(key)) return;
        String filename = "osm_graphs/" + key + ".json";
        ClassPathResource resource = new ClassPathResource(filename);
        try (InputStream is = resource.getInputStream()) {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(is);
            Map<Long, Node> nodes = new HashMap<>();
            for (JsonNode n : root.get("nodes")) {
                Node node = new Node();
                node.id = n.get("id").asLong();
                node.lat = n.get("lat").asDouble();
                node.lng = n.get("lng").asDouble();
                nodes.put(node.id, node);
            }
            List<Edge> edges = new ArrayList<>();
            for (JsonNode e : root.get("edges")) {
                long fromId = e.get("from").asLong();
                long toId = e.get("to").asLong();
                Node from = nodes.get(fromId);
                Node to = nodes.get(toId);
                if (from == null || to == null) continue;
                Edge edge = new Edge();
                edge.from = from;
                edge.to = to;
                edge.geometry = new ArrayList<>();
                for (JsonNode coord : e.get("geometry")) {
                    double lat = coord.get(0).asDouble();
                    double lng = coord.get(1).asDouble();
                    edge.geometry.add(new double[]{lat, lng});
                }
                from.edges.add(edge);
                edges.add(edge);
            }
            nodeCache.put(key, nodes);
            edgeCache.put(key, edges);
        }
    }

    private String getEdgeCacheKey(Edge edge, String district) {
        return district + "_" + edge.from.id + "_" + edge.to.id;
    }

    private double getEdgeWeight(Edge edge, String district, List<CrimeReport> nearbyCrimes) {
        String cacheKey = getEdgeCacheKey(edge, district);
        Object[] cached = edgeWeightCache.get(cacheKey);
        
        if (cached != null) {
            long timestamp = (long) cached[1];
            if (System.currentTimeMillis() - timestamp < TimeUnit.MINUTES.toMillis(CACHE_DURATION_MINUTES)) {
                return (double) cached[0];
            }
        }

        double weight = calculateEdgeWeight(edge, nearbyCrimes);
        edgeWeightCache.put(cacheKey, new Object[]{weight, System.currentTimeMillis()});
        return weight;
    }

    private double calculateEdgeWeight(Edge edge, List<CrimeReport> nearbyCrimes) {
        double totalScore = 0;
        for (CrimeReport crime : nearbyCrimes) {
            if (isCrimeNearEdge(crime, edge, 30)) {
                double severity = getSeverity(crime.getType());
                double recency = getRecency(crime.getTime(), LocalDateTime.now());
                totalScore += severity * recency;
            }
        }
        return totalScore;
    }

    public RouteResponse findSafestRoute(RouteRequest request) {
        
        String startDistrict = DistrictUtil.findDistrict(request.getStartLat(), request.getStartLng());
        String endDistrict = DistrictUtil.findDistrict(request.getEndLat(), request.getEndLng());
        
        if (startDistrict == null || endDistrict == null) 
            throw new RuntimeException("No district found for points");

        String networkType = request.getNetworkType();
        
        try {
            
            loadGraphIfNeeded(startDistrict, networkType);
            if (!startDistrict.equals(endDistrict)) {
                loadGraphIfNeeded(endDistrict, networkType);
            }

            
            String startKey = getGraphKey(startDistrict, networkType);
            Map<Long, Node> nodes = new HashMap<>(nodeCache.get(startKey));
            List<Edge> edges = new ArrayList<>(edgeCache.get(startKey));

            
            if (!startDistrict.equals(endDistrict)) {
                String endKey = getGraphKey(endDistrict, networkType);
                nodes.putAll(nodeCache.get(endKey));
                edges.addAll(edgeCache.get(endKey));
            }


            double minLat = Math.min(request.getStartLat(), request.getEndLat()) - 0.1;
            double maxLat = Math.max(request.getStartLat(), request.getEndLat()) + 0.1;
            double minLng = Math.min(request.getStartLng(), request.getEndLng()) - 0.1;
            double maxLng = Math.max(request.getStartLng(), request.getEndLng()) + 0.1;

            
            Query query = new Query(
                Criteria.where("location").within(
                    new org.springframework.data.geo.Box(
                        new org.springframework.data.geo.Point(minLng, minLat),
                        new org.springframework.data.geo.Point(maxLng, maxLat)
                    )
                )
            );
            List<CrimeReport> nearbyCrimes = mongoTemplate.find(query, CrimeReport.class);

            
            for (Edge edge : edges) {
                edge.weight = getEdgeWeight(edge, startDistrict, nearbyCrimes);
                if (edge.length == 0) {
                    edge.length = calculateEdgeLength(edge);
                }
            }

            
            Node start = findNearestNode(request.getStartLat(), request.getStartLng(), nodes.values());
            Node end = findNearestNode(request.getEndLat(), request.getEndLng(), nodes.values());
            
            if (start == null || end == null) 
                throw new RuntimeException("No nearby road found");

            
            List<Node> path = aStar(start, end);
            
            
            List<RouteResponse.Coordinate> route = path.stream()
                .map(n -> {
                    RouteResponse.Coordinate c = new RouteResponse.Coordinate();
                    c.setLat(n.lat);
                    c.setLng(n.lng);
                    return c;
                })
                .collect(Collectors.toList());

            RouteResponse response = new RouteResponse();
            response.setRoute(route);
            return response;

        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate route: " + e.getMessage(), e);
        }
    }

    private double getSeverity(String type) {
        switch (type.toLowerCase()) {
            case "murder": return 10;
            case "rape": return 9;
            case "kidnap": return 8;
            case "assault": return 7;
            case "robbery": return 6;
            case "harassment": return 5;
            case "theft": return 3;
            default: return 1;
        }
    }
    private double getRecency(LocalDateTime crimeTime, LocalDateTime queryTime) {
        long days = ChronoUnit.DAYS.between(crimeTime, queryTime);
        if (days < 1) return 10;
        if (days < 7) return 8;
        if (days < 21) return 6;
        if (days < 42) return 4;
        if (days < 56) return 2;
        return 1;
    }
    private boolean isCrimeNearEdge(CrimeReport crime, Edge edge, double bufferMeters) {
        double crimeLat = crime.getLocation().getY();
        double crimeLng = crime.getLocation().getX();
        List<double[]> geom = edge.geometry;
        double minDist = Double.MAX_VALUE;
        for (int i = 1; i < geom.size(); i++) {
            double[] p1 = geom.get(i-1);
            double[] p2 = geom.get(i);
            double dist = distancePointToSegment(crimeLat, crimeLng, p1[0], p1[1], p2[0], p2[1]);
            if (dist < minDist) minDist = dist;
        }
        return minDist <= bufferMeters;
    }

    
    private double distancePointToSegment(double lat, double lng, double lat1, double lng1, double lat2, double lng2) {
        
        double phi = Math.toRadians(lat);
        double lambda = Math.toRadians(lng);
        double phi1 = Math.toRadians(lat1);
        double lambda1 = Math.toRadians(lng1);
        double phi2 = Math.toRadians(lat2);
        double lambda2 = Math.toRadians(lng2);

        
        double R = 6371000; 
        double x = (lambda - lambda1) * Math.cos((phi1 + phi) / 2) * R;
        double y = (phi - phi1) * R;
        double x1 = 0;
        double y1 = 0;
        double x2 = (lambda2 - lambda1) * Math.cos((phi1 + phi2) / 2) * R;
        double y2 = (phi2 - phi1) * R;

     
        double dx = x2 - x1;
        double dy = y2 - y1;
        double segLen2 = dx * dx + dy * dy;
        double t = segLen2 == 0 ? 0 : ((x - x1) * dx + (y - y1) * dy) / segLen2;
        t = Math.max(0, Math.min(1, t));
        double projX = x1 + t * dx;
        double projY = y1 + t * dy;
        double dist = Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
        return dist;
    }

    private Node findNearestNode(double lat, double lng, Collection<Node> nodes) {
        Node nearest = null;
        double minDist = Double.MAX_VALUE;
        for (Node n : nodes) {
            double d = haversine(lat, lng, n.lat, n.lng);
            if (d < minDist) {
                minDist = d;
                nearest = n;
            }
        }
        return nearest;
    }

    
    private static final double ALPHA = 10000.0; 
    private static final double BETA = 0.00001; 

    private List<Node> aStar(Node start, Node end) {
        Map<Node, Double> gScore = new HashMap<>();
        Map<Node, Double> fScore = new HashMap<>(); 
        Map<Node, Node> cameFrom = new HashMap<>();
        PriorityQueue<Node> openSet = new PriorityQueue<>(Comparator.comparingDouble(fScore::get));
        Set<Node> closedSet = new HashSet<>();
        gScore.put(start, 0.0);
        fScore.put(start, heuristic(start, end));
        openSet.add(start);
        while (!openSet.isEmpty()) {
            Node current = openSet.poll();
            if (current == end) break;
            closedSet.add(current);
            for (Edge edge : current.edges) {
                Node neighbor = edge.to;
                if (closedSet.contains(neighbor)) continue;
                double edgeCrime = edge.weight;
                double edgeDist = edge.length > 0 ? edge.length : calculateEdgeLength(edge);
                double tentativeG = gScore.getOrDefault(current, Double.POSITIVE_INFINITY)
                        + (ALPHA * edgeCrime + BETA * edgeDist);
                if (tentativeG < gScore.getOrDefault(neighbor, Double.POSITIVE_INFINITY)) {
                    cameFrom.put(neighbor, current);
                    gScore.put(neighbor, tentativeG);
                    fScore.put(neighbor, tentativeG + heuristic(neighbor, end));
                    openSet.add(neighbor);
                }
            }
        }
        List<Node> path = new ArrayList<>();
        for (Node at = end; at != null; at = cameFrom.get(at)) {
            path.add(at);
        }
        Collections.reverse(path);
        return path;
    }

    
    private double heuristic(Node a, Node b) {
        return haversine(a.lat, a.lng, b.lat, b.lng);
    }

    
    private double calculateEdgeLength(Edge edge) {
        double length = 0;
        List<double[]> geom = edge.geometry;
        for (int i = 1; i < geom.size(); i++) {
            length += haversine(geom.get(i-1)[0], geom.get(i-1)[1], geom.get(i)[0], geom.get(i)[1]);
        }
        return length;
    }

    
    private double edgeLengthFromParsed(Edge edge) {
        try {
            java.lang.reflect.Field f = edge.getClass().getDeclaredField("length");
            f.setAccessible(true);
            Object val = f.get(edge);
            if (val instanceof Number) {
                return ((Number) val).doubleValue();
            }
        } catch (Exception ignored) {}
        return 0;
    }

    
    private final Map<Edge, Double> edgeLengthMap = new HashMap<>();

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000; 
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    
    public static class EdgeWeightInfo {
        public double fromLat, fromLng, toLat, toLng, weight;
    }
    public static class CrimeRouteDebugResult {
        public boolean result;
        public java.util.List<com.nirapodpoint.backend.model.RouteResponse.Coordinate> route;
        public java.util.List<EdgeWeightInfo> edgeWeights;
        public java.util.List<java.util.List<EdgeWeightInfo>> altPaths;
        public java.util.List<Double> altPathScores;
    }

    
    private void findAllPaths(Node start, Node end, java.util.List<Node> currentPath, java.util.List<java.util.List<Node>> allPaths, java.util.Set<Node> visited, int maxPaths) {
        if (allPaths.size() >= maxPaths) return;
        if (start == end) {
            allPaths.add(new java.util.ArrayList<>(currentPath));
            return;
        }
        visited.add(start);
        for (Edge edge : start.edges) {
            Node neighbor = edge.to;
            if (!visited.contains(neighbor)) {
                currentPath.add(neighbor);
                findAllPaths(neighbor, end, currentPath, allPaths, visited, maxPaths);
                currentPath.remove(currentPath.size() - 1);
            }
        }
        visited.remove(start);
    }

    public CrimeRouteDebugResult isCrimeOnRouteWithRoute(double crimeLat, double crimeLng, com.nirapodpoint.backend.model.RouteRequest request) {
        String district = DistrictUtil.findDistrict(request.getStartLat(), request.getStartLng());
        if (district == null) throw new RuntimeException("No district found for start point");
        String networkType = request.getNetworkType();
        try {
            loadGraphIfNeeded(district, networkType);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load OSM graph: " + e.getMessage(), e);
        }
        String key = getGraphKey(district, networkType);
        Map<Long, Node> nodes = nodeCache.get(key);
        List<Edge> edges = edgeCache.get(key);

        
        List<CrimeReport> crimes = crimeReportRepository.findAll();
        
        CrimeReport synthetic = new CrimeReport();
        synthetic.setType("debug");
        synthetic.setLocation(new org.springframework.data.mongodb.core.geo.GeoJsonPoint(crimeLng, crimeLat));
        synthetic.setTime(java.time.LocalDateTime.now());
        crimes.add(synthetic);

    
        Map<CrimeReport, Double> crimeScores = new HashMap<>();
        for (CrimeReport crime : crimes) {
            double severity = getSeverity(crime.getType());
            double recency = getRecency(crime.getTime(), java.time.LocalDateTime.now());
            crimeScores.put(crime, severity * recency);
        }
        for (Edge edge : edges) {
            double totalScore = 0;
            for (CrimeReport crime : crimes) {
                if (isCrimeNearEdge(crime, edge, 50)) {
                    totalScore += crimeScores.get(crime);
                }
            }
            edge.weight = totalScore;
            if (edgeLengthMap.containsKey(edge)) {
                edge.length = edgeLengthMap.get(edge);
            } else if (edgeLengthFromParsed(edge) > 0) {
                edge.length = edgeLengthFromParsed(edge);
            } else {
                edge.length = calculateEdgeLength(edge);
            }
        }

        
        Node start = findNearestNode(request.getStartLat(), request.getStartLng(), nodes.values());
        Node end = findNearestNode(request.getEndLat(), request.getEndLng(), nodes.values());
        if (start == null || end == null) throw new RuntimeException("No nearby road found");

        
        List<Node> path = aStar(start, end);

    
        java.util.List<com.nirapodpoint.backend.model.RouteResponse.Coordinate> polyline = new java.util.ArrayList<>();
        java.util.List<EdgeWeightInfo> edgeWeights = new java.util.ArrayList<>();
        java.util.List<Edge> aStarEdges = new java.util.ArrayList<>();
        for (int i = 0; i < path.size(); i++) {
            Node n = path.get(i);
            com.nirapodpoint.backend.model.RouteResponse.Coordinate c = new com.nirapodpoint.backend.model.RouteResponse.Coordinate();
            c.setLat(n.lat);
            c.setLng(n.lng);
            polyline.add(c);
            if (i > 0) {
                Node from = path.get(i-1);
                Node to = n;
                for (Edge edge : from.edges) {
                    if (edge.to == to) {
                        EdgeWeightInfo info = new EdgeWeightInfo();
                        info.fromLat = from.lat;
                        info.fromLng = from.lng;
                        info.toLat = to.lat;
                        info.toLng = to.lng;
                        info.weight = edge.weight;
                        edgeWeights.add(info);
                        aStarEdges.add(edge);
                        break;
                    }
                }
            }
        }

        
        java.util.List<java.util.List<EdgeWeightInfo>> altPaths = new java.util.ArrayList<>();
        java.util.List<Double> altPathScores = new java.util.ArrayList<>();
        int altCount = 0;
        for (int blockIdx = 0; blockIdx < aStarEdges.size() && altCount < 3; blockIdx++) {
            Edge blockedEdge = aStarEdges.get(blockIdx);
            
            blockedEdge.from.edges.remove(blockedEdge);
            List<Node> altPath = aStar(start, end);
            
            blockedEdge.from.edges.add(blockedEdge);
            
            if (altPath.size() > 1 && !altPath.equals(path)) {
                java.util.List<EdgeWeightInfo> altEdgeWeights = new java.util.ArrayList<>();
                double totalScore = 0.0;
                for (int i = 1; i < altPath.size(); i++) {
                    Node from = altPath.get(i-1);
                    Node to = altPath.get(i);
                    for (Edge edge : from.edges) {
                        if (edge.to == to) {
                            EdgeWeightInfo info = new EdgeWeightInfo();
                            info.fromLat = from.lat;
                            info.fromLng = from.lng;
                            info.toLat = to.lat;
                            info.toLng = to.lng;
                            info.weight = edge.weight;
                            altEdgeWeights.add(info);
                            totalScore += edge.weight;
                            break;
                        }
                    }
                }
            
                boolean isDuplicate = false;
                for (java.util.List<EdgeWeightInfo> existing : altPaths) {
                    if (existing.equals(altEdgeWeights)) { isDuplicate = true; break; }
                }
                if (!isDuplicate) {
                    altPaths.add(altEdgeWeights);
                    altPathScores.add(totalScore);
                    altCount++;
                }
            }
        }

        
        boolean found = false;
        for (int i = 1; i < path.size(); i++) {
            Node from = path.get(i-1);
            Node to = path.get(i);
            for (Edge edge : from.edges) {
                if (edge.to == to) {
                    if (isCrimeNearEdge(synthetic, edge, 50)) {
                        found = true;
                        break;
                    }
                }
            }
            if (found) break;
        }
        CrimeRouteDebugResult result = new CrimeRouteDebugResult();
        result.result = found;
        result.route = polyline;
        result.edgeWeights = edgeWeights;
        result.altPaths = altPaths;
        result.altPathScores = altPathScores;
        return result;
    }
} 