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

As part of my ongoing Java explorations, I recently tackled a practical project that hit the sweet spot between business needs and cutting-edge tech. The challenge? Building a system to transcribe audio files across multiple languages with specific formatting requirements.

This wasn't just about converting speech to text. The system needed to identify different speakers, handle six different languages, format numbers and dates properly, and flag sections that might need human review. Given these requirements, I decided to leverage Google Cloud's Vertex AI with Gemini 1.5, all orchestrated through a Spring Boot application.

### The Challenge: Beyond Simple Speech-to-Text

Most off-the-shelf transcription tools give you a wall of text and call it a day. Our requirements were much more nuanced:

1.  **Multilingual Support**: The system had to handle English plus five other languages without missing a beat.
2.  **Speaker Diarization**: We needed clear labels showing who was talking when (e.g., "Speaker A:", "Speaker B:"), which is surprisingly hard to get right.
3.  **Specific Formatting**: Each transcript needed timestamps at speaker changes and language-appropriate number/date formats.
4.  **Handling Imperfections**: Real-world audio has issues - background noise, people talking over each other, mumbling. The system needed to handle these gracefully.
5.  **Quality Assessment**: We needed some way to flag transcriptions that might need human review.

### Architecture: A Spring Boot & Google Cloud Symphony

I built a workflow that looks something like this:

