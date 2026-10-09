#!/usr/bin/env bash
# make-repo.sh: builds the practice repository for TechBytes workshop 5.
# Run it once:  bash make-repo.sh   (Terminal on macOS/Linux, Git Bash on Windows)
# It creates a folder called git-lab next to this script. Every commit has a
# fixed author, committer and date, so everyone in the room gets the same hashes.
# Needs only bash and git 2.23 or newer.
set -eu

if [ -e git-lab ]; then
  echo "git-lab already exists. Delete it first (rm -rf git-lab) or run this somewhere else." >&2
  exit 1
fi
git --version >/dev/null 2>&1 || { echo "git is not installed or not on PATH" >&2; exit 1; }

T=1772442000     # 2026-03-02 09:00 UTC; each commit lands one hour after the previous one

commit() {       # commit "subject" [ola]   -- Maja is the default author, Ola the other one
  T=$((T + 3600))
  export GIT_AUTHOR_DATE="$T +0000" GIT_COMMITTER_DATE="$T +0000"
  if [ "${2:-}" = "ola" ]; then
    export GIT_AUTHOR_NAME="Ola Berg" GIT_AUTHOR_EMAIL="ola@example.com"
  else
    export GIT_AUTHOR_NAME="Maja Lindqvist" GIT_AUTHOR_EMAIL="maja@example.com"
  fi
  export GIT_COMMITTER_NAME="Maja Lindqvist" GIT_COMMITTER_EMAIL="maja@example.com"
  git add -A
  for f in temp.sh test.sh; do   # keep the scripts executable even on Windows filesystems
    git ls-files --error-unmatch "$f" >/dev/null 2>&1 && git update-index --chmod=+x "$f"
  done
  git commit -q -m "$1"
}

mkdir git-lab && cd git-lab
git init -q
git symbolic-ref HEAD refs/heads/main     # name the first branch "main" on any git version
git config core.autocrlf false
git config commit.gpgsign false
git config tag.gpgsign false

# ---------------------------------------------------------------- main, part 1
cat > README.md <<'EOF'
# tempconv

A tiny temperture converter.
EOF
commit "Initial commit"

cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert degrees Celsius to Fahrenheit.
# Usage: ./temp.sh DEGREES
c=$1
echo $(( c * 9 / 5 + 32 ))
EOF
chmod +x temp.sh
commit "Add temp.sh: Celsius to Fahrenheit"

cat > test.sh <<'EOF'
#!/usr/bin/env bash
# test.sh: run the converter against known answers. Exits 1 if anything fails.
fail=0
check() {
  got=$(./temp.sh $1)
  if [ "$got" = "$2" ]; then echo "ok    $1 -> $got"
  else echo "FAIL  $1 -> $got (wanted $2)"; fail=1; fi
}
check 100 212
check 0 32
check -40 -40
exit $fail
EOF
chmod +x test.sh
commit "Add test.sh with three known answers"

cat > LICENSE <<'EOF'
MIT License

Copyright (c) 2026 Maja Lindqvist

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
commit "Add MIT license"

printf '*.log\n*.tmp\n' > .gitignore
commit "Add .gitignore"

cat > README.md <<'EOF'
# tempconv

A tiny temperture converter.

## Usage

    ./temp.sh 100      # prints 212
EOF
commit "README: usage section"

cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
n=$1
unit=${2:-c}
case $unit in
  c) echo $(( n * 9 / 5 + 32 )) ;;
  f) echo $(( (n - 32) * 5 / 9 )) ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
commit "Add Fahrenheit to Celsius (./temp.sh 212 f)" ola

cat > test.sh <<'EOF'
#!/usr/bin/env bash
# test.sh: run the converter against known answers. Exits 1 if anything fails.
fail=0
check() {
  got=$(./temp.sh $1)
  if [ "$got" = "$2" ]; then echo "ok    $1 -> $got"
  else echo "FAIL  $1 -> $got (wanted $2)"; fail=1; fi
}
check 100 212
check 0 32
check -40 -40
check "212 f" 100
check "32 f" 0
exit $fail
EOF
commit "test.sh: cover Fahrenheit to Celsius" ola

cat > CHANGELOG.md <<'EOF'
# Changelog

## Unreleased

- Convert from Fahrenheit with `./temp.sh N f`.
- Convert from Celsius with `./temp.sh N`.
EOF
commit "Add CHANGELOG"

mkdir -p docs
cat > docs/usage.md <<'EOF'
# Using tempconv

`temp.sh` takes a whole number of degrees and a unit letter.

| command            | prints |
|--------------------|--------|
| `./temp.sh 100`    | 212    |
| `./temp.sh 212 f`  | 100    |
EOF
commit "docs: usage table"

cat > README.md <<'EOF'
# tempconv

A tiny temperture converter.

## Usage

    ./temp.sh 100      # prints 212

## Install

Copy `temp.sh` anywhere on your PATH. It needs bash and nothing else.
EOF
commit "README: install section"

cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
if [ "${1:-}" = "--help" ]; then
  echo "tempconv 1.0"
  echo "usage: temp.sh DEGREES [c|f]"
  exit 0
