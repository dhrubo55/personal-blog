+++
category = ["Java", "Spring Boot", "AI", "Google Cloud"]
date = 2025-04-29T00:00:00Z
description = "Leveraging Google Cloud Vertex AI's Gemini 1.5 for advanced, multilingual audio transcription within a Spring Boot application, including prompt engineering, safety settings management, and confidence scoring."
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day88"
summary = "Building a robust multilingual audio transcription system using Spring Boot, Google Cloud Storage, and Vertex AI's Gemini 1.5, covering architecture, prompt engineering, safety settings, confidence scoring, and async/batch processing."
title = "Day 88: Multilingual Audio Transcription with Gemini 1.5, Vertex AI, and Spring Boot"
[cover]
alt = "day88"
caption = "day88"
image = ""
relative = false
+++

Following up on my explorations into Java I recently tackled a fascinating project integrating Generative AI for a practical business need: transcribing audio files accurately, across multiple languages, and with specific formatting requirements.

The core task involved processing audio recordings to generate accurate text transcripts. However, the requirements went beyond simple speech-to-text. I needed speaker diarization (identifying who spoke when), handling multiple languages (English plus about five others), specific formatting for numbers and dates, and a way to flag potentially unclear sections. I chose Google Cloud's Vertex AI, specifically leveraging the power of the Gemini 1.5 model, orchestrated within a Spring Boot application.

### The Challenge: Beyond Simple Speech-to-Text

Standard transcription services often provide raw text, but our use case demanded more structure and nuance:

1.  **Multilingual Support**: The system had to reliably transcribe audio in several languages.
2.  **Speaker Diarization**: Identifying speaker changes and labeling them consistently (e.g., "Speaker A:", "Speaker B:") was crucial for readability.
3.  **Specific Formatting**: Timestamps at speaker changes, language-specific number/date formats were required.
4.  **Handling Imperfections**: Marking inaudible sections and managing overlapping speech gracefully was necessary.
5.  **Quality Assessment**: I needed a mechanism, even if basic, to gauge the confidence level of the transcription for potential human review.

### Architecture: A Spring Boot & Google Cloud Symphony

I designed a flow orchestrated by our Spring Boot backend:

