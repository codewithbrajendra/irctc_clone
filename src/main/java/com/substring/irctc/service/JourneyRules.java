package com.substring.irctc.service;

import com.substring.irctc.entity.*;
import java.time.*;

public final class JourneyRules {
    private JourneyRules() {}
    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
    public static void validate(Long source, Long destination, LocalDate date) {
        if (source == null || destination == null || source.equals(destination))
            throw new IllegalArgumentException("Choose two different stations.");
        if (date == null || date.isBefore(LocalDate.now(ZONE)))
            throw new IllegalArgumentException("Choose today or a future journey date.");
    }
    public static TrainRoute route(Train train, Long stationId) {
        return train.getRoutes().stream().filter(r -> r.getStation().getId().equals(stationId))
                .findFirst().orElseThrow(() -> new IllegalArgumentException("The station is not on this train route."));
    }
    public static boolean departed(TrainSchedule schedule, TrainRoute source) {
        return source.getDepartureTime() != null &&
                LocalDateTime.of(schedule.getRunDate(), source.getDepartureTime()).isBefore(LocalDateTime.now(ZONE));
    }
}
