package com.baezcostiganreed.mathtutorapp;

import jakarta.annotation.PostConstruct;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;




/**
 * Provides REST endpoints to interact with a chat client.
 */
@RestController
public class ChatController {
    private static final int TOP_K = 3;
    private static final double SIMILARITY_THRESHOLD = .6;
    @Value("classpath:/prompts/prompt_template.txt")
    private Resource systemResource;
    private SystemPromptTemplate systemPromptTemplate;
    private final ChatClient chatClient;
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

    @PostConstruct
    public void init() {
            this.systemPromptTemplate = new SystemPromptTemplate(systemResource);
    }

    /**
     * Handles GET requests with an optional user message.
     * Sends the user message to the chat client and returns the chat response.
     *
     * @param topic  the desired math topic of the chat
     * @param usermessage  the text provided by the user
     * @return the chat client's response or an error message
     */
    @GetMapping("/chat")
    public String chat(@RequestParam(value = "topic", defaultValue = "linear equations") String topic,
                       @RequestParam(value = "usermessage", defaultValue = " ") String usermessage) {
        String filterExpressionChapter = "";
        String chapterContent = "";
        switch (topic) {
            case "linear equations":
                filterExpressionChapter = "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 1249 && page_number <= 1357 || file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 28 && page_number <= 79";
                break;
            case "fractions":
                filterExpressionChapter = "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 400 && page_number <= 645 || file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 12 && page_number <= 17";
                break;
            case "integers":
                filterExpressionChapter = "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 15 && page_number <= 268 || file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 7 && page_number <= 9";
                break;
            case "real numbers":
                filterExpressionChapter = "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 1130 && page_number <= 1144";
                break;
            case "signed numbers":
                filterExpressionChapter = "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 1145 && page_number <= 1220";
                break;
            case "decimals":
                filterExpressionChapter = "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 663 && page_number <= 881";
                break;
            case "percents":
                filterExpressionChapter = "file_name == 'fundamentals-of-mathematics.pdf' && page_number >= 848 && page_number <= 920";
                break;
            case "polynomials":
                filterExpressionChapter = "file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 177 && page_number <= 205";
                break;
            case "factoring":
                filterExpressionChapter = "file_name == 'Beginning_and_Intermediate_Algebra.pdf' && page_number >= 212 && page_number <= 237";
                break;
        }
        try {
            List<Document> chapterResults = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query("Steps to find the solution. How to Solve. " + topic + " " + usermessage)
                            .topK(TOP_K)
                            .similarityThreshold(SIMILARITY_THRESHOLD)
                            .filterExpression(filterExpressionChapter)
                            .build());


            if (chapterResults != null) {
                chapterContent = chapterResults.stream().map(Document::getText).collect(Collectors.joining(" CHAPTER DOCUMENT: "));
            } else {
                chapterContent = "";
            }

            Message systemMessage = systemPromptTemplate.createMessage(Map.of("topic", topic, "usermessage", usermessage, "chapterContent", chapterContent));
            Prompt prompt =  new Prompt(systemMessage);
            return chatClient.prompt(prompt).call().content();


        } catch (Exception e) {
            return "I'm sorry, I'm experiencing technical difficulties right now. Please try again later.";
        }
    }
}
