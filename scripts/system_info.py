import sys
import platform
from datetime import datetime

print("=== System Information ===")
print(f"Python Version: {sys.version}")
print(f"Platform: {platform.platform()}")
print(f"Machine: {platform.machine()}")
print(f"Processor: {platform.processor()}")
print(f"Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("\n=== Available Modules ===")
print("sys, platform, datetime, math, random, json")
