package com.baezcostiganreed.mathtutorapp;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.reader.ExtractedTextFormatter;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import java.util.List;


/**
 * A component responsible for extracting text from PDF documents,
 * transforming the text by chunking it and creating vector embeddings,
 * and storing the vector embeddings in a database.
 */
@Component
public class DocsETL {
    private final VectorStore vectorStore;

    @Value("classpath:/docs/pdf/*.pdf")
    private List<Resource> pdfResources;

    private static final Logger logger = LoggerFactory.getLogger(DocsETL.class);
    private final JdbcClient jdbcClient;

    /**
     * Constructs a new instance of this ETL component.
     *
     * @param jdbcClient  the JDBC client used to query the database
     * @param vectorStore the vector store where the vector embeddings will be stored
     */
    public DocsETL(JdbcClient jdbcClient, VectorStore vectorStore) {
        this.jdbcClient = jdbcClient;
        this.vectorStore = vectorStore;
    }

    /**
     * Checks whether the vector store is empty and whether the file_name already exists in metadata.
     *
     * @return false if the vector store is empty, true if it is not empty and the file_name already exists in metadata
     */
    private boolean isDocumentProcessed(String documentName) {
        String countQuery = "SELECT COUNT(*) FROM vector_store";
        Integer count = jdbcClient.sql(countQuery)
                .query(Integer.class)
                .single();
        if (count == 0) {
            return false;
        } else {
            String query = "SELECT COUNT(*) FROM vector_store WHERE metadata->>'file_name' = :documentName";
            Integer metadatacount = jdbcClient.sql(query)
                    .param("documentName", documentName)
                    .query(Integer.class)
                    .single();
            return metadatacount > 0;
        }
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
    private void processPDFAndStoreVectors(Resource pdfResource, TokenTextSplitter textSplitter, PdfDocumentReaderConfig config) {
        PagePdfDocumentReader pdfReader = new PagePdfDocumentReader(pdfResource, config);
        vectorStore.accept(textSplitter.apply(pdfReader.get()));
        logger.info("PDF processing and vector storage completed successfully: " + pdfResource.getFilename());
    }

    /**
     * Initializes the ETL process for the PDF document if the vector store is empty or the document's file name is not in the metadata.
     */
    @PostConstruct

    public void init() {
        PdfDocumentReaderConfig config = createPdfDocumentReaderConfig();
        new TokenTextSplitter();
        TokenTextSplitter textSplitter = TokenTextSplitter.builder()
//                .withChunkSize(1500)
                .build();
        for (Resource pdfResource : pdfResources) {
            if (!isDocumentProcessed(pdfResource.getFilename())) {

                try {
                    processPDFAndStoreVectors(pdfResource, textSplitter, config);
                } catch (Exception e) {
                    logger.error("Error during processing of document: " + pdfResource.getFilename(), e);
                }
            } else {
                logger.info("PDF document already processed: " + pdfResource.getFilename());
            }
        }

    }


}




