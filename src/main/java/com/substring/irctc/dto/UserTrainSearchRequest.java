package com.substring.irctc.dto;

import com.substring.irctc.entity.CoachType;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class UserTrainSearchRequest {
    @NotNull @Positive private Long sourceStationId;
    @NotNull @Positive private Long destinationStationId;
    @NotNull private LocalDate journeyDate;
    private CoachType coachType;
}
