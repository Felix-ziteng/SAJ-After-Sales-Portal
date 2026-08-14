package com.saj.aftersales.service;

import com.saj.aftersales.dto.CreateCustomerRequest;
import com.saj.aftersales.dto.CustomerDto;
import com.saj.aftersales.entity.Customer;
import com.saj.aftersales.mapper.CustomerMapper;
import com.saj.aftersales.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    public CustomerService(CustomerRepository customerRepository, CustomerMapper customerMapper) {
        this.customerRepository = customerRepository;
        this.customerMapper = customerMapper;
    }

    public List<CustomerDto> list() {
        return customerRepository.findAll().stream().map(customerMapper::toDto).toList();
    }

    @Transactional
    public CustomerDto create(CreateCustomerRequest request) {
        Customer customer = new Customer();
        customer.setName(request.name());
        customer.setVatNumber(request.vatNumber());
        customer.setCountry(request.country());
        customer.setZendeskOrgId(request.zendeskOrgId());
        return customerMapper.toDto(customerRepository.save(customer));
    }
}
