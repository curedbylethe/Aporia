# Web

1. Copy `aporia.css` to your application's public styles directory.
2. Link the file in your HTML and set the theme on the root element:

   ```html
   <html data-theme="paper">
   <head><link rel="stylesheet" href="/styles/aporia.css"></head>
   ```

3. Use `data-theme="ink"` for the dark theme. Use tokens in CSS, for example `color: var(--fg-primary);`.
