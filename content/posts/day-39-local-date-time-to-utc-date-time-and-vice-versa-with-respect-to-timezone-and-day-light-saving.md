+++
category = []
date = 2022-01-21T00:00:00Z
description = "Converting LocalDateTime to UTC and vice versa with respect to timezone and Day Light saving time."
showtoc = false
slug = "/java/100DaysOfJava/day38"
summary = "Converting LocalDateTime to UTC and vice versa with respect to timezone and Day Light saving time."
title = "Day 39: Local date time to UTC date time and vice versa with respect to timezone and Day light saving"
[cover]
alt = "Day39"
caption = "Day39"
image = ""
relative = false

+++
I faced some issues while working with `LocalDateTime` and converting localdatetime to UTC and vice versa. Thats why created a method that takes `LocalDateTime` Object and converts it to UTC date time or UTC date time to local date time of the timzone thats the JVM is in.

```java
    public static ZoneOffset getTimeZoneOffset(LocalDateTime dateTime) {
        TimeZone zone = TimeZone.getDefault();
// translate DayOfWeek values to Calendar's
        int dayOfWeek;
        if (dateTime.getDayOfWeek().getValue() == 7) {
            dayOfWeek = 1;
        } else {
            dayOfWeek = dateTime.getDayOfWeek().getValue() + 1;
        }
// get the offset used in the timezone, at the specified date
//        int offset = zone.getOffset(1, now.getYear(), now.getMonthValue() - 1,
//                now.getDayOfMonth(), dayOfWeek, now.getNano() / 1000000);
        int offset = 0;

        if (zone.useDaylightTime()) {
            offset = zone.getDSTSavings();
        }
        offset = zone.getRawOffset();
        return ZoneOffset.ofTotalSeconds(offset / 1000);
    }
```

in this `getTimeZoneOffset()` using the `LocalDateTime` and `TimeZone.getDefault()` which in turns will get the default timezone from the jvm instance. `zone.getRawOffset()` of TimeZone class will return the raw offset.

> #### Raw Offset:
>
> Returns the amount of time in milliseconds to add to UTC to get standard time in this time zone. Because this value is not affected by daylight saving time, it is called raw offset.

> #### DST Savings:
>
> Returns the amount of time to be added to local standard time to get local wall clock time.
> The default implementation returns 3600000 milliseconds (i.e., one hour) if a call to 	`useDaylightTime()` returns true. Otherwise, 0 (zero) is returned.

Then using the `getTimeZoneOffset()` to calculate the local to UTC also UTC to local time.

```java
    public static LocalDateTime localToUTCViceVersa(
    LocalDateTime localDatTime, ZoneOffset offset, boolean switcher) {
        return  localDatTime
                // convert to timezone's offset (local -> UTC)
                // or convet to UTC (UTC -> local)
                .atOffset(switcher ? offset : ZoneOffset.UTC)
                // convert to UTC (local -> UTC)
                // or convert to TimeZone offset (UTC -> local)
                .withOffsetSameInstant(switcher ? ZoneOffset.UTC : offset)
                // get LocalDateTime
                .toLocalDateTime();
    }
```

> #### withOffsetSameInstant() :
>
> Returns a copy of this OffsetDateTime with the specified offset ensuring that the result is at the same instant.
> This method returns an object with the specified ZoneOffset and a LocalDateTime adjusted by the difference between the two offsets. This will result in the old and new objects representing the same instant. This is useful for finding the local time in a different offset. For example, if this time represents 2007-12-03T10:30+02:00 and the offset specified is +03:00, then this method will return 2007-12-03T11:30+03:00

in `localToUTCViceVersa()` which takes a LocalDateTime and ZoneOffset and a switcher to switch to local -> UTC or UTC -> local. which takes the offset and makes the `OffsetDateTime` and then using the `withOffsetSameInstant()` we get local date time in the local time zone or in UTC.