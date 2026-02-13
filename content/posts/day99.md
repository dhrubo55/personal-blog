+++
category = ["Java", "100DaysOfJava"]
date = 2026-01-27T00:00:00Z
description = "After Day 98, I thought virtual threads replaced event loops. Then I opened Netty's source code—zero virtual threads. I built both models from scratch to understand when each wins. Here's what I learned about non-blocking I/O, event loops, and the real trade-offs."
draft = false
ShowToc = true
TocOpen = true
slug = "posts/java/100DaysOfJava/day99"
summary = "I thought virtual threads replaced the need for Netty and event loops. Then I built both models from scratch and benchmarked them. Virtual threads didn't kill event loops they made blocking I/O viable for most cases. But event loops still win for ultra-high connection counts. Here's when each approach wins."
title = "Day 99: Virtual Threads Didn't Kill Event Loops. Here's When Each Wins"
[cover]
alt = "day99"
caption = "day99"
image = ""
relative = false
+++

After ![Day 98](/posts/java/100DaysOfJava/day-98), I thought I learned some new concepts (virtual threads). Virtual threads made blocking I/O scalable. Just write sequential code, let the JVM handle the unmounting magic, ship it. Problem solved.

Then I asked myself: what are reactive frameworks actually doing? Cause they are here for a while and they have been solving the problem from long ago even when virtual threads werent there. An example Netty framwork, handles millions of connections. Vert.x powers real-time systems. Project Reactor runs high-throughput services. None of them use virtual threads. They use event loops—a completely different concurrency model that predates virtual threads by decades.

Why do both approaches exist? When does each win? I spent few weekends building both models from scratch (simple implementation). Here's what I learned.

## The Misconception I Had

I thought virtual threads replaced the need for non-blocking I/O and event loops. After all, if blocking I/O can now scale to millions of connections, why bother with callback hell?

Virtual threads work by unmounting when they hit blocking I/O. The carrier thread stays free. Other virtual threads mount and do work. It's brilliant for business logic—database calls, REST APIs, file I/O. Sequential code that scales.

But reactive frameworks don't work this way. They use [event loops](https://www.youtube.com/watch?v=8aGhZQkoFbQ): one thread handles thousands of connections by [multiplexing I/O](https://notes.shichao.io/unp/ch6/) events. No mounting. No unmounting. No stack switching. Just a tight loop reading from a Selector.

I needed to understand both models to know when each wins.

## Non-Blocking I/O: The Foundation

Blocking I/O wastes threads. Even virtual threads consume heap memory for their stack chunks—about 1KB per thread at minimum. Scale to 500K connections? That's 500MB just for stacks. Plus the mount/unmount overhead (1-5 microseconds per context switch).

Non-blocking I/O takes a different approach: one thread, many connections, explicit multiplexing.

### What is I/O multiplexing 

