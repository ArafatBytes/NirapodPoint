package com.nirapodpoint.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.GeospatialIndex;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.annotation.PostConstruct;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;

@Configuration
public class MongoConfig {
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @PostConstruct
    public void initIndexes() {
        
        mongoTemplate.indexOps("crime_reports")
            .ensureIndex(new GeospatialIndex("location")
                .typed(GeoSpatialIndexType.GEO_2DSPHERE));
    }
}