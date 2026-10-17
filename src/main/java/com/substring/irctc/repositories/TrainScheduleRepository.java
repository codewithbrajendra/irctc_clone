package com.substring.irctc.repositories;

import com.substring.irctc.entity.TrainSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TrainScheduleRepository extends JpaRepository<TrainSchedule,Long>
{


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from TrainSchedule s where s.id = :id")
    Optional<TrainSchedule> findForBooking(@Param("id") Long id);

    @Query("""
        select s from TrainSchedule s where s.runDate = :date and exists
        (select a.id from TrainRoute a, TrainRoute b where a.train = s.train and b.train = s.train
         and a.station.id = :source and b.station.id = :destination and a.stationOrder < b.stationOrder)
        order by s.train.number, s.id
        """)
    List<TrainSchedule> search(@Param("source") Long source, @Param("destination") Long destination,
                              @Param("date") LocalDate date);

    @Query("SELECT ts FROM TrainSchedule ts WHERE ts.train.id = ?1")
    List<TrainSchedule> findByTrainId(Long trainId);

    @Query("SELECT ts FROM TrainSchedule ts WHERE ts.train.id = ?1 AND ts.runDate = ?2")
    Optional<TrainSchedule> findByTrainIdAndRunDate(Long trainId, LocalDate runDate);
}