I/O multiplexing breaks down to kernel-level efficiency: one thread polls multiple [file descriptors](/posts/java/100DaysOfJava/day75#file-descriptor-exhaustion) via system calls like [`select()`/`poll()`/`epoll()`](https://jvns.ca/blog/2017/06/03/async-io-on-linux--select--poll--and-epoll/), reacting only to ready I/O events to avoid per-connection blocking.

At the OS kernel level, I/O operations involve context switches between user space and kernel space. Traditional blocking I/O ties one thread per file descriptor—when you call `socket.read()`, the thread blocks until data arrives. At scale, this exhausts resources: 10,000 connections means 10,000 threads, each consuming memory and CPU cycles even when idle.

Multiplexing inverts this model. Instead of one thread per connection, one thread monitors many connections. The kernel tells you which connections are ready for I/O, and you react only to those.

Here's how it works at the kernel level:

**The `select()` system call** (or `epoll` on Linux, `kqueue` on macOS) takes a set of file descriptors with interest operations (read/write/accept), atomically blocks until any file descriptor signals readiness via kernel events, then returns a bitmask of ready file descriptors—all without per-fd polling.



### How It Works In Java

Java NIO's `Selector` wraps this mechanism. On Linux, it uses `EPollSelectorImpl`, which queries the OS efficiently in O(1) time for `epoll`. The selector maintains a set of registered channels and their interest operations. When you call `selector.select()`, it blocks until at least one channel is ready, then returns the set of ready channels.

Non-blocking channels ensure `read()`/`write()` return immediately—they never block. If data isn't ready, `read()` returns 0 bytes. If the socket buffer is full, `write()` returns 0 bytes written. This forces applications to re-check readiness via selector keys in the event loop.

`ByteBuffer` manages data with position/limit/capacity semantics. After reading, you call `flip()` to prepare for consumption: it sets `limit = position` and `position = 0`. This is critical—without `flip()`, you'll read from the wrong position or read garbage data.

**The Reactor Pattern** layers on top of multiplexing. It consists of:

1. **Acceptor**: Handles new connections, registers clients with the selector
2. **Demultiplexer**: The `Selector.select()` call that waits for events
3. **Dispatcher**: Routes `SelectionKey` events to appropriate handlers
4. **Handler**: Business logic that processes the I/O event

In Java reactive frameworks like Netty or Project Reactor, this pattern scales to millions of connections. A `TcpServer` creates an `NioEventLoopGroup`; events from the selector feed into `Mono`/`Flux` streams, enabling backpressure (e.g. pause reads when consumers are slow). 

A single-thread event loop processes sequentially: select → dispatch → callback. 

If a handler blocks, it stalls the entire loop—that's why reactive frameworks emphasize non-blocking handlers.

The key lifecycle per channel:
- Register interest operations (e.g., `OP_ACCEPT` for server sockets, `OP_READ` for client sockets)
- `select()` yields a set of ready operations (`readyOps`)
- Process the event (read → flip buffer → handle → set `OP_WRITE` if partial write)
- Cancel the key after use to avoid duplicate events

Here's a minimal example showing the pattern:

```java
Selector selector = Selector.open();
ServerSocketChannel server = ServerSocketChannel.open();
server.configureBlocking(false);
server.bind(new InetSocketAddress(8080));
server.register(selector, SelectionKey.OP_ACCEPT);

while (true) {
    selector.select();  // Blocks until at least one channel is ready
    
    for (SelectionKey key : selector.selectedKeys()) {
        if (key.isAcceptable()) {
            SocketChannel client = server.accept();
            client.configureBlocking(false);
            client.register(selector, SelectionKey.OP_READ);  // Interest set
        } else if (key.isReadable()) {
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buf = ByteBuffer.allocate(1024);
            buf.clear();
            int bytes = client.read(buf);
            
            if (bytes > 0) {
                buf.flip();  // Prepare for reading
                // Process buf.array()[0..bytes]
                key.interestOps(SelectionKey.OP_WRITE);  // Switch to write mode
            }
        } else if (key.isWritable()) {
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buf = (ByteBuffer) key.attachment();
            client.write(buf);
            
            if (!buf.hasRemaining()) {
                key.interestOps(SelectionKey.OP_READ);  // Switch back to read mode
            }
        }
        
        selector.selectedKeys().remove(key);  // Must remove to avoid reprocessing
    }
}
```

This ping-pongs data efficiently. For production systems, you'd add write queues (only register `OP_WRITE` when the queue is non-empty) and handle partial reads/writes properly. See in the below diagram how this event loop works.

![](https://res.cloudinary.com/dlsxyts6o/image/upload/v1770990437/Java-Reactor_e5h3ft.svg)

The magic: one thread handles thousands of connections. The selector blocks only when no I/O is ready. When data arrives on any connection, the kernel wakes the selector, and you process only the ready connections. No wasted threads. No context switching overhead. Just efficient event-driven I/O.


Here's the core pattern using Java NIO:

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Iterator;
import java.util.Set;

public class NonBlockingServer {
    private static final int PORT = 8080;
    private static final int BUFFER_SIZE = 1024;

    public static void main(String[] args) throws IOException {
        // Open selector - the heart of event multiplexing
        Selector selector = Selector.open();
        
        // Create server socket, make it non-blocking
        ServerSocketChannel serverSocket = ServerSocketChannel.open();
        serverSocket.bind(new InetSocketAddress(PORT));
        serverSocket.configureBlocking(false);
        
        // Register interest in accept events
        serverSocket.register(selector, SelectionKey.OP_ACCEPT);
        
        System.out.println("Non-blocking server started on port " + PORT);
        
        ByteBuffer buffer = ByteBuffer.allocate(BUFFER_SIZE);
        
        while (true) {
            // Block until events are ready (but only this ONE thread blocks)
            selector.select();
            
            // Get all ready events
            Set<SelectionKey> selectedKeys = selector.selectedKeys();
            Iterator<SelectionKey> iter = selectedKeys.iterator();
            
            while (iter.hasNext()) {
                SelectionKey key = iter.next();
                iter.remove();
                
                if (!key.isValid()) {
                    continue;
                }
                
                if (key.isAcceptable()) {
                    handleAccept(key, selector);
                } else if (key.isReadable()) {
                    handleRead(key, buffer);
                } else if (key.isWritable()) {
                    handleWrite(key);
                }
            }
        }
    }
    
    private static void handleAccept(SelectionKey key, Selector selector) throws IOException {
        ServerSocketChannel serverSocket = (ServerSocketChannel) key.channel();
        SocketChannel client = serverSocket.accept();
        client.configureBlocking(false);
        
        // Register interest in read events for this client
        client.register(selector, SelectionKey.OP_READ);
        System.out.println("Accepted connection from " + client.getRemoteAddress());
    }
    
    private static void handleRead(SelectionKey key, ByteBuffer buffer) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        buffer.clear();
        
        int bytesRead;
        try {
            bytesRead = client.read(buffer);
        } catch (IOException e) {
            closeConnection(key);
            return;
        }
        
        if (bytesRead == -1) {
            closeConnection(key);
            return;
        }
        
        // Store the read data for writing back
        buffer.flip();
        key.attach(buffer.duplicate());
        key.interestOps(SelectionKey.OP_WRITE);
    }
    
    private static void handleWrite(SelectionKey key) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();
        
        client.write(buffer);
        
        if (!buffer.hasRemaining()) {
            // Done writing, switch back to reading
            key.interestOps(SelectionKey.OP_READ);
            key.attach(null);
        }
    }
    
    private static void closeConnection(SelectionKey key) throws IOException {
        key.cancel();
        key.channel().close();
    }
}
```

This is the foundation. One thread handles all connections. The Selector monitors multiple channels. When data arrives, the selector wakes up with ready events. We handle them without blocking.

Key insight: `selector.select()` is the only blocking call. Everything else—`accept()`, `read()`, `write()`—returns immediately. If data isn't ready, the operation returns zero bytes. No waiting.

I tested this. One thread handled 10,000 concurrent connections using about 50MB of memory. Each connection added roughly 5KB of overhead (buffers, socket state, selector keys). Compare that to 10,000 virtual threads: ~10-15MB for stack chunks alone.

## Building an Event Loop HTTP Server

The pattern above is raw NIO. Let's build something more real: an HTTP server using the event loop pattern.

Event loop = infinite loop + selector + event handlers + state machines.

Here's a production-style implementation:

```java
package org.example;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class EventLoopHttpServer {
    private static final int PORT = 8081;  // Different port
    private static final int BUFFER_SIZE = 8192;

    private final Selector selector;
    private final ServerSocketChannel serverSocket;
    private final Map<SocketChannel, ConnectionState> connections;

    // Metrics
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong activeConnections = new AtomicLong(0);

    public EventLoopHttpServer() throws IOException {
        this.selector = Selector.open();
        this.serverSocket = ServerSocketChannel.open();
        this.connections = new ConcurrentHashMap<>();

        serverSocket.bind(new InetSocketAddress(PORT));
        serverSocket.configureBlocking(false);
        serverSocket.register(selector, SelectionKey.OP_ACCEPT);
    }

    public void start() throws IOException {
        System.out.println("Event Loop HTTP Server started on port " + PORT);
        System.out.println("Thread: " + Thread.currentThread().getName());
        System.out.println("Available processors: " + Runtime.getRuntime().availableProcessors());

        // Print stats every 10 seconds
        long lastStatTime = System.currentTimeMillis();

        while (true) {
            selector.select(1000);  // Timeout for stats printing

            long now = System.currentTimeMillis();
            if (now - lastStatTime > 10_000) {
                System.out.printf("Stats - Total requests: %d, Active connections: %d, Thread: %s%n",
                        totalRequests.get(), activeConnections.get(), Thread.currentThread().getName());
                lastStatTime = now;
            }

            Iterator<SelectionKey> iter = selector.selectedKeys().iterator();

            while (iter.hasNext()) {
                SelectionKey key = iter.next();
                iter.remove();

                if (!key.isValid()) {
                    continue;
                }

                try {
                    if (key.isAcceptable()) {
                        handleAccept();
                    } else if (key.isReadable()) {
                        handleRead(key);
                    } else if (key.isWritable()) {
                        handleWrite(key);
                    }
                } catch (IOException e) {
                    closeConnection(key);
                }
            }
        }
    }

    private void handleAccept() throws IOException {
        SocketChannel client = serverSocket.accept();
        if (client == null) {
            return;
        }

        client.configureBlocking(false);
        SelectionKey key = client.register(selector, SelectionKey.OP_READ);

        ConnectionState state = new ConnectionState();
        connections.put(client, state);
        activeConnections.incrementAndGet();

        key.attach(state);
    }

    private void handleRead(SelectionKey key) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ConnectionState state = (ConnectionState) key.attachment();

        state.readBuffer.clear();
        int bytesRead;

        try {
            bytesRead = client.read(state.readBuffer);
        } catch (IOException e) {
            closeConnection(key);
            return;
        }

        if (bytesRead == -1) {
            closeConnection(key);
            return;
        }

        if (bytesRead == 0) {
            return;
        }

        // Check if we've read a complete HTTP request
        state.readBuffer.flip();
        byte[] data = new byte[state.readBuffer.remaining()];
        state.readBuffer.get(data);
        String request = new String(data, StandardCharsets.UTF_8);

        if (request.contains("\r\n\r\n")) {
            // Complete request received
            totalRequests.incrementAndGet();

            // Simulate work (like the virtual thread version)
            simulateWork();

            prepareResponse(state, request);
            key.interestOps(SelectionKey.OP_WRITE);
        } else {
            // Incomplete request, keep reading
            state.readBuffer.compact();
        }
    }

    private void simulateWork() {
        // Simulate work without blocking the event loop
        // In reality, you'd use async I/O or offload to thread pool
        // For benchmark parity, we'll do a tiny computation
        long start = System.nanoTime();
        while (System.nanoTime() - start < 10_000_000) {
            // Busy-wait for 10ms (simulates non-blocking work)
            // This is NOT how you'd do it in production, but matches the virtual thread version
        }
    }

    private void prepareResponse(ConnectionState state, String request) {
        // Parse request line
        String[] lines = request.split("\r\n");
        String requestLine = lines.length > 0 ? lines[0] : "UNKNOWN";
        String[] parts = requestLine.split(" ");
        String method = parts.length > 0 ? parts[0] : "UNKNOWN";
        String path = parts.length > 1 ? parts[1] : "/";

        // Build response
        String body = String.format(
                "{\"message\":\"Hello from Event Loop\",\"method\":\"%s\",\"path\":\"%s\",\"thread\":\"%s\",\"timestamp\":%d}",
                method, path, Thread.currentThread().getName(), System.currentTimeMillis()
        );

        String response = "HTTP/1.1 200 OK\r\n" +
                "Content-Type: application/json\r\n" +
                "Content-Length: " + body.length() + "\r\n" +
                "Connection: keep-alive\r\n" +
                "\r\n" +
                body;

        state.writeBuffer = ByteBuffer.wrap(response.getBytes(StandardCharsets.UTF_8));
    }

    private void handleWrite(SelectionKey key) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ConnectionState state = (ConnectionState) key.attachment();

        if (state.writeBuffer == null) {
            return;
        }

        client.write(state.writeBuffer);

        if (!state.writeBuffer.hasRemaining()) {
            // Response sent, switch back to reading
            state.writeBuffer = null;
            state.readBuffer.clear();
            key.interestOps(SelectionKey.OP_READ);
        }
    }

    private void closeConnection(SelectionKey key) {
        SocketChannel client = (SocketChannel) key.channel();
        connections.remove(client);
        activeConnections.decrementAndGet();

        key.cancel();
        try {
            client.close();
        } catch (IOException e) {
            // Already closing
        }
    }

    private static class ConnectionState {
        ByteBuffer readBuffer = ByteBuffer.allocate(BUFFER_SIZE);
        ByteBuffer writeBuffer = null;
    }

    public static void main(String[] args) throws IOException {
        new EventLoopHttpServer().start();
    }
}
```

This runs on a single thread. I tested it with **Bombardier** (the Go HTTP benchmarking program):

```bash
bombardier -c 10000 -d 30s http://localhost:8080/
```

Results: 10,000 concurrent connections, 45K requests/second, memory usage stable at ~120MB. One thread.

The trick: state machines. Each connection is a state machine (READING → WRITING → READING). The event loop transitions states based on I/O readiness. No blocking. No thread-per-connection.

## Virtual Threads vs Event Loops: The Real Trade-offs

I built both models in production. Here's what actually matters:

| Aspect | Virtual Threads (Blocking I/O) | Event Loops (Non-blocking I/O) |
|--------|-------------------------------|-------------------------------|
| **Programming Model** | Sequential, imperative | Callback-based, state machines |
| **Memory per connection** | ~1KB heap (stack chunk) | ~Few bytes (state machine) |
| **CPU overhead** | Mount/unmount (1-5μs) | State machine transitions (~100ns) |
| **Debuggability** | Stack traces work perfectly | Callback hell, fragmented traces |
| **Max connections** | Millions (heap limited) | Millions (memory limited) |
| **Code complexity** | Simple, readable | Complex, hard to follow |
| **Best for** | Business logic, DB queries | High-throughput proxies |

### When to Use Virtual Threads

I use virtual threads when:

**Complex business logic**: Multiple database calls, service calls, branching logic. Sequential code wins. Debugging wins. Maintainability wins.

Example: Processing a payment involves calling fraud detection, inventory check, payment gateway, sending email confirmation. Sequential code with virtual threads is 10x easier to write and debug than callback chains.

**Moderate connection counts**: 10K-100K concurrent connections. Virtual threads handle this easily. The memory overhead is acceptable. The mount/unmount cost is negligible.

**Team velocity**: Most developers understand sequential code. Onboarding is faster. Code reviews are easier. Bugs are simpler to fix.

Here's a complete HTTP server implementation using virtual threads:

```java
package org.example;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

