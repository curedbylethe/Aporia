# Ghostty

1. From this directory, copy the themes:

   ```sh
   mkdir -p ~/.config/ghostty/themes
   cp lacuna-paper lacuna-ink ~/.config/ghostty/themes/
   ```

2. Add this to `~/.config/ghostty/config`:

   ```ini
   theme = light:lacuna-paper,dark:lacuna-ink
   ```

3. Reload Ghostty's configuration. For one theme only, use `theme = lacuna-ink` or `theme = lacuna-paper`.
