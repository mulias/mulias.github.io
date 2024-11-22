+++
title = "Puzzling with Possum: Parsing Inputs for Advent of Code (Part 1)"
[taxonomies]
tags = [ "advent of code", "parsing", "possum", "~~~(##)'>" ]
[extra]
fix_the_dang_highlighting = "~~"
scripts = [ "possum.js" ]
+++

[Possum](https://github.com/mulias/possum_parser_language) is a parsing tool designed to transform any kind of text into structured data. While it's general-purpose, one use case where it naturally fits is parsing inputs for [Advent of Code](https://adventofcode.com/) puzzles. Possum helps you focus on solving puzzles by making the parsing step quick and painless.

Also parsing is fun. I don't want to over-sell the practical value of this exercise. I've got some convenient examples and I'm going to use them to show off a thing I made. Maybe you'll learn something, but more importantly I hope to nourish your soul, bring structural order to textual chaos, and keep my corner of the programming world a little bit weird. A simple ambition.

If you're new to Possum I'd recommend first reading an [introduction](/blog/possum-intro), although you can probably follow along if you're familiar with parsing and can vibe with some unusual syntax.

#### ⚠️ Work In Progress ⚠️

Possum is still in development. Most of the core functionality is in place, but there are a number of rough edges. The examples in this blog post will guide you along a happy path, but be aware that error messages may not provide much guidance if things go wrong.

## [Advent of Code 2022, Day 1](https://adventofcode.com/2022/day/1)

> One important consideration is food - in particular, the number of Calories each Elf is carrying (your puzzle input).
>
> The Elves take turns writing down the number of Calories contained by the various meals, snacks, rations, etc. that they've brought with them, one item per line. Each Elf separates their own inventory from the previous Elf's inventory (if any) by a blank line.

Here's a sample input which lists the inventory of three elves. It's representative of the full puzzle input but much shorter - the full input for this puzzle is over 2,000 lines long.

```
5642
6401
5591

6603

4481
5189
```

A good way to start writing a parser is to focus on the first bit of meaningful data at the beginning of the input. In this case the very first thing on the first line is an `integer`, so that's what we'll parse.

{% possum_example_large(input="5642
6401
5591

6603

4481
5189" input_rows=8 parser_rows=1) %}
integer
{% end %}

From here we can build up a parser for a single Elf's complete inventory. We can use `array_sep(elem, sep)` to collect multiple values into an array, where each `elem` is an `integer` and `sep` is a `newline`. This parser will match all integers separated by newlines until it hits something unexpected, like the double newline on line 4 that separates inventories. This means we only parse the first Elf's inventory of three items, stopping before we get to the second Elf.

{% possum_example_large(input="5642
6401
5591

6603

4481
5189" input_rows=8 parser_rows=1) %}
array_sep(integer, newline)
{% end %}

To parse the entire input we want to parse each Elf's inventory and collect them all into an array. We can do this by wrapping our parser for a single inventory in another `array_sep`, but this time the parser for the separator is multiple `newlines`.

{% possum_example_large(input="5642
6401
5591

6603

4481
5189" input_rows=8 parser_rows=4) %}
array_sep(
  array_sep(integer, newline),
  newlines
)
{% end %}

This is a working solution! We can stop here, parse our puzzle input into JSON, and move on to the actual puzzle solving part of Advent of Code. However, there are a few more optional ways we can clean up our code.

Looking at our current solution, we have an `array_sep` nested inside another `array_sep`. This pattern of parsing arrays of arrays is common enough that Possum's standard library includes a two dimensional array parser called `table_sep(elem, sep, row_sep)`. This parser handles our input data like a spreadsheet, where each Elf's items are column cells and each inventory is a row.

{% possum_example_large(input="5642
6401
5591

6603

4481
5189" input_rows=8 parser_rows=1) %}
table_sep(integer, newline, newlines)
{% end %}

Possum's standard library also includes shortened aliases for a number of the most common parsers. We can abbreviate `integer` to `int`, `newline` to `nl`, and `newlines` to `nls`. Sometimes it's nice to use the longer version to be explicit, but I'd consider the abbreviated aliases to be idiomatic.

{% possum_example_large(input="5642
6401
5591

6603

4481
5189" input_rows=8 parser_rows=1) %}
table_sep(int, nl, nls)
{% end %}

Finally, we can use the `+` operator to create the parser `nl + nl`, which will parse exactly two newlines. We could alternatively use the string literal parser `"\n\n"`, since `\n` is the escape sequence for a newline. Using either of these parsers in place of `nls` is a bit more specific, since we know that the input format is always going to have two newlines between inventories.

{% possum_example_large(input="5642
6401
5591

6603

4481
5189" input_rows=8 parser_rows=1) %}
table_sep(int, nl, nl+nl)
{% end %}

While relatively simple, this example highlights two key aspects of Possum: incremental parser creation and the standard library's high-level parsers. We started with a basic integer parser and gradually built up to handling the full input, showing how parsers can be composed step by step. Along the way, we used standard library utilities like `table_sep` that encapsulate common parsing patterns, and saw how aliases and operators help keep code concise without sacrificing readability.

To run this parser on our full 2,000-line input file we're going to want to run Possum locally with the [CLI tool](https://github.com/mulias/possum_parser_language/releases). Here's how we can run our parser, reading the puzzle input from `input.txt` and redirecting the output from `stdout` to `input.json`:

```
$ possum -p 'table_sep(int, nl, nl+nl)' input.txt > input.json
```


## [Advent of Code 2022, Day 13](https://adventofcode.com/2022/day/13)

> Your handheld device must still not be working properly; the packets from the distress signal got decoded out of order. You'll need to re-order the list of received packets (your puzzle input) to decode the message.
>
> Your list consists of pairs of packets; pairs are separated by a blank line.
>
> [...]
>
> Packet data consists of lists and integers. Each list starts with [, ends with ], and contains zero or more comma-separated values (either integers or other lists). Each packet is always a list and appears on its own line.
>
> When comparing two values, the first value is called <strong>left</strong> and the second value is called <strong>right</strong>.

For this puzzle we'll use a sample input listing three pairs of packets. The full input for this puzzle is over 400 lines long and many of the packets are significantly longer and more nested.

```
[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]
```

Once again we can start by focusing on the first bit of data on the first line. In order to parse the first integer we need to skip over the square bracket, accomplished using `>`, the "take right" operator.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=1) %}
"[" > int
{% end %}

Next we can build up to parsing the full first line, returning the packet as an array. We want to match the start and end square brackets, but not include them in the output. We can use both the `>` and `<` operators to keep only the right or left parser's result, respectively, so parsing and returning the stuff in the middle will look something like `"[" > packet_values < "]"`. The packet values are `int`s separated by commas so this seems like another good place for `array_sep`.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=1) %}
"[" > array_sep(int, ",") < "]"
{% end %}

Now that we have a parser for the first packet, we can try parsing the full input with `table_sep`, similar to the final parser solution for [2022 day 1](#advent-of-code-2022-day-1).

Mid-article pop quiz: Why won't the following parser work for parsing the whole input?

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=5) %}
table_sep(
  "[" > array_sep(int, ",") < "]",
  nl,
  nl+nl
)
{% end %}

The parser can successfully parse the first pair of packets, but we haven't accounted for the nested packet on line 4. Each packet can contain other packets, but the parser fails when it finds a nested square bracket instead of an integer.

To parse nested packets we split out `packet = ...` as a named parser and then use `packet` recursively in its own definition. There's no other special syntax or trick to make this work - a packet can contain other packets, and that's ok!

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=3) %}
packet = "[" > array_sep(int | packet, ",") < "]"
table_sep(packet, nl, nl+nl)
{% end %}

This looks promising, but there’s one more bug. In the following example the input has been modified so that the second packet is empty. Our parser will still run, but it will give up when it reaches the empty packet.

{% possum_example_large(input="[1,1,3,1,1]
[]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=3) %}
packet = "[" > array_sep(int | packet, ",") < "]"
table_sep(packet, nl, nl+nl)
{% end %}

The `array_sep` parser only succeeds when there's at least one element, producing a non-empty array. Only parsing non-empty arrays is a safer default because it avoids infinite loops that could occur when a parser succeeds without consuming any input. However, we can explicitly opt-in to allowing an empty array by using `maybe_array_sep(elem, sep)` which will parse zero or more elements, returning an empty array if no elements are found.

{% possum_example_large(input="[1,1,3,1,1]
[]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=3) %}
packet = "[" > maybe_array_sep(int | packet, ",") < "]"
table_sep(packet, nl, nl+nl)
{% end %}

At this point we've successfully parsed the full input, but there's more we can do to improve our parser.

Looking at our input more carefully, we can note that each packet is already formatted as valid JSON arrays and integers. Possum has a built-in `json` parser which handles arbitrary JSON formatted data, so we can use that as a drop-in replacement for our `packet` definition.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=3) %}
packet = json
table_sep(packet, nl, nl+nl)
{% end %}

Since the `json` parser accepts any valid JSON data (including strings, numbers, objects etc.), it's overly permissive for our needs. The `json_array(elem)` parser is a more precise choice as it only accepts arrays and gives us control over what elements are allowed through the `elem` parameter. This restriction helps catch unexpected inputs early and makes our parser's intent clearer - we expect packets to be arrays containing only integers and other packets.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=3) %}
packet = json_array(int | packet)
table_sep(packet, nl, nl+nl)
{% end %}

The description specifies that packets come in pairs, calling out the first value as "left" and the second value as "right". We can better match this conceptual model by parsing each packet `pair` as an object with "left" and "right" fields.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=7) %}
packet = json_array(int | packet)
pair =
  packet -> L & nl & packet -> R $
  {"left": L, "right": R}

array_sep(pair, nl+nl)
{% end %}

The object literal syntax used in `pair` is very flexible, but it can be verbose. We can instead use the standard library parser `record2_sep(Key1, value1, sep, Key2, value2)`, which parses two values, `value1` and `value2`, separated by `sep`. The parsed values are turned into an object with value keys `Key1` and `Key2`. Note the special syntax `$"left"` and `$"right"` to specify the key names. Possum usually understands string literals as parsers that match the exact contents of a string. Prefixing the string with a dollar sign marks it as a concrete string value, instead of a parser.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=4) %}
packet = json_array(int | packet)
pair = record2_sep($"left", packet, nl, $"right", packet)
array_sep(pair, nl+nl)
{% end %}

