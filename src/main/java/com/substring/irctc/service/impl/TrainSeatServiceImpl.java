package com.substring.irctc.service.impl;

import com.substring.irctc.dto.TrainSeatDto;
import com.substring.irctc.entity.*;
import com.substring.irctc.exceptions.ResourceNotFoundException;
import com.substring.irctc.repositories.*;
import com.substring.irctc.service.TrainSeatService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class TrainSeatServiceImpl implements TrainSeatService {
    private final TrainSeatRepository seats;
    private final TrainScheduleRepository schedules;
    private final ModelMapper mapper;
    public TrainSeatServiceImpl(TrainSeatRepository seats, TrainScheduleRepository schedules, ModelMapper mapper) {
        this.seats = seats; this.schedules = schedules; this.mapper = mapper;
    }
    @Override @Transactional
    public TrainSeatDto createSeatInfor(TrainSeatDto input) {
        validate(input);
        TrainSchedule schedule = schedules.findForBooking(input.getTrainScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Train schedule not found."));
        TrainSeat coach = new TrainSeat();
        coach.setTrainSchedule(schedule);
        configure(coach, input);
        seats.save(coach);
        updateSummary(schedule);
        return mapper.map(coach, TrainSeatDto.class);
    }
    @Override @Transactional(readOnly = true)
    public List<TrainSeatDto> getSeatInfoByTrainScheduleId(Long scheduleId) {
        return seats.findByTrainScheduleId(scheduleId).stream().map(s -> mapper.map(s, TrainSeatDto.class)).toList();
    }
    @Override @Transactional
    public void deleteSeatInfo(Long seatId) {
        TrainSeat coach = lockSeat(seatId);
        requireUnassigned(coach);
        TrainSchedule schedule = coach.getTrainSchedule();
        seats.delete(coach);
        updateSummary(schedule);
    }
    @Override @Transactional
    public TrainSeatDto updateSeatInfo(Long seatId, TrainSeatDto input) {
        validate(input);
        TrainSeat coach = lockSeat(seatId);
        requireUnassigned(coach);
        if (!coach.getTrainSchedule().getId().equals(input.getTrainScheduleId()))
            throw new IllegalArgumentException("A coach cannot be moved to another schedule.");
        configure(coach, input);
        updateSummary(coach.getTrainSchedule());
        return mapper.map(coach, TrainSeatDto.class);
    }
    @Override @Transactional
    public List<Integer> bookSeat(int count, Long seatId) {
        if (count < 1) throw new IllegalArgumentException("Seat count must be positive.");
        TrainSeat coach = lockSeat(seatId);
        if (coach.getAvailableSeats() == null || coach.getAvailableSeats() < count ||
            coach.getSeatNumberToAssign() == null || coach.getTotalSeats() == null ||
            coach.getSeatNumberToAssign() + count - 1 > coach.getTotalSeats())
            throw new IllegalStateException("Not enough seats available in this coach.");
        List<Integer> assigned = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            assigned.add(coach.getSeatNumberToAssign());
            coach.setSeatNumberToAssign(coach.getSeatNumberToAssign() + 1);
        }
        coach.setAvailableSeats(coach.getAvailableSeats() - count);
        updateSummary(coach.getTrainSchedule());
        return assigned;
    }
    private TrainSeat lockSeat(Long seatId) {
        Long scheduleId = seats.scheduleIdForSeat(seatId)
                .orElseThrow(() -> new ResourceNotFoundException("Coach not found."));
        // Take the same parent lock as booking before loading mutable inventory.
        schedules.findForBooking(scheduleId).orElseThrow(() -> new ResourceNotFoundException("Train schedule not found."));
        return seats.lockBySchedule(scheduleId).stream().filter(c -> c.getId().equals(seatId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Coach not found."));
    }
    private void requireUnassigned(TrainSeat coach) {
        if (coach.getSeatNumberToAssign() != null && coach.getSeatNumberToAssign() > 1)
            throw new IllegalStateException("Coach inventory with assigned seats cannot be reset or deleted.");
    }
    private void validate(TrainSeatDto input) {
        if (input.getTrainScheduleId() == null || input.getCoachType() == null || input.getTotalSeats() == null ||
            input.getTotalSeats() < 1 || input.getPrice() == null || !Double.isFinite(input.getPrice()) || input.getPrice() < 0 ||
            input.getTrainSeatOrder() == null || input.getTrainSeatOrder() < 1)
            throw new IllegalArgumentException("Provide schedule, coach type, positive seat count and order, and non-negative fare.");
    }
    private void configure(TrainSeat coach, TrainSeatDto input) {
        coach.setCoachType(input.getCoachType()); coach.setTotalSeats(input.getTotalSeats());
        coach.setAvailableSeats(input.getTotalSeats()); coach.setSeatNumberToAssign(1);
        coach.setPrice(input.getPrice()); coach.setTrainSeatOrder(input.getTrainSeatOrder());
    }
    private void updateSummary(TrainSchedule schedule) {
        schedule.setAvailableSeats(seats.findByTrainScheduleId(schedule.getId()).stream()
                .mapToInt(c -> c.getAvailableSeats() == null ? 0 : c.getAvailableSeats()).sum());
    }
}