fi
n=$1
unit=${2:-c}
case $unit in
  c) echo $(( n * 9 / 5 + 32 )) ;;
  f) echo $(( (n - 32) * 5 / 9 )) ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
commit "Add --help"

cat > CHANGELOG.md <<'EOF'
# Changelog

## 1.0

- Convert from Fahrenheit with `./temp.sh N f`.
- Convert from Celsius with `./temp.sh N`.
EOF
commit "Release 1.0"
git tag v1.0

cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
c_to_f() { echo $(( $1 * 9 / 5 + 32 )); }
f_to_c() { echo $(( ($1 - 32) * 5 / 9 )); }

if [ "${1:-}" = "--help" ]; then
  echo "tempconv 1.0"
  echo "usage: temp.sh DEGREES [c|f]"
  exit 0
fi
n=$1
unit=${2:-c}
case $unit in
  c) c_to_f "$n" ;;
  f) f_to_c "$n" ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
commit "Refactor: one function per conversion"

# ------------------------- feature/kelvin: four messy commits, for the rebase
git switch -q -c feature/kelvin
cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
c_to_f() { echo $(( $1 * 9 / 5 + 32 )); }
f_to_c() { echo $(( ($1 - 32) * 5 / 9 )); }
k_to_c() { echo $(( $1 - 272 )); }

if [ "${1:-}" = "--help" ]; then
  echo "tempconv 1.0"
  echo "usage: temp.sh DEGREES [c|f]"
  exit 0
fi
n=$1
unit=${2:-c}
case $unit in
  c) c_to_f "$n" ;;
  f) f_to_c "$n" ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
commit "WIP" ola

cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
c_to_f() { echo $(( $1 * 9 / 5 + 32 )); }
f_to_c() { echo $(( ($1 - 32) * 5 / 9 )); }
k_to_c() { echo $(( $1 - 272 )); }

if [ "${1:-}" = "--help" ]; then
  echo "tempconv 1.0"
  echo "usage: temp.sh DEGREES [c|f]"
  exit 0
fi
n=$1
unit=${2:-c}
case $unit in
  c) c_to_f "$n" ;;
  f) f_to_c "$n" ;;
  k) k_to_c "$n" ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
commit "wip kelvin" ola

cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
c_to_f() { echo $(( $1 * 9 / 5 + 32 )); }
f_to_c() { echo $(( ($1 - 32) * 5 / 9 )); }
k_to_c() { echo $(( $1 - 273 )); }

if [ "${1:-}" = "--help" ]; then
  echo "tempconv 1.0"
  echo "usage: temp.sh DEGREES [c|f]"
  exit 0
fi
n=$1
unit=${2:-c}
case $unit in
  c) c_to_f "$n" ;;
  f) f_to_c "$n" ;;
  k) k_to_c "$n" ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
commit "fix" ola

cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f|k]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
#   k = from Kelvin to Celsius
c_to_f() { echo $(( $1 * 9 / 5 + 32 )); }
f_to_c() { echo $(( ($1 - 32) * 5 / 9 )); }
k_to_c() { echo $(( $1 - 273 )); }

if [ "${1:-}" = "--help" ]; then
  echo "tempconv 1.0"
  echo "usage: temp.sh DEGREES [c|f|k]"
  exit 0
fi
n=$1
unit=${2:-c}
case $unit in
  c) c_to_f "$n" ;;
  f) f_to_c "$n" ;;
  k) k_to_c "$n" ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
cat > test.sh <<'EOF'
#!/usr/bin/env bash
# test.sh: run the converter against known answers. Exits 1 if anything fails.
fail=0
check() {
  got=$(./temp.sh $1)
  if [ "$got" = "$2" ]; then echo "ok    $1 -> $got"
  else echo "FAIL  $1 -> $got (wanted $2)"; fail=1; fi
}
check 100 212
check 0 32
check -40 -40
check "212 f" 100
check "32 f" 0
check "300 k" 27
exit $fail
EOF
commit "WIP tests and help" ola
git switch -q main

# ---------------------------------- main, part 2: the commit that breaks a test
cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
c_to_f() { echo $(( $1 * 9 / 5 + 32 )); }
f_to_c() { echo $(( $1 - 32 * 5 / 9 )); }

if [ "${1:-}" = "--help" ]; then
  echo "tempconv 1.0"
  echo "usage: temp.sh DEGREES [c|f]"
  exit 0
fi
n=$1
unit=${2:-c}
case $unit in
  c) c_to_f "$n" ;;
  f) f_to_c "$n" ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
commit "Simplify f_to_c arithmetic"

cat > CHANGELOG.md <<'EOF'
# Changelog

## Unreleased

- Internal: one function per conversion.

## 1.0

- Convert from Fahrenheit with `./temp.sh N f`.
- Convert from Celsius with `./temp.sh N`.
EOF
commit "CHANGELOG: note the refactor"

cat > docs/usage.md <<'EOF'
# Using tempconv

