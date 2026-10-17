package com.substring.irctc.service;
import com.substring.irctc.dto.*;
import org.springframework.data.domain.Pageable;
public interface BookingService {
    BookingResponse createBooking(BookingRequest request, String email);
    PagedResponse<BookingResponse> history(String email, String query, Pageable pageable);
    BookingResponse findByPnr(String pnr, String email);
}