In this second example we've seen how Possum can handle recursive data structures. We started with a bespoke definition for `packet`, then moved to using a standard library parser for data formatted as a JSON array, which happens to match our use case. We also structured our output as nested arrays and then refactored to return objects with field names in order to better match the puzzle description.

Running the final version of our parser is similar to the previous example:

```
$ possum -p '
  packet = json_array(int | packet)
  pair = record2_sep($"left", packet, nl, $"right", packet)
  array_sep(pair, nl+nl)
' input.txt > input.json
```

Alternatively we can save the parser to a `.possum` file which is then read as a positional argument:

```
$ possum input_parser.possum input.txt > input.json
```

## Conclusion

I've written over 1,500 words to explain four lines of code, a new personal record! These examples cover two common input formats for Advent of Code, and should be adaptable to some of the upcoming 2024 puzzles. Whatever wild adventures those Elves get up to next, you'll be ready to parse them.

This is [part 1](/blog/puzzling-with-possum-pt1) of a three part series, covering the basics of parsing arrays, objects, and recursive data with Possum.

In part 2 we'll look at how Possum can handle more complex inputs, including objects with dynamic keys and ASCII diagrams.

Finally in part 3 we'll work through a rare example of not only parsing a puzzle input with Possum, but actually solving a full Advent of Code puzzle, using super advanced features like pattern matching and adding together numbers.
