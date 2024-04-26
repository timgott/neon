{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = [ pkgs.pandoc pkgs.typescript pkgs.entr pkgs.nodePackages.live-server ];

  shellHook = ''
    echo
    echo Run:
    echo '  ls *.md *.js | entr make'
    echo '  live-server'
    echo
  '';
}
