package com.substring.irctc.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingPassengerDto {

    private  Long id;
    @NotBlank @Size(max = 100)
    private String name;
    @NotNull @Min(1) @Max(120)
    private Integer age;
    @NotBlank @Pattern(regexp = "MALE|FEMALE|OTHER")
    private String gender;
    private String seatNumber;
    private String coachId;
    private com.substring.irctc.entity.CoachType coachType;
    private Integer coachOrder;
}
