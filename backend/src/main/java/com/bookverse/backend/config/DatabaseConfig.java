package com.bookverse.backend.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Bean
    public DataSource dataSource() {
        String renderEnv = System.getenv("RENDER");
        String dbUrlEnv = System.getenv("SPRING_DATASOURCE_URL");

        if ("true".equalsIgnoreCase(renderEnv) && (dbUrlEnv == null || dbUrlEnv.isEmpty())) {
            System.out.println("[DatabaseConfig] Running on Render with no MySQL database configured. Falling back to in-memory H2 database.");
            return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:bookverse;DB_CLOSE_DELAY=-1;MODE=MySQL")
                .username("sa")
                .password("")
                .build();
        }

        // Default database configuration (MySQL)
        String url = (dbUrlEnv != null && !dbUrlEnv.isEmpty()) 
            ? dbUrlEnv 
            : "jdbc:mysql://localhost:3306/bookverse?useSSL=false&serverTimezone=UTC";
        
        String username = System.getenv("SPRING_DATASOURCE_USERNAME") != null 
            ? System.getenv("SPRING_DATASOURCE_USERNAME") 
            : "root";
            
        String password = System.getenv("SPRING_DATASOURCE_PASSWORD") != null 
            ? System.getenv("SPRING_DATASOURCE_PASSWORD") 
            : "Admin@1234";

        System.out.println("[DatabaseConfig] Connecting to database: " + url.split("\\?")[0]);
        return DataSourceBuilder.create()
            .driverClassName("com.mysql.cj.jdbc.Driver")
            .url(url)
            .username(username)
            .password(password)
            .build();
    }
}
