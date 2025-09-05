---
title: "Day 92: Building Java AI Agents with Spring AI - My Unicorn Rental Adventure 🦄"
date: 2025-01-15T10:00:00Z
draft: false
tags: ["100DaysOfJava", "Spring AI", "AI Agents", "AWS", "Bedrock", "Vector Database", "RAG", "MCP"]
categories: ["Java", "Artificial Intelligence", "Spring Framework"]
author: "Mohibul"
description: "An exciting journey through building intelligent Java applications with Spring AI, complete with memory, tool calling, and a magical unicorn rental system!"
---

# Day 92: Building Java AI Agents with Spring AI - My Unicorn Rental Adventure 🦄

Hey fellow Java enthusiasts! Today marks day 92 of our #100DaysOfJava journey, and boy, do I have an exciting story to share with you! I recently attended an incredible workshop on "Building Java AI Agents with Spring AI" hosted by AWS, and it completely blew my mind. Imagine building an AI agent that can not only chat with you but also manage a fictional unicorn rental business - yes, you read that right, UNICORNS! 🦄

## The Magic Begins: What is Spring AI?

Picture this: You're a Java developer who has been comfortable with Spring Boot for years, and suddenly someone tells you that you can now build AI-powered applications using the same familiar Spring concepts you already know and love. That's exactly what Spring AI brings to the table!

Spring AI is like giving your trusty Spring Framework a magical upgrade. It provides a unified way to interact with different AI models without having to learn completely new paradigms. Think of it as having a universal translator between your Java application and various AI services like Amazon Bedrock, OpenAI, or Azure OpenAI.

## The ChatClient Interface: Your Gateway to AI Magic

At the heart of Spring AI lies the `ChatClient` interface - think of it as your personal assistant that can talk to any AI model. Here's what makes it so powerful:

```java
// Building a ChatClient is as simple as this!
var chatClient = chatClientBuilder
    .defaultSystem("You are a Unicorn Rentals Agent, expert in all sorts of things related to Unicorns and renting them.")
    .build();
```

The beauty of this interface is its simplicity. Whether you want synchronous responses with `call()`, streaming responses with `stream()`, or batch processing with `generate()`, it's all there in a clean, Spring-like API.

## Building Our Unicorn Rental Empire

### Step 1: The Simple Beginning

Our journey started with a simple command-line chatbot. Imagine typing a few lines of code and suddenly having an AI assistant that knows everything about unicorn rentals:

```java
@Bean
public CommandLineRunner cli(ChatClient.Builder chatClientBuilder) {
    return args -> {
        var chatClient = chatClientBuilder
            .defaultSystem("You are a Unicorn Rentals Agent...")
            .build();
        
        // Magic happens here - instant AI assistant!
        while (true) {
            System.out.print("\nUSER: ");
            System.out.println("\nASSISTANT: " + 
                chatClient.prompt(scanner.nextLine())
                    .call()
                    .content());
        }
    };
}
```

Just like that, we had our first AI agent running! But here's where it gets interesting...

### Step 2: Giving Our Agent Memory

What good is a rental agent who forgets who you are the moment you ask a second question? This is where `MessageChatMemoryAdvisor` comes to the rescue! 

```java
var chatMemory = MessageWindowChatMemory.builder()
    .maxMessages(20)
    .build();

this.chatClient = chatClient
    .defaultSystem(DEFAULT_SYSTEM_PROMPT)
    .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
    .build();
```

Now our unicorn rental agent could remember our conversation! Tell it "My name is Alex" and later ask "What's my name?" - it would remember! It's like giving your application a brain that doesn't reset every time.

### Step 3: Persistent Memory with PostgreSQL

But wait, what happens when we restart our application? Goodbye memory! That's where persistent storage comes in. Using `JdbcChatMemoryRepository`, we connected our agent's memory to a PostgreSQL database:

```java
var chatMemoryRepository = JdbcChatMemoryRepository.builder()
    .dataSource(dataSource)
    .dialect(new PostgresChatMemoryRepositoryDialect())
    .build();
```

Now our unicorn agent has a permanent memory - like having a detailed customer relationship management system built right into the AI!

## The Game Changer: RAG (Retrieval-Augmented Generation)

Here's where things get really exciting! RAG is like giving your AI agent access to a vast library of knowledge. Instead of relying solely on what the AI model was trained on, we can feed it real-time, domain-specific information.

We implemented this using PGVector (PostgreSQL with vector extensions) to store and search through embeddings:

