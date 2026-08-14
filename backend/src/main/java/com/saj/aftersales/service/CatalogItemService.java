package com.saj.aftersales.service;

import com.saj.aftersales.dto.CatalogItemDto;
import com.saj.aftersales.dto.CreateCatalogItemRequest;
import com.saj.aftersales.entity.CatalogItem;
import com.saj.aftersales.exception.ConflictException;
import com.saj.aftersales.mapper.CatalogItemMapper;
import com.saj.aftersales.repository.CatalogItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CatalogItemService {

    private final CatalogItemRepository catalogItemRepository;
    private final CatalogItemMapper catalogItemMapper;

    public CatalogItemService(CatalogItemRepository catalogItemRepository, CatalogItemMapper catalogItemMapper) {
        this.catalogItemRepository = catalogItemRepository;
        this.catalogItemMapper = catalogItemMapper;
    }

    public List<CatalogItemDto> listActive() {
        return catalogItemRepository.findByActiveTrue().stream().map(catalogItemMapper::toDto).toList();
    }

    @Transactional
    public CatalogItemDto create(CreateCatalogItemRequest request) {
        if (catalogItemRepository.existsBySkuIgnoreCase(request.sku())) {
            throw new ConflictException("A catalog item with SKU " + request.sku() + " already exists");
        }
        CatalogItem item = new CatalogItem();
        item.setSku(request.sku());
        item.setName(request.name());
        item.setCategory(request.category());
        return catalogItemMapper.toDto(catalogItemRepository.save(item));
    }
}
