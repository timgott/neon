{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = [ pkgs.sage pkgs.fricas pkgs.nodejs_21 pkgs.pandoc pkgs.entr ];

  shellHook = ''
    echo
    echo 'Run:'
    echo '  sage -n=jupyterlab'
    echo
  '';
}
