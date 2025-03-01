package com.baezcostiganreed.mathtutorapp;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/**
 * Provides REST endpoints to interact with a chat client.
 */
@RestController
public class ChatController {

    private static final int TOP_K = 5;
    private static final double SIMILARITY_THRESHOLD = .7;
    @Value("classpath:/documents/prompts/prompt-template.txt")
    private Resource topic1PromptTemplate;
    private final ChatClient chatClient;
    @Autowired
    private final PgVectorStore vectorStore;

    /**
     * Constructs a new controller with a chat client and a vector store.kk
     *
     * @param chatClientBuilder  builds and configures the ChatClient
     * @param vectorStore        the vector store used for vector operations
     */
    public ChatController(ChatClient.Builder chatClientBuilder, PgVectorStore vectorStore) {
        this.chatClient = chatClientBuilder.build();
        this.vectorStore = vectorStore;
    }

    /**
     * Handles GET requests with an optional user message.
     * Sends the user message to the chat client and returns the chat response.
     *
     * @param usermessage  the text provided by the user
     * @return the chat client's response or an error message
     */
    @GetMapping("/chat")
    public String chat(@RequestParam(value = "topic", defaultValue = "Integers") String topic,
                       @RequestParam(value = "usermessage", defaultValue = "Generate just a word problem for x+5=7 involving animals") String usermessage) {
        try {
            List<Document> searchResults = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(topic + " " + usermessage)
                            .topK(TOP_K)
                            .similarityThreshold(SIMILARITY_THRESHOLD)
                            .filterExpression("metadata->>'page_number' < '10' && metadata->>'page_number' > '5' && metadata->>'file_name' = 'Prealgebra2e-WEB-0qbw93r.pdf'")
                            .build());
            return chatClient.prompt()
                    .user(usermessage)
                    .call()
                    .content();
        } catch (Exception e) {
            return "I'm sorry, I'm experiencing technical difficulties right now. Please try again later.";
        }
    }
}
