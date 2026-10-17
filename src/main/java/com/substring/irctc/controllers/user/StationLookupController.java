package com.substring.irctc.controllers.user;

import com.substring.irctc.dto.StationDto;
import com.substring.irctc.repositories.StationRepo;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/user/stations")
public class StationLookupController {
    private final StationRepo stations;
    private final ModelMapper mapper;
    public StationLookupController(StationRepo stations, ModelMapper mapper) {
        this.stations = stations; this.mapper = mapper;
    }
    @GetMapping
    public List<StationDto> lookup(@RequestParam(defaultValue = "") String query) {
        if (query.length() > 100) throw new IllegalArgumentException("Station search is too long.");
        return stations.search(query.trim(), PageRequest.of(0, 30)).stream()
                .map(s -> mapper.map(s, StationDto.class)).toList();
    }
}
