package com.baezcostiganreed.mathtutorapp;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.ExtractedTextFormatter;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.ParagraphPdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import java.util.List;


/**
 * A component responsible for extracting text from PDF documents,
 * transforming the text by chinking it and creating vector embeddings,
 * and storing the vector embeddings in a database.
 */
@Component
public class DocsETL {
    @Autowired
    private final VectorStore vectorStore;

    @Value("classpath:/documents/Prealgebra2e-WEB_0qbw93r.pdf")
    private Resource prealgebraTextbook;


    private static final Logger logger = LoggerFactory.getLogger(DocsETL.class);
    private final JdbcClient jdbcClient;

    /**
     * Constructs a new instance of this ETL component.
     *
     * @param jdbcClient   the JDBC client used to query the database
     * @param vectorStore  the vector store where the vector embeddings will be stored
     */
    public DocsETL(JdbcClient jdbcClient, VectorStore vectorStore) {
        this.jdbcClient = jdbcClient;
        this.vectorStore = vectorStore;
    }

    /**
     * Checks whether the vector store is empty.
     *
     * @return true if the vector store is empty, false otherwise
     */
    private boolean isVectorStoreEmpty() {
        Integer count = jdbcClient.sql("SELECT COUNT(*) FROM vector_store").query(Integer.class).single();
        return count == 0;
    }

    /**
     * Creates the configuration options for the PDF reader.
     *
     * @return the configuration object containing PDF reader parameters
     */
    private PdfDocumentReaderConfig createPdfDocumentReaderConfig() {
        return PdfDocumentReaderConfig.builder()
                .withPageExtractedTextFormatter(new ExtractedTextFormatter.Builder()
                        .withNumberOfBottomTextLinesToDelete(0)
                        .withNumberOfTopPagesToSkipBeforeDelete(0)
                        .build())
                .withPagesPerDocument(1)
                .build();
    }

    /**
     * Reads the PDF with pdfReader, chunks and creates vector embeddings with textSplitter, and stores the vector embeddings in the vector store database.
     */
    private void processPdfAndStoreVectors() {
        var config = createPdfDocumentReaderConfig();
        var pdfReader = new PagePdfDocumentReader(prealgebraTextbook, config);
        var textSplitter = new TokenTextSplitter();
        vectorStore.accept(textSplitter.apply(pdfReader.get()));
        logger.info("PDF processing and vector storage completed successfully.");
    }

    /**
     * Initializes the ETL process for the PDF document if the vector store is empty.
     */
    @PostConstruct
    public void init() {
        try {
            if (isVectorStoreEmpty()) {
                processPdfAndStoreVectors();
            } else {
                logger.info("Vector store is not empty. Skipping PDF processing and vector storage.");
            }
        } catch (Exception e) {
            logger.error("Error during PDF processing and vector storage: ", e);
        }
    }
}




