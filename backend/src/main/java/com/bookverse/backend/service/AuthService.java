package com.bookverse.backend.service;

import com.bookverse.backend.entity.User;
import com.bookverse.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @org.springframework.transaction.annotation.Transactional
    public User register(User user) {
        return userRepository.save(user);
    }

    public Optional<User> login(String email, String password) {
        return userRepository.findByEmailAndPasswordHash(email, password);
    }
}
