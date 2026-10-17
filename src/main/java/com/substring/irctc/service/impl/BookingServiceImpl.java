package com.substring.irctc.service.impl;

import com.substring.irctc.dto.*;
import com.substring.irctc.entity.*;
import com.substring.irctc.exceptions.ResourceNotFoundException;
import com.substring.irctc.repositories.*;
import com.substring.irctc.service.*;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
public class BookingServiceImpl implements BookingService {
    private final BookingRepository bookings;
    private final UserRepo users;
    private final TrainScheduleRepository schedules;
    private final TrainSeatRepository seats;
    private final ModelMapper mapper;
    public BookingServiceImpl(BookingRepository bookings, UserRepo users, TrainScheduleRepository schedules,
                              TrainSeatRepository seats, ModelMapper mapper) {
        this.bookings = bookings; this.users = users; this.schedules = schedules; this.seats = seats; this.mapper = mapper;
    }

    @Override @Transactional
    public BookingResponse createBooking(BookingRequest request, String email) {
        User user = users.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        // All bookings for a schedule serialize in the database, including across application instances.
        TrainSchedule schedule = schedules.findForBooking(request.getTrainScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Train schedule not found."));
        JourneyRules.validate(request.getSourceStationId(), request.getDestinationStationId(), schedule.getRunDate());
        if (request.getTrainId() != null && !request.getTrainId().equals(schedule.getTrain().getId()) ||
            request.getJourneyDate() != null && !request.getJourneyDate().equals(schedule.getRunDate()))
            throw new IllegalArgumentException("The selected train or journey date does not match the schedule.");
        TrainRoute source = JourneyRules.route(schedule.getTrain(), request.getSourceStationId());
        TrainRoute destination = JourneyRules.route(schedule.getTrain(), request.getDestinationStationId());
        if (source.getStationOrder() >= destination.getStationOrder())
            throw new IllegalArgumentException("Destination must come after the departure station.");
        if (JourneyRules.departed(schedule, source)) throw new IllegalArgumentException("This train has already departed.");
        if (request.getPassengers() == null || request.getPassengers().isEmpty() || request.getPassengers().size() > 6)
            throw new IllegalArgumentException("Add between 1 and 6 passengers.");
        List<TrainSeat> coaches = seats.lockBySchedule(schedule.getId()).stream()
                .filter(c -> c.getCoachType() == request.getCoachType() && c.getAvailableSeats() != null && c.getAvailableSeats() > 0)
                .toList();
        int available = coaches.stream().mapToInt(TrainSeat::getAvailableSeats).sum();
        if (available < request.getPassengers().size())
            throw new IllegalStateException("Not enough seats remain. Search again for current availability.");
        Booking booking = new Booking();
        booking.setUser(user); booking.setTrainSchedule(schedule);
        booking.setSourceStation(source.getStation()); booking.setDestinationStation(destination.getStation());
        booking.setJourneyDate(schedule.getRunDate()); booking.setCreatedAt(LocalDateTime.now(JourneyRules.ZONE));
        booking.setPnr(UUID.randomUUID().toString());
        // Existing demo policy: allocate seats immediately; payment remains explicitly NOT_PAID.
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        List<BookingPassenger> passengers = new ArrayList<>();
        BigDecimal fare = BigDecimal.ZERO;
        int coachIndex = 0;
        for (BookingPassengerDto input : request.getPassengers()) {
            while (coaches.get(coachIndex).getAvailableSeats() == 0) coachIndex++;
            TrainSeat coach = coaches.get(coachIndex);
            if (coach.getPrice() == null || !Double.isFinite(coach.getPrice()) || coach.getPrice() < 0 ||
                coach.getSeatNumberToAssign() == null || coach.getSeatNumberToAssign() < 1 ||
                coach.getTotalSeats() == null || coach.getSeatNumberToAssign() > coach.getTotalSeats())
                throw new IllegalStateException("Seat inventory is incomplete. Contact the administrator.");
            // Map only editable passenger fields; ignore client-supplied IDs and seat numbers.
            BookingPassenger passenger = new BookingPassenger();
            passenger.setName(input.getName().trim()); passenger.setAge(input.getAge()); passenger.setGender(input.getGender());
            passenger.setBooking(booking); passenger.setTrainSeat(coach);
            passenger.setSeatNumber(String.valueOf(coach.getSeatNumberToAssign()));
            coach.setSeatNumberToAssign(coach.getSeatNumberToAssign() + 1);
            coach.setAvailableSeats(coach.getAvailableSeats() - 1);
            fare = fare.add(BigDecimal.valueOf(coach.getPrice()));
            passengers.add(passenger);
        }
        booking.setPassengers(passengers); booking.setTotalFare(fare);
        Payment payment = new Payment(); payment.setBooking(booking); payment.setAmount(fare);
        payment.setCreatedAt(LocalDateTime.now(JourneyRules.ZONE)); payment.setPaymentStatus(PaymentStatus.NOT_PAID);
        booking.setPayment(payment);
        seats.saveAll(coaches);
        // Coach inventory is authoritative; keep the schedule summary in step with it.
        schedule.setAvailableSeats(seats.findByTrainScheduleId(schedule.getId()).stream()
                .mapToInt(c -> c.getAvailableSeats() == null ? 0 : c.getAvailableSeats()).sum());
        return response(bookings.save(booking));
    }

    @Override @Transactional(readOnly = true)
    public PagedResponse<BookingResponse> history(String email, String query, Pageable pageable) {
        return PagedResponse.fromPage(bookings.searchOwned(email, query, pageable).map(this::response));
    }
    @Override @Transactional(readOnly = true)
    public BookingResponse findByPnr(String pnr, String email) {
        return response(bookings.findByPnrAndUserEmail(pnr.trim(), email)
                .orElseThrow(() -> new ResourceNotFoundException("No booking found for this PNR in your account.")));
    }
    private BookingResponse response(Booking booking) {
        BookingResponse result = new BookingResponse();
        TrainSchedule schedule = booking.getTrainSchedule();
        result.setBookingId(booking.getId()); result.setTrainScheduleId(schedule.getId());
        result.setTrainName(schedule.getTrain().getName()); result.setTrainNumber(schedule.getTrain().getNumber());
        result.setCreatedAt(booking.getCreatedAt()); result.setJourneyDate(booking.getJourneyDate());
        result.setPnr(booking.getPnr()); result.setTotalFare(booking.getTotalFare()); result.setBookingStatus(booking.getBookingStatus());
        result.setPaymentStatus(booking.getPayment() == null ? PaymentStatus.NOT_PAID : booking.getPayment().getPaymentStatus());
        result.setSourceStation(mapper.map(booking.getSourceStation(), StationDto.class));
        result.setDestinationStation(mapper.map(booking.getDestinationStation(), StationDto.class));
        result.setDepartureTime(JourneyRules.route(schedule.getTrain(), booking.getSourceStation().getId()).getDepartureTime());
        result.setArrivalTime(JourneyRules.route(schedule.getTrain(), booking.getDestinationStation().getId()).getArrivalTime());
        TrainRoute source = JourneyRules.route(schedule.getTrain(), booking.getSourceStation().getId());
        TrainRoute destination = JourneyRules.route(schedule.getTrain(), booking.getDestinationStation().getId());
        if (source.getDistanceFromSource() != null && destination.getDistanceFromSource() != null) {
            int distance = destination.getDistanceFromSource() - source.getDistanceFromSource();
            if (distance >= 0) result.setDistanceKm(distance);
        }
        result.setTransactionId(booking.getPayment() == null ? null : booking.getPayment().getTansactionId());
        result.setPassengers(booking.getPassengers().stream().map(p -> {
            BookingPassengerDto dto = new BookingPassengerDto();
            dto.setId(p.getId()); dto.setName(p.getName()); dto.setAge(p.getAge()); dto.setGender(p.getGender());
            dto.setSeatNumber(p.getSeatNumber()); dto.setCoachId(String.valueOf(p.getTrainSeat().getId()));
            dto.setCoachType(p.getTrainSeat().getCoachType()); dto.setCoachOrder(p.getTrainSeat().getTrainSeatOrder());
            return dto;
        }).toList());
        return result;
    }
}
