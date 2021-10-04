+++
category = []
date = 2021-09-30T00:00:00Z
description = "Writing a method to retry another method execution, Using TimerTask's schedule() and scheduleAtFixedRate to check availability "
showtoc = false
slug = "/java/100DaysOfJava/day26"
summary = "Writing a method to retry another method execution, using TimerTask's schedule() and scheduleAtFixedRate to check availability"
title = "Day 26: Writing a method to retry another method execution"
[cover]
alt = "cover image"
caption = "cover images"
image = ""
relative = false

+++
Writing a method which can take another method and run that and if needed
retry that execution given number of times. Using Runnable and scheduleAtFixedRate()
from timer class.

> 
>
> TimerTask along with Timer class can schedule tasks using background thread.
> Timer has two type of scheduling option
>
> * schedule (Fixed delayed execution)
> * scheduleAtFixedRate (Fixed rate execution)
>
> ###### Fixed Delay Execution:
>
> Execution after the first execution does not depend on the start time of the execution rather than the completion of the first execution then it starts the second execution
>
> ###### Fixed Rate Execution:
>
> Execution after the first execution does depend on the start time of the execution. Second and execution afterwards
```
	class Scratch {
    
        public static void main(String[] args) {
            retryMethod(() -> uptimeCheck("https://twitter.com"), 3, 5000L);
        }
    
        public static void retryMethod(Runnable function, int retryCount, long retryInterval) {
            Timer timer = new Timer();
            timer.scheduleAtFixedRate(new TimerTask() {
                int count = 0;
    
                @Override
                public void run() {
                    count++;
                    if (count == retryCount) {
                        timer.cancel();
                    }
                    try {
                        function.run();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }, 0, retryInterval);
        }
    
        public static void uptimeCheck(String url) {
            HttpClient httpClient = HttpClient.newHttpClient();
            int statusCode = 0;
            HttpRequest httpRequest = HttpRequest
                    .newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();
            try {
                statusCode = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString()).statusCode();
            } catch (IOException | InterruptedException e) {
                e.printStackTrace();
            }
    
            if (statusCode == 200)
                System.out.println(url + " is up and status: " + statusCode);
            else
                System.out.println(url + " is down and status: " + statusCode);
        }
    }
```
Here retryMethod is a method that takes a runnable and interval time and retry count to run the runnable using TimerTask and Timer's scheduleAtFixedRate.