![Architecture](https://res.cloudinary.com/dlsxyts6o/image/upload/v1746182920/spring-boot-gemini-audio-transcription.png)

1.  **Audio Ingestion & Preparation**: The backend receives audio files and converts them to FLAC format. I chose FLAC because it preserves audio quality while keeping file sizes manageable.
2.  **Cloud Storage**: These FLAC files get uploaded to Google Cloud Storage. This step is crucial - it lets Gemini access potentially large audio files without timing out or hitting memory limits.
3.  **Vertex AI & Gemini 1.5**: Our Spring Boot app calls Vertex AI, pointing Gemini to the audio file's location. The magic happens in the prompt we send along with this request (more on that in a bit).
4.  **Processing & Storage**: Once Gemini does its thing, we parse the response, add our own confidence scoring, and store everything in our database.
5.  **Notification/Feedback**: For user-triggered transcriptions, we send back success/failure notifications.

Using GCS as the middleman was a bit of extra work, but it paid off by making the system more robust when handling larger files.

### Harnessing Gemini 1.5

Gemini 1.5's massive context window and multimodal capabilities made it perfect for handling audio files directly via GCS URIs.

#### Prompt Engineering for Precision

This was the trickiest part of the whole project. Just saying "hey, transcribe this" wasn't going to cut it. After many iterations, I landed on this prompt structure:

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

This prompt spells out exactly what we need:
* The target language (dynamically inserted at runtime)
* How to format timestamps, speaker labels, numbers, and dates
* Clear instructions for handling tricky situations like unclear speech

#### Navigating Safety Settings

I hit an unexpected roadblock with Vertex AI's default safety settings. They're designed to prevent harmful content generation, but in our case, they sometimes flagged legitimate business conversations containing certain keywords.

After some trial and error, I identified which safety categories we could safely disable for our specific use case. This required careful consideration - we needed the full, unfiltered transcription, but we were working with known audio sources in a controlled environment.

### Measuring Confidence: A Pragmatic Approach

One challenge with LLMs is they don't give you a simple "I'm 87% confident in this transcription" score. However, Gemini does return log probabilities (`avg_logprobs`) for the generated tokens, which provide some insight into the model's internal confidence.

I cobbled together a basic confidence scoring system:
1. Extract the `avg_logprobs` from the API response
2. Set a threshold based on experimentation (around `-0.4`)
3. If the average log probability falls below this threshold, flag that transcript for human review

It's not perfect, but it gave us a practical way to identify potentially problematic transcriptions that might need a second pair of eyes.

### Implementation: Async vs. Batch Processing

To handle different use cases, I implemented two processing modes:

1.  **Asynchronous Processing**: For user-triggered transcriptions, we process things in the background using Spring's `@Async` annotations. The user gets an immediate acknowledgment, and we notify them when the job completes.

2.  **Batch Processing**: For processing backlogs of audio files, I built a scheduled job using Spring's `@Scheduled` annotation. This runs during off-hours, picking up unprocessed files and working through them methodically.

```java
    public static List<SafetySetting> getCustomSafetySettings() {
        final List<SafetySetting> safetySettings = new ArrayList<>();
        safetySettings.add(SafetySetting.newBuilder()
                .setCategory(HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT)
                .setThreshold(SafetySetting.HarmBlockThreshold.BLOCK_NONE)
                .build());
        safetySettings.add(SafetySetting.newBuilder()
                .setCategory(HarmCategory.HARM_CATEGORY_HARASSMENT)
                .setThreshold(SafetySetting.HarmBlockThreshold.BLOCK_NONE)
                .build());
        safetySettings.add(SafetySetting.newBuilder()
                .setCategory(HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT)
                .setThreshold(SafetySetting.HarmBlockThreshold.BLOCK_NONE)
                .build());
        safetySettings.add(SafetySetting.newBuilder()
                .setCategory(HarmCategory.HARM_CATEGORY_HATE_SPEECH)
                .setThreshold(SafetySetting.HarmBlockThreshold.BLOCK_NONE)
                .build());
        safetySettings.add(SafetySetting.newBuilder()
                .setCategory(HarmCategory.HARM_CATEGORY_UNSPECIFIED)
                .setThreshold(SafetySetting.HarmBlockThreshold.BLOCK_NONE)
                .build());
        return safetySettings;
    }

    private SpeechToTextInfo transcribeAudioWithGeminiSync(final String gcsUri,
                                                           final SpeechToTextInfo pendingInfo) {
        try {
            log.debug("Transcribing audio synchronously with Gemini for callId: {} and recordingId: {}",
                    pendingInfo.getCallId(), pendingInfo.getRecordId());

            final GenerativeModel model = new GenerativeModel(modelName, vertexAI);
            model.withSafetySettings(getCustomSafetySettings());

            final GenerateContentResponse response = model.generateContent(
                    ContentMaker.fromMultiModalData(
                            buildPrompt(""),
                            PartMaker.fromMimeTypeAndData("audio/flac", gcsUri)
                    ));

            final ImmutableGeminiSpeechToTextTranscriptInfo.Builder transcriptInfoBuilder =
                    ImmutableGeminiSpeechToTextTranscriptInfo.builder();

            final double avgLogProbs = response.getCandidates(0).getAvgLogprobs();
            transcriptInfoBuilder.hasAcceptableConfidence(avgLogProbs >= CONFIDENCE_THRESHOLD)
                    .avgLogProbs(avgLogProbs);

            final String transcript = ResponseHandler.getText(response);
            final SpeechToTextInfo completedInfo = SpeechToTextInfo.from(pendingInfo)
                    .setTranscript(transcript)
                    .setStatus(SpeechToTextState.success)
                    .setTranscriptsInfo(ImmutableList.of(transcriptInfoBuilder.build()))
                    .build();

            // save into db
            return completedInfo;

        } catch (final Exception e) {
            log.error("Failed to transcribe audio synchronously for callId: {}",
                    pendingInfo.getCallId(), e);
            final SpeechToTextInfo failedInfo = SpeechToTextInfo.from(pendingInfo)
                    .setStatus(SpeechToTextState.failed)
                    .build();
            // save into db
            return failedInfo;
        }
    }

    private void transcribeAudioWithGemini(final String gcsUri, final String language,
                                           final SpeechToTextInfo pendingInfo) {
        try {
            log.debug("Transcribing audio with Gemini for callId: {} and recordingId: {}",
                    pendingInfo.getCallId(), pendingInfo.getRecordId());

            final GenerativeModel model = new GenerativeModel(modelName, vertexAI);
            model.withSafetySettings(getCustomSafetySettings());

            final ApiFuture<GenerateContentResponse> response = model.generateContentAsync(
                    ContentMaker.fromMultiModalData(
                            buildPrompt(language),
                            PartMaker.fromMimeTypeAndData("audio/flac", gcsUri)
                    ));

            log.debug("Transcribing audio with Gemini for callId: {} and recordingId: {} and response {}",
                    pendingInfo.getCallId(), pendingInfo.getRecordId(), response);
            ApiFutures.addCallback(response, new ApiFutureCallback<GenerateContentResponse>() {
                @Override
                public void onSuccess(final GenerateContentResponse result) {
                    log.debug("Transcribing audio with Gemini for callId: {} and recordingId: {} and result {}",
                            pendingInfo.getCallId(), pendingInfo.getRecordId(), result);
                    processTranscription(result, pendingInfo);
                }

                @Override
                public void onFailure(final Throwable t) {
                    handleTranscriptionFailure(pendingInfo, t);
                }
            }, MoreExecutors.directExecutor());
        } catch (final Exception e) {
            handleTranscriptionFailure(pendingInfo, e);
        }
    }
```

### Learnings and Final Thoughts

This project taught me a ton about applying LLMs to practical business problems. My key takeaways:

* **Gemini 1.5 is a beast** for these kinds of tasks, especially when working with audio through GCS integration.
* **Prompt engineering makes or breaks you**. The difference between a useless transcript and a perfect one often comes down to how clearly you communicate your requirements.
* **Safety settings matter**. Understanding what they do and how to configure them for your specific use case is crucial.
* **Imperfect signals can still be useful**. Even though `avg_logprobs` isn't a perfect confidence metric, it gave us a practical way to implement human-in-the-loop review.
* **Spring Boot's flexibility shines** when implementing both async and batch processing patterns to handle different use cases.

Wrangling all these technologies together was challenging but incredibly satisfying. There's something deeply rewarding about seeing a complex system like this come together to solve a real business problem.
