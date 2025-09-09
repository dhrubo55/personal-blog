---
title: "Building AI Agents with Spring AI: My learning from the workshop"
date: 2025-01-15T10:00:00Z
draft: true
tags: ["100DaysOfJava", "Spring AI", "AI Agents", "AWS", "Bedrock", "Vector Database", "RAG", "MCP"]
categories: ["Java", "Artificial Intelligence", "Spring Framework"]
author: "Mohibul"
description: "Learn how to build intelligent Java applications using Spring AI, from basic chat interfaces to sophisticated agents with memory, RAG capabilities, and external tool integration."
---

### Building Production-Ready AI Agents with Spring AI: My learning from the workshop

Hey fellow Java developers, Today marks day 92 of my #100DaysOfJava journey, I have an exciting story to share with you! I recently attended an incredible workshop on [Building Java AI Agents with Spring AI](https://aws-experience.com/emea/smb/e/90912/building-java-ai-agents-with-spring-ai) hosted by AWS. In this workshop we learned about building an AI agent that can not only chat with you but also manage a fictional unicorn rental business as example application.

This article will demonstrate my learnings from the workshop, like how to construct a complete AI agent system using Spring AI, progressing from a simple chat interface to a sophisticated application featuring persistent memory, retrieval-augmented generation (RAG), and external tool integration. We'll build a fictional unicorn rental system that showcases real-world AI integration patterns applicable to any business domain.

Picture this: You're a Java developer who has been comfortable with Spring Boot for years, and suddenly someone tells you that you can now build AI-powered applications using the same familiar Spring concepts you already know and love. That's exactly what Spring AI brings to the table!

### Understanding Spring AI's Core Architecture

Spring AI provides a unified abstraction layer over various AI model providers, including OpenAI, Azure OpenAI, and Amazon Bedrock. The framework's central component is the `ChatClient` interface, which standardizes interactions with different AI models while maintaining Spring's dependency injection and configuration principles.

### The ChatClient Interface: Your Gateway to AI Magic

At the heart of Spring AI lies the `ChatClient` interface - think of it as your personal assistant that can talk to any AI model. Here's what makes it so powerful:

```java
@RestController
@RequestMapping("api")
public class ChatController {
    
    private static final String DEFAULT_SYSTEM_PROMPT = """
        You are a helpful AI assistant for Unicorn Rentals, a fictional company that rents unicorns.
        Be friendly, helpful, and concise in your responses.
        """;

    private final ChatClient chatClient;

    public ChatController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder
            .defaultSystem(DEFAULT_SYSTEM_PROMPT)
            .build();
    }
}
```
It can use any model under the hood with system prompt and other configuration. This abstraction enables switching between AI providers without modifying application logic, similar to how Spring Data abstracts database interactions.


```java
@PostMapping("/chat/stream")
public Flux<String> chatStream(@RequestBody PromptRequest promptRequest){
    var conversationId = "user1"; // This should be retrieved from the Auth context
    return chatClient.prompt().user(promptRequest.prompt())
        .advisors(advisor -> advisor.param(ChatMemory.CONVERSATION_ID, conversationId))
        .stream().content();
}
```

The streaming endpoint returns a `Flux<String>`, which means the frontend receives the AI response word by word, creating that magical typewriter effect!

#### Step 2: Giving Our Agent Memory

What good is a rental agent who forgets who you are the moment you ask a second question? This is where `MessageChatMemoryAdvisor` comes to the rescue. As LLM doesnt have persistent memory between each call, if we dont manage memory ourselves we wont remember important information in our chats. Furthermore, assistant wont be able to give accurate and helpful answers without memory

```java
public ChatController(ChatClient.Builder chatClient, DataSource dataSource, 
                     VectorStore vectorStore, ToolCallbackProvider tools) {
    var chatMemoryRepository = JdbcChatMemoryRepository.builder()
        .dataSource(dataSource)
        .dialect(new PostgresChatMemoryRepositoryDialect())
        .build();

    var chatMemory = MessageWindowChatMemory.builder()
        .chatMemoryRepository(chatMemoryRepository)
        .maxMessages(20)
        .build();

    this.vectorStore = vectorStore;

    this.chatClient = chatClient
        .defaultSystem(DEFAULT_SYSTEM_PROMPT)
        .defaultAdvisors(
            MessageChatMemoryAdvisor.builder(chatMemory).build(),
            QuestionAnswerAdvisor.builder(vectorStore).build())
        .defaultTools(new DateTimeTools(), new WeatherTools())
        .defaultToolCallbacks(tools)
        .build();
}
```

