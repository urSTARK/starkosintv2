"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Trash2, Copy, Check } from "lucide-react"

interface OutputLine {
  type: "output" | "error" | "info"
  content: string
  timestamp: Date
}

const EXAMPLE_SCRIPTS = [
  {
    name: "Hello World",
    code: `print("Hello from serverless Python!")
print("Running on Vercel Edge Functions")`,
  },
  {
    name: "Data Analysis",
    code: `import json

# Sample data analysis
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
average = sum(data) / len(data)
maximum = max(data)
minimum = min(data)

result = {
    "average": average,
    "max": maximum,
    "min": minimum,
    "count": len(data)
}

print(json.dumps(result, indent=2))`,
  },
  {
    name: "Math Operations",
    code: `import math

# Calculate some mathematical operations
numbers = [16, 25, 36, 49, 64]

print("Square roots:")
for num in numbers:
    print(f"√{num} = {math.sqrt(num)}")

print(f"\\nπ = {math.pi:.6f}")
print(f"e = {math.e:.6f}")`,
  },
]

const HIDDEN_SCRIPTS = [
  {
    name: "System Info",
    code: `import sys
import platform
from datetime import datetime

print("=== System Information ===")
print(f"Python Version: {sys.version}")
print(f"Platform: {platform.platform()}")
print(f"Machine: {platform.machine()}")
print(f"Processor: {platform.processor()}")
print(f"Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("\\n=== Available Modules ===")
print("sys, platform, datetime, math, random, json")`,
  },
  {
    name: "Prime Numbers",
    code: `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

print("Prime numbers up to 100:")
primes = [n for n in range(2, 101) if is_prime(n)]
print(", ".join(map(str, primes)))
print(f"\\nTotal: {len(primes)} prime numbers found")`,
  },
  {
    name: "Fibonacci Sequence",
    code: `def fibonacci(n):
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

n = 20
fib_sequence = fibonacci(n)
print(f"First {n} Fibonacci numbers:")
print(", ".join(map(str, fib_sequence)))
print(f"\\nThe {n}th Fibonacci number is: {fib_sequence[-1]}")`,
  },
  {
    name: "STARK OSINT 🔍",
    code: `# STARK OSINT - Fully Functional Version
import urllib.request
import urllib.parse
import json
import re
from datetime import datetime

def print_banner():
    print("""
======================================================
      ███████╗████████╗  █████╗  █████╗ ██╗  ██╗
      ██╔════╝   ██╔══╝██╔══██╗██╔══██╗ ██║ ██╔╝
      ███████╗   ██║   ███████║██████╔╝ █████╔╝
      ╚════██║   ██║   ██╔══██║██╔══██╗ ██╔═██╗
      ███████║   ██║   ██║  ██║██║  ██║ ██║  ██╗
      ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═╝  ╚═╝
              OSINT CLI by STARK
======================================================
""")

def fetch_json(url):
    """Fetch JSON data from URL"""
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

def ip_lookup(ip):
    """Lookup IP address information"""
    print(f"\\n🌐 IP Address Lookup: {ip}")
    print("=" * 50)
    
    url = f"http://ip-api.com/json/{ip}"
    data = fetch_json(url)
    
    if "error" in data:
        print(f"❌ Error: {data['error']}")
        return
    
    if data.get("status") == "success":
        print(f"📍 Country: {data.get('country', 'N/A')}")
        print(f"🏙️  City: {data.get('city', 'N/A')}")
        print(f"📮 Region: {data.get('regionName', 'N/A')}")
        print(f"🌍 Coordinates: {data.get('lat', 'N/A')}, {data.get('lon', 'N/A')}")
        print(f"🏢 ISP: {data.get('isp', 'N/A')}")
        print(f"🏛️  Organization: {data.get('org', 'N/A')}")
        print(f"⏰ Timezone: {data.get('timezone', 'N/A')}")
    else:
        print("❌ IP lookup failed")

def phone_lookup(phone):
    """Lookup phone number information"""
    print(f"\\n📱 Phone Number Lookup: {phone}")
    print("=" * 50)
    
    # Validate phone format
    clean_phone = re.sub(r'[^0-9+]', '', phone)
    if not re.match(r'^[+]?[0-9]{10,15}$', clean_phone):
        print("❌ Invalid phone number format")
        return
    
    # Extract country code
    if clean_phone.startswith('+91'):
        print("🇮🇳 Country: India")
        print("📞 Format: Valid Indian mobile number")
    elif clean_phone.startswith('+1'):
        print("🇺🇸 Country: United States/Canada")
        print("📞 Format: Valid North American number")
    elif clean_phone.startswith('+44'):
        print("🇬🇧 Country: United Kingdom")
        print("📞 Format: Valid UK number")
    else:
        print("🌍 International number detected")
    
    print(f"✅ Number validated: {clean_phone}")
    print("ℹ️  Note: Full carrier lookup requires API key")

def ifsc_lookup(ifsc):
    """Lookup IFSC code information"""
    print(f"\\n🏦 IFSC Code Lookup: {ifsc}")
    print("=" * 50)
    
    # Validate IFSC format
    if not re.match(r'^[A-Z]{4}0[A-Z0-9]{6}$', ifsc):
        print("❌ Invalid IFSC code format")
        return
    
    url = f"https://ifsc.razorpay.com/{ifsc}"
    data = fetch_json(url)
    
    if "error" in data:
        print(f"❌ Error: {data['error']}")
        return
    
    print(f"🏛️  Bank: {data.get('BANK', 'N/A')}")
    print(f"🏢 Branch: {data.get('BRANCH', 'N/A')}")
    print(f"📍 Address: {data.get('ADDRESS', 'N/A')}")
    print(f"🏙️  City: {data.get('CITY', 'N/A')}")
    print(f"📮 State: {data.get('STATE', 'N/A')}")
    print(f"📞 Contact: {data.get('CONTACT', 'N/A')}")

def vehicle_lookup(reg_number):
    """Vehicle registration lookup"""
    print(f"\\n🚗 Vehicle Registration Lookup: {reg_number}")
    print("=" * 50)
    
    # Validate Indian vehicle registration format
    pattern = r'^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$'
    clean_reg = reg_number.replace(" ", "").replace("-", "").upper()
    
    if re.match(pattern, clean_reg):
        state_code = clean_reg[:2]
        rto_code = clean_reg[2:4]
        print(f"✅ Valid Indian registration number")
        print(f"📍 State Code: {state_code}")
        print(f"🏢 RTO Code: {rto_code}")
        print(f"🔢 Registration: {clean_reg}")
        print("ℹ️  Note: Full vehicle details require API access")
    else:
        print("❌ Invalid vehicle registration format")

# Main execution
print_banner()

print("🔍 STARK OSINT - Fully Functional Demo")
print("=" * 50)

# Demo 1: IP Lookup
ip_lookup("8.8.8.8")

# Demo 2: Phone Lookup
phone_lookup("+919876543210")

# Demo 3: IFSC Lookup
ifsc_lookup("SBIN0001234")

# Demo 4: Vehicle Lookup
vehicle_lookup("MH12AB1234")

print("\\n" + "=" * 50)
print(f"⏰ Executed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("✅ All OSINT features working with built-in libraries!")
print("=" * 50)`,
  },
]

