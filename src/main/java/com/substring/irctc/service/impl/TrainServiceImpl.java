package com.substring.irctc.service.impl;

import com.substring.irctc.dto.AvailableTrainResponse;
import com.substring.irctc.dto.TrainDTO;
import com.substring.irctc.dto.UserTrainSearchRequest;
import com.substring.irctc.entity.*;
import com.substring.irctc.exceptions.ResourceNotFoundException;
import com.substring.irctc.repositories.StationRepo;
import com.substring.irctc.repositories.TrainRepository;
import com.substring.irctc.repositories.TrainScheduleRepository;
import com.substring.irctc.service.TrainService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;


@Service

public class TrainServiceImpl implements TrainService {


    private StationRepo stationRepository;
    private ModelMapper modelMapper;
    private TrainRepository trainRepository;

    private TrainScheduleRepository trainScheduleRepository;

    public TrainServiceImpl(StationRepo stationRepository, ModelMapper modelMapper, TrainRepository trainRepository, TrainScheduleRepository trainScheduleRepository) {
        this.stationRepository = stationRepository;
        this.modelMapper = modelMapper;
        this.trainRepository = trainRepository;
        this.trainScheduleRepository = trainScheduleRepository;
    }

    @Override
    public TrainDTO createTrain(TrainDTO trainDTO) {
        Station sourceStation = stationRepository.findById(trainDTO.getSourceStation().getId()).orElseThrow(() -> new ResourceNotFoundException("Source station not found with id: " + trainDTO.getSourceStation().getId()));
        Station destinationStation = stationRepository.findById(trainDTO.getDestinationStation().getId()).orElseThrow(() -> new ResourceNotFoundException("Destination station not found with id: " + trainDTO.getDestinationStation().getId()));
        Train train = modelMapper.map(trainDTO, Train.class);
        train.setSourceStation(sourceStation);
        train.setDestinationStation(destinationStation);
        Train savedTrain = trainRepository.save(train);
        return modelMapper.map(savedTrain, TrainDTO.class);
    }

    @Override
    public List<TrainDTO> getAllTrains() {
        List<Train> all = trainRepository.findAll();
        return all.stream().map(train -> modelMapper.map(train, TrainDTO.class)).toList();
    }

    @Override
    public TrainDTO getTrainById(Long id) {
        Train train = trainRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Train not found with id: " + id));
        return modelMapper.map(train, TrainDTO.class);
    }

    @Override
    public TrainDTO updateTrain(Long id, TrainDTO trainDTO) {
        Train existingTrain = trainRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Train not found with id: " + id));
        existingTrain.setName(trainDTO.getName());
        existingTrain.setNumber(trainDTO.getNumber());
        existingTrain.setTotalDistance(trainDTO.getTotalDistance());
        //fetch source and destination stations
        Station sourceStation = stationRepository.findById(trainDTO.getSourceStation().getId()).orElseThrow(() -> new ResourceNotFoundException("Source station not found with id: " + trainDTO.getSourceStation().getId()));
        Station destinationStation = stationRepository.findById(trainDTO.getDestinationStation().getId()).orElseThrow(() -> new ResourceNotFoundException("Destination station not found with id: " + trainDTO.getDestinationStation().getId()));


        existingTrain.setSourceStation(sourceStation);
        existingTrain.setDestinationStation(destinationStation);
        Train updatedTrain = trainRepository.save(existingTrain);
        return modelMapper.map(updatedTrain, TrainDTO.class);
    }

    @Override
    public void deleteTrain(Long id) {
        Train existingTrain = trainRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Train not found with id: " + id));
        trainRepository.delete(existingTrain);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AvailableTrainResponse> userTrainSearch(UserTrainSearchRequest request) {
        com.substring.irctc.service.JourneyRules.validate(request.getSourceStationId(), request.getDestinationStationId(), request.getJourneyDate());
        List<AvailableTrainResponse> results = new ArrayList<>();
        for (TrainSchedule schedule : trainScheduleRepository.search(request.getSourceStationId(), request.getDestinationStationId(), request.getJourneyDate())) {
            Train train = schedule.getTrain();
            TrainRoute source = com.substring.irctc.service.JourneyRules.route(train, request.getSourceStationId());
            TrainRoute destination = com.substring.irctc.service.JourneyRules.route(train, request.getDestinationStationId());
            if (com.substring.irctc.service.JourneyRules.departed(schedule, source)) continue;
            Map<CoachType, Integer> seats = new EnumMap<>(CoachType.class);
            Map<CoachType, Double> prices = new EnumMap<>(CoachType.class);
            for (TrainSeat coach : schedule.getTrainSeats()) {
                if (request.getCoachType() != null && coach.getCoachType() != request.getCoachType()) continue;
                if (coach.getAvailableSeats() == null || coach.getAvailableSeats() <= 0 || coach.getPrice() == null || !Double.isFinite(coach.getPrice()) || coach.getPrice() < 0) continue;
                seats.merge(coach.getCoachType(), coach.getAvailableSeats(), Integer::sum);
                prices.merge(coach.getCoachType(), coach.getPrice(), Math::min);
            }
            if (request.getCoachType() != null && seats.isEmpty()) continue;
            results.add(AvailableTrainResponse.builder().trainId(train.getId()).trainNumber(train.getNumber())
                    .trainName(train.getName()).trainScheduleId(schedule.getId()).scheduleDate(schedule.getRunDate())
                    .departureTime(source.getDepartureTime()).arrivalTime(destination.getArrivalTime())
                    .seatsAvailable(seats).priceByCoach(prices).build());
        }
        return results;
    }
}
