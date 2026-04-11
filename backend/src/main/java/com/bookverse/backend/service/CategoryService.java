package com.bookverse.backend.service;

import com.bookverse.backend.entity.Category;
import com.bookverse.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {
    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAll() { return categoryRepository.findAll(); }
}
