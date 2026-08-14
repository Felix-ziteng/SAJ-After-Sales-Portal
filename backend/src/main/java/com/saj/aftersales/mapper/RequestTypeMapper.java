package com.saj.aftersales.mapper;

import com.saj.aftersales.dto.RequestTypeDto;
import com.saj.aftersales.entity.RequestType;
import org.springframework.stereotype.Component;

@Component
public class RequestTypeMapper {

    public RequestTypeDto toDto(RequestType entity) {
        return new RequestTypeDto(entity.getId(), entity.getCode(), entity.getName(),
                entity.isRequiresManagerApproval(), entity.isRequiresCustomerConfirmation());
    }
}
