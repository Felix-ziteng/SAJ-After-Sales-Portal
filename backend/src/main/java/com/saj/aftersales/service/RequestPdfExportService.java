package com.saj.aftersales.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.saj.aftersales.entity.CustomerConfirmation;
import com.saj.aftersales.entity.RequestItem;
import com.saj.aftersales.entity.RequestTypeCode;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.ShippingAddress;
import com.saj.aftersales.exception.NotFoundException;
import com.saj.aftersales.repository.CustomerConfirmationRepository;
import com.saj.aftersales.repository.RequestItemRepository;
import com.saj.aftersales.repository.ServiceRequestRepository;
import com.saj.aftersales.repository.ShippingAddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Builds the one-page confirmation summary PDF a Technician attaches to the Zendesk ticket —
 * everything already on the Request Detail page, distilled into something printable once the
 * customer has confirmed. No Zendesk API involved (Zendesk isn't integrated yet), purely a
 * downloadable artifact.
 */
@Service
@Transactional(readOnly = true)
public class RequestPdfExportService {

    private static final DateTimeFormatter TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm 'UTC'", Locale.ENGLISH).withZone(ZoneOffset.UTC);

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 18, Font.BOLD);
    private static final Font SUBTITLE_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(100, 100, 100));
    private static final Font SECTION_FONT = new Font(Font.HELVETICA, 12, Font.BOLD);
    private static final Font LABEL_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(120, 120, 120));
    private static final Font VALUE_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL);

    private final ServiceRequestRepository serviceRequestRepository;
    private final RequestItemRepository requestItemRepository;
    private final ShippingAddressRepository shippingAddressRepository;
    private final CustomerConfirmationRepository customerConfirmationRepository;

    public RequestPdfExportService(ServiceRequestRepository serviceRequestRepository,
                                    RequestItemRepository requestItemRepository,
                                    ShippingAddressRepository shippingAddressRepository,
                                    CustomerConfirmationRepository customerConfirmationRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.requestItemRepository = requestItemRepository;
        this.shippingAddressRepository = shippingAddressRepository;
        this.customerConfirmationRepository = customerConfirmationRepository;
    }

    public byte[] buildPdf(Long requestId) {
        ServiceRequest sr = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("No request with id " + requestId));
        ShippingAddress address = shippingAddressRepository.findByServiceRequest_Id(requestId).orElse(null);
        CustomerConfirmation confirmation = customerConfirmationRepository.findByServiceRequest_Id(requestId).orElse(null);

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("Service Request Confirmation", TITLE_FONT));
            Paragraph subtitle = new Paragraph(
                    sr.getRequestNumber() + "   -   Zendesk Ticket #" + sr.getZendeskTicket().getZendeskTicketId(),
                    SUBTITLE_FONT);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            document.add(sectionTitle("Request Details"));
            PdfPTable details = fieldTable();
            addField(details, "Request Type",
                    sr.getRequestType().getCode() == RequestTypeCode.REPLACEMENT ? "Whole Machine Replacement" : "Parts Shipment");
            addField(details, "Technician", sr.getTechnician().getDisplayName());
            addField(details, "Created", TIMESTAMP_FORMAT.format(sr.getCreatedAt()));
            document.add(details);

            if (sr.getRequestType().getCode() == RequestTypeCode.REPLACEMENT) {
                document.add(sectionTitle("Replacement"));
                PdfPTable replacement = fieldTable();
                addField(replacement, "Product",
                        sr.getModel() != null
                                ? (sr.getItemCode() != null ? sr.getItemCode() + " - " : "") + sr.getModel()
                                : "-");
                addField(replacement, "Serial Number", nullSafe(sr.getSerialNumber()));
                addField(replacement, "Fault / Reason", nullSafe(sr.getReason()));
                document.add(replacement);
            } else {
                document.add(sectionTitle("Parts"));
                document.add(itemsTable(requestItemRepository.findByServiceRequest_Id(requestId)));
                PdfPTable reasonTable = fieldTable();
                addField(reasonTable, "Reason", nullSafe(sr.getReason()));
                document.add(reasonTable);
            }

            document.add(sectionTitle("Shipping & Company Details"));
            document.add(shippingTable(address));

            document.add(sectionTitle("Customer Confirmation"));
            document.add(confirmationTable(confirmation));

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Could not generate PDF for request " + requestId, e);
        }
    }

    private Paragraph sectionTitle(String text) {
        Paragraph p = new Paragraph(text, SECTION_FONT);
        p.setSpacingBefore(14);
        p.setSpacingAfter(6);
        return p;
    }

    private PdfPTable fieldTable() {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        return table;
    }

    private void addField(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingBottom(6);
        Paragraph p = new Paragraph();
        p.add(new Phrase(label.toUpperCase(Locale.ENGLISH) + "\n", LABEL_FONT));
        p.add(new Phrase(value, VALUE_FONT));
        cell.addElement(p);
        table.addCell(cell);
    }

    private PdfPTable itemsTable(List<RequestItem> items) {
        PdfPTable table = new PdfPTable(new float[]{2, 4, 1, 3});
        table.setWidthPercentage(100);
        table.setSpacingAfter(6);
        for (String header : new String[]{"Item Code", "Name", "Qty", "Notes"}) {
            PdfPCell cell = new PdfPCell(new Phrase(header, LABEL_FONT));
            cell.setBorderWidthLeft(0);
            cell.setBorderWidthRight(0);
            cell.setBorderWidthTop(0);
            cell.setPaddingBottom(4);
            table.addCell(cell);
        }
        for (RequestItem item : items) {
            table.addCell(dataCell(nullSafe(item.getItemCode())));
            table.addCell(dataCell(item.getName()));
            table.addCell(dataCell(String.valueOf(item.getQuantity())));
            table.addCell(dataCell(nullSafe(item.getNotes())));
        }
        return table;
    }

    private PdfPCell dataCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, VALUE_FONT));
        cell.setBorderWidthLeft(0);
        cell.setBorderWidthRight(0);
        cell.setBorderWidthTop(0);
        cell.setBorderColorBottom(new Color(230, 230, 230));
        cell.setPadding(4);
        return cell;
    }

    private PdfPTable shippingTable(ShippingAddress address) {
        PdfPTable table = fieldTable();
        if (address == null) {
            addField(table, "Status", "Not yet provided by the customer");
            return table;
        }
        addField(table, "Company", nullSafe(address.getCompanyName()));
        addField(table, "VAT Number", nullSafe(address.getVatNumber()));
        String fullAddress = address.getLine1()
                + (address.getLine2() != null && !address.getLine2().isBlank() ? ", " + address.getLine2() : "")
                + "\n" + address.getPostalCode() + " " + address.getCity() + ", " + address.getCountry();
        addField(table, "Address", fullAddress);
        addField(table, "Contact", address.getContactName() + "  -  " + address.getContactPhone());
        return table;
    }

    private PdfPTable confirmationTable(CustomerConfirmation confirmation) {
        PdfPTable table = fieldTable();
        if (confirmation == null || confirmation.getSignatureName() == null) {
            addField(table, "Status", "Not yet confirmed by the customer");
            return table;
        }
        addField(table, "Signed By", confirmation.getSignatureName());
        Instant decidedAt = confirmation.getDecidedAt();
        addField(table, "Confirmed At", decidedAt != null ? TIMESTAMP_FORMAT.format(decidedAt) : "-");
        return table;
    }

    private String nullSafe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
