+++
title = "Guided Tour of Possum, a Tiny Text Parsing Language"
[taxonomies]
tags = [ "possum", "programming languages", "parsing", "parser combinators", "~~~(##)'>" ]
[extra]
fix_the_dang_highlighting = "~~"
scripts = [ "possum.js" ]
+++

[Possum](https://github.com/mulias/possum_parser_language) is a domain specific scripting language for turning plain text into JSON. It's available as a command line tool, but it also runs in the browser! This guide covers the basics of Possum using interactive examples, and should give you enough context to handle a wide range of parsing situations.

TODO: Add some motivation -- what is possum good at, what makes it interesting to use/learn?

TODO: Disclaimer about Possum's error messages still being in development.

## The Basics

TODO: Articulate that every Possum program is a specification for a parser that is ran on input text. The output of running a Possum program is JSON.

### Literal Parsers

String literals are parsers which match the exact text of a string and return a string value on success.

Here's our first interactive example. The `Input` field is the text we're going to parse, while the `Parser` field is the Possum program. Try running the program once to see it succeed, and then change either the input or parser value to experiment with the string matching behavior.

{% possum_example_small(input="Hello World!") %}
"Hello World!"
{% end %}

String literals can be created with double or single quotes. JSON strings are encoded with double quotes, so the program output will always use double quotes.

{% possum_example_small(input='Time to "parse some text"') %}
'Time to "parse some text"'
{% end %}

Number literals are parsers which match the exact digits of a number and return a number value on success. Possum supports the same number formats as JSON, which includes positive and negative numbers, integers, and numbers with fraction or exponent parts.

{% possum_example_small(input="1245") %}
12
{% end %}

{% possum_example_small(input="-37") %}
-37
{% end %}

{% possum_example_small(input="10.45") %}
10.45
{% end %}

{% possum_example_small(input="6.022e23") %}
6.022e23
{% end %}

### Range Parsers

Character ranges are parsers that match a single ASCII character or Unicode code point that falls within an inclusive range.

{% possum_example_small(input="g") %}
"a".."z"
{% end %}

TODO: Something about what a code point is, or about how we don't really have to worry about the exact details of Unicode (yet).

{% possum_example_small(input="😅") %}
"😄".."🫠"
{% end %}

Finally, integer ranges are parsers that match all integers that fall within an inclusive range.

{% possum_example_small(input="77") %}
1..9
{% end %}

{% possum_example_small(input="77") %}
70..80
{% end %}

### Greed and Failure

Parsers always start matching from the beginning of the input and return the longest possible match.

{% possum_example_small(input="match this: but not this") %}
"match this: "
{% end %}

After parsing any extra input is thrown out. This means that the empty string `""` is a parser that always succeeds, no matter the input.

{% possum_example_small(input="abc") %}
""
{% end %}

If the parser fails to find a match Possum returns an error.

{% possum_example_small(input="no match here") %}
"my parser"
{% end %}

## The Standard Library

Possum has a standard library with parsers covering many common parsing situations. We'll be using parsers from the standard library in our examples, so here's a quick overview.

### Parsing Strings

Use `char` to parse exactly one character, returning the value as a string.

{% possum_example_small(input="123") %}
char
{% end %}

Parse and return an upper- or lower-case letter from the English alphabet with `alpha`. To parse multiple letters try changing `alpha` to `alphas`.

{% possum_example_small(input="foo! bar") %}
alpha
{% end %}

Parse and return one or more non-whitespace characters with `token`.

{% possum_example_small(input="foo! bar") %}
token
{% end %}

Parse and return one or more alphanumeric characters with `word`. This parser also accepts `_` and `-`.
{% possum_example_small(input="foo! bar") %}
word
{% end %}

Some parsers are parametrized by other parsers. The parser `many(p)` tries to run the parser `p` repeatedly until it no longer succeeds, and returns the concatenation of all of the parsed values.

{% possum_example_small(input="abcdefg1234") %}
many("a".."d")
{% end %}

### Parsing Whitespace

The `space` parser matches a single blank non-line-breaking character. This usually means an ASCII space or tab. By convention `spaces` will instead parse multiple blank characters at once.

{% possum_example_small(input="        text") %}
space
{% end %}

The `newline` parser matches and return a single line-breaking character. To parse multiple newlines use `newlines`. These parsers are aliased to the abbreviations `nl` and `nls`, respectively.

{% possum_example_large(input="


  |end of whitespace" input_rows=3 parser_rows=1) %}
newline
{% end %}

To parse all contiguous whitespace use `whitespace` or `ws`.

{% possum_example_large(input="


  |end of whitespace" input_rows=3 parser_rows=1) %}
whitespace
{% end %}

### Parsing Numbers

TODO: Explain how numbers work.

{% possum_example_small(input="31987abc") %}
digit
{% end %}

{% possum_example_small(input="31987abc") %}
integer
{% end %}

{% possum_example_small(input="12.45e-10xyz") %}
number
{% end %}

### Parsing Constants

The parsers `true(t)`, `false(f)`, `bool(t, f)`, and `null(n)` return the appropriate constant values when the provided parser matches.

{% possum_example_small(input="True") %}
true("True")
{% end %}

{% possum_example_small(input="No") %}
false("No")
{% end %}

{% possum_example_small(input="0") %}
bool(1, 0)
{% end %}

{% possum_example_small(input="123") %}
null(number)
{% end %}

### Parsing Collections

Finally `array(elem)` and `object(key, value)` return ordered list collections (arrays) and key/value pair collections (objects).

{% possum_example_small(input="1010111001") %}
array(digit)
{% end %}

{% possum_example_small(input="a12b34c56") %}
object(alpha, int)
{% end %}

Collections frequently use separator characters between elements. You can use `array_sep(elem, sep)` and `object_sep(key, pair_sep, value, sep)` to handle these cases, parsing the separators but excluding them from the result.

{% possum_example_small(input="1,2,3,4,5,6") %}
array_sep(int, ',')
{% end %}

{% possum_example_large(input="foo:33,bar:1" input_rows=1 parser_rows=1) %}
object_sep(many(alpha), ":", int, ",")
{% end %}

## Composing Parsers

TODO: Something should go here? Maybe something about how large parsers are created by sticking together smaller parsers with infix operators.

### Or

The infix "or" operator `p1 | p2` tries to match `p1` and then if that fails tries to match `p2` instead.

{% possum_example_small(input="two") %}
"one" | "two"
{% end %}

### Take Right

The "take right" operator `p1 > p2` matches `p1` and then matches and returns `p2`.

{% possum_example_small(input="one two") %}
"one" > ws > "two"
{% end %}

### Take Left

Similarly the "take left" operator `p1 < p2` matches `p1`, keeps the result, then matches `p2`. If both succeed then `p1` is returned.

{% possum_example_small(input="one two") %}
"one" < " two"
{% end %}

{% possum_example_small(input="(5)") %}
"(" > int < ")"
{% end %}

If `p1` succeeds but `p2` fails, the whole parser fails.

{% possum_example_small(input="one three") %}
"one" < ws < "two"
{% end %}

### Merge

The "merge" operator `p1 + p2` matches `p1` and then `p2` and combines the two values.

Merging will concatenate strings:

{% possum_example_small(input="foo   bar") %}
word + ws + word
{% end %}

Concatenate arrays:

{% possum_example_small(input="98765hefty") %}
array(digit) + array(alpha)
{% end %}

Combine objects, adding fields from the right-side object to the left-side object, possibly replacing exisiting values:

{% possum_example_small(input="a0b0c0c1a1d1") %}
object(char, 0) + object(char, 1)
{% end %}

Sum numbers:

{% possum_example_small(input="123321") %}
123 + 321
{% end %}

And apply logical "and" to booleans:

{% possum_example_small(input="10") %}
bool(1, 0) + bool(1, 0)
{% end %}

If the two parsed values have different types then the operation will throw a runtime error.

{% possum_example_small(input="a1") %}
alpha + digit
{% end %}

The one exception to this rule is `null`, which can be merged with any other value, acting as the identity value for that data type:

{% possum_example_small(input="N123") %}
null("N") + int
{% end %}

### Return

The "return" operator `p $ V` matches `p`, and then on success returns the value `V`.

{% possum_example_small(input="12345") %}
12345 $ "Password Accepted"
{% end %}

{% possum_example_small(input="too true") %}
"too true" $ true
{% end %}

The value on the right-side of `$` can be any valid JSON data, including arrays, objects, true, false, and null.

{% possum_example_small(input="123") %}
1 > 2 > 3 $ [1, 2, 3]
{% end %}

{% possum_example_small(input="7") %}
7 $ {"isSeven": true}
{% end %}

{% possum_example_small(input="nil") %}
"nil" $ null
{% end %}

### Destructure

The "destructure" operator `P <- p` matches `p`, and then compares the result to the pattern `P` on the left. If the parsed value has the same structure as the pattern then the parser matches and the whole value is returned. The pattern can be any value, including arrays and objects.

{% possum_example_small(input="5") %}
5 <- int
{% end %}

{% possum_example_small(input="153") %}
[1, 5, 3] <- array(digit)
{% end %}

If the parsed value does not match the pattern then the parser fails.

{% possum_example_small(input="55") %}
5 <- int
{% end %}

Patterns can also contain `UpperCamelCase` variables, which match any value and assign the value to the variable. Variables can be used later in the same parser.

{% possum_example_small(input="9") %}
N <- number $ [N, N, N]
{% end %}

{% possum_example_small(input="153") %}
[1,N,3] <- array(digit) $ N
{% end %}

### Sequence

The "sequence" operator `p1 & p2` matches `p1` and then matches and returns `p2`. This behavior is similar to `>`, but `&` has a more general precidence, grouping parts of a parser together similar to parentheses. Instead of grouping like this:

{% possum_example_large(input="1 foo 3" input_rows=1 parser_rows=3) %}
int > ws > (int | "foo") > ws > (int | "bar")
{% end %}

A sequence of parsers can be written like this:

{% possum_example_large(input="1 foo 3" input_rows=1 parser_rows=3) %}
int & ws & int | "foo" & ws & int | "bar"
{% end %}

### Putting it all together

Using the return, destructure, and sequence operators together we can implement a very common pattern in Possum -- matching a sequence of parsers, destructuring to assign values to variables, and then building a return value using the variables.

{% possum_example_large(input="12 + 99" input_rows=1 parser_rows=6) %}
Left  <- int   & ws &
Op    <- token & ws &
Right <- int   $
{"left": Left, "op": Op, "right": Right}
{% end %}

## Defining Parsers

TODO: Give this another pass, come up with a better example for parameterized parsers.

Parsers are split up and reused by defining the parser and then using it by name. Parser definitions can be separated by semicolons or newlines.

{% possum_example_large(input="first=88 second=0 third=-10" input_rows=1 parser_rows=5) %}
field = alphas > "=" > int

array_sep(field, ws)
{% end %}

Named Parsers can be parameterized with other parsers.
```
  $ possum -p 'field(p) = alphas > "=" > p ; field(int)' -i 'first=111'
  111

  $ possum -p 'first_field(p) = "first=" > p ; first_field(word)' -i 'first=One'
  "One"
```

Named parsers can also be parameterized by values. Here's how to implement `if`,
a parser where the value `Then` is returned when the parser `condition`
succeeds, otherwise `if` fails. Note that parser variables are always
`snake_case` while value variables are always `UpperCamelCase`.

{% possum_example_large(input="12" input_rows=1 parser_rows=5) %}
if(condition, Then) = condition $ Then

if(12, true)
{% end %}

Parsers can be recursive and referenced before they are defined.

{% possum_example_large(input="{{1;{5;7}};{12;3}}" input_rows=1 parser_rows=10) %}
int_or_tuple

int_or_tuple = int | tuple

tuple = "{" &
  A <- int_or_tuple & ";" &
  B <- int_or_tuple & "}" $
  [A, B]
{% end %}

## A Few More Standard Library Parsers

At this point you should be well equipped to browse the standard library, but here are a few more parsers that you might find particularly useful.

The parser `maybe(p)` runs `p` and either returns the parsed value if `p` succeeds, or returns `null` if `p` fails. This means `maybe(p)` will never fail, and can be merged with any other value in a concatinated output.

{% possum_example_small(input="foobaz") %}
"foo" + maybe("bar") + "baz"
{% end %}

Similarly, `skip(p)` runs `p`, but on success always returns `null`. Since `null` can merge with any value this allows parts of the input to be ignored in a concatinated output.

{% possum_example_small(input="foobarbaz") %}
"foo" + skip("bar") + "baz"
{% end %}

The parser `default(p, D)` sets a default value to return if the parser fails.

{% possum_example_small(input="foobaz") %}
default(number, 10)
{% end %}


Once you're happy with a parser, you may want to ensure that it always parses
the whole input by using `end_of_input` or `end` to specify that the end of the
input has been reached.

{% possum_example_small(input="12") %}
int < end
{% end %}

If `end` finds unparsed input then it fails.
{% possum_example_small(input="12three") %}
int < end
{% end %}

Alternatively, `input(p)` wraps a parser to both strip surrounding whitespace
and make sure the whole input it parsed.

{% possum_example_small(input="   12     ") %}
input(int)
{% end %}

Use `scan(p)` to skip characters until the provided parser matches.
{% possum_example_small(input="___test___83324____99") %}
scan(number)
{% end %}

Similar to how `array_sep(elem, sep)` handles one-dimensional data with
separators, `table_sep(array, sep, row_sep)` handles two dimensional data with
both column and row separators.

{% possum_example_large(input="1 2 3 4 5
0 1 2 3 4
4 5 6 1 2", input_rows=3, parser_rows=1) %}
table_sep(num, spaces, nl)
{% end %}

## Conclusion

Some things that could go in a conclusion section:

- The hero returns home from their journey, changed by the experience. Here's
`hello world` again, but now you know a bit more about how to mess with it!

{% possum_example_small(input="Hello Possum!") %}
"Hello" + ws + alphas + "!"
{% end %}

- Links to other blog posts (that don't exist yet). I'd at least like a blog
post/live code page with more substantial examples, and another focusing on the
design/implementation of the language.

- Hannah says I can skip the conclusion!
