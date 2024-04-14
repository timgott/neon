{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = [ pkgs.pandoc pkgs.entr pkgs.nodePackages.live-server ];

  shellHook = ''
    echo
    echo Run:
    echo '  ls *.md | entr -s make'
    echo '  live-server'
    echo
  '';
}
