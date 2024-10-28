+++
title = "Puzzling with Possum: Parsing Inputs for Advent of Code (Part 1)"
[taxonomies]
tags = [ "possum", "parsing", "parser combinators", "~~~(##)'>" ]
[extra]
fix_the_dang_highlighting = "~~"
scripts = [ "possum.js" ]
+++

Every advent of code puzzle


I have three parts planned for this series, each one increasing in complexity.

long lists

## [Advent of Code 2022, Day 1](https://adventofcode.com/2022/day/1)

> One important consideration is food - in particular, the number of Calories each Elf is carrying (your puzzle input).
>
> The Elves take turns writing down the number of Calories contained by the various meals, snacks, rations, etc. that they've brought with them, one item per line. Each Elf separates their own inventory from the previous Elf's inventory (if any) by a blank line.

Here's an example puzzle input which lists the inventory of three elves. It's representative of the full puzzle input but much shorter - the full input for this puzzle is over 2,000 lines long.
```
5642
6401
5591

6603

4481
5189
```

The easiest way to start writing a parser is to focus on the first bit of meaningful data at the beginning of the input. In this case the very first thing on the first line is an `integer`, so that's what we'll parse.

{% possum_example_large(input="5642
6401
5591

6603

4481
5189" input_rows=8 parser_rows=1) %}
integer
{% end %}

We know that the first three `integer`s
As a first step we can parse a group of `integer`s which are each separated by a `newline`. We use `array_sep(elem, sep)` to collect the integer values into an array. This will only parse the inventory of the first Elf, stopping when we find a second newline instead of an integer on line 4.

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
5189" input_rows=8 parser_rows=1) %}
array_sep(array_sep(integer, newline), newlines)
{% end %}

This is a working solution! We can stop here, parse our puzzle input into JSON, and move on to the actual puzzle solving part of Advent of Code.

in the following steps we'll go over a few more ways to clean up our parser code.

Arrays of arrays come up frequently enough that there's a standard library parser called `table_sep(elem, sep, row_sep)` for this use case.

{% possum_example_large(input="5642
6401
5591

6603

4481
5189" input_rows=8 parser_rows=1) %}
table_sep(integer, newline, newlines)
{% end %}

Possum's standard library includes shortened aliases for a number of the most common parsers. We can abbreviate `integer` to `int`, `newline` to `nl`, and `newlines` to `nls`. Sometimes it's nice to use the longer version to be explicit, but I'd consider the abbreviated aliases to be idiomatic.

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

In order to use Possum locally, download and install the [CLI tool](https://github.com/mulias/possum_parser_language/releases). Here's how we can run our parser, reading the puzzle input from `input.txt` and writing the parsed JSON to `input.json`.

```bash
possum -p 'table_sep(int, nl, nl+nl)' input.txt > input.json
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

For this one we'll use this example puzzle input listing three pairs of packets. The full input for this puzzle is over 400 lines long and many of the packets are significantly longer and more nested.
```
[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]
```

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=1) %}
"[" > int
{% end %}

To start, let's write a parser that will match just the first line, returning the packet as an array. We want to match the start and end square brackets, but not include them in the output. We can use the `>` and `<` operators to keep only the right or left parser's result, respectively, so parsing and returning the stuff in the middle will look something like `"[" > packet_values < "]"`. The packet values are `int`s separated by commas so this looks like another good place for `array_sep`.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=1) %}
"[" > array_sep(int, ",") < "]"
{% end %}

Now that we have a parser for the first packet, we can try parsing the full input with `table_sep`, similar to the final parser solution for [2022 day 1](#advent-of-code-2022-day-1). What do you think will be the result of running this parser? Hint: it isn't going to successfully parse the entire input.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=2) %}
packet = "[" > array_sep(int, ",") < "]"
table_sep(packet, nl, nl+nl)
{% end %}

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=2) %}
packet = "[" > array_sep(int | packet, ",") < "]"
table_sep(packet, nl, nl+nl)
{% end %}

This looks promissing, but there’s a bug. In the following example the input has been modified so that the second packet is empty. Our parser will still run, but it will only succeed at parsing the first pair of packets.

{% possum_example_large(input="[1,1,3,1,1]
[]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=2) %}
packet = "[" > array_sep(int | packet, ",") < "]"
table_sep(packet, nl, nl+nl)
{% end %}

The `array_sep(elem, sep)` parser only succeeds when the `elem` parser succeeds at least once, producing a non-empty array. This is because most of the time  For cases where we know that parsing nothing and returnign an empty array is ok, `maybe_array_sep(elem, sep)` will do just that.

{% possum_example_large(input="[1,1,3,1,1]
[]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=2) %}
packet = "[" > maybe_array_sep(int | packet, ",") < "]"
table_sep(packet, nl, nl+nl)
{% end %}

At this point we’ve successfully parsed the full input, but w
The first thing to notice is that each packet is already formatted as JSON. Possum has built in parsers for JSON encoded data, so
We could use the general `json` parser, but since we know each packet is a JSON
array we can be more specific and use the `json_array(elem)` parser.


{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=2) %}
packet = json_array(int | packet)
table_sep(packet, nl, nl+nl)
{% end %}

The puzzle description
instead of an array of arrays of packets, this data will probably be easier to use if it's formatted as an array of pairs, where each pair has a labeled left and right packet. To do this we can define a `pair` parser which parses two packets and returns them as an object.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=6) %}
packet = json_array(int | packet)
pair =
  packet -> L & nl & packet -> R $
  {"left": L, "right": R}

array_sep(pair, nl+nl)
{% end %}

The object literal syntax used in `pair` is very flexible, but it can be verbose. We can instead use the standard library parser `record2_sep(Key1, value1, sep, Key2, value2)`, which parses two values, `value1` and `value2`, separated by `sep`. The parsed values are turned into an object with value keys `Key1` and `Key2`.

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,[6]]]" input_rows=8 parser_rows=3) %}
packet = json_array(int | packet)
pair = record2_sep("left", packet, nl, "right", packet)
array_sep(pair, nl+nl)
{% end %}

## Conclusion