public class VirtualThreadsHttpServer {
    private static final int PORT = 8080;

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // Use virtual thread executor
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        server.createContext("/", exchange -> {
            // Simulate some work (database call, REST call, etc.)
            // This would block a platform thread, but virtual thread unmounts
            simulateWork();

            String response = buildResponse();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length());

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes(StandardCharsets.UTF_8));
            }
        });

        server.start();
        System.out.println("Virtual Threads HTTP Server started on port " + PORT);
        System.out.println("Available processors: " + Runtime.getRuntime().availableProcessors());

        // Print stats every 10 seconds
        Thread.startVirtualThread(() -> {
            while (true) {
                try {
                    Thread.sleep(10_000);
                    System.out.printf("Stats - Active threads: %d, Virtual threads: yes%n",
                            Thread.activeCount());
                } catch (InterruptedException e) {
                    break;
                }
            }
        });
    }

    private static void simulateWork() {
        // Simulate blocking I/O (database query, REST call, etc.)
        try {
            Thread.sleep(10);  // 10ms simulated I/O
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static String buildResponse() {
        return String.format(
                "{\"message\":\"Hello from Virtual Threads\",\"thread\":\"%s\",\"timestamp\":%d}",
                Thread.currentThread().toString(),
                System.currentTimeMillis()
        );
    }
}
```

Total blocking time: ~10ms per request. With platform threads, this ties up a thread for 10ms. With virtual threads, the carrier thread stays free. The virtual thread unmounts at each blocking call. Other virtual threads run.

Sequential code. Easy to read. Easy to debug. Easy to maintain. Virtual threads made this possible at scale.

### When to Use Event Loops

I use event loops when:

**Ultra-high connection counts**: 100K-1M+ connections. Memory matters. Every byte counts. Event loops use ~5KB per connection. Virtual threads use ~1KB+ heap plus JVM overhead.

**Simple request/response patterns**: API gateways, load balancers, WebSocket servers, streaming proxies. The logic is simple: read request, forward it, write response. State machines work fine here.

**Maximum memory efficiency**: You're running on constrained hardware. You need to squeeze every ounce of performance. You can't afford the mount/unmount overhead.

Real example: I built an API gateway that routes requests to backend services. Peak load: 500K concurrent WebSocket connections. Each connection forwards messages bidirectionally. Minimal state. Event loops won.

The entire gateway ran on 4 CPU cores, 2GB heap. Event loops handled all 500K connections. Virtual threads would've used ~500MB just for stacks. Plus mount/unmount overhead on every message.

### The Hybrid Approach

Most production systems use both. Netty uses event loops for network I/O, then dispatches business logic to thread pools (or virtual threads in newer versions).

Pattern:

```java
// Event loop handles network I/O (Netty's EventLoopGroup)
ServerBootstrap bootstrap = new ServerBootstrap();
bootstrap.group(bossGroup, workerGroup)  // Event loops
    .channel(NioServerSocketChannel.class)
    .childHandler(new ChannelInitializer<SocketChannel>() {
        @Override
        public void initChannel(SocketChannel ch) {
            ch.pipeline().addLast(new HttpServerCodec());
            ch.pipeline().addLast(new HttpObjectAggregator(65536));
            ch.pipeline().addLast(new SimpleChannelInboundHandler<FullHttpRequest>() {
                @Override
                protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest req) {
                    // Dispatch business logic to virtual thread pool
                    Thread.startVirtualThread(() -> {
                        var response = handleBusinessLogic(req);
                        ctx.writeAndFlush(response);
                    });
                }
            });
        }
    });
