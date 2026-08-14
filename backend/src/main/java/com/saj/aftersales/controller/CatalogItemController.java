package com.saj.aftersales.controller;

import com.saj.aftersales.dto.CatalogItemDto;
import com.saj.aftersales.dto.CreateCatalogItemRequest;
import com.saj.aftersales.service.CatalogItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalog-items")
public class CatalogItemController {

    private final CatalogItemService catalogItemService;

    public CatalogItemController(CatalogItemService catalogItemService) {
        this.catalogItemService = catalogItemService;
    }

    @GetMapping
    public List<CatalogItemDto> list() {
        return catalogItemService.listActive();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CatalogItemDto> create(@Valid @RequestBody CreateCatalogItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogItemService.create(request));
    }
}
