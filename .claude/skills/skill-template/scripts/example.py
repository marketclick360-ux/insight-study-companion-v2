#!/usr/bin/env python3
"""Example skill script.

Scripts hold deterministic logic so it runs the same way every time and does
NOT consume context — only what this prints is injected back to Claude.
Replace this body with whatever your skill needs to compute, validate, or fetch.
"""

import sys


def main() -> int:
    args = sys.argv[1:]
    print(f"example.py ran with arguments: {args!r}")
    print("Replace this with real logic; print results for Claude to read.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