The `MessageWindowChatMemory` maintains a sliding window of recent messages, while `JdbcChatMemoryRepository` provides persistence using standard database infrastructure.

#### Streaming Responses for Enhanced User Experience

Modern AI applications benefit from streaming responses that provide immediate feedback:

```java
@PostMapping("/chat/stream")
public Flux<String> chatStream(@RequestBody PromptRequest promptRequest){
    var conversationId = "user1"; // Should be retrieved from authentication context
    return chatClient.prompt().user(promptRequest.prompt())
        .advisors(advisor -> advisor.param(ChatMemory.CONVERSATION_ID, conversationId))
        .stream().content();
}

record PromptRequest(String prompt) {}
```

The `Flux<String>` return type enables real-time streaming of AI responses, improving perceived performance and user engagement.

### Web Interface

The web interface features:
- **Real-time streaming responses** - Watch as the AI types responses in real-time!
- **Dark mode design** - Perfect for developers who love dark themes
- **Responsive layout** - Works beautifully on desktop and mobile
- **Chat history** - See your entire conversation flow

### Implementing Retrieval-Augmented Generation (RAG)

RAG enhances AI responses by incorporating domain-specific knowledge from external sources. This approach combines the general knowledge of pre-trained models with current, specific information from your organization's data.

#### Vector Store Integration

Spring AI integrates seamlessly with PostgreSQL's PGVector extension for vector similarity search:

```java
@PostMapping("load")
public void loadDataToVectorStore(@RequestBody String content) {
    vectorStore.add(List.of(new Document(content)));
}
```

The RAG workflow operates as follows:

1. Documents are chunked and converted to vector embeddings using Amazon Titan
2. User queries are similarly embedded
3. Vector similarity search retrieves relevant document chunks
4. The AI model generates responses using both its training data and retrieved context

#### Configuration for RAG

The application properties configure the complete RAG pipeline:

```properties
# RAG Configuration
spring.ai.model.embedding=bedrock-titan
spring.ai.bedrock.titan.embedding.model=amazon.titan-embed-text-v2:0
spring.ai.bedrock.titan.embedding.input-type=text
spring.ai.vectorstore.pgvector.initialize-schema=true
spring.ai.vectorstore.pgvector.dimensions=1024
```

This configuration automatically initializes the vector database schema and configures Amazon Titan for generating embeddings.

### Tool Calling: Extending AI Capabilities

Tool calling allows AI agents to interact with external systems and APIs, transforming them from simple chatbots into capable automation systems.

#### Implementing External Tools

Tools are defined using the `@Tool` annotation and standard Java methods:

```java
public class WeatherTools {
    private final RestTemplate restTemplate = new RestTemplate();

    @Tool(description = "Get weather forecast for a city on a specific date (format: YYYY-MM-DD)")
    public String getWeather(String city, String date) {
        try {
            // Convert city to coordinates using Geocoding API
            var encodedCity = UriUtils.encode(city, StandardCharsets.UTF_8);
            var geocodingUrl = URI.create("https://geocoding-api.open-meteo.com/v1/search?name=" +
                                         encodedCity + "&count=1");

            var geocodingResponse = restTemplate.exchange(
                geocodingUrl,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            var body = geocodingResponse.getBody();
            var results = (body != null) ? (List<?>) body.getOrDefault("results", Collections.emptyList()) : Collections.emptyList();
            if (results.isEmpty()) {
                return "City not found: " + city;
            }

            var location = (Map<?, ?>) results.get(0);
            var latitude = ((Number) location.get("latitude")).doubleValue();
            var longitude = ((Number) location.get("longitude")).doubleValue();
            var cityName = (String) location.get("name");

            // Get weather data from Open-Meteo API
            var weatherUrl = URI.create(
                "https://api.open-meteo.com/v1/forecast" +
                "?latitude=%s&longitude=%s".formatted(latitude, longitude) +
                "&daily=temperature_2m_max,temperature_2m_min" +
                "&timezone=auto" +
                "&start_date=%s&end_date=%s".formatted(date, date)
            );

            var weatherResponse = restTemplate.exchange(
                weatherUrl,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            var weatherData = weatherResponse.getBody();
            if (weatherData == null) {
                return "Failed to retrieve weather data";
            }

            var dailyData = (Map<?, ?>) weatherData.get("daily");
            var dailyUnits = (Map<?, ?>) weatherData.get("daily_units");

            if (dailyData == null || dailyUnits == null) {
                return "Weather data format is invalid";
            }

            var maxTempList = (List<?>) dailyData.get("temperature_2m_max");
            var minTempList = (List<?>) dailyData.get("temperature_2m_min");

            if (maxTempList == null || minTempList == null || maxTempList.isEmpty() || minTempList.isEmpty()) {
                return "Temperature data not available for the specified date";
            }

            var maxTemp = ((Number) maxTempList.get(0)).doubleValue();
            var minTemp = ((Number) minTempList.get(0)).doubleValue();
            var unit = (String) dailyUnits.get("temperature_2m_max");

            return """
                   Weather for %s on %s:
                   Min: %.1f%s, Max: %.1f%s
                   """.formatted(cityName, date, minTemp, unit, maxTemp, unit);

        } catch (Exception e) {
            return "Error fetching weather data: " + e.getMessage();
        }
    }
}
```

