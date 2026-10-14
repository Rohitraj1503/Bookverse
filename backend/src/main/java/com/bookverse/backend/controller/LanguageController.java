package com.bookverse.backend.controller;

import com.bookverse.backend.entity.Language;
import com.bookverse.backend.repository.LanguageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/languages")
@CrossOrigin(origins = "*")
public class LanguageController {

    @Autowired
    private LanguageRepository languageRepository;

    @GetMapping
    public List<Language> getAllLanguages() {
        return languageRepository.findByIsActiveTrueOrderByNameAsc();
    }

    @PostMapping
    public Language createLanguage(@RequestBody Language language) {
        if (language.getCode() != null) {
            language.setCode(language.getCode().toLowerCase().trim());
        }
        return languageRepository.save(language);
    }
}
