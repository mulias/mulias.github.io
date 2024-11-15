+++
title = "Introducing Possum, a Tiny Text Parsing Language"
[taxonomies]
tags = [ "possum", "programming languages", "parsing", "parser combinators", "~~~(##)'>" ]
[extra]
fix_the_dang_highlighting = "~~"
scripts = [ "possum.js" ]
+++

[Possum](https://github.com/mulias/possum_parser_language) is a domain-specific language designed for parsing text, inspired by classic Unix utilities like [AWK](https://en.wikipedia.org/wiki/AWK) and [sed](https://en.wikipedia.org/wiki/Sed). You can use Possum for tasks ranging from single-line scripts for data extraction to quickly prototyping a new programming language syntax. The language aims to make parsing friendly and fun, and uses a minimal feature set to write declarative programs that are both compact and readable.

This guide teaches the core features of Possum using interactive examples, and should give you enough context to handle a wide range of parsing situations. If you're checking out Possum for the first time and want to learn more about the language at a higher level, I'm planning on writing separate articles covering the design philosophy behind Possum and examples of larger Possum programs.

#### ⚠️  Work In Progress ⚠️

Possum is still in development. Most of the core functionality is in place, but there are a number of rough edges. The one you'll likely notice is that error messages are mostly placeholders, and will be pretty unhelpful. Rest assured we've got a team of marsupials working around the clock to correct this issue.

## The Basics

A Possum program is made up of parsers, functions that define both what text inputs are valid and how to transform valid inputs into structured data. The Possum runtime takes a program and an input string and either successfully parses the input into a JSON encoded value, or fails if the input was malformed.

This section covers parsers that match against specific strings or numbers in the input text, and then returns the matched value unchanged. Later on we'll introduce ways to compose these basic parsers together to make compound parsers that can validate more complex inputs and produce any JSON value as output.

### Literal Parsers

String literals are parsers which match the exact text of the string and return the string value on success.

Here's our first interactive example! Typically Possum is run from the command line, but in the browser the `Input` field is the text we're going to parse, while the `Parser` field is the Possum program. Try running the program once to see it succeed, and then change either the input or parser to experiment with the string matching behavior.

{% possum_example_small(input="Hello World!") %}
"Hello World!"
{% end %}

String literals can use double or single quotes. JSON strings are encoded with double quotes, so the output will always use double quotes.

{% possum_example_small(input='Time to "parse some text"') %}
'Time to "parse some text"'
{% end %}

Number literals are parsers which match the exact digits of a number and return the number value on success. Possum supports the same number format as JSON, which includes positive and negative numbers, integers, and numbers with fraction and/or exponent parts.

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

Character ranges are parsers that match a single Unicode code point that falls within an inclusive range.

{% possum_example_small(input="g") %}
"a".."z"
{% end %}

Code points are, broadly speaking, how Unicode defines units of text. This means we can use character range parsers for more than just ASCII characters. The emoji "😄" is code point `U+1F604` and "🤠" is `U+1F920`, so "😅" (`U+1F605`) is in the range. It's worth noting that some units of text are made up of multiple code points stuck together, so character ranges won't work for absolutely everything that looks like a single character. This limitation shouldn't be an issue in the majority of parsing use cases.

{% possum_example_small(input="😅") %}
"😄".."🤠"
{% end %}

Integer ranges use the same `..` syntax, but match all integers that fall within an inclusive range.

{% possum_example_small(input="78") %}
1..9
{% end %}

{% possum_example_small(input="78") %}
70..80
{% end %}

### Greed and Failure

Parsers always start matching from the beginning of the input, do not skip over any input, and return the longest possible match.

{% possum_example_small(input="match this: but not this") %}
"match this: "
{% end %}

After parsing, any extra input is thrown out. This means that the empty string `""` is a parser that always succeeds, no matter the input.

{% possum_example_small(input="Call me Ishmael. Some years ago — never mind how long precisely — having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.") %}
""
{% end %}

If the parser fails to find a match, Possum returns an error.

{% possum_example_small(input="not my parser") %}
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

{% possum_example_small(input="Foo123! bar") %}
alpha
{% end %}

Parse and return one or more alphanumeric characters with `word`. This parser also accepts `_` and `-`.
{% possum_example_small(input="Foo123! bar") %}
word
{% end %}

Parse and return one or more non-whitespace characters with `token`.

{% possum_example_small(input="Foo123! bar") %}
token
{% end %}

Some parsers are parametrized by other parsers. The parser `many(p)` tries to run the parser `p` repeatedly until it no longer succeeds, and returns the concatenation of all of the parsed values.

{% possum_example_small(input="abcdefg") %}
many("a".."d")
{% end %}

### Parsing Whitespace

The `space` parser matches a single blank non-line-breaking character. This usually means an ASCII space or tab. By convention `spaces` will instead parse multiple blank characters at once.

{% possum_example_small(input="        text") %}
space
{% end %}

The `newline` parser matches and returns a single line-breaking character. To parse multiple line breaks use `newlines`. These parsers are aliased to the abbreviations `nl` and `nls`, respectively.

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

The `digit` parser matches a single Arabic numeral between `0` and `9`, and returns the numeral as an integer.

{% possum_example_small(input="31987abc") %}
digit
{% end %}

Parse any valid JSON integer with `integer`, or the alias `int`.

{% possum_example_small(input="31987abc") %}
integer
{% end %}

Parse any valid JSON number with `number` or `num`. This includes numbers with fraction and/or exponent parts.

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

Finally, `array(elem)` and `object(key, value)` return ordered list collections (arrays) and key/value pair collections (objects).

{% possum_example_small(input="1010111001") %}
array(digit)
{% end %}

{% possum_example_small(input="a12b34c56") %}
object(alpha, int)
{% end %}

Collections frequently use separator characters between elements. You can use `array_sep(elem, sep)` and `object_sep(key, pair_sep, value, sep)` to handle these cases, parsing the separators but excluding them from the result.

{% possum_example_small(input="1 2 3 4 5 6") %}
array_sep(int, ' ')
{% end %}

{% possum_example_large(input="foo=33;bar=1" input_rows=1 parser_rows=3) %}
object_sep(alphas, "=", int, ";")
{% end %}

## Composing Parsers

We've now covered both basic parsers for strings and numbers, and some of the high-level parser functions from Possum's standard library. The last big feature we need is the ability to stick parsers together in order to create larger parsers for more complex inputs. In Possum we do this with *infix operators*, symbols that go between two parsers to change how and when the parsers get ran on the input.

### Or

The "or" operator `p1 | p2` tries to match the parser `p1` and then if that fails tries to match `p2` instead.

{% possum_example_small(input="two") %}
"one" | "two"
{% end %}

If both parsers fail then the compound parser fails.

{% possum_example_small(input="three") %}
"one" | "two"
{% end %}

### Take Right

The "take right" operator `p1 > p2` matches `p1` and then matches and returns `p2`.

{% possum_example_small(input="one two") %}
"one" > " " > "two"
{% end %}

If either parser fails then the compound parser fails.

{% possum_example_small(input="one two") %}
"three" > " two"

{% end %}

### Take Left

Similarly the "take left" operator `p1 < p2` matches `p1`, keeps the result, then matches `p2`. If both succeed then the value parsed by `p1` is returned.

{% possum_example_small(input="one two") %}
"one" < " " < "two"
{% end %}

{% possum_example_small(input="(5)") %}
"(" > int < ")"
{% end %}

If either parser fails then the compound parser fails.

{% possum_example_small(input="one three") %}
"one" < " " < "two"
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

Combine objects, overwriting existing values:

{% possum_example_small(input="a0b0c0c1a1d1") %}
object(char, 0) + object(char, 1)
{% end %}

Sum numbers:

{% possum_example_small(input="123321") %}
123 + 321
{% end %}

And apply logical "or" to booleans:

{% possum_example_small(input="10") %}
bool(1, 0) + bool(1, 0)
{% end %}

If the two parsed values have different types then the operation will throw a runtime error.

{% possum_example_small(input="a1") %}
alpha + digit
{% end %}

The one exception to this rule is the value `null`, which can be merged with any other value, acting as the identity value for that data type:

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

The "destructure" operator `p -> P` matches `p`, and then compares the result to the pattern `P`. If the parsed value has the same structure as the pattern then the parser matches and the whole value is returned. The pattern can be any value, including arrays and objects.

{% possum_example_small(input="5") %}
int -> 5
{% end %}

{% possum_example_small(input="153") %}
array(digit) -> [1, 5, 3]
{% end %}

If the parsed value does not match the pattern then the parser fails.

{% possum_example_small(input="55") %}
int -> 5
{% end %}

Patterns can also contain `UpperCamelCase` variables, which match any value and assign the value to the variable. Variables can be used later in the same parser.

{% possum_example_small(input="9") %}
number -> N $ [N, N, N]
{% end %}

{% possum_example_small(input="153") %}
array(digit) -> [1,N,3] $ N
{% end %}

### Sequence

The "sequence" operator `p1 & p2` matches `p1` and then matches and returns `p2`. This behavior is similar to `>`, but `&` has a more general precedence, grouping parts of a parser together in a similar way to parentheses. Because of this `>` is best suited for parsing and then ignoring a value within a parsing step, while `&` is more useful in stringing together a list of steps. Instead of grouping like this:

{% possum_example_large(input="1 foo 3" input_rows=1 parser_rows=3) %}
int > ws > (int | "foo") > ws > (int | "bar")
{% end %}

A sequence of parsers can be written like this:

{% possum_example_large(input="1 foo 3" input_rows=1 parser_rows=3) %}
int & ws & int | "foo" & ws & int | "bar"
{% end %}

### Putting it all together

Using the return, destructure, and sequence operators together we can implement a very common pattern in Possum — matching a sequence of parsers, destructuring to assign values to variables, and then building a return value using the variables.

{% possum_example_large(input="12 + 99" input_rows=1 parser_rows=6) %}
int   -> Left  & ws &
token -> Op    & ws &
int   -> Right $
{"left": Left, "op": Op, "right": Right}
{% end %}

## Defining Parsers

A Possum program must have one *main parser*, and can optionally declare any number of *named parsers*. Parsers must be separated either by newlines or semicolons. Named parsers are declared with the syntax `name = parser`. At runtime Possum executes the main parser, which can reference named parsers declared in the program in the same way we reference named parsers from the standard library.

{% possum_example_large(input="first=88 second=0 third=-10" input_rows=1 parser_rows=5) %}
field = alphas > "=" > int

array_sep(field, ws)
{% end %}

Named Parsers can be parameterized with both parsers and values. Parser params are always `snake_case` while value params are always `UpperCamelCase`.

{% possum_example_large(input="12345" input_rows=1 parser_rows=5) %}
if(condition, Then) = condition $ Then

if(12345, ["return", "this", "array"])
{% end %}

There's one edge case when passing values as parser args, which is that values which could be confused with parsers must be prefixed with a `$`. This includes strings, numbers, and the constants `true`, `false`, and `null`. Arrays, objects, and `UpperCamelCase` variables are always values, so there's no need to disambiguate.

{% possum_example_large(input="12345" input_rows=1 parser_rows=5) %}
if(condition, Then) = condition $ Then

if(12345, $"return this string")
{% end %}

Named parsers can be recursive and referenced before they are declared. The main parser can come before, after, or in between named parser declarations.

{% possum_example_large(input="{{1;{5;7}};{12;3}}" input_rows=1 parser_rows=10) %}
int_or_tuple

int_or_tuple = int | tuple

tuple = "{" &
  int_or_tuple -> A & ";" &
  int_or_tuple -> B & "}" $
  [A, B]
{% end %}

## A Few More Standard Library Parsers

At this point you should be well equipped to [browse the standard library](https://github.com/mulias/possum_parser_language/blob/main/docs/stdlib.md), but here are a few more parsers that you might find particularly useful.

The parser `maybe(p)` runs `p` and either returns the parsed value if `p` succeeds, or returns `null` if `p` fails. This means `maybe(p)` will never fail, and can be merged with any other value in a concatenated output.

{% possum_example_small(input="foobaz") %}
"foo" + maybe("bar") + "baz"
{% end %}

Similarly, `skip(p)` runs `p`, but on success always returns `null`. Since `null` can merge with any value this allows parts of the input to be ignored in a concatenated output.

{% possum_example_small(input="foobarbaz") %}
"foo" + skip("bar") + "baz"
{% end %}

Once you're happy with a parser, you may want to ensure that it always parses the whole input by using `end_of_input` or `end` to specify that the end of the input has been reached.

{% possum_example_small(input="123") %}
int < end
{% end %}

If `end` finds unparsed input then it fails.
{% possum_example_small(input="12three") %}
int < end
{% end %}

Alternatively, `input(p)` wraps a parser to both strip surrounding whitespace and make sure the whole input is parsed.

{% possum_example_small(input="   123     ") %}
input(int)
{% end %}

Use `find(p)` to skip characters until the provided parser matches.

{% possum_example_small(input="___test___83324____99") %}
find(number)
{% end %}

Similar to how `array_sep(elem, sep)` handles one-dimensional data with separators, `table_sep(array, sep, row_sep)` handles two dimensional data with both column and row separators.

{% possum_example_large(input="1 2 3 4 5
0 1 2 3 4
4 5 6 1 2", input_rows=3, parser_rows=1) %}
table_sep(num, spaces, nl)
{% end %}

## ~~~(##)'> Conclusion

We've made it — that's just about everything you need to know to be productive with Possum. In the very first example we matched and returned a string input exactly, but with just a few changes we can extend that parser to handle any number of variations or requirements.

{% possum_example_small(input="Hello Possum!") %}
"Hello" + ws + word + "!"
{% end %}

Possum aims to make parsing friendly and fun by making it easy to compose complex parsers out of simple component parts. These kinds of parsers are frequently called [parser combinators](https://en.wikipedia.org/wiki/Parser_combinator). Many modern languages have parser combinator libraries, but they're all implemented slightly differently from one another. Part of what Possum offers is a single set of powerful parsing utilities that can effectivly be integrated with any other programming language via JSON. On top of that, Possum avoids much of the complexity that comes from trying to integrate parser combinators into an existing language by focusing solely on parsing.

To install Possum check out the [Github repo](https://github.com/mulias/possum_parser_language/). To learn more about using Possum read through the [standard library](https://github.com/mulias/possum_parser_language/blob/main/docs/stdlib.md) or some [larger examples](https://github.com/mulias/possum_parser_language/tree/main/examples). Good luck and happy parsing!
