package com.bookverse.backend.service;

import com.bookverse.backend.entity.User;
import com.bookverse.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired private UserRepository userRepository;

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public Optional<User> getById(Integer id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User updateProfile(Integer id, User updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (updates.getFullName() != null) user.setFullName(updates.getFullName());
        if (updates.getPhone() != null) user.setPhone(updates.getPhone());
        if (updates.getAddress() != null) user.setAddress(updates.getAddress());
        if (updates.getCity() != null) user.setCity(updates.getCity());
        if (updates.getState() != null) user.setState(updates.getState());
        if (updates.getZipCode() != null) user.setZipCode(updates.getZipCode());
        if (updates.getAvatarUrl() != null) user.setAvatarUrl(updates.getAvatarUrl());
        return userRepository.save(user);
    }
}
