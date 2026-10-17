package com.substring.irctc.dto;

import com.substring.irctc.entity.CoachType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Builder @Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class BookingRequest {
    // Compatibility only. Ownership always comes from the authenticated principal.
    private Long userId;
    @NotNull @Positive private Long trainScheduleId;
    private Long trainId;
    @NotNull @Positive private Long sourceStationId;
    @NotNull @Positive private Long destinationStationId;
    private LocalDate journeyDate;
    @NotNull private CoachType coachType;
    @NotNull @Size(min = 1, max = 6) @Valid
    private List<@NotNull BookingPassengerDto> passengers;
}
