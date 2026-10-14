package com.bookverse.backend.service;

import com.bookverse.backend.entity.*;
import com.bookverse.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class WishlistService {
    @Autowired private WishlistRepository wishlistRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BookRepository bookRepository;

    public List<Wishlist> getByUserId(Integer userId) {
        return wishlistRepository.findByUserIdOrderByAddedAtDesc(userId);
    }

    public boolean isWishlisted(Integer userId, Integer bookId) {
        return wishlistRepository.existsByUserIdAndBookId(userId, bookId);
    }

    @Transactional
    public Wishlist addToWishlist(Integer userId, Integer bookId) {
        if (wishlistRepository.existsByUserIdAndBookId(userId, bookId)) {
            return wishlistRepository.findByUserIdAndBookId(userId, bookId).orElseThrow();
        }
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookRepository.findById(bookId).orElseThrow(() -> new RuntimeException("Book not found"));
        Wishlist w = new Wishlist();
        w.setUser(user);
        w.setBook(book);
        return wishlistRepository.save(w);
    }

    @Transactional
    public void removeFromWishlist(Integer userId, Integer bookId) {
        wishlistRepository.deleteByUserIdAndBookId(userId, bookId);
    }

    @Transactional
    public void toggleWishlist(Integer userId, Integer bookId) {
        if (wishlistRepository.existsByUserIdAndBookId(userId, bookId)) {
            wishlistRepository.deleteByUserIdAndBookId(userId, bookId);
        } else {
            addToWishlist(userId, bookId);
        }
    }
}
