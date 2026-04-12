package com.bookverse.backend.controller;

import com.bookverse.backend.dto.RegisterRequest;
import com.bookverse.backend.entity.User;
import com.bookverse.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        System.out.println("Received register request for: " + request.getEmail());
        User user = new User();
        user.setFullName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(request.getPassword());
        
        User savedUser = authService.register(user);
        System.out.println("Saved user: " + savedUser.getEmail() + " with ID: " + savedUser.getId());
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        Optional<User> user = authService.login(email, password);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
    }
}
