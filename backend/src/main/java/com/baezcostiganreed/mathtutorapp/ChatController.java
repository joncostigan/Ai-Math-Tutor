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

    
    @Value("classpath:/documents/prompts/prompt-template.txt")
    private Resource topic1PromptTemplate;
    private final ChatClient chatClient;
    @Autowired
    private final PgVectorStore vectorStore;

    /**
     * Constructs a new controller with a chat client and a vector store.
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
   
    }
}