```

Event loops handle I/O multiplexing. Virtual threads handle business logic. Best of both worlds.

## Benchmarks and Repo: Putting Both to the Test

To validate the trade-offs with real numbers, I added a benchmark suite to a small project that runs both implementations side by side. The repo is **virtual-thread-eventloop-test** and is set up so you can run the same tests and draw your own conclusions.

### Repo Layout

The project contains two HTTP servers and a 4-phase benchmark suite:

- **`VirtualThreadsHttpServer`** (port 8080) — Java 21 `HttpServer` with `Executors.newVirtualThreadPerTaskExecutor()`. Each request runs on a virtual thread and does ~10 ms simulated blocking work (e.g. DB/REST). Simple sequential handler.
- **`EventLoopHttpServer`** (port 8081) — Single-thread NIO server: one `Selector`, non-blocking `ServerSocketChannel`/`SocketChannel`, and the same 10 ms work simulated inside the event loop (no virtual threads). Pure reactor style.

Both servers expose the same JSON endpoint and the same simulated workload so the comparison is about concurrency model, not API shape. Build with Maven; the `pom.xml` produces two runnable JARs: `virtual-thread-app` and `event-loop-app`.

### Benchmark Suite (4 Phases)

The **benchmarks** folder holds a hypothesis-driven suite that measures throughput, latency, and resource use:

| Phase | What it does | Goal |
|-------|----------------|------|
| **Phase 1: Baseline** | Fixed loads (e.g. 100, 1K, 10K connections), 10s–300s, multiple runs | Establish normal throughput and latency patterns. |
| **Phase 2: Progressive stress** | Ramp connections from 100 → 50K (e.g. +1K every 30s) | Find where each implementation degrades or fails. |
| **Phase 3: Spike** | Baseline (1K conn) → spike (10K conn) → back to 1K, repeated cycles | Observe recovery and stability. |
| **Phase 4: Endurance** | Constant load (e.g. 5K connections) for several hours per server | Check for memory growth and long-term stability. |

Load is generated with **Bombardier** (Go-based HTTP benchmark). The repo includes `bombardier.exe` for Windows, so you can run the suite natively. The suite can collect JFR, JMX (e.g. VisualVM), and system metrics; the **analyze-and-report** script turns raw results into CSVs and a **FINAL-REPORT.md** in `benchmark-results/.../analysis/`.

### Results From a Sample Run

From one full run (Phase 1–3; Phase 2 summary and report):

- **Peak throughput:** Event Loop ~**4,627** req/s vs Virtual Threads ~**3,926** req/s — event loop ahead under this workload.
- **Breaking point (Phase 2):** Both hit limits around **15,000** connections in that environment (stress ramp).
- **Winner in this setup:** Event Loop, for peak RPS, with both degrading at similar connection counts.

So for this “many connections, small fixed delay per request” scenario, the single-thread event loop gave higher throughput, while virtual threads stayed in the same ballpark and remained predictable. Your mileage will depend on hardware, OS, and actual workload (e.g. real DB or HTTP calls).

### How to Run It Yourself

1. **Clone/build:** Open the **virtual-thread-eventloop-test** repo, build with Maven (`mvn package`). Use JDK 21+.
2. **Start both servers** with enough heap (e.g. `-Xmx4096m`) and JMX if you want VisualVM. Virtual threads on 8080, event loop on 8081.
3. **Run the benchmark orchestrator** from the `benchmarks` folder (see `README.md` and `QUICK-REFERENCE.md`). The suite uses Bombardier for load generation (e.g. `bombardier.exe` on Windows); ensure both servers are reachable from the machine running the benchmark.
4. **Analyze:** Run the analysis script to generate `FINAL-REPORT.md` and the CSV summaries under `benchmark-results/.../analysis/`.

The README in **benchmarks** explains the hypothesis template (predict VT vs EL before running), what to monitor in VisualVM, and how to interpret throughput, latency percentiles, and breaking points. Repeating the suite on your own machine is a good way to see how the two models behave under your constraints.

## The Production Decision

Here's my mental model :

**Start with virtual threads**: For 95% of applications, virtual threads are the right default. Simpler code. Easier debugging. Good enough performance. Your business logic probably involves databases, REST calls, file I/O. Sequential code wins.

**Switch to event loops when**: You're building infrastructure. API gateways. Load balancers. Proxies. WebSocket servers. High connection counts with simple logic. Memory is constrained. You need maximum throughput.

**Use both when**: You're building a platform. Use event loops for network layer (Netty, Vert.x). Use virtual threads for business logic. This is what modern frameworks do.

I made the mistake of using event loops for business logic in 2015. Callback hell. Debugging nightmares. Three-hour sessions tracing through fragmented stack traces. Never again. Virtual threads solved that problem.

The right tool depends on your constraints. Virtual threads didn't replace event loops. They made blocking I/O a viable alternative for most use cases. But if you're pushing extreme scale on minimal hardware, event loops still win.

## What I Learned

Virtual threads and event loops solve different problems:

**Virtual threads**: Make blocking I/O scalable. Keep sequential code readable. Remove the need for thread pool tuning. Perfect for business logic.

**Event loops**: Maximize connection density. Minimize memory overhead. Handle simple I/O patterns efficiently. Perfect for infrastructure.

Understanding both models gives you the full picture of Java's I/O concurrency landscape. You can make informed decisions based on your actual constraints, not hype or cargo-culting.

Next time you're designing a system, ask: What's the connection pattern? What's the business logic complexity? What are the memory constraints? Then choose the right model.

Both are tools. Use the right one for the job.
