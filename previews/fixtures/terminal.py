"""Stable ANSI specimen for Paper and Ink terminal captures."""

print("\x1b[1mLACUNA / TERMINAL SPECIMEN\x1b[0m")
print("16 ANSI slots and terminal defaults\n")
for first in (0, 8):
    for index in range(first, first + 8):
        print(f"\x1b[48;5;{index}m    \x1b[0m  ", end="")
    print()
    for index in range(first, first + 8):
        print(f"{index:02}    ", end="")
    print("\n")
print("\x1b[1mTheme source\x1b[0m    dist/kitty/")
print("\x1b[1mReference\x1b[0m       resolve.ts")
print("\x1b[1mANSI 00\x1b[0m         Background slot in Ink")
