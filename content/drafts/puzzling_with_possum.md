+++
title = "Puzzling with Possum: Parsing Inputs for Advent of Code"
[taxonomies]
tags = [ "possum", "parsing", "parser combinators", "~~~(##)'>" ]
[extra]
fix_the_dang_highlighting = "~~"
scripts = [ "possum.js" ]
+++

## [Advent of Code 2022, Day 1](https://adventofcode.com/2022/day/1)

> One important consideration is food - in particular, the number of Calories each Elf is carrying (your puzzle input).
>
> The Elves take turns writing down the number of Calories contained by the various meals, snacks, rations, etc. that they've brought with them, one item per line. Each Elf separates their own inventory from the previous Elf's inventory (if any) by a blank line.

As a first step we can parse a group of `integer`s which are each separated by a `newline`. We use `array_sep(p, sep)` to collect the integer values into an array. This will only parse the inventory of the first Elf, stopping when we find a second newline instead of an integer on line 4.

{% possum_example_large(input="1000
2000
3000

4000

5000
6000" input_rows=8 parser_rows=1) %}
array_sep(integer, newline)
{% end %}

To parse the entire input we want to parse each Elf's inventory and collect them all into an array. We can do this by wrapping our parser for a single inventory in another `array_sep`, but this time the parser for the separator is multiple `newlines`.

{% possum_example_large(input="1000
2000
3000

4000

5000
6000" input_rows=8 parser_rows=1) %}
array_sep(array_sep(integer, newline), newlines)
{% end %}

Arrays of arrays come up frequently enough that there's a standard library parser called `table_sep(p, sep, row_sep)` for this use case. Intuitively `table_sep` is for tabular data such as rows of comma separated values. While this puzzle input does not visually look like a table it's structurally equivalent, with a `newline` separating each inventory item and `newlines` separating each inventory "row".

{% possum_example_large(input="1000
2000
3000

4000

5000
6000" input_rows=8 parser_rows=1) %}
table_sep(integer, newline, newlines)
{% end %}

Possum's standard library includes shortened aliases for a number of the most common parsers. We can abbreviate `integer` to `int`, `newline` to `nl`, and `newlines` to `nls`. Sometimes it's nice to use the longer version to be explicit, but I'd consider the abbreviated aliases to be more idomatic.

Finally, we use the `+` operator to create the parser `nl + nl`, which will parse exactly two newlines. Using this parser in place of `nls` is a bit more specific, since we know that the input format is always going to have two newlines between inventories. This isn't terribly important, but it feels like a nice touch.

{% possum_example_large(input="1000
2000
3000

4000

5000
6000" input_rows=8 parser_rows=1) %}
table_sep(int, nl, nl+nl)
{% end %}

## [Advent of Code 2022, Day 13](https://adventofcode.com/2022/day/13)

> Your handheld device must still not be working properly; the packets from the distress signal got decoded out of order. You'll need to re-order the list of received packets (your puzzle input) to decode the message.
>
> Your list consists of pairs of packets; pairs are separated by a blank line.
>
> ...
>
> Packet data consists of lists and integers. Each list starts with [, ends with ], and contains zero or more comma-separated values (either integers or other lists). Each packet is always a list and appears on its own line.
>
> When comparing two values, the first value is called <strong>left</strong> and the second value is called <strong>right</strong>.

This input looks kind of like [2022 day 1](#advent-of-code-2022-day-1) ! Packets are separated by newlines, and pairs are separated by two newlines. We don't know how parse the indevidual packets, but otherwise this follows the same `table_sep` structure. to The `line` parser matches any text left on the current line,

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,6]]" input_rows=8 parser_rows=1) %}
table_sep(line, nl, nl+nl)
{% end %}

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,6]]" input_rows=8 parser_rows=2) %}
packet = "[" > array_sep(int | packet, ",") < "]"
table_sep(packet, nl, nl+nl)
{% end %}

This looks pretty good, but there's a bug.
{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,6]]" input_rows=8 parser_rows=2) %}
packet = "[" > maybe_array_sep(int | packet, ",") < "]"
table_sep(packet, nl, nl+nl)
{% end %}

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,6]]" input_rows=8 parser_rows=1) %}
table_sep(json_array, nl, nl+nl)
{% end %}

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,6]]" input_rows=8 parser_rows=6) %}
pair =
  json_array -> L & nl & json_array -> R $
  {"left": L, "right": R}

array_sep(pair, nl+nl)
{% end %}

{% possum_example_large(input="[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,6]]" input_rows=8 parser_rows=3) %}
pair = record2_sep("left", json_array, nl, "right", json_array)
array_sep(pair, nl+nl)
{% end %}

## [Advent of Code 2023, Day 2](https://adventofcode.com/2023/day/2)

> As you walk, the Elf shows you a small bag and some cubes which are either red, green, or blue. Each time you play this game, he will hide a secret number of cubes of each color in the bag, and your goal is to figure out information about the number of cubes.
>
> To get information, once a bag has been loaded with cubes, the Elf will reach into the bag, grab a handful of random cubes, show them to you, and then put them back in the bag. He'll do this a few times per game.
>
> You play several games and record the information from each game (your puzzle input). Each game is listed with its ID number (like the 11 in Game 11: ...) followed by a semicolon-separated list of subsets of cubes that were revealed from the bag (like 3 red, 5 green, 4 blue).

This puzzle input is pretty dense with information, so we'll have to break it down into a bunch of small steps.

{% possum_example_large(input="Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green" input_rows=5 parser_rows=1) %}
"Game 1: " > int
{% end %}

