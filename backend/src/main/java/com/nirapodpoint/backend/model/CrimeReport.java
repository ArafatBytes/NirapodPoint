package com.nirapodpoint.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Document(collection = "crime_reports")
@CompoundIndexes({
    @CompoundIndex(name = "location_type", def = "{'location': '2dsphere', 'type': 1}")
})
public class CrimeReport {
    @Id
    private String id;

    @Indexed
    private String type;
    private String description;

    @GeoSpatialIndexed(type = org.springframework.data.mongodb.core.index.GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location;

    @Indexed
    private LocalDateTime time;

    @Indexed
    private String reporter;
} 