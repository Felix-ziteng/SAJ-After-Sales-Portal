package com.saj.aftersales.mapper;

import com.saj.aftersales.dto.CatalogItemDto;
import com.saj.aftersales.entity.CatalogItem;
import org.springframework.stereotype.Component;

@Component
public class CatalogItemMapper {

    public CatalogItemDto toDto(CatalogItem entity) {
        return new CatalogItemDto(entity.getId(), entity.getSku(), entity.getName(),
                entity.getCategory(), entity.isActive());
    }
}
