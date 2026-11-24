# Kitty

1. From this directory, copy the themes:

   ```sh
   mkdir -p ~/.config/kitty/themes
   cp lacuna-*.conf ~/.config/kitty/themes/
   ```

2. Add this to `~/.config/kitty/kitty.conf`:

   ```conf
   include themes/lacuna-ink.conf
   ```

3. Reload Kitty's configuration. Replace `ink` with `paper` for the light theme.
