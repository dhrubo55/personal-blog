+++
category = ["Java", "100DaysOfJava"]
date = 2021-09-08T00:00:00Z
description = "TemporalAdjuster ofDateAdjuster implementation and DayOfWeek calculating the next working day with Bangla name."
draft = false
showtoc = false
slug = "/java/100DaysOfJava/day23"
summary = "TemporalAdjuster ofDateAdjuster implementation and DayOfWeek calculating the next working day with Bangla name."
title = "Day 23: TemporalAdjuster ofDateAdjuster implementation and DayOfWeek calculating the next working day with Bangla name."
[cover]
alt = "Day23"
caption = "Day23"
image = ""
relative = false

+++

TemporalAdjuster ofDateAdjuster implementation and DayOfWeek calculating the next working day with Bangla name.

Transcribed from the original LinkedIn image post.

```java
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjuster;
import java.time.temporal.TemporalAdjusters;
import java.util.Locale;

class Day23 {
    public static void main(String[] args) {
        LocalDate today = LocalDate.now();
        LocalDate nextWorkingDay = today.with(Day23.nextWorkingDay);
        DayOfWeek namedDate = nextWorkingDay.getDayOfWeek();

        System.out.println(namedDate.getDisplayName(TextStyle.FULL, Locale.forLanguageTag("bn-BD")));
    }

    static TemporalAdjuster nextWorkingDay = TemporalAdjusters.ofDateAdjuster(localDate -> {
        DayOfWeek dayOfWeek = localDate.getDayOfWeek();

        int daysToAddToGetWorkingDay;
        int daysToOffsetForFriday = 2;
        int daysToOffsetForSaturday = 1;
        int daysToOffsetOtherDay = 1;

        if (dayOfWeek == DayOfWeek.FRIDAY)
            daysToAddToGetWorkingDay = daysToOffsetForFriday;
        else if (dayOfWeek == DayOfWeek.SATURDAY)
            daysToAddToGetWorkingDay = daysToOffsetForSaturday;
        else
            daysToAddToGetWorkingDay = daysToOffsetOtherDay;
        return localDate.plusDays(daysToAddToGetWorkingDay);
    });
}
```

The original LinkedIn graphic is preserved below.

![Day 23 LinkedIn post](/images/100daysofjava/linkedin/day23.png)