`temp.sh` takes a whole number of degrees and a unit letter.

| command            | prints |
|--------------------|--------|
| `./temp.sh 100`    | 212    |
| `./temp.sh 212 f`  | 100    |

## Examples

Body temperature in Fahrenheit: `./temp.sh 37` prints 98 (whole degrees only).
EOF
commit "docs: examples" ola

cat > README.md <<'EOF'
# tempconv

A tiny temperture converter.

## Usage

    ./temp.sh 100      # prints 212

## Install

Copy `temp.sh` anywhere on your PATH. It needs bash and nothing else.

## Contributing

Run `./test.sh` before you push. Every conversion needs a line in it.
EOF
commit "README: contributing section"

# ------------------------------ experiment/color: the branch somebody deletes
git switch -q -c experiment/color
cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
c_to_f() { echo $(( $1 * 9 / 5 + 32 )); }
f_to_c() { echo $(( $1 - 32 * 5 / 9 )); }

if [ "${1:-}" = "--help" ]; then
  echo "tempconv 1.0"
  echo "usage: temp.sh DEGREES [c|f]"
  exit 0
fi
n=$1
unit=${2:-c}
case $unit in
  c) printf '\033[1;31m%s\033[0m\n' "$(c_to_f "$n")" ;;
  f) f_to_c "$n" ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
commit "Print Fahrenheit in red" ola
cat >> docs/usage.md <<'EOF'

Fahrenheit results are printed in red on terminals that support colour.
EOF
commit "docs: mention the colour" ola
git switch -q main

cat > test.sh <<'EOF'
#!/usr/bin/env bash
# test.sh: run the converter against known answers. Exits 1 if anything fails.
fail=0
check() {
  got=$(./temp.sh $1)
  if [ "$got" = "$2" ]; then echo "ok    $1 -> $got"
  else echo "FAIL  $1 -> $got (wanted $2)"; fail=1; fi
}
check 100 212
check 0 32
check -40 -40
check "212 f" 100
check "32 f" 0
if [ $fail = 0 ]; then echo "all tests passed"; else echo "some tests FAILED"; fi
exit $fail
EOF
commit "test.sh: print a summary line"

cat > CONTRIBUTING.md <<'EOF'
# Contributing

1. Make a branch.
2. Add a test in `test.sh` for anything you change.
3. Run `./test.sh`; it must print `all tests passed`.
4. Open a pull request. Squash your WIP commits first.
EOF
commit "Add CONTRIBUTING.md"

# ------------------ feature/tagline: edits the same README line as main will
git switch -q -c feature/tagline
cat > README.md <<'EOF'
# tempconv

A tiny temperture converter for the shell.

## Usage

    ./temp.sh 100      # prints 212

## Install

Copy `temp.sh` anywhere on your PATH. It needs bash and nothing else.

## Contributing

Run `./test.sh` before you push. Every conversion needs a line in it.
EOF
commit "README: longer tagline" ola
cat > README.md <<'EOF'
# tempconv

A tiny temperture converter for the shell.

## Usage

    ./temp.sh 100      # prints 212
    ./temp.sh 212 f    # prints 100

## Install

Copy `temp.sh` anywhere on your PATH. It needs bash and nothing else.

## Contributing

Run `./test.sh` before you push. Every conversion needs a line in it.
EOF
commit "README: second usage example" ola
git switch -q main

cat > README.md <<'EOF'
# tempconv

A tiny temperature converter.

## Usage

    ./temp.sh 100      # prints 212

## Install

Copy `temp.sh` anywhere on your PATH. It needs bash and nothing else.

## Contributing

Run `./test.sh` before you push. Every conversion needs a line in it.
EOF
commit "Fix typo in README"

cat > temp.sh <<'EOF'
#!/usr/bin/env bash
# temp.sh: convert temperatures.
# Usage: ./temp.sh DEGREES [c|f]
#   c = from Celsius to Fahrenheit (default)
#   f = from Fahrenheit to Celsius
c_to_f() { echo $(( $1 * 9 / 5 + 32 )); }
f_to_c() { echo $(( $1 - 32 * 5 / 9 )); }

if [ "${1:-}" = "--help" ]; then
  echo "tempconv 1.1"
  echo "usage: temp.sh DEGREES [c|f]"
  exit 0
fi
n=$1
unit=${2:-c}
case $unit in
  c) c_to_f "$n" ;;
  f) f_to_c "$n" ;;
  *) echo "unknown unit: $unit" >&2; exit 2 ;;
esac
EOF
commit "Bump version to 1.1 in --help"

cat > CHANGELOG.md <<'EOF'
# Changelog

## Unreleased

- Internal: one function per conversion.
- `--help` reports 1.1.

## 1.0

- Convert from Fahrenheit with `./temp.sh N f`.
- Convert from Celsius with `./temp.sh N`.
EOF
commit "CHANGELOG: prepare 1.1"

echo
echo "Built git-lab: $(git rev-list --all --count) commits on 4 branches."
echo "Top of main:   $(git log --oneline -1)"
echo "Now run:       cd git-lab"
