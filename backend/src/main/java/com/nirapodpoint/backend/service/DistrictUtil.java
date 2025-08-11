package com.nirapodpoint.backend.service;

import java.util.*;

public class DistrictUtil {
    public static class District {
        public final String name;
        public final double minLat, minLng, maxLat, maxLng;
        public District(String name, double minLat, double minLng, double maxLat, double maxLng) {
            this.name = name;
            this.minLat = minLat;
            this.minLng = minLng;
            this.maxLat = maxLat;
            this.maxLng = maxLng;
        }
        public boolean contains(double lat, double lng) {
            return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
        }
    }
    public static final List<District> DISTRICTS = Arrays.asList(
        new District("Bagerhat", 21.80, 89.40, 22.90, 89.95),
        new District("Bandarban", 21.10, 92.15, 22.00, 92.70),
        new District("Barguna", 21.80, 89.90, 22.60, 90.30),
        new District("Barisal", 22.30, 90.10, 22.90, 90.50),
        new District("Bhola", 21.90, 90.50, 22.90, 91.10),
        new District("Bogra", 24.50, 88.90, 25.10, 89.60),
        new District("Brahmanbaria", 23.60, 90.80, 24.20, 91.30),
        new District("Chandpur", 23.00, 90.55, 23.60, 91.00),
        new District("Chapai Nawabganj", 24.40, 88.00, 24.90, 88.40),
        new District("Chattogram", 21.90, 91.60, 22.80, 92.20),
        new District("Chuadanga", 23.30, 88.70, 23.70, 89.10),
        new District("Cox's Bazar", 20.85, 91.80, 21.90, 92.30),
        new District("Cumilla", 23.20, 90.90, 24.00, 91.30),
        new District("Dhaka", 23.60, 90.20, 24.00, 90.60),
        new District("Dinajpur", 25.30, 88.40, 26.10, 89.00),
        new District("Faridpur", 23.10, 89.50, 23.80, 90.10),
        new District("Feni", 22.75, 91.30, 23.15, 91.55),
        new District("Gaibandha", 25.00, 89.30, 25.50, 89.70),
        new District("Gazipur", 23.90, 90.20, 24.30, 90.60),
        new District("Gopalganj", 22.90, 89.80, 23.40, 90.20),
        new District("Habiganj", 24.00, 91.10, 24.60, 91.50),
        new District("Jamalpur", 24.60, 89.70, 25.30, 90.30),
        new District("Jashore", 23.00, 88.80, 23.60, 89.40),
        new District("Jhalokati", 22.30, 90.00, 22.70, 90.30),
        new District("Jhenaidah", 23.10, 88.90, 23.70, 89.40),
        new District("Joypurhat", 24.80, 88.90, 25.20, 89.30),
        new District("Khagrachari", 22.90, 91.80, 23.50, 92.30),
        new District("Khulna", 22.60, 89.30, 23.10, 89.70),
        new District("Kishoreganj", 24.10, 90.70, 24.60, 91.20),
        new District("Kurigram", 25.60, 89.30, 26.20, 89.80),
        new District("Kushtia", 23.70, 88.90, 24.10, 89.30),
        new District("Lakshmipur", 22.60, 90.70, 23.10, 91.10),
        new District("Lalmonirhat", 25.80, 89.20, 26.30, 89.60),
        new District("Madaripur", 23.00, 89.90, 23.50, 90.30),
        new District("Magura", 23.20, 89.20, 23.60, 89.60),
        new District("Manikganj", 23.70, 89.90, 24.10, 90.20),
        new District("Meherpur", 23.60, 88.50, 23.90, 88.80),
        new District("Moulvibazar", 24.10, 91.40, 24.70, 92.00),
        new District("Munshiganj", 23.30, 90.30, 23.70, 90.70),
        new District("Mymensingh", 24.40, 90.10, 25.00, 90.60),
        new District("Naogaon", 24.60, 88.50, 25.10, 89.10),
        new District("Narail", 23.00, 89.30, 23.40, 89.70),
        new District("Narayanganj", 23.50, 90.40, 23.90, 90.70),
        new District("Narsingdi", 23.70, 90.60, 24.10, 91.00),
        new District("Natore", 24.20, 88.80, 24.80, 89.30),
        new District("Netrokona", 24.60, 90.80, 25.20, 91.20),
        new District("Nilphamari", 25.80, 88.80, 26.30, 89.30),
        new District("Noakhali", 22.60, 90.90, 23.20, 91.30),
        new District("Pabna", 23.70, 89.00, 24.30, 89.60),
        new District("Panchagarh", 26.20, 88.30, 26.60, 88.60),
        new District("Patuakhali", 21.80, 90.10, 22.60, 90.60),
        new District("Pirojpur", 22.30, 89.90, 22.80, 90.30),
        new District("Rajbari", 23.40, 89.40, 23.90, 89.80),
        new District("Rajshahi", 24.20, 88.40, 24.70, 88.80),
        new District("Rangamati", 22.40, 91.80, 23.30, 92.40),
        new District("Rangpur", 25.50, 88.90, 25.90, 89.40),
        new District("Satkhira", 21.80, 88.90, 22.70, 89.30),
        new District("Shariatpur", 23.00, 90.20, 23.50, 90.60),
        new District("Sherpur", 24.90, 89.90, 25.30, 90.30),
        new District("Sirajganj", 24.10, 89.30, 24.80, 89.90),
        new District("Sunamganj", 24.60, 90.90, 25.20, 91.50),
        new District("Sylhet", 24.50, 91.60, 25.10, 92.10),
        new District("Tangail", 24.00, 89.80, 24.70, 90.40),
        new District("Thakurgaon", 25.80, 88.20, 26.30, 88.60)
    );

    public static String findDistrict(double lat, double lng) {
        for (District d : DISTRICTS) {
            if (d.contains(lat, lng)) return d.name;
        }
        return null;
    }
} 