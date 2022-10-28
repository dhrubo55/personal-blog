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

