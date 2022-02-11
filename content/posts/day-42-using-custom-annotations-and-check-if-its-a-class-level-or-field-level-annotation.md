+++
category = []
date = 2022-02-11T00:00:00Z
description = "implementing custom annotations and check if its a class level or field level annotation."
draft = true
showtoc = false
slug = "/java/100DaysOfJava/day42"
summary = "implementing custom annotations and check if its a class level or field level annotation."
title = "Day 42: using custom annotations and check if its a class level or field level annotation"
[cover]
alt = "Day42"
caption = "Day42"
image = ""
relative = false

+++
Annotations are type of metadata ( data that provides information about other data) provide data about a program that is not part of the program itself. They don't have any effect on operations of the program.

implemented two custom annotation one for Class level named `ClassLevelAnnotation` and another one is Field level named `FieldLevelAnnotation`

```java
	@Retention(RetentionPolicy.RUNTIME)
    @Target(ElementType.TYPE)
    @interface ClassLevelAnnotation {
    }

    @Retention(RetentionPolicy.RUNTIME)
    @Target(ElementType.FIELD)
    @interface FieldLevelAnnotation {
    }
```

#### Retention:
It declares the availability of the annotation. if its given `RetentionPolicy.RUNTIME` that means it will be available in the runtime. If no retention policy is there then it takes the default retention policy which is `RetentionPolicy.CLASS` that means the annotation will be stored in the class file but not be available at the runtime.

#### Target:
It gives the option to declare which java elements the custom annotation can be used to annotate. `ElementType.TYPE` means it targets a class type and can be used to annotate class. `ElementType.FIELD` means it targets a class's field and can be used to annotate it. 

Here in this code there is another type of annotation that is `ElementType.ANNOTATION_TYPE` which is used to annotate another annotation. For example in the implementation the `@Target` and `@Retention` 

Now the annotations are placed on a class 

```java
    @ClassLevelAnnotation
    static class AnotherClass {
        @FieldLevelAnnotation
        public int firstNumber;
    }
```

now in the main class there are two methods implemented to check if the class is annotated with a class level annotation and a field is annotated with a field level annotation.

```java 

class Day42 {
    public static void main(String[] args) throws NoSuchFieldException {
        System.out.println(isAnnotatedClass(AnotherClass.class));
        System.out.println(isAnnotatedField(AnotherClass.class,"firstNumber"));
    }
}

private static boolean isAnnotatedField(Class clasz, String fieldName) throws NoSuchFieldException {
      return clasz.getDeclaredField(fieldName).isAnnotationPresent(FieldLevelAnnotation.class);
    }

private static boolean isAnnotatedClass(Class clasz) {
      return clasz.isAnnotationPresent(ClassLevelAnnotation.class);
    }
```

in 