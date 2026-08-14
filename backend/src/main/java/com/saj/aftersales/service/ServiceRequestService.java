package com.saj.aftersales.service;

import com.saj.aftersales.auth.AuthenticatedUser;
import com.saj.aftersales.dto.CreateServiceRequestRequest;
import com.saj.aftersales.dto.RequestItemInput;
import com.saj.aftersales.dto.ServiceRequestDto;
import com.saj.aftersales.dto.ShippingAddressDto;
import com.saj.aftersales.dto.UpdateServiceRequestRequest;
import com.saj.aftersales.entity.CatalogItem;
import com.saj.aftersales.entity.RequestItem;
import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.RequestType;
import com.saj.aftersales.entity.RequestTypeCode;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.ShippingAddress;
import com.saj.aftersales.entity.UserEntity;
import com.saj.aftersales.entity.ZendeskTicket;
import com.saj.aftersales.exception.BadRequestException;
import com.saj.aftersales.exception.ConflictException;
import com.saj.aftersales.exception.NotFoundException;
import com.saj.aftersales.mapper.ServiceRequestMapper;
import com.saj.aftersales.repository.CatalogItemRepository;
import com.saj.aftersales.repository.RequestItemRepository;
import com.saj.aftersales.repository.RequestTypeRepository;
import com.saj.aftersales.repository.ServiceRequestRepository;
import com.saj.aftersales.repository.ShippingAddressRepository;
import com.saj.aftersales.repository.UserRepository;
import com.saj.aftersales.repository.ZendeskTicketRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ZendeskTicketRepository ticketRepository;
    private final RequestTypeRepository requestTypeRepository;
    private final CatalogItemRepository catalogItemRepository;
    private final UserRepository userRepository;
    private final RequestItemRepository requestItemRepository;
    private final ShippingAddressRepository shippingAddressRepository;
    private final RequestNumberGenerator requestNumberGenerator;
    private final ServiceRequestMapper serviceRequestMapper;

    public ServiceRequestService(ServiceRequestRepository serviceRequestRepository,
                                  ZendeskTicketRepository ticketRepository,
                                  RequestTypeRepository requestTypeRepository,
                                  CatalogItemRepository catalogItemRepository,
                                  UserRepository userRepository,
                                  RequestItemRepository requestItemRepository,
                                  ShippingAddressRepository shippingAddressRepository,
                                  RequestNumberGenerator requestNumberGenerator,
                                  ServiceRequestMapper serviceRequestMapper) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.ticketRepository = ticketRepository;
        this.requestTypeRepository = requestTypeRepository;
        this.catalogItemRepository = catalogItemRepository;
        this.userRepository = userRepository;
        this.requestItemRepository = requestItemRepository;
        this.shippingAddressRepository = shippingAddressRepository;
        this.requestNumberGenerator = requestNumberGenerator;
        this.serviceRequestMapper = serviceRequestMapper;
    }

    public List<ServiceRequestDto> listByTicket(String zendeskTicketId) {
        return serviceRequestRepository.findByZendeskTicket_ZendeskTicketIdOrderByCreatedAtDesc(zendeskTicketId)
                .stream().map(this::toDto).toList();
    }

    public List<ServiceRequestDto> listAll() {
        return serviceRequestRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    public ServiceRequestDto getById(Long id) {
        return toDto(findEntity(id));
    }

    private ServiceRequest findEntity(Long id) {
        return serviceRequestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No request with id " + id));
    }

    private ServiceRequestDto toDto(ServiceRequest sr) {
        List<RequestItem> items = requestItemRepository.findByServiceRequest_Id(sr.getId());
        ShippingAddress address = shippingAddressRepository.findByServiceRequest_Id(sr.getId()).orElse(null);
        return serviceRequestMapper.toDto(sr, items, address);
    }

    @Transactional
    public ServiceRequestDto create(CreateServiceRequestRequest request, AuthenticatedUser currentUser) {
        ZendeskTicket ticket = ticketRepository.findByZendeskTicketId(request.zendeskTicketId())
                .orElseThrow(() -> new NotFoundException("No ticket reference for " + request.zendeskTicketId()));
        RequestType requestType = requestTypeRepository.findByCode(request.requestType())
                .orElseThrow(() -> new IllegalStateException("Request type not configured: " + request.requestType()));
        UserEntity technician = userRepository.findById(Long.valueOf(currentUser.id()))
                .orElseThrow(() -> new NotFoundException("No user with id " + currentUser.id()));

        CatalogItem product = resolveProduct(request.requestType(), request.productId());

        ServiceRequest sr = new ServiceRequest();
        sr.setRequestNumber(requestNumberGenerator.next());
        sr.setZendeskTicket(ticket);
        sr.setRequestType(requestType);
        sr.setCustomer(ticket.getCustomer());
        sr.setTechnician(technician);
        sr.setProduct(product);
        sr.setSerialNumber(request.serialNumber());
        sr.setReason(request.reason());
        sr.setStatus(RequestStatus.DRAFT);
        sr = serviceRequestRepository.save(sr);

        saveItems(sr, request.items());
        saveShippingAddress(sr, request.shippingAddress());

        return toDto(sr);
    }

    @Transactional
    public ServiceRequestDto update(Long id, UpdateServiceRequestRequest request, AuthenticatedUser currentUser) {
        ServiceRequest sr = findEntity(id);

        if (sr.getStatus() != RequestStatus.DRAFT) {
            throw new ConflictException("Only DRAFT requests can be edited");
        }
        boolean isAdmin = currentUser.roles().contains("ADMIN");
        boolean isCreator = sr.getTechnician().getId().equals(Long.valueOf(currentUser.id()));
        if (!isAdmin && !isCreator) {
            throw new AccessDeniedException("Only the creating Technician or an Admin can edit this request");
        }

        if (request.productId() != null) {
            sr.setProduct(resolveProduct(sr.getRequestType().getCode(), request.productId()));
        }
        if (request.serialNumber() != null) {
            sr.setSerialNumber(request.serialNumber());
        }
        if (request.reason() != null) {
            sr.setReason(request.reason());
        }
        if (request.items() != null) {
            requestItemRepository.deleteByServiceRequest_Id(sr.getId());
            saveItems(sr, request.items());
        }
        if (request.shippingAddress() != null) {
            saveShippingAddress(sr, request.shippingAddress());
        }

        return toDto(sr);
    }

    private CatalogItem resolveProduct(RequestTypeCode type, Long productId) {
        if (type == RequestTypeCode.REPLACEMENT) {
            if (productId == null) {
                throw new BadRequestException("productId is required for a Replacement request");
            }
            return catalogItemRepository.findById(productId)
                    .orElseThrow(() -> new NotFoundException("No catalog item with id " + productId));
        }
        return null;
    }

    private void saveItems(ServiceRequest sr, List<RequestItemInput> items) {
        if (items == null) {
            return;
        }
        for (RequestItemInput input : items) {
            CatalogItem catalogItem = catalogItemRepository.findById(input.catalogItemId())
                    .orElseThrow(() -> new NotFoundException("No catalog item with id " + input.catalogItemId()));
            RequestItem item = new RequestItem();
            item.setServiceRequest(sr);
            item.setCatalogItem(catalogItem);
            item.setQuantity(input.quantity());
            item.setNotes(input.notes());
            requestItemRepository.save(item);
        }
    }

    private void saveShippingAddress(ServiceRequest sr, ShippingAddressDto dto) {
        if (dto == null) {
            return;
        }
        ShippingAddress address = shippingAddressRepository.findByServiceRequest_Id(sr.getId())
                .orElseGet(() -> {
                    ShippingAddress created = new ShippingAddress();
                    created.setServiceRequest(sr);
                    return created;
                });
        address.setLine1(dto.line1());
        address.setLine2(dto.line2());
        address.setCity(dto.city());
        address.setPostalCode(dto.postalCode());
        address.setCountry(dto.country());
        address.setContactName(dto.contactName());
        address.setContactPhone(dto.contactPhone());
        shippingAddressRepository.save(address);
    }
}
