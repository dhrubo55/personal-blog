+++
category = []
date = 2022-02-03T00:00:00Z
description = "Distributed unique id's generator based on device MAC address and epoch time and supplier"
showtoc = false
slug = "/java/100DaysOfJava/day41"
summary = "Generating unique id's based on device MAC address and epoch time"
title = "Day 41: Generating unique id's based on device MAC address and epoch time"
[cover]
alt = "Day41"
caption = "Day41"
image = ""
relative = false

+++
Generating unique id's based on device MAC address and default timezone epoch time of given or a default time. These id's can be generated in multiple machines as device mac address is used to create the id.

64 bit Id format is  
**Epoch Time** - (**41 bits**) is used of epoch time and added to the id creation process. Max timestamp that can be represented is 2^41

**Machine Id** - (**10 bits**) machine id is calculated from MAC address and as 10 bits considered so max machines allowed will be 2^10

**Local counter per machine**: **sequence bits** (**12 bits**) are a local counter for each machines. Max value would be 2 ^ 12.

The one remaining sign bit is remained and its set to 0

`CustomUIDSupplier` class is a `Supplier<Long>` that provides the long id's.

```java
class CustomUIDSupplier implements Supplier<Long> {
        private static final int MACHINE_MAC_ID_BITS = 10;
        private static final int SEQUENCE_BITS = 12;

        private static final int maxMachineID 
        = (int)(Math.pow(2, MACHINE_MAC_ID_BITS) - 1);
        private static final int maxSequence 
        = (int)(Math.pow(2, SEQUENCE_BITS) - 1);

        private static final long CUSTOM_EPOCH =
                LocalDateTime
                .parse("2012-01-01T00:00:00", DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                .atZone(ZoneId.systemDefault())
                .toInstant()
				.toEpochMilli();

        private final int machineMacId;

        private volatile long lastTimestamp = -1L;
        private volatile long sequence = 0L;

        public CustomUIDSupplier(int machineMacId) {
            if(machineMacId < 0 || machineMacId > maxMachineID) {
                throw new IllegalArgumentException(String.format("NodeId must be between %d and %d", 0, maxMachineID));
            }
            this.machineMacId = machineMacId;
        }

        public CustomUIDSupplier() {
            this.machineMacId = createNodeId();
        }

        // Get current timestamp in milliseconds, adjust for the custom epoch.
        private static long timestamp(long customEpoch) {
            long epochInThisMoment = Instant.now().toEpochMilli();
            if (customEpoch != 0)
                return  epochInThisMoment - customEpoch;
            else
                return epochInThisMoment;
        }

        // Block and wait till next millisecond
        private long waitNextMillis(long currentTimestamp) {
            while (currentTimestamp == lastTimestamp) {
                currentTimestamp = timestamp(CUSTOM_EPOCH);
            }
            return currentTimestamp;
        }

        private int createNodeId() {
            int machineMacId;
            try {
                StringBuilder sb = new StringBuilder();
                Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
                while (networkInterfaces.hasMoreElements()) {
                    NetworkInterface networkInterface = networkInterfaces.nextElement();
                    byte[] mac = networkInterface.getHardwareAddress();
                    if (mac != null) {
                        for(int i = 0; i < mac.length; i++) {
                            sb.append(String.format("%02X", mac[i]));
                        }
                    }
                }
                machineMacId = sb.toString().hashCode();
            } catch (Exception ex) {
                machineMacId = (new SecureRandom().nextInt());
            }
            machineMacId = machineMacId & maxMachineID;
            return machineMacId;
        }


        @Override
        public Long get() {
            return nextId();
        }

        public synchronized long nextId() {
            long currentTimestamp = timestamp(CUSTOM_EPOCH);

            if(currentTimestamp < lastTimestamp) {
                throw new IllegalStateException("Invalid TimeStamp!");
            }

            if (currentTimestamp == lastTimestamp) {
                sequence = (sequence + 1) & maxSequence;
                if(sequence == 0) {
                    // Sequence Exhausted, wait till next millisecond.
                    currentTimestamp = waitNextMillis(currentTimestamp);
                }
            } else {
                // reset sequence to start with zero for the next millisecond
                sequence = 0;
            }

            lastTimestamp = currentTimestamp;

            long id = currentTimestamp << (MACHINE_MAC_ID_BITS + SEQUENCE_BITS);
            id |= ((long) machineMacId << SEQUENCE_BITS);
            id |= sequence;
            return id;
        }
    }
```

In `CustomerUIDSupplier` class custom epoch is passed or calculated along with machine id that can also be passed in the constructor. `SecureRandom` is used in case the machine id can not be calculated.

`nextId()` which in turn is called inside `get()` of the supplier is calculated based on the sequence and timestamps and machine's mac based id

```java
class Day41 {
    public static void main(String[] args) {
        CustomUIDSupplier customUIDSupplier = new CustomUIDSupplier();
        Stream<Long> longStream = Stream.generate(customUIDSupplier);
        longStream.limit(10).forEach(System.out::println);
   }
}
```

in the `main()` a stream is generated from supplier that will in turn provide the unique id's and then 10 of the id's are taken and printed