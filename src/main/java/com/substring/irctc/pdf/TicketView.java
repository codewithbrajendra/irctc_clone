package com.substring.irctc.pdf;

import com.substring.irctc.dto.*;
import com.substring.irctc.entity.*;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/** Formatting adapter. Field placement, labels, styles and repeating rows belong in ticket.html/CSS. */
public record TicketView(
        BookingResponse booking,
        String sourceStation, String destinationStation, String journeyDate,
        String departureTime, String arrivalTime, String classes, String distance,
        String bookedAt, String fare, String transactionId, boolean unpaid, boolean cancelled,
        List<Passenger> passengers) {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd-MMM-uuuu", Locale.ENGLISH);
    public static TicketView from(BookingResponse booking) {
        List<BookingPassengerDto> people = booking.getPassengers() == null ? List.of() : booking.getPassengers();
        List<Passenger> passengers = new ArrayList<>();
        for (int i = 0; i < people.size(); i++) {
            BookingPassengerDto p = people.get(i);
            passengers.add(new Passenger(i + 1, display(p.getName()), display(p.getAge()), display(p.getGender()),
                    display(booking.getBookingStatus()), display(p.getCoachOrder()), display(p.getCoachId()), display(p.getSeatNumber())));
        }
        return new TicketView(booking, station(booking.getSourceStation()), station(booking.getDestinationStation()),
                booking.getJourneyDate() == null ? "Not recorded" : DATE.format(booking.getJourneyDate()),
                booking.getDepartureTime() == null ? "Not recorded" : booking.getDepartureTime().format(DateTimeFormatter.ofPattern("HH:mm")),
                booking.getArrivalTime() == null ? "Not recorded" : booking.getArrivalTime().format(DateTimeFormatter.ofPattern("HH:mm")),
                display(people.stream().map(BookingPassengerDto::getCoachType).filter(Objects::nonNull).map(Enum::name).distinct().collect(Collectors.joining(", "))),
                booking.getDistanceKm() == null ? "Not recorded" : booking.getDistanceKm() + " KM",
                booking.getCreatedAt() == null ? "Not recorded" : booking.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-uuuu HH:mm", Locale.ENGLISH)),
                booking.getTotalFare() == null ? "Not recorded" : booking.getTotalFare().setScale(2, RoundingMode.HALF_UP).toPlainString(),
                display(booking.getTransactionId()), booking.getPaymentStatus() != PaymentStatus.PAID,
                booking.getBookingStatus() == BookingStatus.CANCELLED, List.copyOf(passengers));
    }
    private static String station(StationDto station) {
        return station == null ? "Not recorded" : display(station.getName()) + " (" + display(station.getCode()) + ")";
    }
    private static String display(Object value) {
        return value == null || value.toString().isBlank() ? "Not recorded" : value.toString();
    }
    public record Passenger(int number, String name, String age, String gender,
                            String status, String coachOrder, String coachId, String seatNumber) {}
}
