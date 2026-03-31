+++
category = ["Java", "100DaysOfJava"]
date = 2021-08-31T00:00:00Z
description = "Optional.ifPresent and Optional.filter to log and filter the Scheduled Day according to holiday"
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day21"
summary = "Optional.ifPresent and Optional.filter to log and filter the Scheduled Day according to holiday"
topics = ["Language & APIs"]
title = "Day 21: Optional.ifPresent and Optional.filter to log and filter the Scheduled Day according to holiday"
[cover]
alt = "Day21"
caption = "Day21"
image = ""
relative = false

+++

Optional.ifPresent and Optional.filter to log and filter the Scheduled Day according to holiday

Transcribed from the original LinkedIn image post.

```java
import java.time.LocalDate;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class Day21 {
    public static void main(String[] args) throws Exception {
        Logger logger = LoggerFactory.getLogger(Day21.class);
        Optional<LocalDate> scheduleDay = ScheduleService.getAvailableScheduleDay();
        scheduleDay.ifPresent(localDate -> logger.info("Available Schedule day is {}", localDate));

        LocalDate scheduleDateToString = scheduleDay
            .filter(HolidayDateService::checkHoliday)
            .orElseThrow(() -> new NoHolidayException("No available Sync Time. Reschedule"));
    }
}
```

The original LinkedIn graphic is preserved below.

[![Day 21 LinkedIn post](/images/100daysofjava/linkedin/day21.png)](https://www.linkedin.com/feed/update/urn:li:share:6838479434283147264/)


