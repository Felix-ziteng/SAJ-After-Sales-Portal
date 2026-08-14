package com.saj.aftersales.mapper;

import com.saj.aftersales.dto.CustomerDto;
import com.saj.aftersales.entity.Customer;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public CustomerDto toDto(Customer entity) {
        return new CustomerDto(entity.getId(), entity.getName(), entity.getVatNumber(),
                entity.getCountry(), entity.getZendeskOrgId());
    }
}
