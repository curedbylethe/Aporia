# Installing Lacuna

All paths below start at the repository root after `npm run build`. Both **Paper** (light) and **Ink** (dark) are included.

| Host | Install location | Theme selection |
|---|---|---|
| Helix | `~/.config/helix/themes/` | `theme = "lacuna-ink"` |
| Zed | `~/.config/zed/themes/` | `"theme": "Lacuna Ink"` |
| VS Code | `~/.vscode/extensions/aporia.lacuna-0.1.0/` | `Lacuna Ink` in Color Theme picker |
| Kitty | `~/.config/kitty/themes/` | `include themes/lacuna-ink.conf` |
| Ghostty | `~/.config/ghostty/themes/` | `theme = lacuna-ink` |
| Alacritty | `~/.config/alacritty/themes/` | import the relevant TOML file |
| WezTerm | `~/.config/wezterm/colors/` | `require('colors.lacuna-ink')` |

## Helix

```sh
mkdir -p ~/.config/helix/themes
cp dist/helix/lacuna-paper.toml dist/helix/lacuna-ink.toml ~/.config/helix/themes/
```

In `~/.config/helix/config.toml`:

```toml
theme = "lacuna-ink"  # or "lacuna-paper"
```

You can change the theme interactively with `:theme lacuna-paper`. Helix uses Tree-sitter captures; actual token categories depend on your installed grammars.

## Zed

```sh
mkdir -p ~/.config/zed/themes
cp dist/zed/lacuna.json ~/.config/zed/themes/
```

Use the Zed theme picker to select Lacuna Paper or Lacuna Ink. For automatic system switching, in Zed's `settings.json`:

```json
{
  "theme": {
    "mode": "system",
    "light": "Lacuna Paper",
    "dark": "Lacuna Ink"
  }
}
```

The `dist/zed/` directory also contains `extension.toml` and `themes/lacuna.json` for developing a Zed theme extension. The manifest contains a **planned, not verified** GitHub repository URL; verify or replace it before publishing. The published v0.2.0 family schema is referenced by the generated JSON; actual installed-version validation is still recommended.

## VS Code

The generated `dist/vscode/` directory is a local color-theme extension (contains its own `package.json` and `themes/` files).

```sh
mkdir -p ~/.vscode/extensions/aporia.lacuna-0.1.0
cp -R dist/vscode/. ~/.vscode/extensions/aporia.lacuna-0.1.0/
```

Restart or reload VS Code and select **Lacuna Paper** or **Lacuna Ink** via *Preferences → Color Theme*. For distribution through the marketplace, first choose a publisher and license, then package and test the extension with your preferred VS Code extension tooling. The repository doesn't claim a published marketplace extension.

## Kitty

```sh
mkdir -p ~/.config/kitty/themes
cp dist/kitty/*.conf ~/.config/kitty/themes/
```

Add this to your `~/.config/kitty/kitty.conf`:

```conf
include themes/lacuna-ink.conf
```

To switch modes, change the `include` to `themes/lacuna-paper.conf` and reload Kitty's configuration.

## Ghostty

```sh
mkdir -p ~/.config/ghostty/themes
cp dist/ghostty/lacuna-paper dist/ghostty/lacuna-ink ~/.config/ghostty/themes/
```

Add to your Ghostty `~/.config/ghostty/config`:

```ini
theme = light:lacuna-paper,dark:lacuna-ink
```

Or set `theme = lacuna-ink` to use only Ink. See Ghostty's [theme documentation](https://ghostty.org/docs/features/theme) for supported lookup directories and light/dark behavior.

## Alacritty

```sh
mkdir -p ~/.config/alacritty/themes
cp dist/alacritty/*.toml ~/.config/alacritty/themes/
```

Add the import to the Alacritty TOML config (top-level `[general]` in current versions):

```toml
[general]
import = ["~/.config/alacritty/themes/lacuna-ink.toml"]
```

Change `ink` to `paper` for light mode. If you already have `[general]`, add `import` to that existing section rather than making a duplicate table.

## WezTerm

```sh
mkdir -p ~/.config/wezterm/colors
cp dist/wezterm/*.lua ~/.config/wezterm/colors/
```

In your WezTerm Lua config (for example `~/.config/wezterm/wezterm.lua`):

```lua
local wezterm = require('wezterm')
local config = wezterm.config_builder()
config.colors = require('colors.lacuna-ink') -- or 'colors.lacuna-paper'
return config
```

If your configuration file is located elsewhere (such as `~/.wezterm.lua`), move the `colors/` folder alongside it or add that directory to Lua's module search path.

## Web applications

Include `dist/web/aporia.css` and choose the Paper or Ink mode:

```html
<link rel="stylesheet" href="/styles/aporia.css">
<html data-theme="paper">
```

In CSS, use `var(--bg-canvas)`, `var(--fg-primary)`, `var(--syntax-keyword)`, etc., or consume `dist/web/tokens.resolved.json` from a build script. See [ARCHITECTURE.md](ARCHITECTURE.md) for the token ownership model.
