{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = [ pkgs.pandoc pkgs.typescript ];
}
