package com.bookverse.backend.controller;

import com.bookverse.backend.entity.Order;
import com.bookverse.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {
    @Autowired
    private OrderService orderService;

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody Order order) {
        try {
            Order savedOrder = orderService.placeOrder(order);
            return ResponseEntity.ok(savedOrder);
        } catch (RuntimeException e) {
            // Log the error for internal tracking
            System.err.println("Order creation failed: " + e.getMessage());
            
            java.util.Map<String, String> error = new java.util.HashMap<>();
            String userMessage = e.getMessage();
            
            // Mask internal SQL errors if they leak through
            if (userMessage.contains("SQL") || userMessage.contains("column") || userMessage.contains("field list")) {
                userMessage = "A database error occurred during checkout. Our team has been notified.";
            }
            
            error.put("error", userMessage);
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            System.err.println("Critical failure during order processing: " + e.getMessage());
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("error", "An unexpected error occurred. Please try again later.");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping("/{userId}")
    public List<Order> getByUserId(@PathVariable Integer userId) { return orderService.getByUserId(userId); }

    @GetMapping
    public List<Order> getAllOrders() { return orderService.getAllOrders(); }

    @PutMapping("/{id}/status")
    public Order updateStatus(@PathVariable Integer id, @RequestBody java.util.Map<String, String> payload) {
        return orderService.updateOrderStatus(id, payload.get("status"));
    }
}