{% possum_example_large(input="Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green" input_rows=5 parser_rows=6) %}
cube_count = int -> Count & space & word -> Color $ {Color: Count}

"Game 1: " > cube_count
{% end %}

{% possum_example_large(input="Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green" input_rows=5 parser_rows=8) %}

cube_count = int -> Count & space & word -> Color $ {Color: Count}

cube_set = many_sep(cube_count, ", ")

"Game 1: " > cube_set
{% end %}

{% possum_example_large(input="Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green" input_rows=5 parser_rows=10) %}
cube_count = int -> Count & space & word -> Color $ {Color: Count}

cube_set = many_sep(cube_count, ", ")

game_sets = array_sep(cube_set, "; ")

"Game 1: " > game_sets
{% end %}

{% possum_example_large(input="Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green" input_rows=5 parser_rows=14) %}
cube_count = int -> Count & space & word -> Color $ {Color: Count}

cube_set = many_sep(cube_count, ", ")

game_sets = array_sep(cube_set, "; ")

game_id = "Game " > int

game = record2_sep("gameId", game_id, ": ", "cubeSets", game_sets)

array_sep(game, nl)
{% end %}

{% possum_example_large(input="Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green" input_rows=5 parser_rows=16) %}
NoCubes = {"red": 0, "green": 0, "blue": 0}

color = "red" | "green" | "blue"

cube_count = int -> Count & space & color -> Color $ {Color: Count}

cube_set = const(NoCubes()) + many_sep(cube_count, ", ")

game_sets = array_sep(cube_set, "; ")

game_id = "Game " > int

game = record2_sep("gameId", game_id, ": ", "cubeSets", game_sets)

array_sep(game, nl)
{% end %}

## [Advent of Code 2022, Day 5](https://adventofcode.com/2022/day/5)

> The ship has a giant cargo crane capable of moving crates between stacks. To ensure none of the crates get crushed or fall over, the crane operator will rearrange them in a series of carefully-planned steps. After the crates are rearranged, the desired crates will be at the top of each stack.
>
> The Elves don't want to interrupt the crane operator during this delicate procedure, but they forgot to ask her which crate will end up where, and they want to be ready to unload them as soon as possible so they can embark.
>
> They do, however, have a drawing of the starting stacks of crates and the rearrangement procedure (your puzzle input).

{% possum_example_large(input="    [D]     [W]
[N] [C]     [X]
[Z] [M] [P] [A]
 1   2   3   4   5

move 1 from 2 to 1
move 3 from 1 to 5
move 2 from 2 to 3
move 1 from 1 to 2" input_rows=9 parser_rows=6) %}
crate = "[" > upper < "]"
no_crate = "   " $ null
cargo = crate | no_crate

table_sep(cargo, space, nl)
{% end %}

{% possum_example_large(input="    [D]     [W]
[N] [C]     [X]
[Z] [M] [P] [A]
 1   2   3   4   5

move 1 from 2 to 1
move 3 from 1 to 5
move 2 from 2 to 3
move 1 from 1 to 2" input_rows=9 parser_rows=13) %}
crate = "[" > upper < "]"
no_crate = "   " $ null
cargo = crate | no_crate

step =
  "move %(number -> C) from %(numeral -> F) to %(numeral -> T)" $
  {"count": C, "from": F, "to": T}

table_sep(cargo, space, nl) -> CargoRows & ws &
line & ws &
array_sep(step, nl) -> Steps $
{"cargo": CargoRows, "steps": Steps}
{% end %}

{% possum_example_large(input="    [D]     [W]
[N] [C]     [X]
[Z] [M] [P] [A]
 1   2   3   4   5

move 1 from 2 to 1
move 3 from 1 to 5
move 2 from 2 to 3
move 1 from 1 to 2" input_rows=9 parser_rows=20) %}
crate = "[" > upper < "]"
no_crate = "   " $ null
cargo = crate | no_crate

step =
  "move %(number -> C) from %(numeral -> F) to %(numeral -> T)" $
  {"count": C, "from": F, "to": T}

Stacks(Labels, CargoRows) =
  RotateTableClockwise(CargoRows) -> CargoCols &
  ZipIntoObject(Labels, CargoCols)

table_sep(cargo, space, nl) -> CargoRows & ws &
array_sep(numeral, ws) -> Labels & ws &
array_sep(step, nl) -> Steps $
{"stacks": Stacks(Labels, CargoRows), "steps": Steps}
{% end %}

{% possum_example_large(input="    [D]     [W]
[N] [C]     [X]
[Z] [M] [P] [A]
 1   2   3   4   5

move 1 from 2 to 1
move 3 from 1 to 5
move 2 from 2 to 3
move 1 from 1 to 2" input_rows=9 parser_rows=20) %}
crate = "[" > upper < "]"
no_crate = "   " $ null
cargo = crate | no_crate

step =
  "move %(number -> C) from %(numeral -> F) to %(numeral -> T)" $
  {"count": C, "from": F, "to": T}

RejectNull(Array) = Reject(Array, IsNull)

Stacks(Labels, CargoRows) =
  RotateTableClockwise(CargoRows) -> CargoCols &
  Map(CargoCols, RejectNull) -> CrateCols &
  ZipIntoObject(Labels, CrateCols)

table_sep(cargo, space, nl) -> CargoRows & ws &
array_sep(numeral, ws) -> Labels & ws &
array_sep(step, nl) -> Steps $
{"stacks": Stacks(Labels, CargoRows), "steps": Steps}
{% end %}
