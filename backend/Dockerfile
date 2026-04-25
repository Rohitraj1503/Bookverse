# Stage 1: Build the application
FROM maven:3.8.5-openjdk-17-slim AS build
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the project (using Maven directly since mvnw is missing in the project root)
RUN mvn clean package -DskipTests

# Stage 2: Create a lightweight production image
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy the generated JAR file from the build stage
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Render assigns a port dynamically using the PORT environment variable
ENV PORT=8080
EXPOSE ${PORT}

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