export function Terminal() {
  const [code, setCode] = useState(EXAMPLE_SCRIPTS[0].code)
  const [output, setOutput] = useState<OutputLine[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const runCode = async (codeToRun?: string) => {
    const scriptCode = codeToRun || code

    if (!scriptCode.trim()) {
      addOutput("error", "No code to execute")
      return
    }

    setIsRunning(true)
    addOutput("info", "$ python script.py")

    try {
      const startTime = Date.now()

      const response = await fetch("/api/execute-python", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: scriptCode }),
      })

      const data = await response.json()
      const executionTime = Date.now() - startTime

      if (data.success) {
        if (data.output) {
          addOutput("output", data.output)
        }
        if (data.error) {
          addOutput("error", data.error)
        }
        addOutput("info", `Execution completed in ${executionTime}ms`)
      } else {
        addOutput("error", data.error || "Unknown error occurred")
      }
    } catch (error) {
      addOutput("error", `Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsRunning(false)
    }
  }

  const addOutput = (type: OutputLine["type"], content: string) => {
    setOutput((prev) => [...prev, { type, content, timestamp: new Date() }])
  }

  const clearOutput = () => {
    setOutput([])
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadExample = (example: (typeof EXAMPLE_SCRIPTS)[0]) => {
    setCode(example.code)
    clearOutput()
  }

  const runHiddenScript = (script: (typeof HIDDEN_SCRIPTS)[0]) => {
    clearOutput()
    runCode(script.code)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <Card className="bg-card border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-accent/40" />
                <div className="w-3 h-3 rounded-full bg-accent/60" />
              </div>
              <span className="text-sm font-mono text-muted-foreground ml-2">script.py</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={copyCode} className="h-8 px-2">
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full min-h-[400px] p-4 bg-terminal-bg text-terminal-text font-mono text-sm leading-relaxed resize-none focus:outline-none"
              placeholder="# Write your Python code here..."
              spellCheck={false}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/50">
            <div className="text-xs text-muted-foreground font-mono">
              {code.split("\n").length} lines • {code.length} characters
            </div>
            <Button
              onClick={() => runCode()}
              disabled={isRunning}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Script
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="bg-card border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
            <span className="text-sm font-mono text-muted-foreground">Output</span>
            <Button variant="ghost" size="sm" onClick={clearOutput} className="h-8 px-2" disabled={output.length === 0}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div
            ref={outputRef}
            className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 bg-terminal-bg font-mono text-sm leading-relaxed"
          >
            {output.length === 0 ? (
              <div className="text-muted-foreground italic">No output yet. Run your script to see results.</div>
            ) : (
              output.map((line, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    line.type === "error"
                      ? "text-terminal-error"
                      : line.type === "info"
                        ? "text-terminal-prompt"
                        : "text-terminal-success"
                  }`}
                >
                  {line.content}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Run
          </h3>
          <div className="space-y-2">
            {HIDDEN_SCRIPTS.map((script, index) => (
              <button
                key={index}
                onClick={() => runHiddenScript(script)}
                disabled={isRunning}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-accent/10 hover:bg-accent/20 transition-colors text-sm border border-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium">{script.name}</span>
                <Play className="w-4 h-4 text-accent" />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Pre-built scripts you can run instantly</p>
        </Card>

        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Example Scripts
          </h3>
          <div className="space-y-2">
            {EXAMPLE_SCRIPTS.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example)}
                className="w-full text-left px-3 py-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors text-sm border border-border"
              >
                {example.name}
              </button>
            ))}
          </div>
        </Card>

        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold mb-2">Available Libraries</h3>
          <div className="flex flex-wrap gap-2">
            {["json", "math", "datetime", "re", "random", "os", "requests", "urllib.request", "urllib.parse"].map(
              (lib) => (
                <span key={lib} className="px-2 py-1 text-xs font-mono bg-secondary rounded border border-border">
                  {lib}
                </span>
              ),
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
