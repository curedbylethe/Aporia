# WezTerm

1. From this directory, copy the themes:

   ```sh
   mkdir -p ~/.config/wezterm/colors
   cp lacuna-*.lua ~/.config/wezterm/colors/
   ```

2. Add the colors to `~/.config/wezterm/wezterm.lua`:

   ```lua
   local wezterm = require('wezterm')
   local config = wezterm.config_builder()
   config.colors = require('colors.lacuna-ink')
   return config
   ```

   If you already have a config, add only the `config.colors` line before its `return`.
3. Replace `ink` with `paper` for the light theme. If your config is elsewhere, place `colors/` alongside it or add the directory to Lua's module search path.
