+++
title = "Nix flakes have built in templates and they're good actually"
[taxonomies]
tags = [ "nix", "nix flake templates", "tooling", "today i learned" ]
+++

Nix [flakes](https://nixos.wiki/wiki/Flakes) come with a templating system to quickly initialize a project with a dev environment that's specialized to a specific language or framework. I've been using Nix for years and had no idea this was a feature!

Shout out to [Thomas Kelly](https://github.com/thomassdk) for walking me through this little exercise and probably saving me hours of configuration time on future projects. Thanks Thomas!

## Setup

Nix flakes are "experimental" even though they've been around for years and seem pretty popular. You might have to do a little extra config work to get the feature enabled.

For `NixOS` this means updating `/etc/nixos/configuration.nix` to add this line:
```nix
nix.settings.experimental-features = [ "nix-command" "flakes" ];
```

For `Nix` without the `OS` part see [config instructions in the docs](https://nixos.wiki/wiki/Flakes#Enable_flakes_permanently_in_NixOS).

## Finding templates

List the official templates:
```
$ nix flake show templates
github:NixOS/templates/98bc26d94008617aac7cd0244fb09ff04d6c8cf6
├───defaultTemplate: template: A very basic flake
└───templates
    ├───bash-hello: template: An over-engineered Hello World in bash
    ├───c-hello: template: An over-engineered Hello World in C
    ├───compat: template: A default.nix and shell.nix for backward compatibility with Nix installations that don't support flakes
    ├───full: template: A template that shows all standard flake outputs
    ├───go-hello: template: A simple Go package
    ├───haskell-hello: template: A Hello World in Haskell with one dependency
    ├───haskell-nix: template: An haskell.nix template using hix
    ├───hercules-ci: template: An example for Hercules-CI, containing only the necessary attributes for adding to your project.
    ├───pandoc-xelatex: template: A report built with Pandoc, XeLaTex and a custom font
    ├───python: template: Python template, using poetry2nix
    ├───rust: template: Rust template, using Naersk
    ├───rust-web-server: template: A Rust web server including a NixOS module
    ├───simpleContainer: template: A NixOS container running apache-httpd
    └───trivial: template: A very basic flake
```
I'm told these are not necessarily the best templates to use, since they have pretty limited scope and tend to be out of date.

List community maintained templates from a github repo:
```
$ nix flake show github:the-nix-way/dev-templates
github:the-nix-way/dev-templates/0ea67a261e12a8d02d773cdc588baccf8397cc25
└───templates
    ├───clojure: template: Clojure development environment
    ├───csharp: template: C# development environment
    ├───cue: template: Cue development environment
    ├───dhall: template: Dhall development environment
    ├───elixir: template: Elixir development environment
    ├───elm: template: Elm development environment
    ├───gleam: template: Gleam development environment
    ├───go: template: Go (Golang) development environment
    ├───hashi: template: HashiCorp DevOps tools development environment
    ├───haskell: template: Haskell development environment
    ├───java: template: Java development environment
    ├───kotlin: template: Kotlin development environment
    ├───latex: template: LaTeX development environment
    ├───nickel: template: Nickel development environment
    ├───nim: template: Nim development environment
    ├───nix: template: Nix development environment
    ├───node: template: Node.js development environment
    ├───opa: template: Open Policy Agent development environment
    ├───php: template: PHP development environment
    ├───protobuf: template: Protobuf development environment
    ├───pulumi: template: Pulumi development environment
    ├───purescript: template: Purescript development environment
    ├───python: template: Python development environment
    ├───rt: template: Rust development environment with Rust version defined by a rust-toolchain.toml file
    ├───ruby: template: Ruby development environment
    ├───rust: template: Rust development environment
    ├───rust-toolchain: template: Rust development environment with Rust version defined by a rust-toolchain.toml file
    ├───scala: template: Scala development environment
    ├───shell: template: Shell script development environment
    └───zig: template: Zig development environment
```
Thomas rec'd [The Nix Way](https://github.com/the-nix-way/dev-templates) as a high quality source of templates!

## Using a template

Initialize a rust template in the current directory:

```
$ nix flake init -t github:the-nix-way/dev-templates#rust
wrote: /home/elias/src/nix-test-too/flake.nix
wrote: /home/elias/src/nix-test-too/flake.lock
wrote: /home/elias/src/nix-test-too/.envrc
```

The generated `flake.nix` defines a baseline development environment for rust projects, while `flake.lock` acts as a package lock file to track when versions change. Bonus points for the `.envrc` file to hook into [direnv](https://direnv.net/) and auto-load the flake when entering the directory!

Assuming we don't have `direnv`, we can use `nix develop` to enter a new dev shell based on the flake:
```
$ nix develop
[dev shell] $ cargo init
     Created binary (application) package
[dev shell] $ cargo run
Hello, world!
```

## Flake integration with Git is kind of weird

If you're working in a directory that uses Git for version control then your flake files will only work once you `git add` them to the project. This is mentioned [extremely briefly](https://nixos.wiki/wiki/Flakes#Git_WARNING) in the docs. If you aren't using Git then flakes will work fine.

In the rust example above the directory starts out without version control, but gets initialized with a git repo as part of `cargo init`. This means if you exit the dev shell and then try to re-run `nix develop` in the newly version controlled repo you'll get a cryptic error message:

```
$ nix develop
warning: Git tree is dirty
error: getting status of '/nix/store/0ccnxa25whszw7mgbgyzdm4nqc0zwnm8-source/flake.nix': No such file or directory
$ git add flake.nix flake.lock
$ nix develop
warning: Git tree is dirty
[dev shell] $ cargo run
Hello, world!
```

## Open questions, further reading

For the first time in a good while I'm actually excited to learn more about how Nix works!

With regards to flakes I'm still wondering how I'll go about finding a good flake template for less common dev environments. I also anticipate some issues with using flakes on version controlled projects where I can't check in the generated files. Not every project is interested in taking on Nix tooling, and in the past I've dealt with that by just not checking in my nix shell config to version control.

A few resources I'd like to follow up with to deepen my understanding:

- More details about flakes [https://jvns.ca/blog/2023/11/11/notes-on-nix-flakes/](https://jvns.ca/blog/2023/11/11/notes-on-nix-flakes/)

- A practical guide to using Nix with a focus on flakes [https://zero-to-nix.com/](https://zero-to-nix.com/)
