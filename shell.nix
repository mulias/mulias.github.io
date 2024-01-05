{ pkgs ? import <nixpkgs> { } }:
with pkgs;

pkgs.mkShell {
  buildInputs = [ zola ];
}
