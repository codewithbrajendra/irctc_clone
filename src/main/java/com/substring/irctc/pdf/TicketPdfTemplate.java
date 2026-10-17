package com.substring.irctc.pdf;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle;
import com.substring.irctc.dto.BookingResponse;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import java.io.*;
import java.nio.charset.StandardCharsets;

/** Renders the editable HTML/CSS resources; no ticket layout is drawn in Java. */
@Component
public class TicketPdfTemplate {
    private final TemplateEngine engine;
    public TicketPdfTemplate() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.XML); // Well-formed XHTML for the PDF renderer.
        resolver.setCharacterEncoding(StandardCharsets.UTF_8.name());
        resolver.setCacheable(false);
        engine = new TemplateEngine();
        engine.setTemplateResolver(resolver);
    }
    public byte[] render(BookingResponse booking) throws IOException {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfRendererBuilder renderer = new PdfRendererBuilder();
            renderer.useFastMode();
            renderer.withHtmlContent(renderHtml(booking), null);
            // All layout assets are bundled. Never fetch URLs or files referenced by booking data or CSS.
            renderer.useUriResolver((base, uri) -> null);
            renderer.useFont(() -> font("DejaVuSans.ttf"), "Ticket Sans", 400, FontStyle.NORMAL, true);
            renderer.useFont(() -> font("DejaVuSans-Bold.ttf"), "Ticket Sans", 700, FontStyle.NORMAL, true);
            renderer.toStream(output);
            renderer.run();
            return output.toByteArray();
        }
    }
    String renderHtml(BookingResponse booking) throws IOException {
        Context context = new Context(java.util.Locale.ENGLISH);
        context.setVariable("ticket", TicketView.from(booking));
        // This is trusted classpath CSS, not user-supplied markup.
        try (InputStream input = new ClassPathResource("templates/ticket/ticket.css").getInputStream()) {
            context.setVariable("ticketCss", new String(input.readAllBytes(), StandardCharsets.UTF_8));
        }
        return engine.process("ticket/ticket", context);
    }
    private InputStream font(String filename) {
        try { return new ClassPathResource("templates/ticket/fonts/" + filename).getInputStream(); }
        catch (IOException failure) { throw new UncheckedIOException("Cannot load bundled ticket font", failure); }
    }
}
