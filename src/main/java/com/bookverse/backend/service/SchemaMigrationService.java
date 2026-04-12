package com.bookverse.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SchemaMigrationService implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Checking database schema for missing columns...");
        try {
            // Check if estimated_delivery column exists in orders table
            List<String> columns = jdbcTemplate.queryForList(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'estimated_delivery' AND TABLE_SCHEMA = DATABASE()",
                String.class
            );

            if (columns.isEmpty()) {
                System.out.println("Adding missing column 'estimated_delivery' to 'orders' table...");
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN estimated_delivery DATE AFTER notes");
                System.out.println("Column 'estimated_delivery' added successfully.");
            } else {
                System.out.println("Column 'estimated_delivery' already exists.");
            }
        } catch (Exception e) {
            System.err.println("Error during schema migration: " + e.getMessage());
            // We don't want to crash the app if migration fails for some reason (e.g. table doesn't exist yet)
        }
    }
}
