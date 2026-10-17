package com.substring.irctc;

import com.substring.irctc.dto.*;
import com.substring.irctc.entity.*;
import com.substring.irctc.pdf.TicketPdfTemplate;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class TicketPdfTemplateTest {
    private BookingResponse example() {
        BookingResponse t = new BookingResponse();
        t.setBookingId(12L); t.setPnr("173b1212-5678-4321-8123-456789abcdef");
        t.setTrainName("Bhopal Vrindavan Express"); t.setTrainNumber("20001");
        t.setJourneyDate(LocalDate.of(2026,10,20)); t.setDepartureTime(LocalTime.of(21,0)); t.setArrivalTime(LocalTime.of(7,0));
        t.setCreatedAt(LocalDateTime.of(2026,10,18,9,15));
        t.setSourceStation(new StationDto(1L,"BPL","Bhopal Junction","Bhopal","Madhya Pradesh"));
        t.setDestinationStation(new StationDto(5L,"VRVR","Vrindavan Road","Vrindavan","Uttar Pradesh"));
        t.setBookingStatus(BookingStatus.CONFIRMED); t.setPaymentStatus(PaymentStatus.NOT_PAID);
        t.setDistanceKm(580); t.setTotalFare(new BigDecimal("1600.00"));
        List<BookingPassengerDto> passengers = new ArrayList<>();
        for (int i=1;i<=2;i++) {
            BookingPassengerDto p = new BookingPassengerDto(); p.setName(i==1 ? "Brajendra Singh" : "Demo Passenger");
            p.setAge(30); p.setGender("MALE"); p.setCoachId("1001"); p.setCoachOrder(1); p.setCoachType(CoachType.AC); p.setSeatNumber(String.valueOf(i)); passengers.add(p);
        }
        t.setPassengers(passengers);
        return t;
    }
    @Test void generatesReadableReferenceStyleTicketFromRealFields() throws Exception {
        byte[] bytes = new TicketPdfTemplate().render(example());
        assertThat(new String(bytes,0,5,java.nio.charset.StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
        try (var document = Loader.loadPDF(bytes)) {
            assertThat(document.getNumberOfPages()).isEqualTo(1);
            String text = new PDFTextStripper().getText(document);
            assertThat(text).contains("Electronic Reservation Slip", "Bhopal Junction", "Vrindavan Road", "Brajendra Singh", "INR 1600.00", "NOT_PAID", "not an official IRCTC ticket", "Arrival time: 07:00");
            assertThat(text.replaceAll("\\s", "")).contains(example().getPnr());
            assertThat(text).doesNotContain("21-Oct-2026", "LOWER", "S4", "PAID IN FULL");
            for (var name : document.getPage(0).getResources().getFontNames())
                assertThat(document.getPage(0).getResources().getFont(name).isEmbedded()).isTrue();
        }
        // Reproducible fixture for visual QA; synthetic data only, ignored under target/.
        Files.createDirectories(Path.of("target/ticket-preview"));
        Files.write(Path.of("target/ticket-preview/reservation.pdf"), bytes);
    }
    @Test void bookingTextIsEscapedAndConditionalSectionsFollowSavedState() throws Exception {
        BookingResponse t = example();
        t.getPassengers().get(0).setName("<img src='https://invalid.example/evil'/> & Guest");
        t.setPaymentStatus(PaymentStatus.PAID);
        t.setBookingStatus(BookingStatus.CANCELLED);
        try (var doc = Loader.loadPDF(new TicketPdfTemplate().render(t))) {
            String text = new PDFTextStripper().getText(doc);
            assertThat(text).contains("<img", "& Guest", "This booking is cancelled.");
            assertThat(text.replaceAll("\\s", "")).contains("invalid.example/evil");
            assertThat(text).doesNotContain("This reservation is not marked as paid.");
        }
        t.setPassengers(List.of());
        try (var doc = Loader.loadPDF(new TicketPdfTemplate().render(t))) {
            assertThat(new PDFTextStripper().getText(doc)).contains("No passenger details recorded.");
        }
    }
    @Test void longNamesAndMultiplePassengersContinueWithoutDroppingData() throws Exception {
        BookingResponse t=example();
        t.setTrainName("A very long train service name ".repeat(4));
        t.setSourceStation(new StationDto(1L,"SOURCE","A long departure station name ".repeat(4),"City","State"));
        List<BookingPassengerDto> passengers=new ArrayList<>();
        for (int i=0;i<6;i++) {
            BookingPassengerDto p=new BookingPassengerDto(); p.setName("José Günther " + "Longsurname".repeat(7) + i);
            p.setAge(40); p.setGender("OTHER"); p.setCoachType(CoachType.SLEEPER); p.setCoachOrder(i+1);
            p.setCoachId(String.valueOf(100+i)); p.setSeatNumber("12"); passengers.add(p);
        }
        t.setPassengers(passengers);
        byte[] bytes=new TicketPdfTemplate().render(t);
        try(var doc=Loader.loadPDF(bytes)) {
            assertThat(doc.getNumberOfPages()).isGreaterThan(1);
            String text=new PDFTextStripper().getText(doc);
            for (var p:passengers) assertThat(text.replaceAll("\\s", "")).contains(p.getName().replaceAll("\\s", ""));
            assertThat(text).contains("Transaction ID: Not recorded", "Quota");
            PDFTextStripper continuation = new PDFTextStripper();
            continuation.setStartPage(2); continuation.setEndPage(2);
            assertThat(continuation.getText(doc)).contains("Booking status", "Current status");
        }
        Files.createDirectories(Path.of("target/ticket-preview"));
        Files.write(Path.of("target/ticket-preview/long-reservation.pdf"),bytes);
    }
}
