package com.substring.irctc.repositories;

import com.substring.irctc.entity.TrainSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;

public interface TrainSeatRepository extends JpaRepository<TrainSeat,Long>
{
    @Query("select s.trainSchedule.id from TrainSeat s where s.id = ?1")
    java.util.Optional<Long> scheduleIdForSeat(Long seatId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from TrainSeat s where s.trainSchedule.id = ?1 order by s.trainSeatOrder, s.id")
    List<TrainSeat> lockBySchedule(Long scheduleId);

    @Query("SELECT ts FROM TrainSeat ts WHERE ts.trainSchedule.id = ?1 order by ts.trainSeatOrder")
    List<TrainSeat> findByTrainScheduleId(Long trainScheduleId);
}