```java
// Adding knowledge to our vector store
vectorStore.add(List.of(new Document("Unicorn have origins in different cultures: Chinese Qilin, Indian unicorn seals, Greek accounts")));

// The AI can now answer questions about unicorn origins!
```

The workflow is beautiful:
1. Documents get chunked and converted to vector embeddings
2. User queries also become embeddings
3. Similar documents are retrieved using vector similarity search
4. The AI uses both its training and the retrieved context to answer

It's like having a research assistant that can instantly find relevant information from your company's knowledge base!

## Tool Calling: When AI Meets the Real World

This is where our unicorn rental agent became truly magical. We gave it the ability to use external tools - essentially teaching it to interact with the outside world!

### Weather Tool
```java
@Tool(description = "Get weather forecast for a city on a specific date")
public String getWeather(String city, String date) {
    // API calls to get real weather data
    return weatherInfo;
}
```

### DateTime Tool
```java
@Tool(description = "Get the current date and time")
public String getCurrentDateTime(String timeZone) {
    return ZonedDateTime.now(ZoneId.of(timeZone))
        .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
}
```

Now when someone asks "What's the weather tomorrow in Las Vegas?", our agent:
1. Uses the DateTime tool to get the current date
2. Calculates tomorrow's date
3. Uses the Weather tool to fetch actual weather data
4. Provides a comprehensive answer!

It's like watching your application come alive and interact with the real world!

## The Crown Jewel: Model Context Protocol (MCP)

The most fascinating part was implementing MCP - Model Context Protocol. Think of it as a standardized way for AI agents to communicate with external services. We turned our existing UnicornStore application into an MCP server:

```java
@Tool(description = "Create a new unicorn in the unicorn store.")
@Transactional
public Unicorn createUnicorn(Unicorn unicorn) {
    // Business logic to create unicorns
    return savedUnicorn;
}

@Tool(description = "Get a list of all unicorns in the unicorn store")
public List<Unicorn> getAllUnicorns(String... parameters) {
    // Fetch all unicorns from database
    return unicorns;
}
```

The beauty is that our AI agent could now:
- List available unicorns: "What unicorns are available?"
- Create new unicorns: "Please create a new fancy unicorn named Spring"
- All while maintaining conversation context and using real business logic!

## The Complete Architecture: A Symphony of Components

Our final unicorn rental agent was a masterpiece of modern software architecture:

1. **ChatClient** - The conductor orchestrating everything
2. **Memory System** - Both local and persistent, keeping track of conversations
3. **Vector Store** - RAG capabilities for domain knowledge
4. **Tool Calling** - Weather, datetime, and business operations
5. **MCP Integration** - Communication with external services
6. **AWS Bedrock** - Powerful Claude AI models
7. **PostgreSQL + PGVector** - Reliable data storage with vector capabilities

## Deployment: Taking It to the Cloud

The workshop didn't stop at development - we deployed our creation to AWS EKS (Elastic Kubernetes Service)! Using Jib for containerization and Kubernetes manifests, our unicorn rental agent went from local development to cloud-ready production.

```bash
# Building and pushing to ECR
mvn compile jib:build -Dimage=$ECR_URI:latest

# Deploying to Kubernetes
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

## What's Next?

This workshop opened my eyes to the incredible possibilities when you combine the robustness of Java/Spring with the power of modern AI. The unicorn rental system might be fictional, but the patterns and techniques are very real and applicable to any business domain.

Whether you're building customer service bots, internal tools, or complex business automation, Spring AI provides a solid foundation that feels natural to Java developers.

## Final Thoughts

As we approach the final stretch of our #100DaysOfJava journey, this workshop reminded me why I love being a Java developer. The language and ecosystem continue to evolve, embracing new paradigms while maintaining the stability and predictability we depend on.

The future of software development is clearly heading toward AI integration, and with Spring AI, we Java developers are perfectly positioned to build that future!

Have you experimented with AI in your Java applications? What use cases are you most excited about? Drop a comment below - I'd love to hear about your AI adventures!

Until tomorrow, keep coding and stay curious! 🚀

---

*This post is part of my #100DaysOfJava challenge. Follow along for daily insights, tutorials, and discoveries in the world of Java development!*

**Tags:** #100DaysOfJava #SpringAI #AWS #Bedrock #VectorDatabase #RAG #MCP #ArtificialIntelligence #JavaDevelopment

---

**Resources:**
- [Spring AI Documentation](https://spring.io/projects/spring-ai)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)
- [Workshop GitHub Repository](https://github.com/aws-samples/java-on-aws)
- [Model Context Protocol](https://modelcontextprotocol.io/)
