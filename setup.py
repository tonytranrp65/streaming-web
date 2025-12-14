#!/usr/bin/env python3
"""
Streaming Website Setup Script
This script installs npm packages and starts the streaming website server
"""

import subprocess
import sys
import os
import socket
import platform

def run_command(command, description):
    """Run a shell command and return success status"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=os.getcwd())
        if result.returncode == 0:
            print("✅ Success!")
            return True, result.stdout
        else:
            print(f"❌ Failed: {result.stderr}")
            return False, result.stderr
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False, str(e)

def check_nodejs():
    """Check if Node.js is installed"""
    print("🔍 Checking for Node.js...")
    success, output = run_command("node --version", "Checking Node.js version")
    if not success:
        print("❌ Node.js is not installed!")
        print("💡 Please install Node.js from: https://nodejs.org/")
        return False
    print(f"✅ Node.js found: {output.strip()}")
    return True

def check_npm():
    """Check if npm is installed"""
    print("🔍 Checking for npm...")
    success, output = run_command("npm --version", "Checking npm version")
    if not success:
        print("❌ npm is not installed!")
        print("💡 npm usually comes with Node.js. Please reinstall Node.js.")
        return False
    print(f"✅ npm found: {output.strip()}")
    return True

def get_local_ip():
    """Get the local IP address"""
    try:
        # Create a socket to determine the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # Connect to Google DNS
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "localhost"

def find_available_port(start_port=3000, max_attempts=100):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            # Try to bind to the port on IPv4
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
            # Also try to bind to the port on IPv6 if available
            try:
                with socket.socket(socket.AF_INET6, socket.SOCK_STREAM) as s:
                    s.bind(('::', port))
            except OSError:
                # IPv6 might not be available, that's ok
                pass
            return port
        except OSError:
            continue
    raise RuntimeError(f"Could not find an available port after {max_attempts} attempts")

def main():
    """Main setup function"""
    print("🚀 Streaming Website Setup")
    print("=" * 40)

    # Check prerequisites
    if not check_nodejs():
        sys.exit(1)

    if not check_npm():
        sys.exit(1)

    print()

    # Install dependencies
    success, _ = run_command("npm install", "Installing npm dependencies (including Socket.io)")
    if not success:
        print("❌ Failed to install dependencies. Exiting.")
        sys.exit(1)

    print()

    # Get network information
    local_ip = get_local_ip()
    port = find_available_port()
    os.environ['PORT'] = str(port)

    print("🚀 Starting the server...")
    print("=" * 40)
    print(f"📱 Local access: http://localhost:{port}")
    print(f"🌐 Network access: http://{local_ip}:{port}")
    print()
    print("💡 Opening in browser... (you may need to refresh)")
    print("💡 Share the Network URL with others on your local network")
    print()

    # Start the server
    try:
        print("🔥 Server starting up...")
        print("Press Ctrl+C to stop the server")
        print()

        # Open browser (optional)
        try:
            if platform.system() == "Windows":
                os.startfile(f"http://localhost:{port}")
            elif platform.system() == "Darwin":  # macOS
                subprocess.run(["open", f"http://localhost:{port}"])
            else:  # Linux
                subprocess.run(["xdg-open", f"http://localhost:{port}"])
        except:
            pass  # Browser opening is optional

        # Start the server
        env = os.environ.copy()
        env['PORT'] = str(port)
        result = subprocess.run("npm start", shell=True, cwd=os.getcwd(), env=env, capture_output=True, text=True)

        # If port is in use, try the next port
        if result.returncode != 0 and "EADDRINUSE" in result.stderr:
            print(f"⚠️  Port {port} is in use, trying next available port...")
            next_port = find_available_port(port + 1)
            print(f"🔍 Found next available port: {next_port}")
            env['PORT'] = str(next_port)
            port = next_port
            print(f"📱 Local access: http://localhost:{port}")
            print(f"🌐 Network access: http://{local_ip}:{port}")
            print()
            subprocess.run("npm start", shell=True, cwd=os.getcwd(), env=env)

    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
