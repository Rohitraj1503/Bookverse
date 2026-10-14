package com.bookverse.backend.repository;

import com.bookverse.backend.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LanguageRepository extends JpaRepository<Language, Integer> {
    List<Language> findByIsActiveTrueOrderByNameAsc();
    Optional<Language> findByCode(String code);
    Optional<Language> findByNameIgnoreCase(String name);
}
