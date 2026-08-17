package com.saj.aftersales.service;

import com.saj.aftersales.entity.RequestItem;
import com.saj.aftersales.entity.RequestTypeCode;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.ShippingAddress;
import com.saj.aftersales.exception.NotFoundException;
import com.saj.aftersales.repository.RequestItemRepository;
import com.saj.aftersales.repository.ServiceRequestRepository;
import com.saj.aftersales.repository.ShippingAddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Builds the CSV in the exact column order the warehouse's external spreadsheet expects:
 * {@code IVA,tkt,tech,Client name,Contact,Address,Number,Model code,Model name,Qty,faulty SN,Cause}.
 * A PARTS request with several line items exports one row per item; a REPLACEMENT request is
 * always a single unit, so it's one row with Qty hardcoded to 1.
 */
@Service
@Transactional(readOnly = true)
public class WarehouseExportService {

    private static final String HEADER = "IVA,tkt,tech,Client name,Contact,Address,Number,Model code,Model name,Qty,faulty SN,Cause";

    private final ServiceRequestRepository serviceRequestRepository;
    private final RequestItemRepository requestItemRepository;
    private final ShippingAddressRepository shippingAddressRepository;

    public WarehouseExportService(ServiceRequestRepository serviceRequestRepository,
                                   RequestItemRepository requestItemRepository,
                                   ShippingAddressRepository shippingAddressRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.requestItemRepository = requestItemRepository;
        this.shippingAddressRepository = shippingAddressRepository;
    }

    public String buildCsv(List<Long> ids) {
        StringBuilder csv = new StringBuilder(HEADER).append("\r\n");
        for (Long id : ids) {
            ServiceRequest sr = serviceRequestRepository.findById(id)
                    .orElseThrow(() -> new NotFoundException("No request with id " + id));
            ShippingAddress address = shippingAddressRepository.findByServiceRequest_Id(sr.getId()).orElse(null);
            for (String[] row : buildRows(sr, address)) {
                appendRow(csv, row);
            }
        }
        return csv.toString();
    }

    private List<String[]> buildRows(ServiceRequest sr, ShippingAddress address) {
        String iva = address != null ? address.getVatNumber() : null;
        String clientName = address != null ? address.getCompanyName() : null;
        String contact = address != null ? address.getContactName() : null;
        String fullAddress = formatAddress(address);
        String number = address != null ? address.getContactPhone() : null;
        String tkt = sr.getZendeskTicket().getZendeskTicketId();
        String tech = sr.getTechnician().getDisplayName();
        String cause = sr.getReason();

        if (sr.getRequestType().getCode() == RequestTypeCode.REPLACEMENT) {
            String modelCode = sr.getProduct() != null ? sr.getProduct().getSku() : null;
            String modelName = sr.getProduct() != null ? sr.getProduct().getName() : null;
            return List.<String[]>of(new String[]{iva, tkt, tech, clientName, contact, fullAddress, number,
                    modelCode, modelName, "1", sr.getSerialNumber(), cause});
        }

        List<RequestItem> items = requestItemRepository.findByServiceRequest_Id(sr.getId());
        return items.stream()
                .map(item -> new String[]{iva, tkt, tech, clientName, contact, fullAddress, number,
                        item.getCatalogItem().getSku(), item.getCatalogItem().getName(),
                        String.valueOf(item.getQuantity()), null, cause})
                .toList();
    }

    private String formatAddress(ShippingAddress address) {
        if (address == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder(address.getLine1());
        if (address.getLine2() != null && !address.getLine2().isBlank()) {
            sb.append(", ").append(address.getLine2());
        }
        sb.append(", ").append(address.getPostalCode()).append(" ").append(address.getCity())
                .append(", ").append(address.getCountry());
        return sb.toString();
    }

    private void appendRow(StringBuilder csv, String[] row) {
        for (int i = 0; i < row.length; i++) {
            if (i > 0) {
                csv.append(",");
            }
            csv.append(escape(row[i]));
        }
        csv.append("\r\n");
    }

    private String escape(String value) {
        String safe = value == null ? "" : value;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
