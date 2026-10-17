package com.substring.irctc.service;

import com.substring.irctc.dto.BookingResponse;
import com.substring.irctc.pdf.TicketPdfTemplate;
import org.springframework.stereotype.Service;
import java.io.IOException;

@Service
public class BookingPdfService {
    private final BookingService bookings;
    private final TicketPdfTemplate template;
    public BookingPdfService(BookingService bookings, TicketPdfTemplate template) {
        this.bookings = bookings;
        this.template = template;
    }
    public TicketFile download(String pnr, String email) throws IOException {
        // Resolve through the same owner-scoped lookup used by ticket history.
        BookingResponse booking = bookings.findByPnr(pnr, email);
        return new TicketFile("ticket-" + booking.getBookingId() + ".pdf", template.render(booking));
    }
    public record TicketFile(String filename, byte[] content) {}
}