#### DateTime Tool for Temporal Context

A simpler tool demonstrates basic temporal functionality:

```java
class DateTimeTools {
    @Tool(description = "Get the current date and time")
    public String getCurrentDateTime(String timeZone) {
        return java.time.ZonedDateTime.now(java.time.ZoneId.of(timeZone))
                .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
```

When users request weather information, the AI automatically determines it needs current time context and weather data, orchestrating multiple tool calls to provide comprehensive responses.

### Model Context Protocol (MCP) Integration

MCP standardizes communication between AI agents and external services. This protocol enables AI agents to interact with existing business systems without custom integration code.

#### Converting Existing Services to MCP Servers

Existing Spring Boot services can be enhanced with MCP capabilities by adding the `@Tool` annotation to service methods:

```java
@Service
public class UnicornService {
    private final UnicornRepository unicornRepository;
    private final UnicornPublisher unicornPublisher;
    private static final Logger logger = LoggerFactory.getLogger(UnicornService.class);

    @Tool(description = "Create a new unicorn in the unicorn store.")
    @Transactional
    public Unicorn createUnicorn(Unicorn unicorn) {
        logger.debug("Creating unicorn: {}", unicorn);
        if (unicorn.getId() == null) {
            unicorn.setId(UUID.randomUUID().toString());
        }
        validateUnicorn(unicorn);

        var savedUnicorn = unicornRepository.save(unicorn);
        publishUnicornEvent(savedUnicorn, UnicornEventType.UNICORN_CREATED);

        logger.debug("Created unicorn with ID: {}", savedUnicorn.getId());
        return savedUnicorn;
    }

    @Tool(description = "Get a list of all unicorns in the unicorn store")
    public List<Unicorn> getAllUnicorns(String... parameters) {
        logger.debug("Retrieving all unicorns");
        return StreamSupport
                .stream(unicornRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());
    }
}
```

This approach allows AI agents to perform actual business operations, transforming them from conversational interfaces into functional business automation tools.

### Configuration-Driven Development

Spring AI's configuration-centric approach minimizes boilerplate code:

```properties
# Application basics
spring.application.name=agent
logging.level.org.springframework.ai=DEBUG

# Amazon Bedrock Configuration
spring.ai.bedrock.converse.chat.options.model=us.anthropic.claude-3-7-sonnet-20250219-v1:0

# UI Configuration
spring.thymeleaf.cache=false
spring.thymeleaf.prefix=classpath:/templates/
spring.thymeleaf.suffix=.html

# JDBC Memory Configuration
spring.ai.chat.memory.repository.jdbc.initialize-schema=always
spring.datasource.username=postgres

# RAG Configuration
spring.ai.model.embedding=bedrock-titan
spring.ai.bedrock.titan.embedding.model=amazon.titan-embed-text-v2:0
spring.ai.bedrock.titan.embedding.input-type=text
spring.ai.vectorstore.pgvector.initialize-schema=true
spring.ai.vectorstore.pgvector.dimensions=1024

# MCP Client Configuration
spring.ai.mcp.client.toolcallback.enabled=true
```

This configuration automatically sets up:
- **Claude 3.5 Sonnet** as our chat model
- **Amazon Titan** for embeddings
- **PostgreSQL** for memory and vector storage
- **Thymeleaf** for web templates
- **MCP client** for external tool integration

No manual beans, no complex configuration classes - just properties!

### The Complete Architecture: A Symphony of Components

Our final unicorn rental agent was a masterpiece of modern software architecture:

1. **ChatClient** - The conductor orchestrating everything
2. **Web Interface** - Beautiful Thymeleaf + Tailwind CSS frontend with real-time streaming
3. **Memory System** - Both local and persistent, keeping track of conversations
4. **Vector Store** - RAG capabilities for domain knowledge
5. **Tool Calling** - Weather, datetime, and business operations
6. **MCP Integration** - Communication with external services
7. **AWS Bedrock** - Powerful Claude AI models and Titan embeddings
8. **PostgreSQL + PGVector** - Reliable data storage with vector capabilities

