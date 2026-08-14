package com.saj.aftersales.repository;

import com.saj.aftersales.entity.CatalogItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogItemRepository extends JpaRepository<CatalogItem, Long> {

    List<CatalogItem> findByActiveTrue();

    boolean existsBySkuIgnoreCase(String sku);
}
