package com.bookverse.backend.service;

import com.bookverse.backend.entity.Order;
import com.bookverse.backend.entity.OrderItem;
import com.bookverse.backend.entity.Book;
import com.bookverse.backend.entity.User;
import com.bookverse.backend.repository.OrderRepository;
import com.bookverse.backend.repository.BookRepository;
import com.bookverse.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Order placeOrder(Order order) {
        if (order.getUser() == null || order.getUser().getId() == null) {
            throw new RuntimeException("Invalid user information");
        }

        // 0. Fetch managed User entity
        User managedUser = userRepository.findById(order.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found: " + order.getUser().getId()));
        order.setUser(managedUser);

        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new RuntimeException("Order must have at least one item");
        }

        // Set estimated delivery (5 days out)
        order.setEstimatedDelivery(java.time.LocalDate.now().plusDays(5));

        // 1. Link items to order and update stock
        for (OrderItem item : order.getItems()) {
            item.setOrder(order);
            
            // 2. Reduce stock
            Book book = bookRepository.findById(item.getBook().getId())
                    .orElseThrow(() -> new RuntimeException("Book not found: " + item.getBook().getId()));
            
            if (book.getStock() < item.getQuantity()) {
                throw new RuntimeException("Insufficient stock for book: " + book.getTitle());
            }
            
            book.setStock(book.getStock() - item.getQuantity());
            bookRepository.save(book);
            
            // Link to managed book entity to ensure JPA consistency
            item.setBook(book);
        }

        return orderRepository.save(order);
    }

    public List<Order> getByUserId(Integer userId) { return orderRepository.findByUserIdOrderByCreatedAtDesc(userId); }

    public List<Order> getAllOrders() { return orderRepository.findAllByOrderByCreatedAtDesc(); }

    @Transactional
    public Order updateOrderStatus(Integer orderId, String status) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(Order.Status.valueOf(status.toLowerCase()));
        return orderRepository.save(order);
    }
}
