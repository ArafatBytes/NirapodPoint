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

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class RouteService {
    @Autowired
    private CrimeReportRepository crimeReportRepository;

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

    public RouteResponse findSafestRoute(RouteRequest request) {
        
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

        
        LocalDateTime queryTime = LocalDateTime.now(); 
        LocalDateTime fromTime = queryTime.minusHours(3);
        LocalDateTime toTime = queryTime.plusHours(3);
        List<CrimeReport> crimes = crimeReportRepository.findAll().stream()
                .filter(c -> c.getTime() != null &&
                        !c.getTime().isBefore(fromTime) &&
                        !c.getTime().isAfter(toTime))
                .collect(Collectors.toList());

        
        Map<CrimeReport, Double> crimeScores = new HashMap<>();
        for (CrimeReport crime : crimes) {
            double severity = getSeverity(crime.getType());
            double recency = getRecency(crime.getTime(), queryTime);
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
        List<RouteResponse.Coordinate> route = new ArrayList<>();
        for (Node n : path) {
            RouteResponse.Coordinate c = new RouteResponse.Coordinate();
            c.setLat(n.lat);
            c.setLng(n.lng);
            route.add(c);
        }
        RouteResponse response = new RouteResponse();
        response.setRoute(route);
        return response;
    }

    private double getSeverity(String type) {
        switch (type.toLowerCase()) {
            case "murder": return 10;
            case "robbery": return 7;
            case "harassment": return 6;
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
        
        double[] mid = edge.geometry.get(edge.geometry.size()/2);
        double dist = haversine(crime.getLocation().getY(), crime.getLocation().getX(), mid[0], mid[1]);
        return dist <= bufferMeters;
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

    
    private static final double ALPHA = 1.0; 
    private static final double BETA = 0.001; 

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
} 