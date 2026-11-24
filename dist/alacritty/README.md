# Alacritty

1. From this directory, copy the themes:

   ```sh
   mkdir -p ~/.config/alacritty/themes
   cp lacuna-*.toml ~/.config/alacritty/themes/
   ```

2. Add the import to `~/.config/alacritty/alacritty.toml`. Use the existing `[general]` section if present.

   ```toml
   [general]
   import = ["~/.config/alacritty/themes/lacuna-ink.toml"]
   ```

3. Replace `ink` with `paper` for the light theme.
