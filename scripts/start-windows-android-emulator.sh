#!/usr/bin/env bash

# Start this Expo app from WSL against an already-running Windows Android emulator.
# The Windows SDK supplies adb.exe, while Expo on Linux insists on a binary named adb.

set -euo pipefail

mode="--go"

case "${1:-}" in
  "") ;;
  --go | --dev-client) mode="$1" ;;
  -h | --help)
    cat <<'EOF'
Usage: ./scripts/start-windows-android-emulator.sh [--go|--dev-client]

Start an authorized Android Studio virtual device on Windows first. The default
mode uses Expo Go. Use --dev-client only after installing an Ezzy development build.

Set WINDOWS_SDK to override automatic Android SDK discovery.
EOF
    exit 0
    ;;
  *)
    echo "Unknown option: $1" >&2
    exit 2
    ;;
esac

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
app_dir="$(cd -- "$script_dir/.." && pwd)"

windows_sdk="${WINDOWS_SDK:-}"

if [[ -z "$windows_sdk" ]]; then
  for candidate in /mnt/c/Users/*/AppData/Local/Android/Sdk; do
    if [[ -x "$candidate/platform-tools/adb.exe" ]]; then
      windows_sdk="$candidate"
      break
    fi
  done
fi

if [[ -z "$windows_sdk" || ! -x "$windows_sdk/platform-tools/adb.exe" ]]; then
  cat >&2 <<'EOF'
Windows Android SDK not found. Complete Android Studio's SDK Manager setup first,
or run again with WINDOWS_SDK=/mnt/c/Users/<WindowsUser>/AppData/Local/Android/Sdk.
EOF
  exit 1
fi

# Expo constructs "$ANDROID_HOME/platform-tools/adb" itself. A WSL bridge gives
# it that Linux filename while still executing the Windows SDK's adb.exe.
bridge_sdk="${ANDROID_BRIDGE_SDK:-$HOME/.android-sdk-windows}"
bridge_adb="$bridge_sdk/platform-tools/adb"

mkdir -p "$bridge_sdk/platform-tools"
ln -sfn "$windows_sdk/platform-tools/adb.exe" "$bridge_adb"

export ANDROID_HOME="$bridge_sdk"
export PATH="$HOME/.nvm/versions/node/v22.17.0/bin:$bridge_sdk/platform-tools:$PATH"

if ! command -v npx >/dev/null 2>&1; then
  echo "Node 22 / npx was not found at $HOME/.nvm/versions/node/v22.17.0/bin." >&2
  exit 1
fi

devices="$($bridge_adb devices -l)"

if ! awk '$2 == "device" { found = 1 } END { exit !found }' <<<"$devices"; then
  echo "No authorized Android emulator is available:" >&2
  echo "$devices" >&2
  echo "Start the AVD in Android Studio and accept its USB-debugging prompt, then retry." >&2
  exit 1
fi

"$bridge_adb" reverse tcp:8081 tcp:8081

cd "$app_dir"
exec npx expo start "$mode" --localhost --android
