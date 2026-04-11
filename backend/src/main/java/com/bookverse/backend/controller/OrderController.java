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
        System.out.println("DEBUG: Incoming Order Request: " + order);
        if (order.getItems() != null) {
            System.out.println("DEBUG: Order items count: " + order.getItems().size());
        }
        try {
            return ResponseEntity.ok(orderService.placeOrder(order));
        } catch (Exception e) {
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
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