The beauty of this architecture is how all these components work together seamlessly, yet each can be developed and tested independently.

### Deployment: Taking It to the Cloud

The workshop didn't stop at development - we deployed our creation to AWS EKS (Elastic Kubernetes Service)! Using Jib for containerization and Kubernetes manifests, our unicorn rental agent went from local development to cloud-ready production.

```bash
# Building and pushing to Amazon ECR
mvn compile jib:build -Dimage=$ECR_URI:latest

# Deploying to Amazon EKS
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

## Key Takeaways for Fellow Java Developers

1. **Familiar Territory**: Spring AI uses the same patterns we know and love from Spring Framework
2. **Progressive Enhancement**: Start simple, add features incrementally
3. **Real Business Value**: AI agents can perform actual business operations, not just chat
4. **Production Ready**: With proper architecture, these agents can handle real-world loads
5. **Ecosystem Integration**: Seamlessly works with existing Spring/Java infrastructure

### Performance and Scaling

Several factors impact production performance:

- **Memory Management**: Configure appropriate message window sizes based on conversation length requirements
- **Vector Store Optimization**: Regularly maintain vector indexes and consider partitioning strategies for large datasets
- **Connection Pooling**: Configure database connection pools appropriately for concurrent AI interactions
- **Caching**: Implement caching strategies for frequently accessed embeddings and tool responses

### Security Considerations

Production deployments require attention to security:

- **Authentication**: Integrate conversation IDs with proper user authentication systems
- **API Rate Limiting**: Implement rate limiting to prevent abuse of AI endpoints
- **Data Privacy**: Ensure conversation data handling complies with privacy regulations
- **Input Validation**: Validate and sanitize all user inputs before processing

## Common Pitfalls and Best Practices

There are some common mistakes we can make when developing AI appli

### Memory Management

Unlimited conversation history can lead to context window overflow and increased costs. Implement sliding window memory with appropriate limits:

```java
var chatMemory = MessageWindowChatMemory.builder()
    .chatMemoryRepository(chatMemoryRepository)
    .maxMessages(20) // Adjust based on use case
    .build();
```

### Tool Design Principles

Effective tools should be:
- **Atomic**: Each tool should perform a single, well-defined operation
- **Idempotent**: Tools should produce consistent results for identical inputs
- **Error-Resilient**: Implement comprehensive error handling and fallback mechanisms

### Vector Store Maintenance

RAG systems require ongoing maintenance:
- Regular reindexing of document embeddings
- Monitoring for embedding drift as models evolve
- Implementing document versioning and update strategies

### Real-World Applications

The patterns demonstrated extend to various enterprise scenarios:

#### Customer Service Automation

AI agents can handle customer inquiries by accessing knowledge bases, order systems, and external APIs for real-time information retrieval and problem resolution.

#### Internal Tool Integration

Development teams can create AI assistants that interact with CI/CD systems, monitoring tools, and documentation platforms to streamline operational workflows.

#### Business Process Automation

AI agents can orchestrate complex business processes by integrating with ERP systems, approval workflows, and notification services.

## Conclusion

Spring AI democratizes AI integration for Java developers by providing familiar abstractions and configuration patterns. The framework enables rapid development of sophisticated AI agents while maintaining production-ready architecture principles.

Key benefits include:

- **Familiar Development Model**: Leverages existing Spring expertise
- **Provider Agnostic**: Supports multiple AI model providers
- **Production Ready**: Includes memory management, streaming, and deployment features
- **Extensible**: Supports custom tools and integration patterns

The combination of conversation memory, RAG capabilities, and tool calling creates AI agents that can handle complex, stateful interactions while maintaining context and accessing real-time information. This foundation supports building AI-powered applications that deliver genuine business value within existing enterprise architectures.

As AI continues to evolve, Spring AI provides a stable foundation that abstracts provider-specific details while enabling developers to focus on solving business problems rather than managing AI infrastructure complexity.

here is the github link for the whole project https://github.com/dhrubo55/java-ai-agent-amazon-workshop

*This post is part of my #100DaysOfJava challenge. Follow along for daily insights, tutorials, and discoveries in the world of Software development!*


---

**Resources:**
- [Spring AI Documentation](https://spring.io/projects/spring-ai)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)
- [Workshop GitHub Repository](https://github.com/aws-samples/java-on-aws)
- [Model Context Protocol](https://modelcontextprotocol.io/)
