{ pkgs ? import <nixpkgs> {} }:
let
unstable = import <nixos-unstable> {};
in
pkgs.mkShell {
  packages = [ unstable.sage pkgs.fricas ];

  shellHook = ''
    echo
    echo 'Run:'
    echo '  sage -n=jupyterlab'
    echo
  '';
}
