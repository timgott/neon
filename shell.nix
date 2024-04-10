{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = [ pkgs.sage pkgs.fricas ];

  shellHook = ''
    echo Run sage -n=jupyterlab
  '';
}
