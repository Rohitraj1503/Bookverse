# ==================================================
# Stage 1: Build Stage (Maven + Eclipse Temurin JDK 17)
# ==================================================
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy dependency definition first to leverage Docker layer caching
COPY pom.xml .

# Download dependencies offline for faster, reliable builds
RUN mvn dependency:go-offline -B

# Copy application source code
COPY src ./src

# Compile and package the Spring Boot executable JAR
RUN mvn clean package -DskipTests

# Dynamically locate and stage the produced JAR to a standard path
RUN cp target/*.jar /build/app.jar

# ==================================================
# Stage 2: Production Runtime Stage (Eclipse Temurin JRE 17)
# ==================================================
FROM eclipse-temurin:17-jre-jammy

# Add metadata labels
LABEL maintainer="BookVerse Team"
LABEL description="BookVerse Spring Boot Production Backend"

# Install curl for container healthcheck probes and clean package cache
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Create a dedicated non-root user and group for container security
RUN groupadd -r bookverse && useradd -r -g bookverse -d /app -s /sbin/nologin bookverse

WORKDIR /app

# Create uploads directory for book covers and ensure non-root ownership
RUN mkdir -p /app/uploads/covers && chown -R bookverse:bookverse /app

# Copy the generated executable JAR from builder stage with proper ownership
COPY --from=builder --chown=bookverse:bookverse /build/app.jar /app/app.jar

# Switch to unprivileged non-root user
USER bookverse

# Default environment configuration
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Expose backend port
EXPOSE 8080

# Configure Docker HEALTHCHECK against the backend health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=35s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/api/health || exit 1

# Execute Java with graceful signal propagation (JVM becomes PID 1)
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
