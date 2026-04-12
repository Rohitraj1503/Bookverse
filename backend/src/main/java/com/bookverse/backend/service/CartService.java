package com.bookverse.backend.service;

import com.bookverse.backend.entity.Cart;
import com.bookverse.backend.repository.CartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {
    @Autowired
    private CartRepository cartRepository;

    public List<Cart> getByUserId(Integer userId) { return cartRepository.findByUserId(userId); }

    public Cart addToCart(Cart cart) {
        Optional<Cart> existing = cartRepository.findByUserIdAndBookId(cart.getUser().getId(), cart.getBook().getId());
        if (existing.isPresent()) {
            Cart c = existing.get();
            c.setQuantity(c.getQuantity() + cart.getQuantity());
            return cartRepository.save(c);
        }
        return cartRepository.save(cart);
    }

    @Transactional
    public void clearCart(Integer userId) { cartRepository.deleteByUserId(userId); }
}
