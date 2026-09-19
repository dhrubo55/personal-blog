---
title: Selected work
url: "/case-studies/"
aliases: ["/projects/"]
hidemeta: true
disableShare: true
summary: Selected production work and technical investigations by Mohibul Hassan Chowdhury.
---

# Selected work

These examples separate production responsibilities from public technical investigations. Customer names and private data are omitted.

## Production call intelligence

**Problem.** Turn call recordings into useful transcripts and conversation intelligence while accounting for language, model uncertainty, retries, and later transcript revisions.

**Constraints.** The workflows needed single-recording and batch processing, multilingual prompting, credential management, confidence-based evaluation, and failure handling across backend and administration flows. Model reliability and bring-your-own-key pricing also affected the design.

**My contribution.** I worked on the architecture and implementation of transcription workflows using Google Vertex AI and Gemini. I also worked on transcript-derived summaries whose state becomes stale when a transcript changes.

**Decisions and evidence.** The workflow records append-only lifecycle state, supports batch processing and retries, uses feature flags for controlled release, and sends notifications when work completes. Confidence signals and provider behavior inform evaluation instead of treating every model response as equally reliable.

**Outcome.** The system supports production transcription and conversation-intelligence workflows without tying the backend to one happy-path request.

**Limitations.** I cannot publish customer data, private evaluation sets, traffic volumes, or internal reliability measurements.

## Database cleanup and migration

**Problem.** A mature platform was carrying database structures and recurring writes whose current value needed to be established before removal.

**Constraints.** The analysis covered approximately 68 million records and dependencies across multiple systems. Removing data structures required careful sequencing, validation, and rollback safeguards.

**My contribution.** I traced dependencies, helped define the migration sequence, and verified the effect of removing 8 write triggers and 4 unused tables.

**Decisions and evidence.** The migration separated dependency analysis from removal, retained rollback options until validation passed, and measured database activity after the change.

**Outcome.** The cleanup eliminated approximately 1.8 million unnecessary writes per month. It reclaimed an estimated 50 to 100 GB on affected database instances and contributed to an estimated USD 600 to 1,200 in annual infrastructure savings.

**Limitations.** Storage and cost figures are estimates. This case study does not claim that an outage or a single defect caused the accumulated data.

## Virtual threads and event loops

**Technical investigation.** I built two small HTTP servers and a benchmark suite to compare virtual threads with an event-loop design. The article records the machine details, commands, results, and limits of the sample run.

Read [Virtual threads and event loops solve different problems](/posts/posts/java/100daysofjava/day99/) and inspect the [public benchmark repository](https://github.com/dhrubo55/virtual-thread-eventloop-test).

This is an educational implementation, not evidence that the benchmark architecture ran in production.

## Contact

- [Email](mailto:mohibulhassan100@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/mohibulhassan/)
- [Download the resume](/resume.pdf)