![Architecture](https://res.cloudinary.com/dlsxyts6o/image/upload/v1746182920/spring-boot-gemini-audio-transcription.png)

1.  **Audio Ingestion & Preparation**: The backend receives audio files (potentially triggered by a frontend action or a batch process). It converts these files into the FLAC format, which is well-suited for transcription tasks.
2.  **Cloud Storage**: The processed FLAC files are uploaded to a Google Cloud Storage (GCS) bucket. GCS acts as a staging area, allowing Gemini 1.5 to access potentially large audio files efficiently using their GCS URIs.
3.  **Vertex AI & Gemini 1.5**: The Spring Boot application makes requests to the Vertex AI API, pointing Gemini 1.5 to the GCS URI of the audio file. Crucially, the request includes a carefully crafted prompt to guide the transcription process.
4.  **Processing & Storage**: Gemini processes the audio based on the prompt. The resulting transcript is received by the Spring Boot application, which then parses it, potentially flags it based on confidence scores, and stores the structured data (transcript, speaker labels, timestamps, flags) in our application database.
5.  **Notification/Feedback**: For user-initiated requests, the system provides feedback (success/failure) asynchronously.

Using GCS as an intermediary decouples the upload process from the transcription request and leverages Vertex AI's ability to handle large inputs directly from storage.

### Harnessing Gemini 1.5

Gemini 1.5's strength lies in its large context window and multimodal capabilities, making it suitable for processing long audio files directly via GCS URIs.

#### Prompt Engineering for Precision

Getting the desired output required careful prompt engineering. A simple "transcribe this" wouldn't suffice. I iterated to develop a detailed prompt structure:

```text
Please accurately transcribe this audio recording with high attention to detail. %1$s is the preferred language if specified.

I need a professional-quality transcript that captures the following elements:

Language Detection and Handling:
1. If language code is provided ([Language code]):
   - Use this as the primary transcription language
2. If no language code is provided:
   - Detect the spoken language from the audio
   - Transcribe in the detected language
   - Include the detected language code in the response

Formatting Requirements:
- Include timestamps at every speaker change
- Label speakers as "Speaker A:", "Speaker B:", etc.
- Use appropriate number formatting for the detected/specified language
- Format dates as DD.MM.YYYY

Language-Specific Guidelines:
[Language code]

Special Instructions:
- Mark unclear speech with [inaudible]
- For overlapping speech, prioritize the main speaker
- Ignore background noise unless relevant
```

This prompt explicitly tells the model:
*   The target language.
*   The required formatting for timestamps, speaker labels, numbers, and dates.
*   How to handle ambiguities like unclear speech or overlapping voices.

The `[language]` placeholders are dynamically filled based on the audio file's metadata or user input.

#### Navigating Safety Settings

An interesting challenge arose with Vertex AI's default safety settings. While essential for preventing harmful content generation, they could sometimes misinterpret certain words or phrases in the audio as violating policies, leading to incomplete or refused transcriptions. For our specific use case (transcribing potentially sensitive but legitimate business conversations), I needed the full, unfiltered transcription.

After some research and testing, I identified specific safety categories that could be disabled for our Vertex AI requests without compromising the core goal, ensuring I received the most accurate transcription possible, even if the conversation contained potentially flagged terms in a benign context. This requires careful consideration of the risks and is specific to the controlled nature of the input audio.

### Measuring Confidence: A Pragmatic Approach

LLMs don't typically provide a simple, reliable "accuracy score." However, Gemini responses can include log probabilities (`avg_logprobs`) for the generated tokens, offering a hint about the model's internal confidence. While not a perfect measure of factual accuracy, lower (less negative) log probabilities generally indicate higher confidence from the model's perspective.

I implemented a makeshift confidence scoring system:
1.  Examine the `avg_logprobs` returned by the API (if available for the specific call type).
2.  Set a threshold (I experimented and settled around `-0.4`).
3.  If the average log probability for a transcription segment fell below this threshold, I set a flag (`needs_review`) in our database associated with that transcript.

This flag signals to human agents (e.g., call center quality assurance) that a particular transcript might warrant closer inspection. It's a pragmatic **human-in-the-loop** approach, acknowledging the limitations of automated quality assessment for generative models.

### Implementation: Async vs. Batch Processing

To cater to different needs, I implemented two processing modes:

1.  **Asynchronous Processing (User-Initiated)**: When a user triggers transcription (e.g., via a button click on a frontend), the Spring Boot backend initiates the process asynchronously (`@Async` or using message queues). The user gets an immediate acknowledgment, and the backend handles the conversion, upload, Vertex AI call, and DB update in the background. Upon completion or failure, the user can be notified (e.g., via websockets or polling). This provides a responsive user experience.

2.  **Batch Processing (Scheduled)**: For processing large backlogs of audio files, I implemented a scheduled job using Spring's `@Scheduled` annotation. This job runs periodically (e.g., nightly), queries the database for unprocessed audio files, and processes them sequentially (or in small batches) using the synchronous Vertex AI API endpoint. This is suitable for non-urgent, bulk processing tasks.

### Learnings and Final Thoughts

This project was a deep dive into applying large language models to a specific, structured task. Key takeaways include:

*   **Gemini 1.5's Power**: It's highly capable for complex transcription tasks, especially with long audio via GCS integration.
*   **Prompt is King**: Detailed, explicit prompt engineering is non-negotiable for getting structured, accurate output that meets specific formatting requirements.
*   **Safety vs. Accuracy**: Understanding and configuring safety settings is crucial for specific use cases where default filters might be overly restrictive.
*   **Pragmatic QA**: Leveraging available metrics like `avg_logprobs` can provide useful, albeit imperfect, signals for human review workflows.
*   **Right Tool for the Job**: Combining asynchronous and batch processing patterns within Spring Boot allows handling both interactive requests and bulk operations efficiently.

Integrating cutting-edge GenAI like Gemini into a robust Spring Boot application was challenging but rewarding, showcasing how these technologies can solve real-world business problems when architected thoughtfully.
