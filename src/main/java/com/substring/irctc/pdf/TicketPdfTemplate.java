package com.substring.irctc.pdf;

import com.substring.irctc.dto.*;
import com.substring.irctc.entity.BookingStatus;
import com.substring.irctc.entity.PaymentStatus;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import java.awt.Color;
import java.io.*;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/** Backend-owned, reservation-slip layout. Every displayed booking value comes from a saved DTO. */
@Component
public class TicketPdfTemplate {
    private static final Color BLUE = new Color(35, 104, 167);
    private static final Color LIGHT_BLUE = new Color(231, 241, 250);
    private static final Color GRAY = new Color(85, 94, 105);
    private static final float LEFT = 40;
    private static final float WIDTH = PDRectangle.A4.getWidth() - 80;
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd-MMM-uuuu", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    public byte[] render(BookingResponse ticket) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.getDocumentInformation().setTitle("Railway Connect reservation slip");
            document.getDocumentInformation().setAuthor("Railway Connect");
            PDFont regular = font(document, "DejaVuSans.ttf");
            PDFont bold = font(document, "DejaVuSans-Bold.ttf");
            try (Layout layout = new Layout(document, regular, bold, ticket.getPnr())) {
                layout.heading();
                layout.journey(ticket);
                layout.metadata(ticket);
                layout.passengers(ticket);
                layout.payment(ticket);
                layout.paragraph("This is a Railway Connect demonstration reservation slip, not an official IRCTC ticket.", bold, 9, GRAY);
                layout.paragraph("Boarding station is the booked source station. Quota, berth type and arrival date are not recorded in this version. Route times alone do not establish next-day arrival.", regular, 8.5f, GRAY);
            }
            int pages = document.getNumberOfPages();
            for (int i = 0; i < pages; i++) {
                try (PDPageContentStream footer = new PDPageContentStream(document, document.getPage(i), PDPageContentStream.AppendMode.APPEND, true)) {
                    footer.beginText(); footer.setFont(regular, 8); footer.setNonStrokingColor(GRAY);
                    footer.newLineAtOffset(LEFT, 42); footer.showText("Railway Connect  |  Reservation details"); footer.endText();
                    footer.beginText(); footer.setFont(regular, 8); footer.newLineAtOffset(450, 42);
                    footer.showText("Page " + (i + 1) + " of " + pages); footer.endText();
                }
            }
            document.save(output);
            return output.toByteArray();
        }
    }
    private PDFont font(PDDocument document, String filename) throws IOException {
        try (InputStream input = new ClassPathResource("templates/ticket/fonts/" + filename).getInputStream()) {
            return PDType0Font.load(document, input);
        }
    }
    private static String value(Object input) {
        return input == null || input.toString().isBlank() ? "Not recorded" : input.toString();
    }
    private static String station(StationDto station) {
        return station == null ? "Not recorded" : value(station.getName()) + " (" + value(station.getCode()) + ")";
    }

    private static final class Layout implements AutoCloseable {
        private final PDDocument document;
        private final PDFont regular;
        private final PDFont bold;
        private final String pnr;
        private PDPageContentStream stream;
        private float y;
        Layout(PDDocument document, PDFont regular, PDFont bold, String pnr) throws IOException {
            this.document = document; this.regular = regular; this.bold = bold; this.pnr = pnr;
            newPage(false);
        }
        private void newPage(boolean continued) throws IOException {
            if (stream != null) stream.close();
            PDPage page = new PDPage(PDRectangle.A4); document.addPage(page);
            stream = new PDPageContentStream(document, page);
            stream.setStrokingColor(Color.BLACK); stream.setLineWidth(1.2f);
            stream.addRect(28, 28, page.getMediaBox().getWidth() - 56, page.getMediaBox().getHeight() - 56); stream.stroke();
            y = page.getMediaBox().getHeight() - 55;
            if (continued) {
                paragraph("Electronic Reservation Slip - continued", bold, 13, Color.BLACK);
                paragraph("PNR: " + value(pnr), regular, 9, BLUE);
                rule();
            }
        }
        private void ensure(float height) throws IOException { if (y - height < 70) newPage(true); }
        void heading() throws IOException {
            centered("Electronic Reservation Slip (ERS)", LEFT, y, WIDTH, bold, 16, Color.BLACK);
            y -= 20;
            centered("Railway Connect - demonstration booking", LEFT, y, WIDTH, regular, 9, GRAY);
            y -= 35;
            text("RAILWAY", LEFT + 4, y, bold, 17, BLUE);
            text("CONNECT", LEFT + 4, y - 18, bold, 12, BLUE);
            right("YOUR JOURNEY DETAILS", LEFT + WIDTH, y - 3, bold, 10, BLUE);
            right("Generated from your saved booking", LEFT + WIDTH, y - 18, regular, 8, GRAY);
            y -= 50;
        }
        void journey(BookingResponse t) throws IOException {
            float col = WIDTH / 3;
            float top = y;
            centered("Booked from", LEFT, top, col, bold, 10, Color.BLACK);
            // The arrow follows the visual structure of the supplied reservation-slip reference.
            stream.setNonStrokingColor(BLUE);
            stream.moveTo(LEFT + col + 12, top + 11); stream.lineTo(LEFT + 2 * col - 22, top + 11);
            stream.lineTo(LEFT + 2 * col - 22, top + 17); stream.lineTo(LEFT + 2 * col - 5, top + 3);
            stream.lineTo(LEFT + 2 * col - 22, top - 11); stream.lineTo(LEFT + 2 * col - 22, top - 5);
            stream.lineTo(LEFT + col + 12, top - 5); stream.closePath(); stream.fill();
            centered("Boarding at", LEFT + col, top, col - 15, bold, 10, Color.WHITE);
            centered("To", LEFT + 2 * col, top, col, bold, 10, Color.BLACK);
            y -= 29;
            float lowest = y;
            lowest = Math.min(lowest, cell(station(t.getSourceStation()), LEFT, y, col, regular, 10, Color.BLACK));
            lowest = Math.min(lowest, cell(station(t.getSourceStation()), LEFT + col, y, col, bold, 10, Color.BLACK));
            lowest = Math.min(lowest, cell(station(t.getDestinationStation()), LEFT + 2 * col, y, col, regular, 10, Color.BLACK));
            y = lowest - 8;
            String date = t.getJourneyDate() == null ? "Not recorded" : DATE.format(t.getJourneyDate());
            float bottom = cell("Journey date: " + date, LEFT, y, col, regular, 9, Color.BLACK);
            bottom = Math.min(bottom, cell("Departure: " + (t.getDepartureTime() == null ? "Not recorded" : TIME.format(t.getDepartureTime())), LEFT + col, y, col, bold, 9, Color.BLACK));
            bottom = Math.min(bottom, cell("Arrival time: " + (t.getArrivalTime() == null ? "Not recorded" : TIME.format(t.getArrivalTime())), LEFT + 2 * col, y, col, regular, 9, Color.BLACK));
            y = bottom - 6; rule();
        }
        void metadata(BookingResponse t) throws IOException {
            String classes = t.getPassengers() == null ? "Not recorded" : t.getPassengers().stream()
                    .map(BookingPassengerDto::getCoachType).filter(Objects::nonNull).map(Enum::name).distinct().collect(Collectors.joining(", "));
            fields(new String[]{"PNR", "Train No. / Name", "Class"}, new String[]{value(t.getPnr()), value(t.getTrainNumber()) + " / " + value(t.getTrainName()), value(classes)}, true);
            fields(new String[]{"Quota", "Distance", "Booking date"}, new String[]{"Not recorded", t.getDistanceKm() == null ? "Not recorded" : t.getDistanceKm() + " KM", t.getCreatedAt() == null ? "Not recorded" : DateTimeFormatter.ofPattern("dd-MMM-uuuu HH:mm", Locale.ENGLISH).format(t.getCreatedAt())}, false);
            rule();
        }
        private void fields(String[] labels, String[] values, boolean blue) throws IOException {
            float col = WIDTH / 3;
            float size = blue ? 10 : 8.5f;
            int maxLines = 1;
            for (String input : values) maxLines = Math.max(maxLines, wrap(input, blue ? bold : regular, size, col - 14).size());
            ensure(17 + maxLines * (size + 4) + 13);
            for (int i = 0; i < 3; i++) centered(labels[i], LEFT + i * col, y, col, bold, 9, Color.BLACK);
            y -= 17;
            float bottom = y;
            for (int i = 0; i < 3; i++) bottom = Math.min(bottom, cell(values[i], LEFT + i * col, y, col, blue ? bold : regular, blue ? 10 : 8.5f, blue ? BLUE : Color.BLACK));
            y = bottom - 13;
        }
        void passengers(BookingResponse t) throws IOException {
            ensure(75); paragraph("Passenger Details", bold, 12, Color.BLACK);
            float[] widths = {22, 132, 30, 48, 141, WIDTH - 373};
            tableHeader(widths);
            List<BookingPassengerDto> passengers = t.getPassengers() == null ? List.of() : t.getPassengers();
            for (int i = 0; i < passengers.size(); i++) {
                BookingPassengerDto p = passengers.get(i);
                String status = value(t.getBookingStatus()) + " / Coach " + value(p.getCoachOrder()) + " (ID " + value(p.getCoachId()) + ") / Seat " + value(p.getSeatNumber());
                String[] values = {String.valueOf(i + 1), value(p.getName()), value(p.getAge()), value(p.getGender()), status, status};
                float height = 24;
                for (int c = 0; c < values.length; c++) height = Math.max(height, wrap(values[c], regular, 8.5f, widths[c] - 8).size() * 12 + 12);
                if (y - height < 70) { newPage(true); paragraph("Passenger Details - continued", bold, 12, Color.BLACK); tableHeader(widths); }
                float x = LEFT;
                for (int c = 0; c < values.length; c++) {
                    stream.setStrokingColor(new Color(190, 197, 204)); stream.setLineWidth(.4f);
                    stream.addRect(x, y - height, widths[c], height); stream.stroke();
                    float lineY = y - 15;
                    for (String line : wrap(values[c], regular, 8.5f, widths[c] - 8)) { text(line, x + 4, lineY, regular, 8.5f, Color.BLACK); lineY -= 12; }
                    x += widths[c];
                }
                y -= height;
            }
            if (passengers.isEmpty()) paragraph("No passenger details recorded.", regular, 9, GRAY);
            y -= 15;
        }
        private void tableHeader(float[] widths) throws IOException {
            stream.setNonStrokingColor(LIGHT_BLUE); stream.addRect(LEFT, y - 30, WIDTH, 30); stream.fill();
            String[] labels = {"#", "Name", "Age", "Gender", "Booking status", "Current status"};
            float x = LEFT;
            for (int i = 0; i < labels.length; i++) { text(labels[i], x + 4, y - 18, bold, 8, Color.BLACK); x += widths[i]; }
            y -= 30;
        }
        void payment(BookingResponse t) throws IOException {
            ensure(110); rule();
            paragraph("Total fare: INR " + (t.getTotalFare() == null ? "Not recorded" : t.getTotalFare().setScale(2, RoundingMode.HALF_UP)), bold, 11, BLUE);
            paragraph("Payment status: " + value(t.getPaymentStatus()), bold, 10, Color.BLACK);
            paragraph("Transaction ID: " + value(t.getTransactionId()), regular, 9, Color.BLACK);
            if (t.getPaymentStatus() != PaymentStatus.PAID) paragraph("This reservation is not marked as paid. Downloading this PDF does not confirm payment.", regular, 9, GRAY);
            if (t.getBookingStatus() == BookingStatus.CANCELLED) paragraph("This booking is cancelled.", bold, 10, Color.BLACK);
            rule();
        }
        void paragraph(String input, PDFont font, float size, Color color) throws IOException {
            List<String> lines = wrap(input, font, size, WIDTH);
            ensure(lines.size() * (size + 4) + 8);
            for (String line : lines) { text(line, LEFT, y, font, size, color); y -= size + 4; }
            y -= 6;
        }
        private float cell(String input, float x, float top, float width, PDFont font, float size, Color color) throws IOException {
            float lineY = top;
            for (String line : wrap(input, font, size, width - 14)) { centered(line, x + 7, lineY, width - 14, font, size, color); lineY -= size + 4; }
            return lineY;
        }
        private void rule() throws IOException {
            stream.setStrokingColor(Color.BLACK); stream.setLineWidth(1);
            stream.moveTo(LEFT, y); stream.lineTo(LEFT + WIDTH, y); stream.stroke(); y -= 18;
        }
        private List<String> wrap(String input, PDFont font, float size, float width) throws IOException {
            String clean = clean(input, font);
            List<String> lines = new ArrayList<>(); StringBuilder line = new StringBuilder();
            // Character-based fallback also wraps unbroken UUIDs and long passenger names.
            for (int cp : clean.codePoints().toArray()) {
                String part = new String(Character.toChars(cp));
                if (font.getStringWidth(line + part) * size / 1000 > width && !line.isEmpty()) {
                    int space = line.lastIndexOf(" ");
                    if (space > 0) {
                        lines.add(line.substring(0, space));
                        String rest = line.substring(space + 1); line.setLength(0); line.append(rest);
                    } else { lines.add(line.toString()); line.setLength(0); }
                }
                if (!line.isEmpty() || !part.isBlank()) line.append(part);
            }
            if (!line.isEmpty()) lines.add(line.toString());
            return lines.isEmpty() ? List.of("") : lines;
        }
        private String clean(String input, PDFont font) throws IOException {
            StringBuilder result = new StringBuilder();
            for (int cp : value(input).codePoints().toArray()) {
                if (Character.isISOControl(cp)) { result.append(' '); continue; }
                String s = new String(Character.toChars(cp));
                try { font.encode(s); result.append(s); } catch (IllegalArgumentException unsupported) { result.append('?'); }
            }
            return result.toString();
        }
        private void text(String s, float x, float baseline, PDFont font, float size, Color color) throws IOException {
            stream.beginText(); stream.setFont(font, size); stream.setNonStrokingColor(color);
            stream.newLineAtOffset(x, baseline); stream.showText(clean(s, font)); stream.endText();
        }
        private void centered(String s, float x, float baseline, float width, PDFont font, float size, Color color) throws IOException {
            String clean = clean(s, font); text(clean, x + (width - font.getStringWidth(clean) * size / 1000) / 2, baseline, font, size, color);
        }
        private void right(String s, float x, float baseline, PDFont font, float size, Color color) throws IOException {
            text(s, x - font.getStringWidth(s) * size / 1000, baseline, font, size, color);
        }
        @Override public void close() throws IOException { if (stream != null) stream.close(); }
    }
}
