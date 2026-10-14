package com.bookverse.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("app", "BookVerse Backend");
        response.put("timestamp", Instant.now().toString());

        boolean dbOk = false;
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                dbOk = conn.isValid(2);
            } catch (Exception e) {
                dbOk = false;
                response.put("db_message", "Database connection pending or unavailable");
            }
        }
        response.put("database", dbOk ? "CONNECTED" : "DISCONNECTED");

        return ResponseEntity.ok(response);
    }
}
