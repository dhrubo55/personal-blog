+++
category = []
date = 2022-10-23T00:00:00Z
description = "Mocking void methods using ArgumentCapture and Answering"
draft = true
showtoc = false
slug = "/java/100daysofjava/day58"
summary = "Mocking void methods using ArgumentCapture and Answering"
title = "Day 58: Mocking void methods using ArgumentCapture and Answering"
[cover]
alt = "day58"
caption = "day58"
image = ""
relative = false

+++
When unit testing any java class which have void methods inside it and also needed to be mocked. Then we mock them in 4 ways using mockito's mocking method's and they are -

1. doNothing() & ArgumentCapture
2. doThrow()
3. doAnswer()
4. doCallRealMethod()

### doNothing() :

when using doNothing() as its name suggest it does nothing. So when verifying we need to verify if the method is called or not.

```java
  void add(Number a, Number b) {
        if (a instanceof Integer && b instanceof  Integer) {
            addInt(a.intValue(), b.intValue());
        } else if (a instanceof Double && b instanceof Double) {
            addDouble(a.doubleValue(), b.doubleValue());
        }
    }
```

if this add() method is tested with doNothing() it will just invoke it and then verify whether it was invoked or not. So the test would be

```java
@Test
public void whenAddCalledVerified() {
    Scratch scratch = mock(Scratch.class);
    doNothing().when(scratch).add(anyInt(), anyInt());
 
    verify(scratch, times(1)).add(1, 1);
}
```

### doNothing() + ArgumentCaptor :

So before going into how this helps mocking void method. Let us learn about what is `ArgumentCaptor`

#### ArugmentCaptor

ArgumentCaptor allows us to capture an argument passed to a method to inspect it. This is useful when we can't access the argument outside of the method we'd like to test.

To see it in action first we need to setup a method and test.

```java

public class BookService {

    private final BookMeta bookMeta;
    
    @Override
    public void printBook(long id, Book book) {
        BookMeta meta = getBookMetaInfoById(id);
        meta.addBookMetaInfo(book);
        System.out.println(book.toString());
    }
```

So now to test this printBook method we need to setup a test

```java
@RunWith(MockitoJUnitRunner.class)
public class BookTest {
	String bookTitle = "Kill It With Fire"
    @Mock
    BookMeta bookMeta;

    @InjectMocks
    BookService bookService;
    
    @Captor
	ArgumentCaptor<Book> bookCap;
    
    bookService.printBook(1, new Book(bookTitle));
  
    Mockito.verify(bookMeta).addBookMetaInfo(bookCap.capture());
    Book capturedBook = bookCap.getValue();
    assertEquals(capturedBook.getTitle(), bookTitle);
}
```

in this code we can see there is an implementation of a `BookService`. In that a method is implemented named `findBookById` which uses another 2 services named `BookEntityService` and `BookMetaEntityService` each provides some book and some related information.

we define an `ArgumentCaptor<Book>` with annotation `@Captor`. then we capture it while verifying the call `addBookMetaInfo` call and then verify the value with assertion.

**This use case is well suited when the arguments is manipulated in the void method we are mocking.**

### doThrow():

This method can help to verify if a method throws any exception and based on that we can test some execution path.

In the `add()` method we can check for addition overflow and throw a exception so that we can verify the execution path.

```java
@Test(expected = Exception.class)
public void givenNull_addThrowsException() {
    Scratch scratch = mock(Scratch.class);
    doThrow().when(scratch).add(any(), null);
 
    scratch.add(1, null);
}
```

### doAnswer()

Answer is used when you need to do additional actions when a mocked method is invoked, e.g. when you need to compute the return value based on the parameters of this method call. So Use doAnswer() when we want to stub a void method with generic Answer. Answer specifies an action that is executed and a return value that is returned when you interact with the mock.

so we can make answer to `add()` method and to verfiy execution.

```java
@Test
public void whenAddCalledAnswered() {
    Scratch scratch = mock(Scratch.class);
    doAnswer(invocation -> {
        Object arg0 = invocation.getArgument(0);
        Object arg1 = invocation.getArgument(1);
        
        assertEquals(1, arg0);
        assertEquals(1, arg1);
        return null;
    }).when(scratch).add(anyInt(), anyInt());
    scratch.add(1,1);
}
```

Also another common usage of Answer is to stub asynchronous methods that have callbacks. For example, we have mocked the interface below:

```java
public interface BookService {
  void get(Callback callback);
}
```

Here you’ll find that `when-thenReturn` is not that helpful anymore. Answer is the replacement. For example, we can emulate a success by calling the `onSuccess` function of the callback.

```java
@Test
public void testOnSuccess_get() {
    Scratch scratch = mock(Scratch.class);
    doAnswer(invocation -> {
        Object arg0 = invocation.getArgument(0);
        Object arg1 = invocation.getArgument(1);
        
        assertEquals(1, arg0);
        assertEquals(1, arg1);
        return null;
    }).when(scratch).add(anyInt(), anyInt());
    scratch.add(1,1);
}
```