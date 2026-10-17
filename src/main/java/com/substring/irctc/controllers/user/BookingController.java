package com.substring.irctc.controllers.user;

import com.substring.irctc.dto.*;
import com.substring.irctc.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/user/bookings")
public class BookingController {
    private final BookingService bookings;
    public BookingController(BookingService bookings) { this.bookings = bookings; }
    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingRequest request, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookings.createBooking(request, principal.getName()));
    }
    @GetMapping
    public PagedResponse<BookingResponse> history(Principal principal,
            @RequestParam(defaultValue = "") String query, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (page < 0 || size < 1 || size > 100 || query.length() > 100)
            throw new IllegalArgumentException("Use a non-negative page, size 1 to 100 and search up to 100 characters.");
        return bookings.history(principal.getName(), query.trim(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id")));
    }
    @GetMapping("/pnr/{pnr}")
    public BookingResponse lookup(@PathVariable String pnr, Principal principal) {
        return bookings.findByPnr(pnr, principal.getName());
    }
}
