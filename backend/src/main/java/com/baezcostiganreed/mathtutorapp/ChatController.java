package com.baezcostiganreed.mathtutorapp;

import org.springframework.ai.document.Document;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.IntStream;


/**
 * ChatController handles chat requests and manages the interaction with the Ollama API.
 * It retrieves relevant documents from the vector store based on user input and filters the similarity search by metadata.
 * It maintains chat history and calls the Ollama Api.
 */
@RestController
public class ChatController {
    private static final int TOP_K = 3; // Number of top results to retrieve from the vector store
    private static final double SIMILARITY_THRESHOLD = .6; // Minimum similarity score for document retrieval
    private static final int MAX_HISTORY = 5; // Maximum number of user-assistant message pairs to retain in history

    private final OllamaApi ollamaApi = new OllamaApi("http://localhost:11434"); // Maximum number of user-assistant message pairs to retain in history
    private final PgVectorStore vectorStore; // Vector store for similarity search

    private static final Map<String, Deque<OllamaApi.Message>> sessionHistory = new ConcurrentHashMap<>(); /// Stores chat history for each session
    private final Map<String, List<Document>> vectorCache = new ConcurrentHashMap<>(); /// Caches vector search results

    @Value("classpath:/prompts/prompt_template.txt")
    private Resource systemTemplateResource; // Resource file containing the system prompt template

    private String systemPromptTemplate; // Loaded system prompt template as a string

    /**
     * Constructor for ChatController.
     *
     * @param vectorStore The PgVectorStore instance used for similarity search.
     */
    public ChatController(PgVectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    /**
     * Loads the system prompt template from the specified resource file.
     *
     * @throws IOException If an error occurs while reading the resource file.
     */
    @PostConstruct
    public void loadSystemPrompt() throws IOException {
        this.systemPromptTemplate = systemTemplateResource.getContentAsString(Charset.defaultCharset());
    }

    /**
     * Handles chat requests by retrieving relevant documents, maintaining chat history, and generating responses.
     *
     * @param topic       The topic of the chat (e.g., "linear equations").
     * @param usermessage The user's message or query.
     * @param sessionId   The session ID for maintaining chat history.
     * @return A Flux of ChatResponse objects containing the assistant's responses.
     */
    @GetMapping("/chat")
    public Flux<OllamaApi.ChatResponse> chat(
            @RequestParam(value = "topic", defaultValue = "") String topic,
            @RequestParam(value = "usermessage", defaultValue = " ") String usermessage,
            @RequestParam(value = "sessionId", defaultValue = "default") String sessionId
    ) {
        // Validate the topic parameter
        if (topic == null || topic.trim().isEmpty()) {
            return Flux.error(new IllegalArgumentException("Please select a topic"));
        }

        // Define metadata filter expressions for different topics
        String filterExpressionChapter = switch (topic) {
            case "linear equations" ->
                    "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 1249 && page_number <= 1357 || file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 28 && page_number <= 79";
            case "fractions" ->
                    "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 400 && page_number <= 645 || file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 12 && page_number <= 17";
            case "integers" ->
                    "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 15 && page_number <= 268 || file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 7 && page_number <= 9";
            case "real numbers" ->
                    "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 1131 && page_number <= 1144";
            case "signed numbers" ->
                    "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 1145 && page_number <= 1220";
            case "decimals" ->
                    "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 663 && page_number <= 828";
            case "percents" ->
                    "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 848 && page_number <= 920";
            case "polynomials" ->
                    "file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 177 && page_number <= 205";
            case "factoring" ->
                    "file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 212 && page_number <= 237";
            default -> "";
        };

        // Generate a cache key for the current topic and user message
        String cacheKey = String.join("::", topic.trim(), usermessage.trim()).toLowerCase();

        // Retrieve relevant documents from the vector store
        List<Document> chapterResults = vectorCache.computeIfAbsent(cacheKey, key ->
                vectorStore.similaritySearch(
                        SearchRequest.builder()
                                .query("Steps to find the solution. How to Solve. " + topic + " " + usermessage)
                                .topK(TOP_K)
                                .similarityThreshold(SIMILARITY_THRESHOLD)
                                .filterExpression(filterExpressionChapter)
                                .build()));

        // Format the retrieved documents into a string
        String chapterContent = chapterResults != null && !chapterResults.isEmpty()
                ? IntStream.range(0, chapterResults.size())
                .mapToObj(i -> "Document " + (i + 1) + ": " + chapterResults.get(i).getText())
                .collect(Collectors.joining("\n "))
                : "No documents provided\n";

        // Format the system prompt using the system prompt template and current topic
        String systemPrompt = String.format(systemPromptTemplate, topic, topic);

        Deque<OllamaApi.Message> history = sessionHistory.computeIfAbsent(sessionId, k -> new ArrayDeque<>());

        // Add the user message to the chat history
        history.add(OllamaApi.Message.builder(OllamaApi.Message.Role.USER).content(usermessage).build());

        // Ensure the history does not exceed the maximum allowed size
        while (history.size() > MAX_HISTORY * 2) {
            history.pollFirst();
        }

        // Prepare the list of messages for the API request
        List<OllamaApi.Message> messages = new ArrayList<>();
        messages.add(OllamaApi.Message.builder(OllamaApi.Message.Role.SYSTEM).content(systemPrompt).build());
        messages.add(OllamaApi.Message.builder(OllamaApi.Message.Role.TOOL).content(chapterContent).build());
        messages.addAll(history);

        // Build the chat request for the Ollama API
        OllamaApi.ChatRequest request = OllamaApi.ChatRequest.builder("phi4-mini")
                .stream(true)
                .messages(messages)
                .options(OllamaOptions.builder()
                        .numCtx(16000)
                        .temperature(.3)
                        .topP(.9)
                        .keepAlive("5")
                        .numPredict(250)
                        .build())

                .build();

        StringBuilder assistantMessageBuilder = new StringBuilder();

        // Send the chat request and add the assistant's response to the chat history
        return this.ollamaApi.streamingChat(request)
                .doOnNext(chatResponse -> {
                    assistantMessageBuilder.append(chatResponse.message().content());
                })
                .doOnComplete(() -> {
                    history.add(OllamaApi.Message.builder(OllamaApi.Message.Role.ASSISTANT)
                            .content(assistantMessageBuilder.toString())
                            .build());
                    while (history.size() > MAX_HISTORY * 2) {
                        history.pollFirst();
                    }
                });
    }


}


